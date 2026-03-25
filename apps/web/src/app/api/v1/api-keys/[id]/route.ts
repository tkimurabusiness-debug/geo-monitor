import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

/** DELETE /api/v1/api-keys/:id */
export const DELETE = withErrorHandling(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await authenticate(req);
    const { id } = await params;

    const supabase = await getOrgSupabase();
    const { error: dbError } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.orgId);

    if (dbError) throw Errors.notFound("APIキー");

    return success({ deleted: true });
  },
);
