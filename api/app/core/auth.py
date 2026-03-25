"""Internal authentication for Next.js → FastAPI calls."""

from fastapi import Header, HTTPException
from .config import get_settings


async def verify_internal_key(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
) -> str:
    """Verify the internal API key sent by Next.js API routes."""
    settings = get_settings()
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal key")
    return x_internal_key
