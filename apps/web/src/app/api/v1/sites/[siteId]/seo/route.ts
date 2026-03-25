import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { paginated, withErrorHandling } from "../../../_lib/response";
import { parseQuery } from "../../../_lib/validate";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/seo */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const { getPage } = parseQuery(req);
  const { page, perPage } = getPage();
  const supabase = await getOrgSupabase();

  const { data, count } = await supabase
    .from("seo_rankings")
    .select("*, keywords(keyword)", { count: "exact" })
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .order("checked_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  return paginated(data ?? [], count ?? 0, page, perPage);
});
