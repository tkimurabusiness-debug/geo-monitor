from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..core.auth import verify_internal_key
from ..services.competitors.detector import (
    detect_competitors,
    auto_register_competitors,
    build_industry_map,
)

router = APIRouter(prefix="/internal/competitors", tags=["competitors"])


class CompetitorDetectRequest(BaseModel):
    site_id: str
    organization_id: str
    brand_name: str
    max_auto: int = 5


@router.post("/detect")
async def detect(req: CompetitorDetectRequest, _key: str = Depends(verify_internal_key)):
    """Detect competitors from monitoring data."""
    result = await detect_competitors(req.site_id, req.organization_id, req.brand_name)
    return {"status": "completed", "data": result}


@router.post("/auto-register")
async def auto_register(req: CompetitorDetectRequest, _key: str = Depends(verify_internal_key)):
    """Detect and auto-register competitors."""
    result = await auto_register_competitors(
        req.site_id, req.organization_id, req.brand_name, req.max_auto
    )
    return {"status": "completed", "data": result}


class IndustryMapRequest(BaseModel):
    site_id: str
    organization_id: str


@router.post("/industry-map")
async def industry_map(req: IndustryMapRequest, _key: str = Depends(verify_internal_key)):
    """Get industry positioning map data."""
    result = await build_industry_map(req.site_id, req.organization_id)
    return {"status": "completed", "data": result}
