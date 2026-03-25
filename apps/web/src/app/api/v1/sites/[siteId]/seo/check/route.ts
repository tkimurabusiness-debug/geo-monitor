import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { proxyToFastAPI } from "../../../../_lib/fastapi-proxy";
import { Errors } from "../../../../_lib/errors";

type Ctx = { params: Promise<{ siteId: string }> };

/** POST /api/v1/sites/:siteId/seo/check — Run SERP + search volume check via FastAPI */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  const { data: site } = await supabase
    .from("sites")
    .select("url")
    .eq("id", siteId)
    .eq("organization_id", auth.orgId)
    .single();

  if (!site) throw Errors.notFound("サイト");

  try {
    const result = await proxyToFastAPI("/internal/seo/check", {
      site_id: siteId,
      organization_id: auth.orgId,
      site_url: site.url,
    });
    return success(result);
  } catch (e) {
    console.error("[SEO Check Proxy Error]", e);
    return success(
      { status: "queued", message: "FastAPIサービス起動後に実行されます", site_id: siteId },
      202,
    );
  }
});
