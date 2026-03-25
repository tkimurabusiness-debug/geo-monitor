"use client";

import { PageHeader } from "@/components/layout";
import { Card, CardTitle } from "@/components/ui";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { mockIndustryMapData } from "@/lib/mock-data/seo";

export default function IndustryMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="業界マップ"
        description="KW領域別ポジショニング（X: SEO強度 / Y: GEOスコア / サイズ: AI言及率）"
      />

      <Card padding="md">
        <CardTitle>ポジショニングマップ</CardTitle>
        <p className="text-[10px] text-text-muted mb-4">
          バブルサイズ = 監視KW中のAI言及率。自社は青色、競合はグレーで表示。
        </p>
        <ResponsiveContainer width="100%" height={480}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="SEO強度"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{ value: "SEO強度", position: "bottom", fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="GEOスコア"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={35}
              label={{ value: "GEOスコア", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }}
            />
            <ZAxis type="number" dataKey="size" range={[200, 800]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ payload }: any) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg bg-white border border-border p-2 shadow-md text-xs">
                    <p className="font-semibold text-text-primary">{d.name}</p>
                    <p className="text-text-muted">SEO強度: {d.x}</p>
                    <p className="text-text-muted">GEOスコア: {d.y}</p>
                    <p className="text-text-muted">AI言及率: {d.size}%</p>
                  </div>
                );
              }}
            />
            <Scatter data={mockIndustryMapData}>
              {mockIndustryMapData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isSelf ? "#0ea5e9" : "#cbd5e1"}
                  stroke={entry.isSelf ? "#0284c7" : "#94a3b8"}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 justify-center">
          {mockIndustryMapData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: d.isSelf ? "#0ea5e9" : "#cbd5e1" }}
              />
              <span className="text-xs text-text-secondary">{d.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle>強み領域</CardTitle>
          <p className="text-xs text-text-muted mt-1">GEO + SEO共に高い</p>
          <div className="mt-3 space-y-2">
            <InsightRow label="note運用代行" geo={92} seo={3} />
            <InsightRow label="ChatGPT SEO" geo={88} seo={7} />
            <InsightRow label="LLMO対策" geo={82} seo={2} />
          </div>
        </Card>
        <Card>
          <CardTitle>チャンス領域</CardTitle>
          <p className="text-xs text-text-muted mt-1">GEO低い × SEO高い = 改善余地大</p>
          <div className="mt-3 space-y-2">
            <InsightRow label="SEO対策 中小企業" geo={45} seo={22} />
            <InsightRow label="BtoB マーケティング" geo={35} seo={45} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InsightRow({ label, geo, seo }: { label: string; geo: number; seo: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-light p-2.5">
      <span className="text-xs font-medium text-text-primary">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted">GEO <strong className="font-mono">{geo}</strong></span>
        <span className="text-xs text-text-muted">SEO <strong className="font-mono">{seo}位</strong></span>
      </div>
    </div>
  );
}
