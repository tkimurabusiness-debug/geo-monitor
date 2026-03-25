from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..core.auth import verify_internal_key
from ..services.actions.generator import (
    generate_actions_basic,
    generate_actions_pro,
    save_actions,
)

router = APIRouter(prefix="/internal/actions", tags=["actions"])


class ActionGenRequest(BaseModel):
    site_id: str
    organization_id: str
    plan: str = "basic"  # "basic" or "pro"


@router.post("/generate")
async def generate(req: ActionGenRequest, _key: str = Depends(verify_internal_key)):
    """Generate action suggestions based on plan level."""
    if req.plan == "pro":
        actions = await generate_actions_pro(req.site_id, req.organization_id)
    else:
        actions = await generate_actions_basic(req.site_id, req.organization_id)

    saved = await save_actions(actions)

    return {
        "status": "completed",
        "data": {
            "generated": len(actions),
            "saved": saved,
            "plan": req.plan,
            "actions": actions,
        },
    }
