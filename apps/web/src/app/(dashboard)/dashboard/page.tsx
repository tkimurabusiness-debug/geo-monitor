"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, PlatformIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { PLATFORM_META } from "@geo-monitor/shared-types";
import type { AIPlatform } from "@geo-monitor/shared-types";
import {
  mockKPIs,
  mockTrendData,
  mockRadarData,
  mockAlerts,
  mockTopKeywords,
  mockActions,
} from "@/lib/mock-data/dashboard";
import { useFetch } from "@/hooks/use-fetch";

const platformLines: Array<{ key: AIPlatform; color: string }> = [
  { key: "chatgpt", color: PLATFORM_META.chatgpt.color },
  { key: "gemini", color: PLATFORM_META.gemini.color },
  { key: "claude", color: PLATFORM_META.claude.color },
  { key: "perplexity", color: PLATFORM_META.perplexity.color },
  { key: "grok", color: PLATFORM_META.grok.color },
  { key: "deepseek", color: PLATFORM_META.deepseek.color },
];

const DEFAULT_PLATFORMS: AIPlatform[] = ["chatgpt", "gemini", "claude"];

// Mock summary for useFetch fallback
const mockSummary = {
  geo_score: mockKPIs.geoScore.value,
  readiness_score: mockKPIs.readiness.value,
  weekly_mentions: mockKPIs.weeklyMentions.value,
  active_keywords: mockKPIs.dominantKWs.total,
  unread_alerts: 3,
};

export default function DashboardPage() {
  const { data: summary } = useFetch("/dashboard/summary", mockSummary);
  const { data: trends } = useFetch("/dashboard/trends", mockTrendData);

  const [activePlatforms, setActivePlatforms] = useState<Set<AIPlatform>>(
    new Set(DEFAULT_PLATFORMS),
  );

  function togglePlatform(p: AIPlatform) {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const visibleLines = platformLines.filter((p) => activePlatforms.has(p.key));

  return (
    <div className="space-y-6">
      <PageHeader
        title="ダッシュボード"
        description="GEOモニタリングの概要"
      />

      {/* AI Platform Selector */}
      <Card padding="sm">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-text-secondary">表示AI:</span>
          {platformLines.map((p) => {
            const meta = PLATFORM_META[p.key];
            const checked = activePlatforms.has(p.key);
            return (
              <label
                key={p.key}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                  checked
                    ? "border-current bg-opacity-10"
                    : "border-border opacity-40 hover:opacity-70",
                )}
                style={checked ? { borderColor: meta.color, backgroundColor: meta.color + "10" } : undefined}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlatform(p.key)}
                  className="sr-only"
                />
                <PlatformIcon platform={p.key} size="sm" />
                <span className="text-sm font-medium">{meta.label}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="総合GEOスコア"
          value={(summary?.geo_score ?? 0).toFixed(1)}
          unit="/100"
          change={mockKPIs.geoScore.change}
        />
        <KPICard
          label="GEO Readiness"
          value={(summary?.readiness_score ?? 0).toFixed(1)}
          unit="/100"
          change={mockKPIs.readiness.change}
        />
        <KPICard
          label="週間AI言及数"
          value={(summary?.weekly_mentions ?? 0).toString()}
          change={mockKPIs.weeklyMentions.change}
          suffix="件"
        />
        <KPICard
          label="競合優位KW"
          value={mockKPIs.dominantKWs.value.toString()}
          unit={`/${mockKPIs.dominantKWs.total}`}
          change={mockKPIs.dominantKWs.change}
        />
      </div>

      {/* ── Row 2: Trend Chart + Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padding="md">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>AI検索スコア推移（30日）</CardTitle>
            <div className="flex flex-wrap gap-2">
              {visibleLines.map((p) => (
                <PlatformIcon
                  key={p.key}
                  platform={p.key}
                  size="sm"
                  showLabel
                />
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                }}
              />
              {visibleLines.map((p) => (
                <Line
                  key={p.key}
                  type="monotone"
                  dataKey={p.key}
                  stroke={p.color}
                  strokeWidth={2}
                  dot={false}
                  name={PLATFORM_META[p.key].label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardTitle>プラットフォーム別スコア</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={mockRadarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="platform"
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                axisLine={false}
              />
              <Radar
                dataKey="score"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 3: Actions + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>今週やるべきこと TOP3</CardTitle>
            <Link
              href="/actions"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              すべて見る <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="flex items-start gap-3 rounded-lg border border-border-light p-3 hover:bg-bg-hover transition-colors"
              >
                <Badge
                  variant={
                    action.priority === "critical"
                      ? "danger"
                      : action.priority === "warning"
                        ? "warning"
                        : "info"
                  }
                  className="mt-0.5 shrink-0"
                >
                  {action.priority === "critical"
                    ? "重要"
                    : action.priority === "warning"
                      ? "注意"
                      : "情報"}
                </Badge>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  {action.text}
                </p>
                <ExternalLink size={12} className="shrink-0 text-text-muted mt-1" />
              </Link>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>最近のアラート</CardTitle>
            <Link
              href="/alerts"
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              すべて見る <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border border-border-light p-3"
              >
                <div
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    alert.severity === "critical"
                      ? "bg-danger"
                      : alert.severity === "warning"
                        ? "bg-warning"
                        : "bg-info",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {alert.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {alert.message}
                  </p>
                </div>
                <span className="text-xs text-text-muted shrink-0">
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 4: Top Keywords Table ── */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>TOP キーワード</CardTitle>
          <Link
            href="/keywords"
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            すべて見る <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  キーワード
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  GEOスコア
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  変動
                </th>
                {visibleLines.map((p) => (
                  <th
                    key={p.key}
                    className="px-2 py-2.5 text-center"
                  >
                    <PlatformIcon platform={p.key} size="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTopKeywords.map((kw) => (
                <tr
                  key={kw.id}
                  className="border-b border-border-light hover:bg-bg-hover transition-colors"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/keywords/${kw.id}`}
                      className="text-base font-medium text-text-primary hover:text-accent whitespace-nowrap"
                    >
                      {kw.keyword}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-semibold text-text-primary">
                      {kw.geoScore}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <TrendBadge value={kw.trend} />
                  </td>
                  {visibleLines.map((p) => {
                    const rank =
                      kw.platforms[p.key as keyof typeof kw.platforms];
                    return (
                      <td key={p.key} className="px-2 py-3 text-center">
                        {rank != null ? (
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                              rank === 1
                                ? "bg-emerald-100 text-emerald-700"
                                : rank <= 3
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600",
                            )}
                          >
                            {rank}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Row 5: Platform Summary Cards ── */}
      <div>
        <h2 className="text-base font-semibold text-text-primary mb-3">
          プラットフォーム別サマリ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {mockRadarData.filter((d) => activePlatforms.has(d.platform.toLowerCase() as AIPlatform)).map((d) => {
            const pKey = d.platform.toLowerCase() as AIPlatform;
            return (
              <Card key={d.platform} padding="sm" className="text-center">
                <div className="flex justify-center mb-2">
                  <PlatformIcon platform={pKey} size="lg" />
                </div>
                <p className="text-sm font-medium text-text-secondary">
                  {PLATFORM_META[pKey]?.label ?? d.platform}
                </p>
                <p className="text-2xl font-bold font-mono text-text-primary mt-1">
                  {d.score}
                </p>
                <p className="text-xs text-text-muted">/100</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KPICard({
  label,
  value,
  unit,
  change,
  suffix,
}: {
  label: string;
  value: string;
  unit?: string;
  change: number;
  suffix?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-text-muted font-medium">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono text-text-primary">
          {value}
        </span>
        {unit && <span className="text-base text-text-muted">{unit}</span>}
        {suffix && <span className="text-base text-text-muted">{suffix}</span>}
      </div>
      <div className="mt-2">
        <TrendBadge value={change} />
      </div>
    </Card>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-text-muted">
        <Minus size={14} />
        変動なし
      </span>
    );
  }
  const positive = value > 0;
  return (
    <Badge variant={positive ? "success" : "danger"} className="text-sm px-2.5 py-1">
      {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {positive ? "+" : ""}
      {value}
    </Badge>
  );
}
