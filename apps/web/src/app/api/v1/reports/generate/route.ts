import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody } from "../../_lib/validate";
import { proxyToFastAPI } from "../../_lib/fastapi-proxy";
import { Errors } from "../../_lib/errors";

/** POST /api/v1/reports/generate */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{ year?: number; month?: number; site_id?: string }>(req).catch(() => ({ year: undefined, month: undefined, site_id: undefined }));

  const now = new Date();
  const year = body.year ?? now.getFullYear();
  const month = body.month ?? now.getMonth() + 1;

  const supabase = await getOrgSupabase();

  // Get site_id (use first site if not specified)
  let siteId = body.site_id;
  if (!siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("organization_id", auth.orgId)
      .limit(1)
      .single();
    siteId = site?.id;
  }
  if (!siteId) throw Errors.badRequest("サイトが登録されていません");

  try {
    const result = await proxyToFastAPI("/internal/reports/generate", {
      organization_id: auth.orgId,
      site_id: siteId,
      year,
      month,
    });
    return success(result);
  } catch (e) {
    console.error("[Report Proxy Error]", e);
    return success({ status: "queued", message: "FastAPI起動後に実行されます" }, 202);
  }
});
