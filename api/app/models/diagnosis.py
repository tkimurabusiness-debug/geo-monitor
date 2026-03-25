from pydantic import BaseModel
from typing import Optional


class DiagnosisRequest(BaseModel):
    site_id: str
    organization_id: str
    url: str
    brand_name: str = ""


class DiagnosisCheckItem(BaseModel):
    id: str
    label: str
    passed: bool
    detail: str
    suggestion: Optional[str] = None


class DiagnosisResponse(BaseModel):
    site_id: str
    readiness_score: float
    geo_score: float
    technical_checks: list[DiagnosisCheckItem]
    content_checks: list[DiagnosisCheckItem]
    extracted_keywords: list[dict]
    recommended_keywords: list[dict]


class MonitoringRunRequest(BaseModel):
    site_id: str
    organization_id: str
    keyword_ids: list[str] = []
    platforms: list[str] = ["chatgpt", "gemini", "claude"]
    brand_name: str = ""
    site_url: str = ""
