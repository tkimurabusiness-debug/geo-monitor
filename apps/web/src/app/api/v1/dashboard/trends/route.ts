import { authenticate, getOrgSupabase } from "../../_lib/auth";
import { success, withErrorHandling } from "../../_lib/response";
import { parseQuery } from "../../_lib/validate";

/** GET /api/v1/dashboard/trends — Score trends over time */
export const GET = withErrorHandling(async (req) => {
  const auth = await authenticate(req);
  const { getInt } = parseQuery(req);
  const days = getInt("days", 30);
  const supabase = await getOrgSupabase();

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get monitoring results grouped by date and platform
  const { data: results } = await supabase
    .from("monitoring_results")
    .select("platform, brand_mentioned, brand_rank, checked_at")
    .eq("organization_id", auth.orgId)
    .gte("checked_at", since.toISOString())
    .order("checked_at", { ascending: true });

  // Aggregate by date + platform
  const byDate: Record<string, Record<string, { total: number; mentioned: number }>> = {};
  for (const r of results ?? []) {
    const date = r.checked_at.slice(0, 10);
    byDate[date] ??= {};
    byDate[date][r.platform] ??= { total: 0, mentioned: 0 };
    byDate[date][r.platform].total++;
    if (r.brand_mentioned) byDate[date][r.platform].mentioned++;
  }

  const trends = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, platforms]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(platforms).map(([p, v]) => [
          p,
          v.total > 0 ? Math.round((v.mentioned / v.total) * 100) : 0,
        ]),
      ),
    }));

  return success(trends);
});
