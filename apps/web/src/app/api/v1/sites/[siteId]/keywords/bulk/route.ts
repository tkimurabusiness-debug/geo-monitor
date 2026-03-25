import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { parseBody } from "../../../../_lib/validate";

type Ctx = { params: Promise<{ siteId: string }> };

/** POST /api/v1/sites/:siteId/keywords/bulk — Bulk add keywords */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const body = await parseBody<{
    keywords: Array<{
      keyword: string;
      category_id?: string;
      geo_importance?: string;
      source?: string;
    }>;
  }>(req);

  if (!body.keywords?.length) {
    return success({ inserted: 0 });
  }

  const supabase = await getOrgSupabase();

  const rows = body.keywords.map((kw) => ({
    site_id: siteId,
    organization_id: auth.orgId,
    keyword: kw.keyword.trim(),
    category_id: kw.category_id ?? null,
    geo_importance: kw.geo_importance ?? "medium",
    source: kw.source ?? "manual",
  }));

  const { data, error: dbError } = await supabase
    .from("keywords")
    .insert(rows)
    .select();

  if (dbError) throw dbError;
  return success({ inserted: data?.length ?? 0, keywords: data }, 201);
});
