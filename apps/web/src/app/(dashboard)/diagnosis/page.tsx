"use client";

import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { RefreshCw, Check, X, AlertTriangle } from "lucide-react";

const mockDiagnosis = {
  geoScore: 82,
  readinessScore: 85,
  technicalChecks: [
    { id: "t1", label: "JSON-LD構造化データ", passed: true, detail: "FAQ, Organization schema検出" },
    { id: "t2", label: "OGPメタタグ", passed: true, detail: "title, description, image設定済み" },
    { id: "t3", label: "robots.txt", passed: true, detail: "適切に設定" },
    { id: "t4", label: "sitemap.xml", passed: true, detail: "24ページ登録" },
    { id: "t5", label: "セマンティックHTML（h1-h6）", passed: true, detail: "h1-h3の階層構造が適切" },
    { id: "t6", label: "canonical URL", passed: true, detail: "全ページで設定" },
    { id: "t7", label: "Core Web Vitals", passed: false, detail: "LCPが3.2秒（推奨: 2.5秒以下）", suggestion: "画像の遅延読み込みとフォント最適化を検討" },
    { id: "t8", label: "FAQ / HowTo Schema", passed: false, detail: "一部ページで未実装", suggestion: "サービスページとブログにFAQ Schemaを追加" },
    { id: "t9", label: "モバイル対応", passed: true, detail: "レスポンシブ対応済み" },
    { id: "t10", label: "SSL/HTTPS", passed: true, detail: "有効なSSL証明書" },
  ],
  contentChecks: [
    { id: "c1", label: "E-E-A-T要素（著者情報）", passed: true, detail: "著者プロフィール・実績あり" },
    { id: "c2", label: "Q&A形式コンテンツ", passed: true, detail: "FAQ形式の記事あり" },
    { id: "c3", label: "直接回答型コンテンツ", passed: false, detail: "記事の冒頭に結論がない", suggestion: "記事冒頭に「結論」セクションを追加し、AIが引用しやすい構造に" },
    { id: "c4", label: "目次(TOC)", passed: true, detail: "自動生成TOC設置済み" },
    { id: "c5", label: "具体的数値・データ", passed: true, detail: "事例ページに数値データあり" },
    { id: "c6", label: "更新日の明示", passed: false, detail: "最終更新日の表示なし", suggestion: "記事の公開日・更新日をスキーマ含めて明示" },
    { id: "c7", label: "引用元・出典の明示", passed: false, detail: "外部データの出典なし", suggestion: "統計データや調査結果に出典リンクを追加" },
  ],
};

export default function DiagnosisPage() {
  const techPassed = mockDiagnosis.technicalChecks.filter((c) => c.passed).length;
  const contentPassed = mockDiagnosis.contentChecks.filter((c) => c.passed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="サイト診断"
        description="GEO Readiness + GEOスコア"
        actions={
          <Button size="sm" variant="outline">
            <RefreshCw size={14} />
            再診断
          </Button>
        }
      />

      {/* Score summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreCard label="GEOスコア" score={mockDiagnosis.geoScore} description="AIにどれくらい言及されてるか（結果）" />
        <ScoreCard label="GEO Readiness" score={mockDiagnosis.readinessScore} description="GEO対策できる状態かどうか（土台）" />
      </div>

      {/* Technical checks */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>技術要件チェック</CardTitle>
          <Badge variant={techPassed === mockDiagnosis.technicalChecks.length ? "success" : "warning"}>
            {techPassed}/{mockDiagnosis.technicalChecks.length} 合格
          </Badge>
        </div>
        <div className="space-y-2">
          {mockDiagnosis.technicalChecks.map((check) => (
            <CheckItem key={check.id} {...check} />
          ))}
        </div>
      </Card>

      {/* Content checks */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>コンテンツ要件チェック</CardTitle>
          <Badge variant={contentPassed === mockDiagnosis.contentChecks.length ? "success" : "warning"}>
            {contentPassed}/{mockDiagnosis.contentChecks.length} 合格
          </Badge>
        </div>
        <div className="space-y-2">
          {mockDiagnosis.contentChecks.map((check) => (
            <CheckItem key={check.id} {...check} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScoreCard({ label, score, description }: { label: string; score: number; description: string }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  return (
    <Card className="text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={cn("text-4xl font-bold font-mono mt-2", color)}>{score}</p>
      <p className="text-sm text-text-muted mt-0.5">/100</p>
      <p className="text-xs text-text-secondary mt-3">{description}</p>
      {/* Progress bar */}
      <div className="mt-3 mx-auto max-w-[200px] bg-bg-muted rounded-full h-2">
        <div className={cn("h-2 rounded-full", score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${score}%` }} />
      </div>
    </Card>
  );
}

function CheckItem({ label, passed, detail, suggestion }: { label: string; passed: boolean; detail: string; suggestion?: string }) {
  return (
    <div className={cn("rounded-lg border p-3", passed ? "border-border-light" : "border-amber-200 bg-amber-50/50")}>
      <div className="flex items-start gap-2">
        {passed ? (
          <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
        ) : (
          <X size={16} className="text-red-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted mt-0.5">{detail}</p>
          {suggestion && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-100/50 px-2.5 py-1.5">
              <AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">{suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
