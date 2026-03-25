"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Card, Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Globe,
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { AI_PLATFORMS, PLATFORM_META } from "@geo-monitor/shared-types";
import type { AIPlatform } from "@geo-monitor/shared-types";

// Mock extracted keywords (Step 3で実際のAI抽出に差し替え)
const mockCategories = [
  {
    name: "GEO対策・AI検索",
    keywords: [
      "GEO対策", "AI検索 最適化", "ChatGPT SEO", "Perplexity 対策",
      "Gemini 検索対策", "AI Overview 表示方法", "LLMO対策",
      "AI検索 引用される方法", "GEO対策 ツール", "AI検索 ランキング",
    ],
  },
  {
    name: "note運用・SNS",
    keywords: [
      "note運用代行", "note フォロワー 増やし方", "note 企業活用",
      "note SEO対策", "note 記事 書き方", "note マーケティング",
      "SNS運用代行 費用", "コンテンツマーケティング note",
    ],
  },
  {
    name: "SEO・Web集客",
    keywords: [
      "SEO対策 中小企業", "MEO対策", "コンテンツSEO",
      "Web集客 方法", "オウンドメディア 運用", "検索順位 上げ方",
      "ローカルSEO", "構造化データ マークアップ",
    ],
  },
  {
    name: "デジタルマーケティング",
    keywords: [
      "デジタルマーケティング 中小企業", "BtoB マーケティング",
      "リード獲得 方法", "MA ツール", "コンバージョン率 改善",
      "LP 最適化",
    ],
  },
];

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedKWs, setSelectedKWs] = useState<Set<string>>(
    new Set(mockCategories.flatMap((c) => c.keywords)),
  );
  const [categoryToggles, setCategoryToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(mockCategories.map((c) => [c.name, true])),
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<AIPlatform>>(
    new Set(AI_PLATFORMS),
  );

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setAnalyzing(true);
    // Mock: Step 3でThinkingモデル診断に差し替え
    await new Promise((r) => setTimeout(r, 2500));
    setAnalyzing(false);
    setStep(2);
  }

  function toggleCategory(catName: string) {
    const newState = !categoryToggles[catName];
    setCategoryToggles((prev) => ({ ...prev, [catName]: newState }));
    const cat = mockCategories.find((c) => c.name === catName);
    if (!cat) return;
    setSelectedKWs((prev) => {
      const next = new Set(prev);
      cat.keywords.forEach((kw) => {
        if (newState) next.add(kw);
        else next.delete(kw);
      });
      return next;
    });
  }

  function toggleKeyword(kw: string) {
    setSelectedKWs((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  }

  function togglePlatform(p: AIPlatform) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function handleComplete() {
    router.push("/dashboard");
  }

  const steps = [
    { num: 1, label: "サイト分析" },
    { num: 2, label: "KW確認" },
    { num: 3, label: "AI選択" },
  ];

  return (
    <>
      <PageHeader
        title="初回セットアップ"
        description="サイトを分析してモニタリングを開始"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 max-w-md">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                step >= s.num
                  ? "bg-accent text-white"
                  : "bg-bg-muted text-text-muted",
              )}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                step >= s.num ? "text-text-primary" : "text-text-muted",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-border ml-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: URL input + analysis */}
      {step === 1 && (
        <Card className="max-w-xl">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-light mb-3">
              <Globe size={24} className="text-accent" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">
              サイトURLを入力
            </h2>
            <p className="text-sm text-text-muted mt-1">
              サイトを自動分析してキーワードを抽出します
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <Input
              id="url"
              placeholder="https://your-site.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={analyzing || !url}>
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  分析中...
                </>
              ) : (
                "サイトを分析する"
              )}
            </Button>
          </form>

          {analyzing && (
            <div className="mt-6 space-y-2">
              <ProgressStep done label="サイトをクロール中..." />
              <ProgressStep done={false} label="ページ構造を解析中..." />
              <ProgressStep done={false} label="キーワードを抽出中..." />
              <ProgressStep done={false} label="GEO Readinessを診断中..." />
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Keyword confirmation */}
      {step === 2 && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  抽出キーワード確認
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  不要なキーワードのチェックを外してください（{selectedKWs.size}件選択中）
                </p>
              </div>
              <Badge variant="success">
                {mockCategories.reduce((s, c) => s + c.keywords.length, 0)}件抽出
              </Badge>
            </div>

            <div className="space-y-4">
              {mockCategories.map((cat) => (
                <div
                  key={cat.name}
                  className="rounded-lg border border-border p-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={categoryToggles[cat.name]}
                      onChange={() => toggleCategory(cat.name)}
                      className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {cat.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({cat.keywords.filter((kw) => selectedKWs.has(kw)).length}/
                      {cat.keywords.length})
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cat.keywords.map((kw) => (
                      <label
                        key={kw}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors",
                          selectedKWs.has(kw)
                            ? "border-accent/30 bg-accent-light/50 text-accent-text"
                            : "border-border bg-bg-muted text-text-muted line-through",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedKWs.has(kw)}
                          onChange={() => toggleKeyword(kw)}
                          className="sr-only"
                        />
                        {kw}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft size={14} />
              戻る
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              次へ
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI platform selection */}
      {step === 3 && (
        <div className="max-w-xl space-y-4">
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              モニタリング対象AI
            </h2>
            <p className="text-xs text-text-muted mb-4">
              モニタリングするAIプラットフォームを選択（後から変更可能）
            </p>

            <div className="grid grid-cols-2 gap-3">
              {AI_PLATFORMS.map((p) => {
                const meta = PLATFORM_META[p];
                const selected = selectedPlatforms.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer",
                      selected
                        ? "border-accent bg-accent-light/30"
                        : "border-border hover:border-border-light opacity-50",
                    )}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {meta.label}
                    </span>
                    {selected && (
                      <Check
                        size={14}
                        className="ml-auto text-accent"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg bg-bg-muted p-3">
              <p className="text-xs text-text-secondary">
                <strong>Google AIO</strong>（AI Overview）はSERPチェック時に自動取得されます。
                個別選択は不要です。
              </p>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft size={14} />
              戻る
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              インポートしてモニタリング開始
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ProgressStep({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <Check size={14} className="text-success" />
      ) : (
        <Loader2 size={14} className="animate-spin text-accent" />
      )}
      <span
        className={cn(
          "text-xs",
          done ? "text-text-secondary" : "text-accent font-medium",
        )}
      >
        {label}
      </span>
    </div>
  );
}
