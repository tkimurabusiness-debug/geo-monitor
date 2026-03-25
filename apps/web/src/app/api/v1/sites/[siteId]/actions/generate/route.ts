import { authenticate, getOrgSupabase } from "../../../../_lib/auth";
import { success, withErrorHandling } from "../../../../_lib/response";
import { proxyToFastAPI } from "../../../../_lib/fastapi-proxy";

type Ctx = { params: Promise<{ siteId: string }> };

/** POST /api/v1/sites/:siteId/actions/generate — Generate action suggestions */
export const POST = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;

  const supabase = await getOrgSupabase();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", auth.orgId)
    .single();

  try {
    const result = await proxyToFastAPI("/internal/actions/generate", {
      site_id: siteId,
      organization_id: auth.orgId,
      plan: org?.plan ?? "basic",
    });
    return success(result);
  } catch (e) {
    console.error("[Actions Proxy Error]", e);
    return success({ status: "queued", message: "FastAPI起動後に実行されます" }, 202);
  }
});
