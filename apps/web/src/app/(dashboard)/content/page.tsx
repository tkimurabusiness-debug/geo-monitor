"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button, Input, Select } from "@/components/ui";
import { Sparkles, FileText, Copy, ExternalLink } from "lucide-react";

const mockGenerated = [
  { id: "g1", title: "【2026年最新】GEO対策とは？AI検索で上位表示される方法", keyword: "GEO対策", status: "published", date: "2026-03-20" },
  { id: "g2", title: "note運用代行サービス完全ガイド｜費用・選び方・効果", keyword: "note運用代行", status: "draft", date: "2026-03-18" },
  { id: "g3", title: "ChatGPTに推薦されるSEO対策の新常識", keyword: "ChatGPT SEO", status: "draft", date: "2026-03-15" },
];

export default function ContentPage() {
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="コンテンツ生成"
        description="GEO最適化コンテンツの自動生成"
        actions={<Badge variant="warning">アドオン +3万/月</Badge>}
      />

      {/* Generation form */}
      <Card padding="md">
        <CardTitle>新規コンテンツ生成</CardTitle>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="対象キーワード"
            options={[
              { value: "geo", label: "GEO対策" },
              { value: "note", label: "note運用代行" },
              { value: "chatgpt-seo", label: "ChatGPT SEO" },
              { value: "llmo", label: "LLMO対策" },
            ]}
          />
          <Select
            label="コンテンツタイプ"
            options={[
              { value: "note", label: "note記事" },
              { value: "blog", label: "ブログ記事" },
              { value: "faq", label: "FAQ" },
            ]}
          />
          <Select
            label="トーン"
            options={[
              { value: "professional", label: "プロフェッショナル" },
              { value: "casual", label: "カジュアル" },
              { value: "educational", label: "教育的" },
            ]}
          />
        </div>
        <div className="mt-4">
          <Button disabled={generating} onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 2000); }}>
            <Sparkles size={14} />
            {generating ? "生成中..." : "コンテンツを生成"}
          </Button>
        </div>
      </Card>

      {/* Generated content list */}
      <Card padding="md">
        <CardTitle>生成済みコンテンツ</CardTitle>
        <div className="mt-4 space-y-3">
          {mockGenerated.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border-light p-4 hover:bg-bg-hover transition-colors">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="muted">{item.keyword}</Badge>
                    <span className="text-xs text-text-muted">{item.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "published" ? "success" : "warning"}>
                  {item.status === "published" ? "公開済み" : "下書き"}
                </Badge>
                <Button size="sm" variant="ghost"><Copy size={14} /></Button>
                <Button size="sm" variant="ghost"><ExternalLink size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
