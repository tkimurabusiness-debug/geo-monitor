import type { AIPlatform } from "@geo-monitor/shared-types";

/** KPI summary */
export const mockKPIs = {
  geoScore: { value: 72.5, change: +3.2 },
  readiness: { value: 85.0, change: +1.5 },
  weeklyMentions: { value: 128, change: 12 },
  dominantKWs: { value: 18, total: 50, change: +3 },
};

/** Platform visibility radar data (order matches AI_PLATFORMS) */
export const mockRadarData: Array<{
  platform: string;
  score: number;
  fullMark: number;
}> = [
  { platform: "ChatGPT", score: 82, fullMark: 100 },
  { platform: "Gemini", score: 65, fullMark: 100 },
  { platform: "Claude", score: 78, fullMark: 100 },
  { platform: "Perplexity", score: 90, fullMark: 100 },
  { platform: "Grok", score: 45, fullMark: 100 },
  { platform: "DeepSeek", score: 55, fullMark: 100 },
];

/** 30-day trend data */
export const mockTrendData = generateTrendData();

function generateTrendData() {
  const platforms: AIPlatform[] = [
    "chatgpt",
    "perplexity",
    "gemini",
    "claude",
    "grok",
    "deepseek",
  ];
  const data: Array<Record<string, number | string>> = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entry: Record<string, number | string> = {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
    };
    platforms.forEach((p, idx) => {
      const base = [78, 85, 60, 72, 40, 50][idx];
      entry[p] = Math.max(
        0,
        Math.min(100, base + Math.round((Math.random() - 0.4) * 10 + i * 0.2)),
      );
    });
    data.push(entry);
  }
  return data;
}

/** Recent alerts */
export const mockAlerts = [
  {
    id: "a1",
    severity: "critical" as const,
    title: "Perplexityでの言及が消失",
    message: "KW「GEO対策 ツール」でPerplexityの言及がなくなりました",
    time: "2時間前",
  },
  {
    id: "a2",
    severity: "warning" as const,
    title: "ChatGPT順位下落",
    message: "KW「note運用代行」のChatGPT順位が1位→3位に下落",
    time: "5時間前",
  },
  {
    id: "a3",
    severity: "info" as const,
    title: "新規競合検出",
    message: "「X社」がKW「AI検索 最適化」でChatGPTに新規ランクイン",
    time: "1日前",
  },
  {
    id: "a4",
    severity: "warning" as const,
    title: "GEO Readiness低下",
    message: "FAQ Schema構造化データが一部ページで壊れています",
    time: "2日前",
  },
  {
    id: "a5",
    severity: "info" as const,
    title: "週次チェック完了",
    message: "50KW × 6プラットフォームのチェックが完了しました",
    time: "3日前",
  },
];

/** Top keywords */
export const mockTopKeywords = [
  {
    id: "kw1",
    keyword: "note運用代行",
    geoScore: 92,
    trend: +5,
    platforms: { chatgpt: 1, gemini: 2, claude: 1, perplexity: 1, grok: null, deepseek: 3 },
  },
  {
    id: "kw2",
    keyword: "GEO対策",
    geoScore: 78,
    trend: -3,
    platforms: { chatgpt: 2, gemini: 3, claude: null, perplexity: null, grok: null, deepseek: null },
  },
  {
    id: "kw3",
    keyword: "AI検索 最適化",
    geoScore: 85,
    trend: +8,
    platforms: { chatgpt: 1, gemini: 1, claude: 2, perplexity: 2, grok: 4, deepseek: 2 },
  },
  {
    id: "kw4",
    keyword: "コンテンツSEO",
    geoScore: 60,
    trend: 0,
    platforms: { chatgpt: 3, gemini: null, claude: 4, perplexity: 5, grok: null, deepseek: null },
  },
  {
    id: "kw5",
    keyword: "ChatGPT SEO",
    geoScore: 88,
    trend: +12,
    platforms: { chatgpt: 1, gemini: 2, claude: 1, perplexity: 1, grok: 2, deepseek: 1 },
  },
];

/** Weekly actions */
export const mockActions = [
  {
    id: "act1",
    priority: "critical" as const,
    text: "PerplexityでKW「GEO対策」の順位が3位に下落。FAQセクションの追加を推奨",
    href: "/keywords/kw2",
  },
  {
    id: "act2",
    priority: "warning" as const,
    text: "FAQ構造化データが未実装のページが5件。JSON-LDの追加で引用率UP",
    href: "/diagnosis",
  },
  {
    id: "act3",
    priority: "info" as const,
    text: "新しい競合「X社」がChatGPTでランクイン。モニタリング追加を推奨",
    href: "/competitors",
  },
];
