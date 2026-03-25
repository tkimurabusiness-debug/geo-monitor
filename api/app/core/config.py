from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Internal auth (Next.js → FastAPI)
    internal_api_key: str = "dev-internal-key"

    # AI APIs
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""
    perplexity_api_key: str = ""
    xai_api_key: str = ""
    deepseek_api_key: str = ""

    # Serper + ラッコKW
    serper_api_key: str = ""
    rakko_api_key: str = ""

    # App
    environment: str = "development"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
