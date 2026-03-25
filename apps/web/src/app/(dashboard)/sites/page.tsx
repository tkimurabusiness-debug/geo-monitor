"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button, Input, Dialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, Globe, ExternalLink } from "lucide-react";

const mockSites = [
  {
    id: "site1",
    url: "https://stock-value.co.jp",
    name: "Stock Value コーポレートサイト",
    geoScore: 82,
    readinessScore: 85,
    keywords: 50,
    lastDiagnosed: "2026-03-20",
  },
];

export default function SitesPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="サイト管理"
        description="登録サイト一覧（プロプラン: 最大3サイト）"
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} />
            サイト追加
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSites.map((site) => (
          <Card key={site.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light">
                  <Globe size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{site.name}</h3>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                    {site.url} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase">GEOスコア</p>
                <p className="text-lg font-bold font-mono text-text-primary">{site.geoScore}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase">Readiness</p>
                <p className="text-lg font-bold font-mono text-text-primary">{site.readinessScore}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase">KW数</p>
                <p className="text-lg font-bold font-mono text-text-primary">{site.keywords}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
              <span className="text-[10px] text-text-muted">最終診断: {site.lastDiagnosed}</span>
              <Badge variant="success">アクティブ</Badge>
            </div>
          </Card>
        ))}

        {/* Empty slot */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
        >
          <Plus size={24} className="mb-2" />
          <span className="text-sm">サイトを追加</span>
          <span className="text-xs mt-1">あと2サイト追加可能</span>
        </button>
      </div>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="サイト追加">
        <div className="space-y-4">
          <Input id="site-url" label="サイトURL" placeholder="https://example.com" />
          <Input id="site-name" label="サイト名（任意）" placeholder="例: コーポレートサイト" />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={() => setShowAdd(false)}>追加して診断開始</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
