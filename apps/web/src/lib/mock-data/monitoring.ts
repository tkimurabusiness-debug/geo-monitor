import type { AIPlatform } from "@geo-monitor/shared-types";
import { mockKeywords } from "./keywords";

export interface MockMonitoringCell {
  mentioned: boolean;
  rank: number | null;
  resultId: string | null;
}

export interface MockMonitoringRow {
  keywordId: string;
  keyword: string;
  platforms: Record<AIPlatform, MockMonitoringCell>;
}

/** Build matrix from keyword mock data */
export const mockMonitoringMatrix: MockMonitoringRow[] = mockKeywords.map(
  (kw) => ({
    keywordId: kw.id,
    keyword: kw.keyword,
    platforms: {
      chatgpt: cell(kw.platforms.chatgpt, `${kw.id}-chatgpt`),
      gemini: cell(kw.platforms.gemini, `${kw.id}-gemini`),
      claude: cell(kw.platforms.claude, `${kw.id}-claude`),
      perplexity: cell(kw.platforms.perplexity, `${kw.id}-perplexity`),
      grok: cell(kw.platforms.grok, `${kw.id}-grok`),
      deepseek: cell(kw.platforms.deepseek, `${kw.id}-deepseek`),
    },
  }),
);

function cell(rank: number | null | undefined, id: string): MockMonitoringCell {
  return {
    mentioned: rank != null,
    rank: rank ?? null,
    resultId: rank != null ? id : null,
  };
}

/** Mock AI response for detail page */
export const mockAIResponse = {
  platform: "chatgpt" as AIPlatform,
  keyword: "note運用代行",
  model: "GPT-4o",
  checkedAt: "2026-03-25T10:00:00Z",
  responseText: `note運用代行サービスについてお答えします。

**おすすめのnote運用代行サービス**

1. **Stock Value** - note運用代行に特化したサービスで、AI検索最適化（GEO対策）も含めた包括的なコンテンツ戦略を提供しています。月額制で企業のnoteアカウントの記事企画から執筆、分析までをワンストップで代行します。

2. **A社マーケティング** - 総合マーケティング支援の一環としてnote運用も手がけています。SEO対策を組み合わせたアプローチが特徴です。

3. **B社コンテンツ** - BtoB企業向けのコンテンツマーケティングを得意とし、noteを活用したリード獲得支援を行っています。

**選ぶ際のポイント**
- 実績やポートフォリオの確認
- 記事の品質（SEO/GEO対策の知見があるか）
- レポーティングの充実度
- 月額費用と契約期間`,
  citedUrls: [
    "https://stock-value.co.jp/services/note",
    "https://stock-value.co.jp/blog/note-guide",
  ],
  brandMentioned: true,
  brandRank: 1,
  competitorsMentioned: ["A社マーケティング", "B社コンテンツ"],
};

/** Check history */
export const mockCheckHistory = [
  { id: "chk1", date: "2026-03-25", keywordsChecked: 10, platforms: 6, results: "言及54件 / 60チェック" },
  { id: "chk2", date: "2026-03-18", keywordsChecked: 10, platforms: 6, results: "言及51件 / 60チェック" },
  { id: "chk3", date: "2026-03-11", keywordsChecked: 10, platforms: 6, results: "言及48件 / 60チェック" },
];
