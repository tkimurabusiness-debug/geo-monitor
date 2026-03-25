import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, withErrorHandling } from "../../../_lib/response";
import { parseBody, requireFields } from "../../../_lib/validate";
import { Errors } from "../../../_lib/errors";
import { PLAN_LIMITS, type Plan } from "@geo-monitor/shared-types";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/competitors */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("competitors")
    .select("*")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });

  return success(data ?? []);
});

/** POST /api/v1/sites/:siteId/competitors */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const body = await parseBody<{ brand_name: string; url?: string }>(req);
  requireFields(body, ["brand_name"]);

  const supabase = await getOrgSupabase();

  // Plan limit
  const { count } = await supabase
    .from("competitors")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId);

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", auth.orgId)
    .single();

  const limit = PLAN_LIMITS[(org?.plan ?? "basic") as Plan].competitors;
  if (limit !== Infinity && (count ?? 0) >= limit) {
    throw Errors.planLimit("競合数");
  }

  const { data, error: dbError } = await supabase
    .from("competitors")
    .insert({
      site_id: siteId,
      organization_id: auth.orgId,
      brand_name: body.brand_name,
      url: body.url ?? null,
      source: "manual",
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return success(data, 201);
});
