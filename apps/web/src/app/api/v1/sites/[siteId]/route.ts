import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody } from "../../_lib/validate";
import { Errors } from "../../_lib/errors";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("organization_id", auth.orgId)
    .single();

  if (!site) throw Errors.notFound("サイト");
  return success(site);
});

/** PATCH /api/v1/sites/:siteId */
export const PATCH = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const body = await parseBody<{ url?: string; name?: string }>(req);
  const supabase = await getOrgSupabase();

  const { data: site, error: dbError } = await supabase
    .from("sites")
    .update({
      ...(body.url !== undefined && { url: body.url }),
      ...(body.name !== undefined && { name: body.name }),
    })
    .eq("id", siteId)
    .eq("organization_id", auth.orgId)
    .select()
    .single();

  if (dbError || !site) throw Errors.notFound("サイト");
  return success(site);
});

/** DELETE /api/v1/sites/:siteId */
export const DELETE = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  const { error: dbError } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId)
    .eq("organization_id", auth.orgId);

  if (dbError) throw Errors.notFound("サイト");
  return success({ deleted: true });
});
