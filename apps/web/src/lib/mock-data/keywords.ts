import type { AIPlatform } from "@geo-monitor/shared-types";

export interface MockKeyword {
  id: string;
  keyword: string;
  category: string;
  geoImportance: "high" | "medium" | "low";
  geoScore: number;
  searchVolume: number | null;
  serpRank: number | null;
  lastChecked: string;
  platforms: Partial<Record<AIPlatform, number | null>>;
  trend: number; // score change
}

export const mockKeywordCategories = [
  "GEO対策・AI検索",
  "note運用・SNS",
  "SEO・Web集客",
  "デジタルマーケティング",
];

export const mockKeywords: MockKeyword[] = [
  {
    id: "kw1",
    keyword: "note運用代行",
    category: "note運用・SNS",
    geoImportance: "high",
    geoScore: 92,
    searchVolume: 720,
    serpRank: 3,
    lastChecked: "2026-03-25T10:00:00Z",
    platforms: { chatgpt: 1, gemini: 2, claude: 1, perplexity: 1, grok: null, deepseek: 3 },
    trend: +5,
  },
  {
    id: "kw2",
    keyword: "GEO対策",
    category: "GEO対策・AI検索",
    geoImportance: "high",
    geoScore: 78,
    searchVolume: 1300,
    serpRank: 5,
    lastChecked: "2026-03-25T10:00:00Z",
    platforms: { chatgpt: 2, gemini: 3, claude: null, perplexity: null, grok: null, deepseek: null },
    trend: -3,
  },
  {
    id: "kw3",
    keyword: "AI検索 最適化",
    category: "GEO対策・AI検索",
    geoImportance: "high",
    geoScore: 85,
    searchVolume: 880,
    serpRank: 4,
    lastChecked: "2026-03-25T10:00:00Z",
    platforms: { chatgpt: 1, gemini: 1, claude: 2, perplexity: 2, grok: 4, deepseek: 2 },
    trend: +8,
  },
  {
    id: "kw4",
    keyword: "ChatGPT SEO",
    category: "GEO対策・AI検索",
    geoImportance: "high",
    geoScore: 88,
    searchVolume: 2400,
    serpRank: 7,
    lastChecked: "2026-03-25T10:00:00Z",
    platforms: { chatgpt: 1, gemini: 2, claude: 1, perplexity: 1, grok: 2, deepseek: 1 },
    trend: +12,
  },
  {
    id: "kw5",
    keyword: "コンテンツSEO",
    category: "SEO・Web集客",
    geoImportance: "medium",
    geoScore: 60,
    searchVolume: 1600,
    serpRank: 12,
    lastChecked: "2026-03-24T10:00:00Z",
    platforms: { chatgpt: 3, gemini: null, claude: 4, perplexity: 5, grok: null, deepseek: null },
    trend: 0,
  },
  {
    id: "kw6",
    keyword: "note フォロワー 増やし方",
    category: "note運用・SNS",
    geoImportance: "medium",
    geoScore: 70,
    searchVolume: 3200,
    serpRank: 8,
    lastChecked: "2026-03-24T10:00:00Z",
    platforms: { chatgpt: 2, gemini: 3, claude: 2, perplexity: 3, grok: null, deepseek: null },
    trend: +2,
  },
  {
    id: "kw7",
    keyword: "Perplexity 対策",
    category: "GEO対策・AI検索",
    geoImportance: "medium",
    geoScore: 55,
    searchVolume: 480,
    serpRank: 15,
    lastChecked: "2026-03-24T10:00:00Z",
    platforms: { chatgpt: null, gemini: null, claude: null, perplexity: 2, grok: null, deepseek: null },
    trend: -1,
  },
  {
    id: "kw8",
    keyword: "SEO対策 中小企業",
    category: "SEO・Web集客",
    geoImportance: "medium",
    geoScore: 45,
    searchVolume: 5400,
    serpRank: 22,
    lastChecked: "2026-03-23T10:00:00Z",
    platforms: { chatgpt: 5, gemini: null, claude: null, perplexity: null, grok: null, deepseek: null },
    trend: -5,
  },
  {
    id: "kw9",
    keyword: "LLMO対策",
    category: "GEO対策・AI検索",
    geoImportance: "high",
    geoScore: 82,
    searchVolume: 320,
    serpRank: 2,
    lastChecked: "2026-03-25T10:00:00Z",
    platforms: { chatgpt: 1, gemini: 1, claude: 3, perplexity: 1, grok: 3, deepseek: 2 },
    trend: +10,
  },
  {
    id: "kw10",
    keyword: "BtoB マーケティング",
    category: "デジタルマーケティング",
    geoImportance: "low",
    geoScore: 35,
    searchVolume: 8100,
    serpRank: 45,
    lastChecked: "2026-03-23T10:00:00Z",
    platforms: { chatgpt: null, gemini: null, claude: null, perplexity: null, grok: null, deepseek: null },
    trend: 0,
  },
];

/** Generate 30-day history for a keyword */
export function generateKeywordHistory(kwId: string) {
  const kw = mockKeywords.find((k) => k.id === kwId);
  const base = kw?.geoScore ?? 50;
  const data: Array<{ date: string; score: number; chatgpt: number; gemini: number; claude: number; perplexity: number }> = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      score: Math.max(0, Math.min(100, base + Math.round((Math.random() - 0.4) * 15 + i * 0.3))),
      chatgpt: Math.max(0, Math.min(100, base + Math.round((Math.random() - 0.3) * 20))),
      gemini: Math.max(0, Math.min(100, base - 10 + Math.round((Math.random() - 0.3) * 20))),
      claude: Math.max(0, Math.min(100, base - 5 + Math.round((Math.random() - 0.3) * 20))),
      perplexity: Math.max(0, Math.min(100, base + 5 + Math.round((Math.random() - 0.3) * 20))),
    });
  }
  return data;
}
