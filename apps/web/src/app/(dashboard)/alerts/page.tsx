"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Bell, Check, Filter } from "lucide-react";

const mockAlertFeed = [
  { id: "af1", severity: "critical" as const, title: "Perplexityでの言及が消失", message: "KW「GEO対策 ツール」でPerplexityの言及がなくなりました。FAQセクションの追加を検討してください。", time: "2時間前", read: false },
  { id: "af2", severity: "warning" as const, title: "ChatGPT順位下落", message: "KW「note運用代行」のChatGPT順位が1位→3位に下落しました。記事の更新日を最新にしてください。", time: "5時間前", read: false },
  { id: "af3", severity: "info" as const, title: "新規競合検出", message: "「X社」がKW「AI検索 最適化」でChatGPTに新規ランクインしました。", time: "1日前", read: true },
  { id: "af4", severity: "warning" as const, title: "GEO Readiness低下", message: "FAQ Schema構造化データが一部ページで壊れています。確認してください。", time: "2日前", read: true },
  { id: "af5", severity: "info" as const, title: "週次チェック完了", message: "50KW × 6プラットフォームのチェックが完了しました。結果をダッシュボードで確認できます。", time: "3日前", read: true },
  { id: "af6", severity: "info" as const, title: "Geminiでの言及増加", message: "KW「LLMO対策」でGeminiの順位が5位→1位に上昇しました。", time: "5日前", read: true },
];

const severityConfig = {
  critical: { label: "重要", variant: "danger" as const, dot: "bg-danger" },
  warning: { label: "注意", variant: "warning" as const, dot: "bg-warning" },
  info: { label: "情報", variant: "info" as const, dot: "bg-info" },
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filtered = filter === "unread" ? mockAlertFeed.filter((a) => !a.read) : mockAlertFeed;
  const unreadCount = mockAlertFeed.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="アラート"
        description={`${unreadCount}件の未読アラート`}
        actions={
          <Button size="sm" variant="outline">
            <Check size={14} />
            すべて既読にする
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Button size="sm" variant={filter === "all" ? "primary" : "ghost"} onClick={() => setFilter("all")}>
          すべて ({mockAlertFeed.length})
        </Button>
        <Button size="sm" variant={filter === "unread" ? "primary" : "ghost"} onClick={() => setFilter("unread")}>
          <Bell size={12} /> 未読 ({unreadCount})
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((alert) => {
          const sev = severityConfig[alert.severity];
          return (
            <Card
              key={alert.id}
              padding="sm"
              className={cn(!alert.read && "border-l-4", !alert.read && alert.severity === "critical" && "border-l-red-500", !alert.read && alert.severity === "warning" && "border-l-amber-500", !alert.read && alert.severity === "info" && "border-l-blue-400")}
            >
              <div className="flex items-start gap-3 p-2">
                <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-medium", alert.read ? "text-text-secondary" : "text-text-primary")}>
                      {alert.title}
                    </p>
                    <Badge variant={sev.variant}>{sev.label}</Badge>
                    {!alert.read && <Badge variant="default">新規</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
                <span className="text-[10px] text-text-muted shrink-0 mt-0.5">
                  {alert.time}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
