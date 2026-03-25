import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { Errors } from "../../_lib/errors";

/** GET /api/v1/auth/me — Current user + organization */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("id", auth.userId)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, created_at")
    .eq("id", auth.orgId)
    .single();

  if (!org) throw Errors.notFound("組織");

  return success({
    user: user ?? null,
    organization: org,
    auth_method: auth.authMethod,
  });
});
