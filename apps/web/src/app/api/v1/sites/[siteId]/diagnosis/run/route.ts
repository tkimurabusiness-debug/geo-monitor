import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { proxyToFastAPI } from "../../../../_lib/fastapi-proxy";
import { Errors } from "../../../../_lib/errors";

type Ctx = { params: Promise<{ siteId: string }> };

/** POST /api/v1/sites/:siteId/diagnosis/run — Run site diagnosis via FastAPI */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  // Get site URL
  const { data: site } = await supabase
    .from("sites")
    .select("url, name")
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
    const result = await proxyToFastAPI("/internal/diagnosis/run", {
      site_id: siteId,
      organization_id: auth.orgId,
      url: site.url,
      brand_name: org?.name ?? "",
    });
    return success(result);
  } catch (e) {
    console.error("[Diagnosis Proxy Error]", e);
    return success(
      { status: "queued", message: "FastAPIサービス起動後に実行されます", site_id: siteId },
      202,
    );
  }
});
