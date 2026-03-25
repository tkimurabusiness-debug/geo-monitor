import { authenticate, getOrgSupabase } from "../_lib/auth";
import { paginated, withErrorHandling } from "../_lib/response";
import { parseQuery } from "../_lib/validate";

/** GET /api/v1/content */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const { getPage } = parseQuery(req);
  const { page, perPage } = getPage();
  const supabase = await getOrgSupabase();

  const { data, count } = await supabase
    .from("content_generations")
    .select("*", { count: "exact" })
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  return paginated(data ?? [], count ?? 0, page, perPage);
});
