"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Card, Button, Badge, Input, Select, Dialog, PlatformIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelativeTime } from "@/lib/utils/format";
import { Plus, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AI_PLATFORMS, PLATFORM_META } from "@geo-monitor/shared-types";
import {
  mockKeywords,
  mockKeywordCategories,
  type MockKeyword,
} from "@/lib/mock-data/keywords";

export default function KeywordsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [importanceFilter, setImportanceFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKw, setNewKw] = useState("");

  const filtered = mockKeywords.filter((kw) => {
    if (search && !kw.keyword.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (categoryFilter !== "all" && kw.category !== categoryFilter) return false;
    if (importanceFilter !== "all" && kw.geoImportance !== importanceFilter)
      return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="キーワード管理"
        description={`${mockKeywords.length}件のキーワードを監視中`}
        actions={
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus size={14} />
            キーワード追加
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="sm" className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="キーワードを検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Select
            options={[
              { value: "all", label: "全カテゴリ" },
              ...mockKeywordCategories.map((c) => ({ value: c, label: c })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: "all", label: "全重要度" },
              { value: "high", label: "高" },
              { value: "medium", label: "中" },
              { value: "low", label: "低" },
            ]}
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            className="w-32"
          />
          <span className="text-xs text-text-muted">
            {filtered.length}件表示
          </span>
        </div>
      </Card>

      {/* Keywords Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  キーワード
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">
                  重要度
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  GEOスコア
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Google順位
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  検索Vol
                </th>
                {/* Platform columns */}
                {AI_PLATFORMS.map((p) => (
                  <th key={p} className="px-1.5 py-3 text-center">
                    <PlatformIcon platform={p} size="sm" />
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  最終チェック
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kw) => (
                <tr
                  key={kw.id}
                  className="border-b border-border-light hover:bg-bg-hover transition-colors cursor-pointer"
                  onClick={() => router.push(`/keywords/${kw.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {kw.keyword}
                      </span>
                      <TrendIndicator value={kw.trend} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-text-secondary">
                      {kw.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ImportanceBadge importance={kw.geoImportance} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        kw.geoScore >= 80
                          ? "text-emerald-600"
                          : kw.geoScore >= 50
                            ? "text-amber-600"
                            : "text-red-500",
                      )}
                    >
                      {kw.geoScore}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-text-secondary">
                    {kw.serpRank ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-text-secondary">
                    {kw.searchVolume ? formatNumber(kw.searchVolume) : "—"}
                  </td>
                  {AI_PLATFORMS.map((p) => {
                    const rank = kw.platforms[p];
                    return (
                      <td key={p} className="px-1.5 py-3 text-center">
                        {rank != null ? (
                          <RankCell rank={rank} />
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right text-xs text-text-muted">
                    {formatRelativeTime(kw.lastChecked)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Keyword Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="キーワード追加"
      >
        <div className="space-y-4">
          <Input
            id="new-kw"
            label="キーワード"
            placeholder="例: GEO対策 ツール"
            value={newKw}
            onChange={(e) => setNewKw(e.target.value)}
          />
          <Select
            label="カテゴリ"
            options={mockKeywordCategories.map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <Select
            label="GEO重要度"
            options={[
              { value: "high", label: "高" },
              { value: "medium", label: "中" },
              { value: "low", label: "低" },
            ]}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddDialog(false)}
            >
              キャンセル
            </Button>
            <Button className="flex-1" onClick={() => setShowAddDialog(false)}>
              追加
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function RankCell({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
        rank === 1
          ? "bg-emerald-100 text-emerald-700"
          : rank <= 3
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-500",
      )}
    >
      {rank}
    </span>
  );
}

function ImportanceBadge({
  importance,
}: {
  importance: "high" | "medium" | "low";
}) {
  const map = {
    high: { variant: "danger" as const, label: "高" },
    medium: { variant: "warning" as const, label: "中" },
    low: { variant: "muted" as const, label: "低" },
  };
  const { variant, label } = map[importance];
  return <Badge variant={variant}>{label}</Badge>;
}

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  return value > 0 ? (
    <TrendingUp size={12} className="text-emerald-500" />
  ) : (
    <TrendingDown size={12} className="text-red-500" />
  );
}
