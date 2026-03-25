from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from ..core.auth import verify_internal_key
from ..services.reports.generator import generate_monthly_report, generate_pdf_html

router = APIRouter(prefix="/internal/reports", tags=["reports"])


class ReportGenRequest(BaseModel):
    organization_id: str
    site_id: str
    year: int
    month: int


@router.post("/generate")
async def generate(req: ReportGenRequest, _key: str = Depends(verify_internal_key)):
    """Generate monthly report data."""
    result = await generate_monthly_report(
        org_id=req.organization_id,
        site_id=req.site_id,
        year=req.year,
        month=req.month,
    )
    return {"status": "completed", "data": result}


@router.post("/pdf-preview", response_class=HTMLResponse)
async def pdf_preview(req: ReportGenRequest, _key: str = Depends(verify_internal_key)):
    """Generate HTML preview for PDF rendering.

    This endpoint returns HTML that can be:
    1. Viewed in a browser as-is
    2. Converted to PDF via Puppeteer on the server
    3. Printed to PDF from the browser
    """
    report = await generate_monthly_report(
        org_id=req.organization_id,
        site_id=req.site_id,
        year=req.year,
        month=req.month,
    )
    html = await generate_pdf_html(report)
    return HTMLResponse(content=html)
