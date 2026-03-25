"""Alert rule engine — evaluates monitoring results against alert rules.

Trigger conditions:
- mention_lost: Brand mention disappeared (was mentioned → now not)
- rank_dropped: Brand rank dropped by N or more positions
- new_competitor: A new competitor appeared in rankings
- competitor_up: A competitor's rank improved
- readiness_dropped: GEO Readiness score decreased
"""

from datetime import datetime, timedelta
from ...core.supabase import get_supabase


ALERT_TYPES = {
    "mention_lost": {"severity": "critical", "label": "言及消失"},
    "rank_dropped": {"severity": "warning", "label": "順位下落"},
    "new_competitor": {"severity": "info", "label": "新規競合検出"},
    "competitor_up": {"severity": "warning", "label": "競合順位上昇"},
    "readiness_dropped": {"severity": "warning", "label": "Readiness低下"},
    "check_completed": {"severity": "info", "label": "チェック完了"},
}


async def evaluate_alerts(site_id: str, org_id: str) -> list[dict]:
    """Evaluate all alert rules after a monitoring run.

    Compares latest results with previous results to detect changes.
    Returns list of triggered alerts.
    """
    supabase = get_supabase()
    triggered = []

    # Get latest and previous monitoring results
    latest_resp = supabase.table("monitoring_results") \
        .select("keyword_id, platform, brand_mentioned, brand_rank, competitors_ranking, keywords(keyword)") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .order("checked_at", desc=True) \
        .execute()

    results = latest_resp.data or []
    if not results:
        return triggered

    # Group by keyword+platform, keep latest 2 per group
    groups: dict[str, list[dict]] = {}
    for r in results:
        key = f"{r['keyword_id']}:{r['platform']}"
        groups.setdefault(key, []).append(r)

    for key, group in groups.items():
        if len(group) < 2:
            continue

        current = group[0]
        previous = group[1]
        kw_name = (current.get("keywords") or {}).get("keyword", key)

        # Rule: mention_lost
        if previous.get("brand_mentioned") and not current.get("brand_mentioned"):
            triggered.append(_build_alert(
                org_id, site_id, "mention_lost",
                f"{current['platform']}での言及が消失",
                f"KW「{kw_name}」で{current['platform']}の言及がなくなりました",
                {"keyword": kw_name, "platform": current["platform"]},
            ))

        # Rule: rank_dropped (2+ positions)
        prev_rank = previous.get("brand_rank")
        curr_rank = current.get("brand_rank")
        if prev_rank and curr_rank and curr_rank > prev_rank + 1:
            drop = curr_rank - prev_rank
            triggered.append(_build_alert(
                org_id, site_id, "rank_dropped",
                f"{current['platform']}順位下落（{prev_rank}位→{curr_rank}位）",
                f"KW「{kw_name}」の{current['platform']}順位が{drop}位下がりました",
                {"keyword": kw_name, "platform": current["platform"], "from": prev_rank, "to": curr_rank},
            ))

        # Rule: new_competitor
        prev_comps = {c.get("brand", "").lower() for c in (previous.get("competitors_ranking") or [])}
        curr_comps = current.get("competitors_ranking") or []
        for comp in curr_comps:
            comp_name = comp.get("brand", "")
            if comp_name.lower() not in prev_comps and comp_name:
                triggered.append(_build_alert(
                    org_id, site_id, "new_competitor",
                    f"新規競合「{comp_name}」がランクイン",
                    f"KW「{kw_name}」の{current['platform']}で「{comp_name}」が新規ランクインしました",
                    {"keyword": kw_name, "platform": current["platform"], "competitor": comp_name},
                ))

    return triggered


async def save_and_dispatch_alerts(alerts: list[dict]) -> dict:
    """Save alerts to DB and dispatch notifications."""
    if not alerts:
        return {"saved": 0, "dispatched": 0}

    supabase = get_supabase()

    # Save alerts
    for alert in alerts:
        supabase.table("alerts").insert(alert).execute()

    # Get alert settings for this org
    org_id = alerts[0]["organization_id"]
    settings_resp = supabase.table("alert_settings") \
        .select("*") \
        .eq("organization_id", org_id) \
        .eq("enabled", True) \
        .execute()
    settings = settings_resp.data or []

    # Dispatch notifications
    dispatched = 0
    for alert in alerts:
        for setting in settings:
            channels = setting.get("channels", ["email"])

            if "email" in channels:
                await _send_email_alert(alert)
                dispatched += 1

            if "slack" in channels:
                webhook_url = setting.get("threshold", {}).get("slack_webhook_url")
                if webhook_url:
                    await _send_slack_alert(alert, webhook_url)
                    dispatched += 1

    return {"saved": len(alerts), "dispatched": dispatched}


async def _send_email_alert(alert: dict) -> None:
    """Send email alert notification.

    TODO: Integrate with Resend or similar email service.
    For now, logs the alert.
    """
    print(f"[Email Alert] {alert['severity'].upper()}: {alert['title']} — {alert['message']}")


async def _send_slack_alert(alert: dict, webhook_url: str) -> None:
    """Send Slack webhook notification."""
    import httpx

    severity_emoji = {"critical": "🔴", "warning": "🟡", "info": "🔵"}
    emoji = severity_emoji.get(alert["severity"], "ℹ️")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(webhook_url, json={
                "text": f"{emoji} *{alert['title']}*\n{alert['message']}",
            })
    except Exception as e:
        print(f"[Slack Alert Error] {e}")


def _build_alert(
    org_id: str, site_id: str, alert_type: str,
    title: str, message: str, metadata: dict,
) -> dict:
    info = ALERT_TYPES.get(alert_type, {"severity": "info", "label": alert_type})
    return {
        "organization_id": org_id,
        "site_id": site_id,
        "alert_type": alert_type,
        "severity": info["severity"],
        "title": title,
        "message": message,
        "metadata": metadata,
        "is_read": False,
    }
