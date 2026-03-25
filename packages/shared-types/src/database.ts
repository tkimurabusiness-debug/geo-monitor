import type {
  AIPlatform,
  Plan,
  GeoImportance,
  KeywordSource,
  Sentiment,
  AlertSeverity,
  ActionPriority,
  ActionStatus,
  UserRole,
} from "./domain";

/** Organization (tenant) */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}

/** User */
export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  role: UserRole;
  created_at: string;
}

/** Site */
export interface Site {
  id: string;
  organization_id: string;
  url: string;
  name: string;
  geo_score: number | null;
  readiness_score: number | null;
  last_diagnosed_at: string | null;
  created_at: string;
}

/** Keyword category */
export interface KeywordCategory {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

/** Keyword */
export interface Keyword {
  id: string;
  site_id: string;
  organization_id: string;
  category_id: string | null;
  keyword: string;
  source: KeywordSource;
  geo_importance: GeoImportance;
  search_intent: string | null;
  is_active: boolean;
  created_at: string;
}

/** Competitor */
export interface Competitor {
  id: string;
  site_id: string;
  brand_name: string;
  url: string | null;
  source: "auto_detected" | "manual";
  created_at: string;
}

/** GEO monitoring result */
export interface MonitoringResult {
  id: string;
  site_id: string;
  keyword_id: string;
  platform: AIPlatform;
  model: string | null;
  prompt_text: string;
  response_text: string;
  brand_mentioned: boolean;
  brand_rank: number | null;
  url_cited: boolean;
  cited_urls: string[];
  competitors_ranking: Array<{ brand: string; rank: number }>;
  sentiment: Sentiment | null;
  raw_response: Record<string, unknown>;
  checked_at: string;
}

/** SEO ranking */
export interface SeoRanking {
  id: string;
  site_id: string;
  keyword_id: string;
  google_rank: number | null;
  aio_displayed: boolean;
  aio_cited: boolean;
  search_volume: number | null;
  checked_at: string;
}

/** Diagnosis result */
export interface DiagnosisResult {
  id: string;
  site_id: string;
  readiness_score: number;
  geo_score: number;
  technical_checks: Record<string, boolean>;
  content_checks: Record<string, boolean>;
  extracted_keywords: Record<string, unknown>;
  recommended_keywords: Record<string, unknown>;
  full_report: Record<string, unknown>;
  diagnosed_at: string;
}

/** Alert */
export interface Alert {
  id: string;
  organization_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/** Action suggestion */
export interface ActionSuggestion {
  id: string;
  organization_id: string;
  site_id: string;
  priority: ActionPriority;
  category: string;
  title: string;
  description: string;
  estimated_impact: string | null;
  status: ActionStatus;
  created_at: string;
}

/** Report */
export interface Report {
  id: string;
  organization_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  pdf_url: string | null;
  created_at: string;
}
