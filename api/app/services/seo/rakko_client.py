"""ラッコキーワード API client for Japanese search volume data."""

import httpx
from typing import Optional
from ...core.config import get_settings


async def get_search_volume(keyword: str) -> Optional[int]:
    """Get monthly search volume for a keyword from ラッコキーワード API.

    Note: ラッコKW API requires a paid plan. Falls back to None if unavailable.
    """
    settings = get_settings()
    if not settings.rakko_api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.related-keywords.com/v1/search-volume",
                headers={"Authorization": f"Bearer {settings.rakko_api_key}"},
                params={"keyword": keyword},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return data.get("volume") or data.get("search_volume")
    except Exception:
        return None


async def batch_search_volume(keywords: list[str]) -> dict[str, Optional[int]]:
    """Get search volumes for multiple keywords.

    Returns: {"keyword": volume_or_none, ...}
    """
    settings = get_settings()
    if not settings.rakko_api_key:
        return {kw: None for kw in keywords}

    results = {}
    # ラッコKW may support batch — check docs. For now, sequential.
    for kw in keywords:
        results[kw] = await get_search_volume(kw)
    return results
