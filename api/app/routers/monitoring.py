from fastapi import APIRouter, Depends
from ..core.auth import verify_internal_key
from ..models.diagnosis import MonitoringRunRequest
from ..services.providers import ProviderRegistry
from ..core.supabase import get_supabase

router = APIRouter(prefix="/internal/monitoring", tags=["monitoring"])


@router.post("/run")
async def run_monitoring(
    req: MonitoringRunRequest,
    _key: str = Depends(verify_internal_key),
):
    """Run GEO monitoring check across AI platforms."""
    supabase = get_supabase()
    results = []

    # Get keywords to check
    if req.keyword_ids:
        kw_resp = supabase.table("keywords").select("id, keyword").in_("id", req.keyword_ids).execute()
    else:
        kw_resp = supabase.table("keywords").select("id, keyword").eq("site_id", req.site_id).eq("is_active", True).execute()

    keywords = kw_resp.data or []

    for kw in keywords:
        for platform_name in req.platforms:
            provider = ProviderRegistry.get(platform_name)
            if not provider:
                continue

            try:
                visibility = await provider.check_visibility(
                    keyword=kw["keyword"],
                    brand_name=req.brand_name,
                    site_url=req.site_url,
                )

                result = {
                    "site_id": req.site_id,
                    "organization_id": req.organization_id,
                    "keyword_id": kw["id"],
                    "platform": platform_name,
                    "model": "",
                    "prompt_text": kw["keyword"],
                    "response_text": visibility.get("response_text", ""),
                    "brand_mentioned": visibility.get("mentioned", False),
                    "brand_rank": visibility.get("rank"),
                    "url_cited": bool(visibility.get("citations")),
                    "cited_urls": visibility.get("citations", []),
                    "competitors_ranking": visibility.get("competitors", []),
                    "sentiment": visibility.get("sentiment"),
                    "raw_response": {},
                }

                supabase.table("monitoring_results").insert(result).execute()
                results.append({"keyword": kw["keyword"], "platform": platform_name, "mentioned": visibility.get("mentioned", False)})

            except Exception as e:
                results.append({"keyword": kw["keyword"], "platform": platform_name, "error": str(e)})

    # Post-monitoring: evaluate alerts and detect competitors
    alert_summary = {}
    competitor_summary = {}
    try:
        from ..services.alerts.engine import evaluate_alerts, save_and_dispatch_alerts
        alerts = await evaluate_alerts(req.site_id, req.organization_id)
        alert_summary = await save_and_dispatch_alerts(alerts)
    except Exception as e:
        alert_summary = {"error": str(e)}

    try:
        from ..services.competitors.detector import auto_register_competitors
        competitor_summary = await auto_register_competitors(
            req.site_id, req.organization_id, req.brand_name
        )
    except Exception as e:
        competitor_summary = {"error": str(e)}

    return {
        "status": "completed",
        "checked": len(results),
        "results": results,
        "alerts": alert_summary,
        "competitors_detected": competitor_summary,
    }
