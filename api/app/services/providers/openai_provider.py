"""OpenAI (ChatGPT) provider — API implementation."""

import json
from openai import AsyncOpenAI
from .base import AIProvider, AIResponse
from ...core.config import get_settings


class ChatGPTProvider(AIProvider):
    platform = "chatgpt"

    def __init__(self):
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def query(self, prompt: str) -> AIResponse:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        text = response.choices[0].message.content or ""
        return AIResponse(
            text=text,
            model=response.model,
            platform=self.platform,
            raw_response=response.model_dump(),
        )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = f"""以下のキーワードについて、おすすめのサービスや企業を教えてください。
キーワード: {keyword}

回答はJSON形式で、以下の構造で返してください:
{{
  "recommendations": [
    {{"rank": 1, "brand": "企業名", "description": "説明", "url": "URL（分かれば）"}}
  ]
}}"""

        response = await self.query(prompt)

        # Parse ranking from response
        mentioned = brand_name.lower() in response.text.lower()
        rank = None
        competitors = []

        try:
            # Try to parse JSON from response
            json_start = response.text.find("{")
            json_end = response.text.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response.text[json_start:json_end])
                for rec in data.get("recommendations", []):
                    if brand_name.lower() in rec.get("brand", "").lower():
                        rank = rec.get("rank")
                    else:
                        competitors.append(
                            {"brand": rec.get("brand", ""), "rank": rec.get("rank")}
                        )
        except (json.JSONDecodeError, KeyError):
            pass

        return {
            "mentioned": mentioned,
            "rank": rank,
            "response_text": response.text,
            "citations": response.citations,
            "competitors": competitors,
            "sentiment": None,
        }
