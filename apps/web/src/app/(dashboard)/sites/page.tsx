"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button, Input, Dialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, Globe, ExternalLink } from "lucide-react";
import { useFetch, useMutation } from "@/hooks/use-fetch";
import { formatDate } from "@/lib/utils/format";

interface SiteData {
  id: string;
  url: string;
  name: string | null;
  geo_score: number | null;
  readiness_score: number | null;
  last_diagnosed_at: string | null;
  created_at: string;
}

const mockSites: SiteData[] = [
  {
    id: "site1",
    url: "https://stock-value.co.jp",
    name: "Stock Value コーポレートサイト",
    geo_score: 82,
    readiness_score: 85,
    last_diagnosed_at: "2026-03-20T00:00:00Z",
    created_at: "2026-01-15T00:00:00Z",
  },
];

export default function SitesPage() {
  const { data: sitesData, refetch } = useFetch<SiteData[]>("/sites", mockSites);
  const sites = Array.isArray(sitesData) ? sitesData : mockSites;
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const { mutate: addSite, loading: addLoading } = useMutation<{ url: string; name?: string }>("post", "/sites");

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
        {sites.map((site) => (
          <Card key={site.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light">
                  <Globe size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{site.name || site.url}</h3>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1">
                    {site.url} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase">GEOスコア</p>
                <p className="text-lg font-bold font-mono text-text-primary">{site.geo_score ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase">Readiness</p>
                <p className="text-lg font-bold font-mono text-text-primary">{site.readiness_score ?? "—"}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
              <span className="text-[10px] text-text-muted">最終診断: {site.last_diagnosed_at ? formatDate(site.last_diagnosed_at) : "未実施"}</span>
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
          <Input id="site-url" label="サイトURL" placeholder="https://example.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <Input id="site-name" label="サイト名（任意）" placeholder="例: コーポレートサイト" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>キャンセル</Button>
            <Button className="flex-1" disabled={addLoading || !newUrl} onClick={async () => {
              await addSite({ url: newUrl, name: newName || undefined });
              setShowAdd(false);
              setNewUrl("");
              setNewName("");
              refetch();
            }}>
              {addLoading ? "追加中..." : "追加して診断開始"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
