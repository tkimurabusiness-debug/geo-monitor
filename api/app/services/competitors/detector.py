"""Competitor auto-detection from AI monitoring results.

Scans monitoring_results for brand names mentioned alongside the user's brand,
then ranks them by frequency and co-occurrence.
"""

from collections import Counter
from ...core.supabase import get_supabase


async def detect_competitors(site_id: str, org_id: str, brand_name: str) -> list[dict]:
    """Detect competitors from existing monitoring results.

    Looks at competitors_ranking JSONB in monitoring_results to find
    brands that appear frequently across multiple keywords and platforms.

    Returns: [{"brand": str, "mention_count": int, "keywords": [str], "avg_rank": float}]
    """
    supabase = get_supabase()

    # Get all monitoring results for this site
    resp = supabase.table("monitoring_results") \
        .select("keyword_id, platform, competitors_ranking, keywords(keyword)") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .execute()

    results = resp.data or []

    # Count competitor mentions
    brand_counts: Counter[str] = Counter()
    brand_keywords: dict[str, set[str]] = {}
    brand_ranks: dict[str, list[int]] = {}

    for r in results:
        rankings = r.get("competitors_ranking") or []
        kw_name = (r.get("keywords") or {}).get("keyword", "")

        for comp in rankings:
            name = comp.get("brand", "").strip()
            rank = comp.get("rank")
            if not name or brand_name.lower() in name.lower():
                continue

            brand_counts[name] += 1
            brand_keywords.setdefault(name, set()).add(kw_name)
            if rank:
                brand_ranks.setdefault(name, []).append(rank)

    # Build ranked list
    detected = []
    for name, count in brand_counts.most_common(20):
        avg_rank = sum(brand_ranks.get(name, [])) / len(brand_ranks.get(name, [1])) if brand_ranks.get(name) else 0
        detected.append({
            "brand": name,
            "mention_count": count,
            "keywords": sorted(brand_keywords.get(name, set())),
            "avg_rank": round(avg_rank, 1),
        })

    return detected


async def auto_register_competitors(
    site_id: str, org_id: str, brand_name: str, max_auto: int = 5
) -> dict:
    """Detect and auto-register top competitors.

    Returns: {"detected": int, "registered": int, "competitors": [...]}
    """
    detected = await detect_competitors(site_id, org_id, brand_name)

    if not detected:
        return {"detected": 0, "registered": 0, "competitors": []}

    supabase = get_supabase()

    # Get already registered competitors
    existing_resp = supabase.table("competitors") \
        .select("brand_name") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .execute()
    existing_names = {c["brand_name"].lower() for c in (existing_resp.data or [])}

    # Register new ones
    registered = []
    for comp in detected[:max_auto]:
        if comp["brand"].lower() in existing_names:
            continue

        supabase.table("competitors").insert({
            "site_id": site_id,
            "organization_id": org_id,
            "brand_name": comp["brand"],
            "source": "auto_detected",
        }).execute()
        registered.append(comp["brand"])

    return {
        "detected": len(detected),
        "registered": len(registered),
        "competitors": detected[:max_auto],
        "new_registrations": registered,
    }


async def build_industry_map(site_id: str, org_id: str) -> dict:
    """Build industry positioning map data.

    Returns bubble chart data with SEO strength, GEO score, and mention rate
    for the site and its competitors.
    """
    supabase = get_supabase()

    # Get site info
    site_resp = supabase.table("sites") \
        .select("url, name, geo_score, readiness_score") \
        .eq("id", site_id) \
        .eq("organization_id", org_id) \
        .single() \
        .execute()
    site = site_resp.data

    # Get competitors
    comp_resp = supabase.table("competitors") \
        .select("id, brand_name, url") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .execute()
    competitors = comp_resp.data or []

    # Get total active keywords
    kw_resp = supabase.table("keywords") \
        .select("id", count="exact") \
        .eq("site_id", site_id) \
        .eq("is_active", True) \
        .execute()
    total_kw = kw_resp.count or 1

    # Get self mention rate
    self_mentions = supabase.table("monitoring_results") \
        .select("id", count="exact") \
        .eq("site_id", site_id) \
        .eq("brand_mentioned", True) \
        .execute()
    self_mention_rate = round(((self_mentions.count or 0) / max(total_kw, 1)) * 100, 1)

    # Build map data
    map_data = [{
        "name": site.get("name") or site.get("url", "自社"),
        "geo_score": float(site.get("geo_score") or 0),
        "seo_strength": float(site.get("readiness_score") or 0),
        "mention_rate": self_mention_rate,
        "is_self": True,
    }]

    # For competitors, calculate mention rates from monitoring data
    for comp in competitors:
        # Count how many times this competitor appears in rankings
        comp_mentions = 0
        results = supabase.table("monitoring_results") \
            .select("competitors_ranking") \
            .eq("site_id", site_id) \
            .execute()

        for r in (results.data or []):
            for cr in (r.get("competitors_ranking") or []):
                if comp["brand_name"].lower() in cr.get("brand", "").lower():
                    comp_mentions += 1

        map_data.append({
            "name": comp["brand_name"],
            "geo_score": 0,  # We don't track competitor GEO scores directly
            "seo_strength": 0,
            "mention_rate": round((comp_mentions / max(total_kw, 1)) * 100, 1),
            "is_self": False,
        })

    return {"map_data": map_data, "total_keywords": total_kw}
