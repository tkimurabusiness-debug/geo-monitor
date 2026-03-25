import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, withErrorHandling } from "../../../_lib/response";

/** GET /api/v1/organizations/current/members */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("organization_id", auth.orgId)
    .order("created_at");

  return success(data ?? []);
});
