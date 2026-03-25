"""Monthly PDF report generation.

Aggregates monitoring, SEO, diagnosis data for a given period
and generates a structured report (data + optional PDF).
"""

import json
from datetime import date, timedelta
from typing import Optional
from ...core.supabase import get_supabase


async def generate_monthly_report(
    org_id: str,
    site_id: str,
    year: int,
    month: int,
) -> dict:
    """Generate monthly report data.

    Aggregates all monitoring, SEO, and diagnosis data for the given month.
    Returns structured data that can be rendered as PDF.
    """
    period_start = date(year, month, 1)
    if month == 12:
        period_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        period_end = date(year, month + 1, 1) - timedelta(days=1)

    supabase = get_supabase()

    # 1. GEO Score trend (monitoring)
    mon_resp = supabase.table("monitoring_results") \
        .select("keyword_id, platform, brand_mentioned, brand_rank, checked_at") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .gte("checked_at", period_start.isoformat()) \
        .lte("checked_at", period_end.isoformat()) \
        .order("checked_at") \
        .execute()
    monitoring = mon_resp.data or []

    total_checks = len(monitoring)
    mentions = sum(1 for m in monitoring if m.get("brand_mentioned"))
    mention_rate = round((mentions / max(total_checks, 1)) * 100, 1)

    # Platform breakdown
    platform_stats: dict[str, dict] = {}
    for m in monitoring:
        p = m["platform"]
        platform_stats.setdefault(p, {"checks": 0, "mentions": 0, "ranks": []})
        platform_stats[p]["checks"] += 1
        if m.get("brand_mentioned"):
            platform_stats[p]["mentions"] += 1
            if m.get("brand_rank"):
                platform_stats[p]["ranks"].append(m["brand_rank"])

    platform_summary = []
    for p, stats in platform_stats.items():
        avg_rank = round(sum(stats["ranks"]) / len(stats["ranks"]), 1) if stats["ranks"] else None
        platform_summary.append({
            "platform": p,
            "checks": stats["checks"],
            "mentions": stats["mentions"],
            "mention_rate": round((stats["mentions"] / max(stats["checks"], 1)) * 100, 1),
            "avg_rank": avg_rank,
        })

    # 2. SEO rankings
    seo_resp = supabase.table("seo_rankings") \
        .select("keyword_id, google_rank, aio_displayed, search_volume, keywords(keyword)") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .gte("checked_at", period_start.isoformat()) \
        .lte("checked_at", period_end.isoformat()) \
        .execute()
    seo_data = seo_resp.data or []

    avg_seo_rank = None
    ranks = [s["google_rank"] for s in seo_data if s.get("google_rank")]
    if ranks:
        avg_seo_rank = round(sum(ranks) / len(ranks), 1)

    aio_count = sum(1 for s in seo_data if s.get("aio_displayed"))

    # 3. Top keyword changes (compare start vs end of month)
    kw_changes = _compute_keyword_changes(monitoring)

    # 4. Latest diagnosis
    diag_resp = supabase.table("diagnosis_results") \
        .select("readiness_score, geo_score") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .order("diagnosed_at", desc=True) \
        .limit(1) \
        .execute()
    diagnosis = diag_resp.data[0] if diag_resp.data else {}

    # 5. Action suggestions
    actions_resp = supabase.table("action_suggestions") \
        .select("priority, title, status, estimated_impact") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()
    top_actions = actions_resp.data or []

    # Build report data
    report_data = {
        "period": f"{year}年{month}月",
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "summary": {
            "geo_score": float(diagnosis.get("geo_score", 0)),
            "readiness_score": float(diagnosis.get("readiness_score", 0)),
            "total_checks": total_checks,
            "mention_rate": mention_rate,
            "avg_seo_rank": avg_seo_rank,
            "aio_appearances": aio_count,
        },
        "platform_breakdown": platform_summary,
        "keyword_changes": kw_changes[:10],
        "top_actions": top_actions,
        "seo_highlights": {
            "keywords_tracked": len(set(s.get("keyword_id") for s in seo_data)),
            "avg_rank": avg_seo_rank,
            "aio_count": aio_count,
        },
    }

    # Save report
    try:
        resp = supabase.table("reports").insert({
            "organization_id": org_id,
            "report_type": "monthly",
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "data": report_data,
            "pdf_url": None,  # PDF generation is a separate step
        }).execute()
        report_id = resp.data[0]["id"] if resp.data else None
    except Exception as e:
        print(f"[Report] DB save error: {e}")
        report_id = None

    return {
        "id": report_id,
        **report_data,
    }


def _compute_keyword_changes(monitoring: list[dict]) -> list[dict]:
    """Compute rank changes per keyword over the period."""
    # Group by keyword, get first and last rank
    kw_history: dict[str, list[dict]] = {}
    for m in monitoring:
        kid = m["keyword_id"]
        kw_history.setdefault(kid, []).append(m)

    changes = []
    for kid, entries in kw_history.items():
        mentioned_entries = [e for e in entries if e.get("brand_rank")]
        if len(mentioned_entries) < 2:
            continue
        first = mentioned_entries[0]["brand_rank"]
        last = mentioned_entries[-1]["brand_rank"]
        change = first - last  # positive = improved
        changes.append({"keyword_id": kid, "from_rank": first, "to_rank": last, "change": change})

    changes.sort(key=lambda c: c["change"], reverse=True)
    return changes


async def generate_pdf_html(report_data: dict) -> str:
    """Generate HTML for PDF rendering.

    This HTML is designed to be converted to PDF via Puppeteer or similar.
    Returns a self-contained HTML document.
    """
    summary = report_data.get("summary", {})
    platforms = report_data.get("platform_breakdown", [])
    actions = report_data.get("top_actions", [])

    platform_rows = "\n".join(
        f"<tr><td>{p['platform']}</td><td>{p['mention_rate']}%</td><td>{p.get('avg_rank') or '—'}</td></tr>"
        for p in platforms
    )

    action_rows = "\n".join(
        f"<tr><td><span class='badge {a['priority']}'>{a['priority']}</span></td><td>{a['title']}</td><td>{a.get('estimated_impact', '')}</td></tr>"
        for a in actions
    )

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>GEO Monitor 月次レポート — {report_data.get('period', '')}</title>
<style>
  body {{ font-family: 'Noto Sans JP', 'Helvetica Neue', sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }}
  h1 {{ font-size: 24px; border-bottom: 3px solid #0ea5e9; padding-bottom: 8px; }}
  h2 {{ font-size: 18px; color: #0ea5e9; margin-top: 32px; }}
  .kpi-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }}
  .kpi {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }}
  .kpi .value {{ font-size: 32px; font-weight: bold; font-family: 'JetBrains Mono', monospace; }}
  .kpi .label {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
  table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
  th {{ background: #f1f5f9; text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #64748b; }}
  td {{ padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }}
  .badge {{ padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }}
  .badge.critical {{ background: #fee2e2; color: #dc2626; }}
  .badge.high {{ background: #fef3c7; color: #d97706; }}
  .badge.medium {{ background: #e0f2fe; color: #0284c7; }}
  .badge.low {{ background: #f1f5f9; color: #64748b; }}
  .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }}
</style>
</head>
<body>
<h1>GEO Monitor 月次レポート</h1>
<p style="color: #64748b;">{report_data.get('period', '')} | Generated by GEO Monitor</p>

<h2>サマリ</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="value">{summary.get('geo_score', 0)}</div><div class="label">GEOスコア</div></div>
  <div class="kpi"><div class="value">{summary.get('readiness_score', 0)}</div><div class="label">Readiness</div></div>
  <div class="kpi"><div class="value">{summary.get('mention_rate', 0)}%</div><div class="label">AI言及率</div></div>
  <div class="kpi"><div class="value">{summary.get('total_checks', 0)}</div><div class="label">総チェック数</div></div>
  <div class="kpi"><div class="value">{summary.get('avg_seo_rank') or '—'}</div><div class="label">平均SEO順位</div></div>
  <div class="kpi"><div class="value">{summary.get('aio_appearances', 0)}</div><div class="label">AIO表示回数</div></div>
</div>

<h2>プラットフォーム別</h2>
<table>
  <thead><tr><th>プラットフォーム</th><th>言及率</th><th>平均順位</th></tr></thead>
  <tbody>{platform_rows}</tbody>
</table>

<h2>改善提案 TOP5</h2>
<table>
  <thead><tr><th>優先度</th><th>施策</th><th>見込み</th></tr></thead>
  <tbody>{action_rows}</tbody>
</table>

<div class="footer">
  GEO Monitor by Stock Value — AI検索時代のブランド可視性分析ツール
</div>
</body>
</html>"""
