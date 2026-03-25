import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, paginated, withErrorHandling } from "../../../_lib/response";
import { parseBody, parseQuery, requireFields } from "../../../_lib/validate";
import { Errors } from "../../../_lib/errors";
import { PLAN_LIMITS, type Plan } from "@geo-monitor/shared-types";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/keywords */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const q = parseQuery(req);
  const { page, perPage } = q.getPage();
  const category = q.get("category");
  const importance = q.get("importance");
  const search = q.get("search");

  const supabase = await getOrgSupabase();

  let query = supabase
    .from("keywords")
    .select("*, keyword_categories(name)", { count: "exact" })
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .eq("is_active", true);

  if (category) query = query.eq("category_id", category);
  if (importance) query = query.eq("geo_importance", importance);
  if (search) query = query.ilike("keyword", `%${search}%`);

  const { count } = await query;

  const { data, error: dbError } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (dbError) throw dbError;
  return paginated(data ?? [], count ?? 0, page, perPage);
});

/** POST /api/v1/sites/:siteId/keywords */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const body = await parseBody<{
    keyword: string;
    category_id?: string;
    geo_importance?: string;
    search_intent?: string;
    source?: string;
  }>(req);
  requireFields(body, ["keyword"]);

  const supabase = await getOrgSupabase();

  // Plan limit check
  const { count } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId)
    .eq("is_active", true);

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", auth.orgId)
    .single();

  const limit = PLAN_LIMITS[(org?.plan ?? "basic") as Plan].keywords;
  if (limit !== Infinity && (count ?? 0) >= limit) {
    throw Errors.planLimit("キーワード数");
  }

  const { data, error: dbError } = await supabase
    .from("keywords")
    .insert({
      site_id: siteId,
      organization_id: auth.orgId,
      keyword: body.keyword.trim(),
      category_id: body.category_id ?? null,
      geo_importance: body.geo_importance ?? "medium",
      search_intent: body.search_intent ?? null,
      source: body.source ?? "manual",
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return success(data, 201);
});
