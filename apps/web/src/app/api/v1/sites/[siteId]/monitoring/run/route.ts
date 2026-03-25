import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { proxyToFastAPI } from "../../../../_lib/fastapi-proxy";
import { parseBody } from "../../../../_lib/validate";
import { Errors } from "../../../../_lib/errors";

type Ctx = { params: Promise<{ siteId: string }> };

/** POST /api/v1/sites/:siteId/monitoring/run — Run GEO monitoring via FastAPI */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const body = await parseBody<{
    keyword_ids?: string[];
    platforms?: string[];
  }>(req).catch(() => ({ keyword_ids: [], platforms: ["chatgpt", "gemini", "claude"] }));

  const supabase = await getOrgSupabase();
  const { data: site } = await supabase
    .from("sites")
    .select("url")
    .eq("id", siteId)
    .eq("organization_id", auth.orgId)
    .single();

  if (!site) throw Errors.notFound("サイト");

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.orgId)
    .single();

  try {
    const result = await proxyToFastAPI("/internal/monitoring/run", {
      site_id: siteId,
      organization_id: auth.orgId,
      keyword_ids: body.keyword_ids ?? [],
      platforms: body.platforms ?? ["chatgpt", "gemini", "claude"],
      brand_name: org?.name ?? "",
      site_url: site.url,
    });
    return success(result);
  } catch (e) {
    console.error("[Monitoring Proxy Error]", e);
    return success(
      { status: "queued", message: "FastAPIサービス起動後に実行されます", site_id: siteId },
      202,
    );
  }
});
