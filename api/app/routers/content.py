from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from ..core.auth import verify_internal_key
from ..services.content.generator import generate_content

router = APIRouter(prefix="/internal/content", tags=["content"])


class ContentGenRequest(BaseModel):
    keyword: str
    content_type: str = "blog"  # "note" | "blog" | "faq"
    tone: str = "professional"  # "professional" | "casual" | "educational"
    organization_id: str = ""
    site_url: str = ""
    brand_name: str = ""
    keyword_id: Optional[str] = None


@router.post("/generate")
async def generate(req: ContentGenRequest, _key: str = Depends(verify_internal_key)):
    """Generate GEO-optimized content."""
    result = await generate_content(
        keyword=req.keyword,
        content_type=req.content_type,
        tone=req.tone,
        org_id=req.organization_id,
        site_url=req.site_url,
        brand_name=req.brand_name,
        keyword_id=req.keyword_id,
    )
    return {"status": "completed", "data": result}
