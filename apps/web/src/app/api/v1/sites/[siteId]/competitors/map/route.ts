import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/competitors/map — Industry map data */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  // Fetch site + competitors with their scores
  const { data: site } = await supabase
    .from("sites")
    .select("id, name, url, geo_score, readiness_score")
    .eq("id", siteId)
    .eq("organization_id", auth.orgId)
    .single();

  const { data: competitors } = await supabase
    .from("competitors")
    .select("id, brand_name, url")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId);

  // TODO: Calculate actual SEO/GEO scores per competitor from monitoring data
  // For now return basic structure
  return success({
    self: site ? { name: site.name ?? site.url, geo_score: site.geo_score ?? 0, seo_strength: 0 } : null,
    competitors: (competitors ?? []).map((c) => ({
      id: c.id,
      name: c.brand_name,
      geo_score: 0,
      seo_strength: 0,
    })),
  });
});
