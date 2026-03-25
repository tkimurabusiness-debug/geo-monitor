import { authenticate, getOrgSupabase } from "../_lib/auth";
import { success, paginated, withErrorHandling } from "../_lib/response";
import { parseBody, parseQuery, requireFields } from "../_lib/validate";
import { Errors } from "../_lib/errors";
import { PLAN_LIMITS } from "@geo-monitor/shared-types";
import type { Plan } from "@geo-monitor/shared-types";

/** GET /api/v1/sites — List sites for current org */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const { getPage } = parseQuery(req);
  const { page, perPage } = getPage();

  const supabase = await getOrgSupabase();

  // Count total
  const { count } = await supabase
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId);

  // Fetch page
  const { data: sites, error: dbError } = await supabase
    .from("sites")
    .select("*")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (dbError) throw dbError;

  return paginated(sites ?? [], count ?? 0, page, perPage);
});

/** POST /api/v1/sites — Create a new site */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ url: string; name?: string }>(req);
  requireFields(body, ["url"]);

  const supabase = await getOrgSupabase();

  // Check plan limit
  const { count } = await supabase
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId);

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", auth.orgId)
    .single();

  const plan = (org?.plan ?? "basic") as Plan;
  const limit = PLAN_LIMITS[plan].sites;
  if ((count ?? 0) >= limit) {
    throw Errors.planLimit("サイト数");
  }

  // Normalize URL
  let url = body.url.trim();
  if (!url.startsWith("http")) url = "https://" + url;

  const { data: site, error: dbError } = await supabase
    .from("sites")
    .insert({
      organization_id: auth.orgId,
      url,
      name: body.name || null,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return success(site, 201);
});
