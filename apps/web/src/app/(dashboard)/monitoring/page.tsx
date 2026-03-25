"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Button, Badge, PlatformIcon } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Play, Check, X } from "lucide-react";
import { AI_PLATFORMS, PLATFORM_META } from "@geo-monitor/shared-types";
import {
  mockMonitoringMatrix,
  mockCheckHistory,
} from "@/lib/mock-data/monitoring";

export default function MonitoringPage() {
  const router = useRouter();

  // Stats
  const totalCells = mockMonitoringMatrix.length * AI_PLATFORMS.length;
  const mentionedCells = mockMonitoringMatrix.reduce(
    (sum, row) =>
      sum +
      AI_PLATFORMS.filter((p) => row.platforms[p].mentioned).length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="GEOモニタリング"
        description="全キーワード × 全AIプラットフォームのマトリクス"
        actions={
          <Button size="sm">
            <Play size={14} />
            手動チェック実行
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-text-muted">総チェック数</p>
          <p className="text-xl font-bold font-mono mt-1">{totalCells}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">言及あり</p>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {mentionedCells}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">言及率</p>
          <p className="text-xl font-bold font-mono mt-1">
            {Math.round((mentionedCells / totalCells) * 100)}%
          </p>
        </Card>
      </div>

      {/* Matrix Table */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border">
          <CardTitle>KW × AI マトリクス</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider sticky left-0 bg-bg-muted/50 z-10">
                  キーワード
                </th>
                {AI_PLATFORMS.map((p) => (
                  <th key={p} className="px-3 py-3 text-center">
                    <PlatformIcon platform={p} size="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMonitoringMatrix.map((row) => (
                <tr
                  key={row.keywordId}
                  className="border-b border-border-light hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                    <button
                      onClick={() => router.push(`/keywords/${row.keywordId}`)}
                      className="text-sm font-medium text-text-primary hover:text-accent text-left cursor-pointer"
                    >
                      {row.keyword}
                    </button>
                  </td>
                  {AI_PLATFORMS.map((p) => {
                    const cell = row.platforms[p];
                    return (
                      <td key={p} className="px-3 py-2.5 text-center">
                        {cell.mentioned ? (
                          <button
                            onClick={() =>
                              cell.resultId &&
                              router.push(`/monitoring/${cell.resultId}`)
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                              cell.rank === 1
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : cell.rank != null && cell.rank <= 3
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                            )}
                          >
                            <Check size={10} />
                            {cell.rank}位
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <X size={10} />
                          </span>
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

      {/* Check History */}
      <Card padding="md">
        <CardTitle>チェック履歴</CardTitle>
        <div className="mt-3 space-y-2">
          {mockCheckHistory.map((chk) => (
            <div
              key={chk.id}
              className="flex items-center justify-between rounded-lg border border-border-light p-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="success">完了</Badge>
                <span className="text-sm text-text-primary">{chk.date}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>{chk.keywordsChecked} KW</span>
                <span>{chk.platforms} AI</span>
                <span>{chk.results}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
