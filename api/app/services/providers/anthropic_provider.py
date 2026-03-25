"""Anthropic (Claude) provider — API implementation."""

import json
from anthropic import AsyncAnthropic
from .base import AIProvider, AIResponse
from ...core.config import get_settings


class ClaudeProvider(AIProvider):
    platform = "claude"

    def __init__(self):
        settings = get_settings()
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def query(self, prompt: str) -> AIResponse:
        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text if response.content else ""
        return AIResponse(
            text=text,
            model=response.model,
            platform=self.platform,
            raw_response={"id": response.id, "model": response.model},
        )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = self._build_visibility_prompt(keyword)
        response = await self.query(prompt)
        return self._parse_visibility(response.text, brand_name)

    def _build_visibility_prompt(self, keyword: str) -> str:
        return f"""以下のキーワードについて、おすすめのサービスや企業をランキング形式で教えてください。
キーワード: {keyword}

JSON形式で回答してください:
{{"recommendations": [{{"rank": 1, "brand": "企業名", "description": "説明"}}]}}"""

    def _parse_visibility(self, text: str, brand_name: str) -> dict:
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
