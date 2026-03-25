import { authenticate, getOrgSupabase } from "../../../_lib/auth";
import { success, withErrorHandling } from "../../../_lib/response";

type Ctx = { params: Promise<{ siteId: string }> };

/** GET /api/v1/sites/:siteId/diagnosis — Latest diagnosis */
export const GET = withErrorHandling(async (req, { params }: Ctx) => {
  const auth = await authenticate(req);
  const { siteId } = await params;
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("diagnosis_results")
    .select("*")
    .eq("site_id", siteId)
    .eq("organization_id", auth.orgId)
    .order("diagnosed_at", { ascending: false })
    .limit(1)
    .single();

  return success(data);
});
