import { authenticate, getOrgSupabase } from "../_lib/auth";
import { success, withErrorHandling } from "../_lib/response";
import { parseBody } from "../_lib/validate";

/** GET /api/v1/alert-settings */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  const { data } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("organization_id", auth.orgId);

  return success(data ?? []);
});

/** PUT /api/v1/alert-settings — Upsert alert settings */
export const PUT = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const body = await parseBody<{
    settings: Array<{
      rule_type: string;
      threshold?: Record<string, unknown>;
      channels?: string[];
      enabled: boolean;
    }>;
  }>(req);

  const supabase = await getOrgSupabase();

  // Delete existing and re-insert
  await supabase
    .from("alert_settings")
    .delete()
    .eq("organization_id", auth.orgId);

  if (body.settings?.length) {
    const rows = body.settings.map((s) => ({
      organization_id: auth.orgId,
      rule_type: s.rule_type,
      threshold: s.threshold ?? {},
      channels: s.channels ?? ["email"],
      enabled: s.enabled,
    }));

    await supabase.from("alert_settings").insert(rows);
  }

  return success({ updated: true });
});
