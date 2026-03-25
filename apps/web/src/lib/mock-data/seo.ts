export interface MockSerpRow {
  id: string;
  keyword: string;
  googleRank: number | null;
  prevRank: number | null;
  searchVolume: number;
  aioDisplayed: boolean;
  geoScore: number;
}

export const mockSerpData: MockSerpRow[] = [
  { id: "s1", keyword: "note運用代行", googleRank: 3, prevRank: 5, searchVolume: 720, aioDisplayed: true, geoScore: 92 },
  { id: "s2", keyword: "GEO対策", googleRank: 5, prevRank: 4, searchVolume: 1300, aioDisplayed: false, geoScore: 78 },
  { id: "s3", keyword: "AI検索 最適化", googleRank: 4, prevRank: 6, searchVolume: 880, aioDisplayed: true, geoScore: 85 },
  { id: "s4", keyword: "ChatGPT SEO", googleRank: 7, prevRank: 8, searchVolume: 2400, aioDisplayed: true, geoScore: 88 },
  { id: "s5", keyword: "コンテンツSEO", googleRank: 12, prevRank: 10, searchVolume: 1600, aioDisplayed: false, geoScore: 60 },
  { id: "s6", keyword: "LLMO対策", googleRank: 2, prevRank: 3, searchVolume: 320, aioDisplayed: false, geoScore: 82 },
  { id: "s7", keyword: "note フォロワー 増やし方", googleRank: 8, prevRank: 9, searchVolume: 3200, aioDisplayed: true, geoScore: 70 },
  { id: "s8", keyword: "SEO対策 中小企業", googleRank: 22, prevRank: 18, searchVolume: 5400, aioDisplayed: false, geoScore: 45 },
  { id: "s9", keyword: "Perplexity 対策", googleRank: 15, prevRank: 15, searchVolume: 480, aioDisplayed: false, geoScore: 55 },
  { id: "s10", keyword: "BtoB マーケティング", googleRank: 45, prevRank: 42, searchVolume: 8100, aioDisplayed: false, geoScore: 35 },
];

export const mockCompetitors = [
  { id: "c1", name: "A社マーケティング", url: "https://a-marketing.co.jp", source: "auto_detected" as const, geoScore: 68, kwOverlap: 7 },
  { id: "c2", name: "B社コンテンツ", url: "https://b-content.co.jp", source: "auto_detected" as const, geoScore: 55, kwOverlap: 5 },
  { id: "c3", name: "C社デジタル", url: "https://c-digital.co.jp", source: "manual" as const, geoScore: 42, kwOverlap: 3 },
];

/** Bubble chart data for industry map */
export const mockIndustryMapData = [
  { name: "Stock Value（自社）", x: 72, y: 82, size: 85, isSelf: true },
  { name: "A社マーケティング", x: 60, y: 68, size: 70, isSelf: false },
  { name: "B社コンテンツ", x: 45, y: 55, size: 50, isSelf: false },
  { name: "C社デジタル", x: 35, y: 42, size: 30, isSelf: false },
  { name: "D社（空白地帯参考）", x: 80, y: 30, size: 20, isSelf: false },
];
