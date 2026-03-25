from fastapi import APIRouter, Depends
from ..core.auth import verify_internal_key
from ..models.diagnosis import DiagnosisRequest
from ..services.diagnosis.service import run_diagnosis

router = APIRouter(prefix="/internal/diagnosis", tags=["diagnosis"])


@router.post("/run")
async def run_diagnosis_endpoint(
    req: DiagnosisRequest,
    _key: str = Depends(verify_internal_key),
):
    """Run site diagnosis (called from Next.js API route)."""
    result = await run_diagnosis(
        site_id=req.site_id,
        org_id=req.organization_id,
        url=req.url,
        brand_name=req.brand_name,
    )
    return {"status": "completed", "data": result}
