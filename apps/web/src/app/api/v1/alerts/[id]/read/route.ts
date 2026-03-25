import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, withErrorHandling } from "../../../_lib/response";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/v1/alerts/:id/read */
export const PATCH = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  return success({ read: true });
});
