import { authenticate, getOrgSupabase } from "../_lib/auth";
import { paginated, withErrorHandling } from "../_lib/response";
import { parseQuery } from "../_lib/validate";

/** GET /api/v1/alerts */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const { getPage, get } = parseQuery(req);
  const { page, perPage } = getPage();
  const isRead = get("is_read");
  const supabase = await getOrgSupabase();

  let query = supabase
    .from("alerts")
    .select("*", { count: "exact" })
    .eq("organization_id", auth.orgId);

  if (isRead !== null) query = query.eq("is_read", isRead === "true");

  const { count } = await query;
  const { data } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  return paginated(data ?? [], count ?? 0, page, perPage);
});
