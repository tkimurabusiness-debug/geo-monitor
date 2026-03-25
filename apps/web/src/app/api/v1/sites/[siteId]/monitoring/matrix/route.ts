import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { AI_PLATFORMS } from "@geo-monitor/shared-types";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/monitoring/matrix — KW x AI matrix */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  // Get all active keywords for this site
  const { data: keywords } = await supabase
    .from("keywords")
    .select("id, keyword")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .eq("is_active", true)
    .order("created_at");

  // Get latest monitoring result per keyword per platform
  const { data: results } = await supabase
    .from("monitoring_results")
    .select("id, keyword_id, platform, brand_mentioned, brand_rank, checked_at")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .order("checked_at", { ascending: false });

  // Build matrix: for each keyword, get latest result per platform
  const matrix = (keywords ?? []).map((kw) => {
    const platforms: Record<string, { mentioned: boolean; rank: number | null; resultId: string | null }> = {};
    for (const p of AI_PLATFORMS) {
      const latest = results?.find((r) => r.keyword_id === kw.id && r.platform === p);
      platforms[p] = {
        mentioned: latest?.brand_mentioned ?? false,
        rank: latest?.brand_rank ?? null,
        resultId: latest?.id ?? null,
      };
    }
    return { keywordId: kw.id, keyword: kw.keyword, platforms };
  });

  return success(matrix);
});
