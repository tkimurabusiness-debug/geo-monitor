/** AI Platforms supported by GEO Monitor (display order) */
export const AI_PLATFORMS = [
  "chatgpt",
  "gemini",
  "claude",
  "perplexity",
  "grok",
  "deepseek",
] as const;

export type AIPlatform = (typeof AI_PLATFORMS)[number];

/** Platform display metadata
 * 主要3色: ChatGPT=緑, Gemini=青, Claude=オレンジ
 * Perplexity/Grok/DeepSeek=グレー
 */
export const PLATFORM_META: Record<
  AIPlatform,
  { label: string; color: string; shortLabel: string }
> = {
  chatgpt: { label: "ChatGPT", shortLabel: "GPT", color: "#10b981" },
  gemini: { label: "Gemini", shortLabel: "Gem", color: "#3b82f6" },
  claude: { label: "Claude", shortLabel: "Cla", color: "#f59e0b" },
  perplexity: { label: "Perplexity", shortLabel: "Pplx", color: "#94a3b8" },
  grok: { label: "Grok", shortLabel: "Grk", color: "#94a3b8" },
  deepseek: { label: "DeepSeek", shortLabel: "DS", color: "#94a3b8" },
};

/** Subscription plans */
export const PLANS = ["basic", "pro", "enterprise"] as const;
export type Plan = (typeof PLANS)[number];

/** Plan limits */
export const PLAN_LIMITS: Record<
  Plan,
  {
    sites: number;
    keywords: number;
    competitors: number;
    checkFrequency: string;
    hasSlack: boolean;
    hasMonthlyPdf: boolean;
    hasContentGen: boolean;
  }
> = {
  basic: {
    sites: 1,
    keywords: 100,
    competitors: 3,
    checkFrequency: "weekly",
    hasSlack: false,
    hasMonthlyPdf: false,
    hasContentGen: false,
  },
  pro: {
    sites: 3,
    keywords: 500,
    competitors: 10,
    checkFrequency: "biweekly",
    hasSlack: true,
    hasMonthlyPdf: true,
    hasContentGen: true,
  },
  enterprise: {
    sites: 10,
    keywords: Infinity,
    competitors: Infinity,
    checkFrequency: "daily",
    hasSlack: true,
    hasMonthlyPdf: true,
    hasContentGen: true,
  },
};

/** GEO importance levels */
export type GeoImportance = "high" | "medium" | "low";

/** Keyword source */
export type KeywordSource = "extracted" | "recommended" | "manual";

/** Sentiment */
export type Sentiment = "positive" | "neutral" | "negative";

/** Alert severity */
export type AlertSeverity = "critical" | "warning" | "info";

/** Action priority */
export type ActionPriority = "critical" | "high" | "medium" | "low";

/** Action status */
export type ActionStatus = "todo" | "in_progress" | "done" | "dismissed";

/** User role within organization */
export type UserRole = "owner" | "admin" | "member" | "viewer";
