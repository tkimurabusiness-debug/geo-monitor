"""Google Gemini provider — API implementation via httpx."""

import json
import httpx
from .base import AIProvider, AIResponse
from ...core.config import get_settings

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


class GeminiProvider(AIProvider):
    platform = "gemini"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.google_ai_api_key

    async def query(self, prompt: str) -> AIResponse:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GEMINI_API_URL}?key={self.api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = ""
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            pass

        return AIResponse(
            text=text,
            model="gemini-2.0-flash",
            platform=self.platform,
            raw_response=data,
        )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = f"""以下のキーワードについて、おすすめのサービスや企業をランキング形式で教えてください。
キーワード: {keyword}

JSON形式で回答してください:
{{"recommendations": [{{"rank": 1, "brand": "企業名", "description": "説明"}}]}}"""

        response = await self.query(prompt)
        return _parse_ranking(response.text, brand_name)


class PerplexityProvider(AIProvider):
    """Perplexity Sonar API — returns citations."""

    platform = "perplexity"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.perplexity_api_key

    async def query(self, prompt: str) -> AIResponse:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": "sonar",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        citations = data.get("citations", [])

        return AIResponse(
            text=text,
            citations=citations,
            model="sonar",
            platform=self.platform,
            raw_response=data,
        )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = f"{keyword} おすすめのサービスや企業を教えてください"
        response = await self.query(prompt)

        mentioned = brand_name.lower() in response.text.lower()
        url_cited = any(site_url.replace("https://", "").replace("http://", "") in c for c in response.citations)

        result = _parse_ranking(response.text, brand_name)
        result["citations"] = response.citations
        result["url_cited"] = url_cited
        return result


def _parse_ranking(text: str, brand_name: str) -> dict:
    """Parse ranking JSON from AI response text."""
    mentioned = brand_name.lower() in text.lower()
    rank = None
    competitors = []

    try:
        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            data = json.loads(text[json_start:json_end])
            for rec in data.get("recommendations", []):
                b = rec.get("brand", "")
                r = rec.get("rank")
                if brand_name.lower() in b.lower():
                    rank = r
                else:
                    competitors.append({"brand": b, "rank": r})
    except (json.JSONDecodeError, KeyError):
        pass

    return {
        "mentioned": mentioned,
        "rank": rank,
        "response_text": text,
        "citations": [],
        "competitors": competitors,
        "sentiment": None,
    }
