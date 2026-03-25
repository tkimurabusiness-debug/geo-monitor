import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseBody, requireFields } from "../../_lib/validate";
import { proxyToFastAPI } from "../../_lib/fastapi-proxy";

/** POST /api/v1/content/generate */
export const POST = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{
    keyword: string;
    content_type?: string;
    tone?: string;
    keyword_id?: string;
  }>(req);
  requireFields(body, ["keyword"]);

  const supabase = await getOrgSupabase();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.orgId)
    .single();

  const { data: site } = await supabase
    .from("sites")
    .select("url")
    .eq("organization_id", auth.orgId)
    .limit(1)
    .single();

  try {
    const result = await proxyToFastAPI("/internal/content/generate", {
      keyword: body.keyword,
      content_type: body.content_type ?? "blog",
      tone: body.tone ?? "professional",
      organization_id: auth.orgId,
      site_url: site?.url ?? "",
      brand_name: org?.name ?? "",
      keyword_id: body.keyword_id ?? null,
    });
    return success(result);
  } catch (e) {
    console.error("[Content Proxy Error]", e);
    return success({ status: "queued", message: "FastAPI起動後に実行されます" }, 202);
  }
});
