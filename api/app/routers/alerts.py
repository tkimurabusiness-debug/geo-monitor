from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..core.auth import verify_internal_key
from ..services.alerts.engine import evaluate_alerts, save_and_dispatch_alerts

router = APIRouter(prefix="/internal/alerts", tags=["alerts"])


class AlertEvalRequest(BaseModel):
    site_id: str
    organization_id: str


@router.post("/evaluate")
async def evaluate(req: AlertEvalRequest, _key: str = Depends(verify_internal_key)):
    """Evaluate alert rules after a monitoring run and dispatch notifications."""
    alerts = await evaluate_alerts(req.site_id, req.organization_id)
    result = await save_and_dispatch_alerts(alerts)
    return {
        "status": "completed",
        "data": {
            **result,
            "alerts": [{"type": a["alert_type"], "severity": a["severity"], "title": a["title"]} for a in alerts],
        },
    }
