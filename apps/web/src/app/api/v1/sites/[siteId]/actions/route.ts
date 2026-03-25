import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, withErrorHandling } from "../../../_lib/response";
import { parseQuery } from "../../../_lib/validate";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/actions */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const { get } = parseQuery(req);
  const status = get("status");
  const supabase = await getOrgSupabase();

  let query = supabase
    .from("action_suggestions")
    .select("*")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId);

  if (status) query = query.eq("status", status);

  const { data } = await query.order("created_at", { ascending: false });
  return success(data ?? []);
});
