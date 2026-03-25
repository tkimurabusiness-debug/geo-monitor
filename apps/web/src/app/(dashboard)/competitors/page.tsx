"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button, Input, Dialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, ExternalLink, Zap } from "lucide-react";
import { mockCompetitors } from "@/lib/mock-data/seo";

export default function CompetitorsPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="競合管理"
        description={`${mockCompetitors.length}社の競合を監視中（プロプラン: 最大10社）`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            競合追加
          </Button>
        }
      />

      {/* Competitor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Self card */}
        <Card className="border-accent/30 bg-accent-light/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Stock Value（自社）
            </h3>
            <Badge variant="default">自社</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-text-muted uppercase">GEOスコア</p>
              <p className="text-xl font-bold font-mono text-accent-text">82</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase">監視KW</p>
              <p className="text-xl font-bold font-mono text-text-primary">10</p>
            </div>
          </div>
        </Card>

        {/* Competitor cards */}
        {mockCompetitors.map((comp) => (
          <Card key={comp.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {comp.name}
              </h3>
              <Badge variant={comp.source === "auto_detected" ? "info" : "muted"}>
                {comp.source === "auto_detected" ? (
                  <><Zap size={10} />自動検出</>
                ) : (
                  "手動"
                )}
              </Badge>
            </div>
            <a
              href={comp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline flex items-center gap-1 mb-3"
            >
              {comp.url} <ExternalLink size={10} />
            </a>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-text-muted uppercase">GEOスコア</p>
                <p className={cn(
                  "text-xl font-bold font-mono",
                  comp.geoScore >= 60 ? "text-amber-600" : "text-text-secondary",
                )}>
                  {comp.geoScore}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase">KW重複</p>
                <p className="text-xl font-bold font-mono text-text-primary">
                  {comp.kwOverlap}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-light">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-bg-muted rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full"
                    style={{ width: `${comp.geoScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-text-muted">vs 自社82</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* H2H comparison placeholder */}
      <Card padding="md">
        <CardTitle>Head-to-Head 比較</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">
          キーワード別に自社 vs 競合のAI言及順位を比較
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase">KW</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-accent-text uppercase">自社</th>
                {mockCompetitors.map((c) => (
                  <th key={c.id} className="px-3 py-2.5 text-center text-xs font-medium text-text-muted uppercase">
                    {c.name.split("社")[0]}社
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["note運用代行", "GEO対策", "AI検索 最適化"].map((kw) => (
                <tr key={kw} className="border-b border-border-light">
                  <td className="px-4 py-2.5 text-text-primary">{kw}</td>
                  <td className="px-3 py-2.5 text-center">
                    <RankBadge rank={1} self />
                  </td>
                  <td className="px-3 py-2.5 text-center"><RankBadge rank={2} /></td>
                  <td className="px-3 py-2.5 text-center"><RankBadge rank={3} /></td>
                  <td className="px-3 py-2.5 text-center"><RankBadge rank={null} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="競合追加">
        <div className="space-y-4">
          <Input id="comp-name" label="ブランド名" placeholder="例: A社マーケティング" />
          <Input id="comp-url" label="URL" placeholder="https://example.com" />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={() => setShowAdd(false)}>追加</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function RankBadge({ rank, self }: { rank: number | null; self?: boolean }) {
  if (rank == null) return <span className="text-xs text-text-muted">—</span>;
  return (
    <span className={cn(
      "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold",
      self
        ? "bg-accent-light text-accent-text"
        : rank <= 2
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-500",
    )}>
      {rank}
    </span>
  );
}
