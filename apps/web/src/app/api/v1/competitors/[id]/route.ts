import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/v1/competitors/:id */
export const DELETE = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  await supabase
    .from("competitors")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  return success({ deleted: true });
});
