"""SEO check orchestration service."""

from .serper_client import batch_check_serp
from .rakko_client import batch_search_volume
from ...core.supabase import get_supabase


async def run_seo_check(site_id: str, org_id: str, site_url: str) -> dict:
    """Run SERP position + search volume check for all active keywords of a site."""
    supabase = get_supabase()

    # Get active keywords
    kw_resp = supabase.table("keywords").select("id, keyword").eq("site_id", site_id).eq("is_active", True).execute()
    keywords = kw_resp.data or []

    if not keywords:
        return {"status": "completed", "checked": 0, "results": []}

    # Extract domain from URL
    domain = site_url.replace("https://", "").replace("http://", "").split("/")[0]

    # Run SERP checks
    kw_texts = [kw["keyword"] for kw in keywords]
    serp_results = await batch_check_serp(kw_texts, domain)

    # Get search volumes
    volumes = await batch_search_volume(kw_texts)

    # Save to DB
    results = []
    for kw, serp in zip(keywords, serp_results):
        vol = volumes.get(kw["keyword"])
        record = {
            "site_id": site_id,
            "organization_id": org_id,
            "keyword_id": kw["id"],
            "google_rank": serp.google_rank,
            "aio_displayed": serp.aio_displayed,
            "aio_cited": serp.aio_cited,
            "search_volume": vol,
        }
        supabase.table("seo_rankings").insert(record).execute()
        results.append({
            "keyword": kw["keyword"],
            "google_rank": serp.google_rank,
            "aio_displayed": serp.aio_displayed,
            "search_volume": vol,
        })

    return {"status": "completed", "checked": len(results), "results": results}
