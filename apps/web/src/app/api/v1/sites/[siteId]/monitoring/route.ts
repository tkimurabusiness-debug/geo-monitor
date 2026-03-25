import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { paginated, withErrorHandling } from "../../../_lib/response";
import { parseQuery } from "../../../_lib/validate";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/monitoring — Monitoring results list */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const { getPage, get } = parseQuery(req);
  const { page, perPage } = getPage();
  const platform = get("platform");
  const keywordId = get("keyword_id");

  const supabase = await getOrgSupabase();

  let query = supabase
    .from("monitoring_results")
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId);

  if (platform) query = query.eq("platform", platform);
  if (keywordId) query = query.eq("keyword_id", keywordId);

  const { count } = await query;
  const { data } = await query
    .order("checked_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  return paginated(data ?? [], count ?? 0, page, perPage);
});
