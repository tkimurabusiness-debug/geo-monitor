"""Diagnosis orchestration service."""

from .crawler import crawl_site
from .scorer import score_technical, score_content, calculate_readiness_score
from .keyword_extractor import extract_keywords
from ...core.supabase import get_supabase


async def run_diagnosis(site_id: str, org_id: str, url: str, brand_name: str = "") -> dict:
    """Run full site diagnosis: crawl → score → extract keywords → save."""

    # 1. Crawl site
    crawl = await crawl_site(url)

    # 2. Score
    tech_checks = score_technical(crawl)
    content_checks = score_content(crawl)
    readiness_score = calculate_readiness_score(tech_checks, content_checks)

    # 3. Extract keywords
    kw_data = await extract_keywords(crawl, brand_name)

    # 4. Save to DB
    supabase = get_supabase()

    result = {
        "site_id": site_id,
        "organization_id": org_id,
        "readiness_score": readiness_score,
        "geo_score": 0,  # Calculated after monitoring runs
        "technical_checks": {c.id: {"label": c.label, "passed": c.passed, "detail": c.detail, "suggestion": c.suggestion} for c in tech_checks},
        "content_checks": {c.id: {"label": c.label, "passed": c.passed, "detail": c.detail, "suggestion": c.suggestion} for c in content_checks},
        "extracted_keywords": kw_data.get("extracted", []),
        "recommended_keywords": kw_data.get("recommended", []),
        "full_report": {
            "crawled_pages": len(crawl.pages),
            "is_https": crawl.is_https,
            "has_robots_txt": crawl.has_robots_txt,
            "has_sitemap": crawl.has_sitemap,
            "has_llms_txt": crawl.has_llms_txt,
        },
    }

    # Save to DB (skip if Supabase not configured)
    diagnosis_id = None
    try:
        supabase = get_supabase()
        db_resp = supabase.table("diagnosis_results").insert(result).execute()
        supabase.table("sites").update({
            "readiness_score": readiness_score,
            "last_diagnosed_at": "now()",
        }).eq("id", site_id).execute()
        diagnosis_id = db_resp.data[0]["id"] if db_resp.data else None
    except Exception as e:
        print(f"[Diagnosis] DB save skipped: {e}")

    return {
        "id": diagnosis_id,
        **result,
        "technical_checks_summary": {
            "passed": sum(1 for c in tech_checks if c.passed),
            "total": len(tech_checks),
        },
        "content_checks_summary": {
            "passed": sum(1 for c in content_checks if c.passed),
            "total": len(content_checks),
        },
    }
