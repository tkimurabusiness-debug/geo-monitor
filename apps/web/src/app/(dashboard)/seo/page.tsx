"use client";

import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { mockSerpData } from "@/lib/mock-data/seo";

export default function SeoPage() {
  // Position distribution
  const dist = [
    { range: "1-3位", count: mockSerpData.filter((d) => d.googleRank != null && d.googleRank <= 3).length },
    { range: "4-10位", count: mockSerpData.filter((d) => d.googleRank != null && d.googleRank >= 4 && d.googleRank <= 10).length },
    { range: "11-20位", count: mockSerpData.filter((d) => d.googleRank != null && d.googleRank >= 11 && d.googleRank <= 20).length },
    { range: "21-50位", count: mockSerpData.filter((d) => d.googleRank != null && d.googleRank >= 21 && d.googleRank <= 50).length },
    { range: "50位+", count: mockSerpData.filter((d) => d.googleRank != null && d.googleRank > 50).length },
  ];

  // Scatter data: SEO rank vs GEO score
  const scatterData = mockSerpData
    .filter((d) => d.googleRank != null)
    .map((d) => ({ x: d.googleRank!, y: d.geoScore, keyword: d.keyword }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO順位"
        description="Google検索順位 + 検索ボリューム + GEO相関"
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardTitle>順位分布</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={25} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="キーワード数" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <CardTitle>SEO順位 × GEOスコア相関</CardTitle>
          <p className="text-[10px] text-text-muted mb-2">X: Google順位（左が上位） / Y: GEOスコア</p>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Google順位"
                reversed
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                domain={[0, 50]}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="GEOスコア"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                domain={[0, 100]}
                width={30}
              />
              <ZAxis range={[50, 200]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(value: number, name: string) => [value, name === "x" ? "Google順位" : "GEOスコア"]}
              />
              <Scatter data={scatterData} fill="#0ea5e9" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* SERP Table */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border">
          <CardTitle>SERP順位一覧</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">KW</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase">Google順位</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase">変動</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase">検索Vol</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase">AIO</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase">GEOスコア</th>
              </tr>
            </thead>
            <tbody>
              {mockSerpData.map((row) => {
                const change = row.prevRank != null && row.googleRank != null
                  ? row.prevRank - row.googleRank
                  : 0;
                return (
                  <tr key={row.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.keyword}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold">
                      {row.googleRank ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {change > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                          <TrendingUp size={12} />+{change}
                        </span>
                      ) : change < 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
                          <TrendingDown size={12} />{change}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted"><Minus size={12} className="inline" /></span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-text-secondary">
                      {formatNumber(row.searchVolume)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.aioDisplayed ? (
                        <Badge variant="success">表示</Badge>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        "font-mono font-semibold",
                        row.geoScore >= 80 ? "text-emerald-600" : row.geoScore >= 50 ? "text-amber-600" : "text-red-500"
                      )}>
                        {row.geoScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
