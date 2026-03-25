"""Serper.dev API client for Google SERP position tracking."""

import httpx
from dataclasses import dataclass
from typing import Optional
from ...core.config import get_settings

SERPER_API_URL = "https://google.serper.dev/search"


@dataclass
class SerpResult:
    keyword: str
    google_rank: Optional[int]
    serp_url: Optional[str]
    aio_displayed: bool
    aio_cited: bool
    aio_text: str = ""


async def check_serp_position(
    keyword: str,
    target_domain: str,
    gl: str = "jp",
    hl: str = "ja",
) -> SerpResult:
    """Check Google SERP position for a keyword + target domain.

    Args:
        keyword: Search query
        target_domain: Domain to find in results (e.g. "stock-value.co.jp")
        gl: Country code
        hl: Language code
    """
    settings = get_settings()
    if not settings.serper_api_key:
        return SerpResult(keyword=keyword, google_rank=None, serp_url=None, aio_displayed=False, aio_cited=False)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            SERPER_API_URL,
            headers={"X-API-KEY": settings.serper_api_key, "Content-Type": "application/json"},
            json={"q": keyword, "gl": gl, "hl": hl, "num": 50},
        )
        resp.raise_for_status()
        data = resp.json()

    # Find target domain in organic results
    google_rank = None
    serp_url = None
    domain_lower = target_domain.lower().replace("https://", "").replace("http://", "").rstrip("/")

    for i, result in enumerate(data.get("organic", []), 1):
        link = result.get("link", "").lower()
        if domain_lower in link:
            google_rank = i
            serp_url = result.get("link")
            break

    # Check AI Overview (AIO)
    aio_displayed = False
    aio_cited = False
    aio_text = ""
    ai_overview = data.get("aiOverview")
    if ai_overview:
        aio_displayed = True
        aio_text = ai_overview.get("text", "")
        # Check if our domain is cited in AIO
        for ref in ai_overview.get("references", []):
            if domain_lower in ref.get("link", "").lower():
                aio_cited = True
                break

    return SerpResult(
        keyword=keyword,
        google_rank=google_rank,
        serp_url=serp_url,
        aio_displayed=aio_displayed,
        aio_cited=aio_cited,
        aio_text=aio_text,
    )


async def batch_check_serp(
    keywords: list[str],
    target_domain: str,
) -> list[SerpResult]:
    """Check SERP positions for multiple keywords."""
    results = []
    for kw in keywords:
        try:
            result = await check_serp_position(kw, target_domain)
            results.append(result)
        except Exception as e:
            print(f"[Serper Error] {kw}: {e}")
            results.append(SerpResult(keyword=kw, google_rank=None, serp_url=None, aio_displayed=False, aio_cited=False))
    return results
