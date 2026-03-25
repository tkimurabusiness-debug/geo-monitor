import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/v1/actions/:id — Update status */
export const PATCH = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const body = await parseBody<{ status: string }>(req);
  const supabase = await getOrgSupabase();

  const { data, error: dbError } = await supabase
    .from("action_suggestions")
    .update({ status: body.status })
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .select()
    .single();

  if (dbError || !data) throw Errors.notFound("施策");
  return success(data);
});
