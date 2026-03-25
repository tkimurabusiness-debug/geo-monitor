"""Keyword extraction using OpenAI Thinking model."""

import json
from openai import AsyncOpenAI
from ...core.config import get_settings
from .crawler import SiteCrawlResult


async def extract_keywords(crawl: SiteCrawlResult, brand_name: str = "") -> dict:
    """Extract keywords from crawled site using AI.

    Returns:
        {
            "extracted": [{"category": str, "keywords": [{"keyword": str, "intent": str, "importance": "high"|"medium"|"low"}]}],
            "recommended": [{"keyword": str, "reason": str, "importance": str}],
        }
    """
    settings = get_settings()

    if not settings.openai_api_key:
        return _fallback_extraction(crawl)

    client = AsyncOpenAI(api_key=settings.openai_api_key)

    # Build context from crawled pages
    pages_summary = []
    for p in crawl.pages[:10]:
        pages_summary.append(
            f"URL: {p.url}\nTitle: {p.title}\nH1: {', '.join(p.h1)}\nH2: {', '.join(p.h2[:5])}\n本文（先頭500文字）: {p.body_text[:500]}"
        )
    context = "\n---\n".join(pages_summary)

    prompt = f"""あなたはSEO/GEOキーワード分析の専門家です。
以下のサイト情報を分析し、このサイトがAI検索で言及されるべきキーワードを抽出してください。

サイトURL: {crawl.final_url}
ブランド名: {brand_name or "不明"}

--- サイト情報 ---
{context}
--- ここまで ---

以下のJSON形式で回答してください（日本語で）:
{{
  "extracted": [
    {{
      "category": "カテゴリ名（3-6カテゴリ）",
      "keywords": [
        {{"keyword": "キーワード", "intent": "検索意図の説明", "importance": "high/medium/low"}}
      ]
    }}
  ],
  "recommended": [
    {{"keyword": "サイトには直接載っていないが狙うべきKW", "reason": "理由", "importance": "high/medium/low"}}
  ]
}}

条件:
- extractedは合計80-100件
- recommendedは30-50件
- importanceはhigh(GEO重要度が高い)が全体の30%程度
- 各カテゴリは15-30KW"""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",  # Use strong model for extraction quality
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        text = response.choices[0].message.content or "{}"
        return json.loads(text)

    except Exception as e:
        print(f"[KW Extraction Error] {e}")
        return _fallback_extraction(crawl)


def _fallback_extraction(crawl: SiteCrawlResult) -> dict:
    """Fallback: extract keywords from headings when API is unavailable."""
    keywords = set()
    for page in crawl.pages:
        for h in page.h1 + page.h2 + page.h3:
            cleaned = h.strip()
            if 3 <= len(cleaned) <= 50:
                keywords.add(cleaned)

    kw_list = [
        {"keyword": kw, "intent": "見出しから抽出", "importance": "medium"}
        for kw in list(keywords)[:50]
    ]

    return {
        "extracted": [{"category": "サイトコンテンツ", "keywords": kw_list}],
        "recommended": [],
    }
