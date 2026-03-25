import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";

/** GET /api/v1/dashboard/summary — KPI summary */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const supabase = await getOrgSupabase();

  // Aggregate KPIs from sites
  const { data: sites } = await supabase
    .from("sites")
    .select("geo_score, readiness_score")
    .eq("organization_id", auth.orgId);

  const geoScores = (sites ?? []).map((s) => s.geo_score).filter(Boolean) as number[];
  const readinessScores = (sites ?? []).map((s) => s.readiness_score).filter(Boolean) as number[];
  const avgGeo = geoScores.length ? geoScores.reduce((a, b) => a + b, 0) / geoScores.length : 0;
  const avgReadiness = readinessScores.length ? readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length : 0;

  // Count active keywords
  const { count: kwCount } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId)
    .eq("is_active", true);

  // Count unread alerts
  const { count: alertCount } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId)
    .eq("is_read", false);

  // Recent monitoring mentions count (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: mentionCount } = await supabase
    .from("monitoring_results")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", auth.orgId)
    .eq("brand_mentioned", true)
    .gte("checked_at", weekAgo.toISOString());

  return success({
    geo_score: Math.round(avgGeo * 10) / 10,
    readiness_score: Math.round(avgReadiness * 10) / 10,
    weekly_mentions: mentionCount ?? 0,
    active_keywords: kwCount ?? 0,
    unread_alerts: alertCount ?? 0,
  });
});
