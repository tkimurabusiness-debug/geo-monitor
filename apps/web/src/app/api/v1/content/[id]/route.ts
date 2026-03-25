import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/content/:id */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("content_generations")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .single();

  if (!data) throw Errors.notFound("コンテンツ");
  return success(data);
});
