import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

/** GET /api/v1/organizations/current */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", auth.orgId)
    .single();

  if (!data) throw Errors.notFound("組織");
  return success(data);
});

/** PATCH /api/v1/organizations/current */
export const PATCH = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ name?: string; slug?: string }>(req);
  const supabase = await getOrgSupabase();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;

  const { data, error: dbError } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", auth.orgId)
    .select()
    .single();

  if (dbError || !data) throw Errors.internal("組織の更新に失敗しました");
  return success(data);
});
