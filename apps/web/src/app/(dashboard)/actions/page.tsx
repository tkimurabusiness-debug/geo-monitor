"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Lightbulb, CheckCircle, Clock, Sparkles } from "lucide-react";

type Status = "todo" | "in_progress" | "done";

const mockActions = [
  { id: "a1", priority: "critical" as const, category: "構造化データ", title: "FAQ JSON-LDを未実装ページに追加", description: "サービスページ3ページでFAQ Schemaが未実装。AI引用率の向上に直結します。", impact: "+8pt", status: "todo" as Status },
  { id: "a2", priority: "critical" as const, category: "コンテンツ", title: "記事冒頭に結論セクションを追加", description: "AIは冒頭の直接回答を引用しやすい傾向。主要記事5本の冒頭を改修推奨。", impact: "+12pt", status: "todo" as Status },
  { id: "a3", priority: "high" as const, category: "E-E-A-T", title: "更新日の明示とSchema対応", description: "記事の公開日・更新日をdateModified Schemaで明示。鮮度シグナルの強化。", impact: "+5pt", status: "in_progress" as Status },
  { id: "a4", priority: "high" as const, category: "技術", title: "Core Web Vitals改善（LCP）", description: "LCPが3.2秒。画像最適化とフォント読み込み戦略の見直しで2.5秒以下を目指す。", impact: "+3pt", status: "todo" as Status },
  { id: "a5", priority: "medium" as const, category: "コンテンツ", title: "外部データの出典リンク追加", description: "統計データや市場調査の出典URLを追加。信頼性シグナルの強化。", impact: "+4pt", status: "done" as Status },
  { id: "a6", priority: "medium" as const, category: "SEO/GEO", title: "Perplexity向けQ&Aコンテンツ強化", description: "Perplexityはソース鮮度を重視。最新データを含むQ&A記事の追加。", impact: "+6pt", status: "todo" as Status },
  { id: "a7", priority: "low" as const, category: "技術", title: "llms.txt ファイルの設置", description: "LLM向けのサイト情報ファイルを設置。AI可読性の向上。", impact: "+2pt", status: "todo" as Status },
];

const priorityConfig = {
  critical: { label: "緊急", variant: "danger" as const, color: "border-l-red-500" },
  high: { label: "高", variant: "warning" as const, color: "border-l-amber-500" },
  medium: { label: "中", variant: "info" as const, color: "border-l-blue-400" },
  low: { label: "低", variant: "muted" as const, color: "border-l-gray-300" },
};

export default function ActionsPage() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const filtered = filter === "all" ? mockActions : mockActions.filter((a) => a.status === filter);

  const counts = {
    todo: mockActions.filter((a) => a.status === "todo").length,
    in_progress: mockActions.filter((a) => a.status === "in_progress").length,
    done: mockActions.filter((a) => a.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="施策提案"
        description="GEOスコア改善のための具体的アクション"
        actions={
          <Button size="sm" variant="outline">
            <Sparkles size={14} />
            施策を再生成
          </Button>
        }
      />

      {/* Summary + Filters */}
      <div className="flex items-center gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          すべて ({mockActions.length})
        </FilterButton>
        <FilterButton active={filter === "todo"} onClick={() => setFilter("todo")}>
          未着手 ({counts.todo})
        </FilterButton>
        <FilterButton active={filter === "in_progress"} onClick={() => setFilter("in_progress")}>
          <Clock size={12} /> 進行中 ({counts.in_progress})
        </FilterButton>
        <FilterButton active={filter === "done"} onClick={() => setFilter("done")}>
          <CheckCircle size={12} /> 完了 ({counts.done})
        </FilterButton>
      </div>

      {/* Action list */}
      <div className="space-y-3">
        {filtered.map((action) => {
          const prio = priorityConfig[action.priority];
          return (
            <Card
              key={action.id}
              padding="none"
              className={cn("border-l-4", prio.color, action.status === "done" && "opacity-60")}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={prio.variant}>{prio.label}</Badge>
                      <Badge variant="muted">{action.category}</Badge>
                      {action.status === "in_progress" && (
                        <Badge variant="info"><Clock size={10} /> 進行中</Badge>
                      )}
                      {action.status === "done" && (
                        <Badge variant="success"><CheckCircle size={10} /> 完了</Badge>
                      )}
                    </div>
                    <h3 className={cn("text-sm font-semibold text-text-primary", action.status === "done" && "line-through")}>
                      {action.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-text-muted uppercase">改善見込み</p>
                    <p className="text-lg font-bold font-mono text-emerald-600">{action.impact}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        active ? "bg-accent text-white" : "bg-bg-muted text-text-secondary hover:bg-bg-active",
      )}
    >
      {children}
    </button>
  );
}
