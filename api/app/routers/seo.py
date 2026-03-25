from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..core.auth import verify_internal_key
from ..services.seo.service import run_seo_check

router = APIRouter(prefix="/internal/seo", tags=["seo"])


class SeoCheckRequest(BaseModel):
    site_id: str
    organization_id: str
    site_url: str


@router.post("/check")
async def run_seo_check_endpoint(
    req: SeoCheckRequest,
    _key: str = Depends(verify_internal_key),
):
    """Run SERP position + search volume check (called from Next.js)."""
    result = await run_seo_check(
        site_id=req.site_id,
        org_id=req.organization_id,
        site_url=req.site_url,
    )
    return result
