"""GEO Monitor FastAPI service — handles heavy processing jobs."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import health, diagnosis, monitoring, seo, competitors, alerts, actions, content, reports
from .core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="GEO Monitor API",
    description="Internal API for heavy processing: diagnosis, monitoring, content generation",
    version="0.1.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# CORS — only allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(diagnosis.router)
app.include_router(monitoring.router)
app.include_router(seo.router)
app.include_router(competitors.router)
app.include_router(alerts.router)
app.include_router(actions.router)
app.include_router(content.router)
app.include_router(reports.router)


@app.on_event("startup")
async def startup():
    """Register AI providers on startup based on available API keys."""
    from .services.providers import ProviderRegistry
    from .services.providers.openai_provider import ChatGPTProvider
    from .services.providers.gemini_provider import GeminiProvider, PerplexityProvider
    from .services.providers.anthropic_provider import ClaudeProvider
    from .services.providers.generic_provider import create_grok_provider, create_deepseek_provider

    if settings.openai_api_key:
        ProviderRegistry.register(ChatGPTProvider())
    if settings.google_ai_api_key:
        ProviderRegistry.register(GeminiProvider())
    if settings.anthropic_api_key:
        ProviderRegistry.register(ClaudeProvider())
    if settings.perplexity_api_key:
        ProviderRegistry.register(PerplexityProvider())

    if settings.xai_api_key:
        ProviderRegistry.register(create_grok_provider(settings.xai_api_key))
    if settings.deepseek_api_key:
        ProviderRegistry.register(create_deepseek_provider(settings.deepseek_api_key))

    platforms = ProviderRegistry.available_platforms()
    print(f"[GEO Monitor API] Started. {len(platforms)} providers: {platforms}")
