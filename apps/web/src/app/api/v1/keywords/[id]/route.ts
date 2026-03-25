import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/v1/keywords/:id */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("keywords")
    .select("*, keyword_categories(name)")
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .single();

  if (!data) throw Errors.notFound("キーワード");
  return success(data);
});

/** PATCH /api/v1/keywords/:id */
export const PATCH = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const body = await parseBody<Record<string, unknown>>(req);
  const supabase = await getOrgSupabase();

  const allowed = ["keyword", "category_id", "geo_importance", "search_intent", "is_active"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error: dbError } = await supabase
    .from("keywords")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.orgId)
    .select()
    .single();

  if (dbError || !data) throw Errors.notFound("キーワード");
  return success(data);
});

/** DELETE /api/v1/keywords/:id */
export const DELETE = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { id } = await params;
  const supabase = await getOrgSupabase();

  await supabase
    .from("keywords")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  return success({ deleted: true });
});
