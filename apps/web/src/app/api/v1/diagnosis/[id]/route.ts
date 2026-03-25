import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/diagnosis/:id */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("diagnosis_results")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .single();

  if (!data) throw Errors.notFound("診断結果");
  return success(data);
});
