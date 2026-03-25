"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button, PlatformIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AI_PLATFORMS, PLATFORM_META } from "@geo-monitor/shared-types";
import type { AIPlatform } from "@geo-monitor/shared-types";
import { mockKeywords, generateKeywordHistory } from "@/lib/mock-data/keywords";

export default function KeywordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const kw = mockKeywords.find((k) => k.id === id) ?? mockKeywords[0];
  const history = generateKeywordHistory(kw.id);

  const mentionedCount = AI_PLATFORMS.filter(
    (p) => kw.platforms[p] != null,
  ).length;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/keywords"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent mb-3"
        >
          <ArrowLeft size={12} />
          キーワード一覧に戻る
        </Link>
        <PageHeader
          title={kw.keyword}
          description={`カテゴリ: ${kw.category}`}
          actions={
            <Button size="sm" variant="outline">
              <ExternalLink size={14} />
              チェック実行
            </Button>
          }
        />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-text-muted">GEOスコア</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {kw.geoScore}
            </span>
            <span className="text-sm text-text-muted">/100</span>
          </div>
          <TrendBadge value={kw.trend} />
        </Card>
        <Card>
          <p className="text-xs text-text-muted">Google順位</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">
            {kw.serpRank ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">検索Vol/月</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">
            {kw.searchVolume ? formatNumber(kw.searchVolume) : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">AI言及率</p>
          <p className="text-2xl font-bold font-mono text-text-primary mt-1">
            {mentionedCount}/{AI_PLATFORMS.length}
          </p>
        </Card>
      </div>

      {/* Platform cards */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          プラットフォーム別スコア
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AI_PLATFORMS.map((p) => {
            const rank = kw.platforms[p];
            const mentioned = rank != null;
            return (
              <Card
                key={p}
                padding="sm"
                className={cn(
                  "text-center",
                  !mentioned && "opacity-50",
                )}
              >
                <div className="flex justify-center mb-2">
                  <PlatformIcon platform={p} size="lg" />
                </div>
                <p className="text-xs font-medium text-text-secondary">
                  {PLATFORM_META[p].label}
                </p>
                {mentioned ? (
                  <>
                    <p className="text-lg font-bold font-mono text-text-primary mt-1">
                      {rank}位
                    </p>
                    <Badge variant="success" className="mt-1">
                      言及あり
                    </Badge>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold font-mono text-text-muted mt-1">
                      —
                    </p>
                    <Badge variant="muted" className="mt-1">
                      言及なし
                    </Badge>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trend chart */}
      <Card padding="md">
        <CardTitle>GEOスコア推移（30日）</CardTitle>
        <div className="mt-2 flex gap-3 mb-4">
          {(["chatgpt", "gemini", "claude", "perplexity"] as AIPlatform[]).map(
            (p) => (
              <PlatformIcon key={p} platform={p} size="sm" showLabel />
            ),
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={history}>
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
              }}
            />
            <Area
              type="monotone"
              dataKey="chatgpt"
              stroke={PLATFORM_META.chatgpt.color}
              fill={PLATFORM_META.chatgpt.color}
              fillOpacity={0.08}
              strokeWidth={2}
              name="ChatGPT"
            />
            <Area
              type="monotone"
              dataKey="gemini"
              stroke={PLATFORM_META.gemini.color}
              fill={PLATFORM_META.gemini.color}
              fillOpacity={0.08}
              strokeWidth={2}
              name="Gemini"
            />
            <Area
              type="monotone"
              dataKey="claude"
              stroke={PLATFORM_META.claude.color}
              fill={PLATFORM_META.claude.color}
              fillOpacity={0.08}
              strokeWidth={2}
              name="Claude"
            />
            <Area
              type="monotone"
              dataKey="perplexity"
              stroke={PLATFORM_META.perplexity.color}
              fill={PLATFORM_META.perplexity.color}
              fillOpacity={0.05}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              name="Perplexity"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Competitor comparison for this keyword */}
      <Card padding="md">
        <CardTitle>このキーワードの競合ランキング</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">
          AI回答で同じキーワードに言及されている企業
        </p>
        <div className="space-y-2">
          {[
            { rank: 1, brand: "Stock Value（自社）", highlight: true },
            { rank: 2, brand: "競合A社", highlight: false },
            { rank: 3, brand: "競合B社", highlight: false },
            { rank: null as number | null, brand: "競合C社", highlight: false },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                item.highlight
                  ? "border-accent bg-accent-light/30"
                  : "border-border-light",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold",
                  item.rank === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : item.rank
                      ? "bg-gray-100 text-gray-600"
                      : "bg-gray-50 text-gray-400",
                )}
              >
                {item.rank ?? "—"}
              </span>
              <span
                className={cn(
                  "text-sm",
                  item.highlight
                    ? "font-semibold text-accent-text"
                    : "text-text-secondary",
                )}
              >
                {item.brand}
              </span>
              {item.rank === null && (
                <Badge variant="muted" className="ml-auto">
                  言及なし
                </Badge>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <Badge variant={positive ? "success" : "danger"} className="mt-1">
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? "+" : ""}
      {value}
    </Badge>
  );
}
