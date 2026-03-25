import { PLAN_LIMITS, type Plan } from "@geo-monitor/shared-types";

type Feature =
  | "slack"
  | "monthly_pdf"
  | "content_gen"
  | "detailed_actions";

const featureMap: Record<Feature, (plan: Plan) => boolean> = {
  slack: (plan) => PLAN_LIMITS[plan].hasSlack,
  monthly_pdf: (plan) => PLAN_LIMITS[plan].hasMonthlyPdf,
  content_gen: (plan) => PLAN_LIMITS[plan].hasContentGen,
  detailed_actions: (plan) => plan !== "basic",
};

/** Check if a plan has access to a feature */
export function canAccess(feature: Feature, plan: Plan): boolean {
  return featureMap[feature]?.(plan) ?? false;
}

/** Check if a plan limit is exceeded */
export function isWithinLimit(
  resource: "sites" | "keywords" | "competitors",
  currentCount: number,
  plan: Plan,
): boolean {
  const limit = PLAN_LIMITS[plan][resource];
  if (limit === Infinity) return true;
  return currentCount < limit;
}
