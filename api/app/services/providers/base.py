"""AI Provider abstraction layer.

Phase 1: Scraper implementations (Playwright)
Phase 2: Official API implementations
Switch via config flag per platform.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class AIResponse:
    text: str
    citations: list[str] = field(default_factory=list)
    model: str = ""
    platform: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    raw_response: dict = field(default_factory=dict)


class AIProvider(ABC):
    """Base class for all AI platform providers."""

    platform: str  # "chatgpt", "gemini", "claude", "perplexity", "grok", "deepseek"

    @abstractmethod
    async def query(self, prompt: str) -> AIResponse:
        """Send a query and get the AI's response."""
        ...

    @abstractmethod
    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        """Check if a brand is mentioned for a keyword.

        Returns:
            {
                "mentioned": bool,
                "rank": int | None,
                "response_text": str,
                "citations": list[str],
                "competitors": list[{"brand": str, "rank": int}],
                "sentiment": "positive" | "neutral" | "negative" | None,
            }
        """
        ...


class ProviderRegistry:
    """Registry of available AI providers."""

    _providers: dict[str, AIProvider] = {}

    @classmethod
    def register(cls, provider: AIProvider) -> None:
        cls._providers[provider.platform] = provider

    @classmethod
    def get(cls, platform: str) -> Optional[AIProvider]:
        return cls._providers.get(platform)

    @classmethod
    def get_all(cls) -> list[AIProvider]:
        return list(cls._providers.values())

    @classmethod
    def available_platforms(cls) -> list[str]:
        return list(cls._providers.keys())
