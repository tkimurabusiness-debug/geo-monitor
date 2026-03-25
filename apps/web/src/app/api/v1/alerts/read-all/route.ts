import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";

/** POST /api/v1/alerts/read-all */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("organization_id", auth.orgId)
    .eq("is_read", false);

  return success({ read_all: true });
});
