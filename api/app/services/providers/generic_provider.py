"""Generic OpenAI-compatible providers (Grok via xAI, DeepSeek)."""

import json
import httpx
from .base import AIProvider, AIResponse


class OpenAICompatibleProvider(AIProvider):
    """Provider for APIs that follow the OpenAI chat completions format."""

    def __init__(self, platform: str, api_key: str, base_url: str, model: str):
        self.platform = platform
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    async def query(self, prompt: str) -> AIResponse:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return AIResponse(
            text=text,
            model=self.model,
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

        mentioned = brand_name.lower() in response.text.lower()
        rank = None
        competitors = []

        try:
            json_start = response.text.find("{")
            json_end = response.text.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response.text[json_start:json_end])
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
            "response_text": response.text,
            "citations": [],
            "competitors": competitors,
            "sentiment": None,
        }


def create_grok_provider(api_key: str) -> OpenAICompatibleProvider:
    return OpenAICompatibleProvider(
        platform="grok",
        api_key=api_key,
        base_url="https://api.x.ai/v1",
        model="grok-3-mini-fast",
    )


def create_deepseek_provider(api_key: str) -> OpenAICompatibleProvider:
    return OpenAICompatibleProvider(
        platform="deepseek",
        api_key=api_key,
        base_url="https://api.deepseek.com/v1",
        model="deepseek-chat",
    )
