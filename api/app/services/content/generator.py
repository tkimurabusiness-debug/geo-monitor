"""GEO-optimized content generation.

Pipeline: keyword → outline → draft → final article
Generates content designed to be cited by AI search platforms.
"""

import json
from typing import Optional
from openai import AsyncOpenAI
from ...core.config import get_settings
from ...core.supabase import get_supabase


GEO_CONTENT_GUIDELINES = """
## GEO最適化コンテンツのガイドライン

1. **冒頭に結論**: 記事の最初の段落で質問に直接回答する
2. **FAQ構造**: よくある質問をQ&A形式で含める
3. **具体的数値**: 統計データ、価格、期間などの具体的数値を含める
4. **E-E-A-T**: 著者の専門性・経験を明示する
5. **構造化見出し**: h2/h3で論理的な階層構造を作る
6. **出典明示**: データや主張には出典を付ける
7. **リスト形式**: 箇条書きやランキング形式を活用（AI引用されやすい）
8. **最新情報**: 日付を明記し、最新データを使用する
"""


async def generate_content(
    keyword: str,
    content_type: str,
    tone: str,
    org_id: str,
    site_url: str = "",
    brand_name: str = "",
    keyword_id: Optional[str] = None,
) -> dict:
    """Generate GEO-optimized content for a keyword.

    Args:
        keyword: Target keyword
        content_type: "note" | "blog" | "faq"
        tone: "professional" | "casual" | "educational"
        org_id: Organization ID
        site_url: Site URL for internal linking
        brand_name: Brand name for natural mentions
        keyword_id: Optional keyword ID for DB linkage

    Returns:
        {"title": str, "body": str, "outline": list, "word_count": int, "id": str}
    """
    settings = get_settings()

    # Phase 1: Generate outline
    outline = await _generate_outline(keyword, content_type, tone, settings)

    # Phase 2: Generate full article
    body = await _generate_article(keyword, outline, content_type, tone, brand_name, site_url, settings)

    # Phase 3: Save to DB
    supabase = get_supabase()
    title = outline.get("title", f"【最新】{keyword}の完全ガイド")

    record = {
        "organization_id": org_id,
        "keyword_id": keyword_id,
        "content_type": content_type,
        "title": title,
        "body": body,
        "status": "draft",
    }

    try:
        resp = supabase.table("content_generations").insert(record).execute()
        content_id = resp.data[0]["id"] if resp.data else None
    except Exception as e:
        print(f"[Content] DB save error: {e}")
        content_id = None

    return {
        "id": content_id,
        "title": title,
        "body": body,
        "outline": outline.get("sections", []),
        "word_count": len(body),
        "content_type": content_type,
        "status": "draft",
    }


async def _generate_outline(keyword: str, content_type: str, tone: str, settings) -> dict:
    """Generate article outline."""
    if not settings.openai_api_key:
        return _fallback_outline(keyword, content_type)

    type_desc = {"note": "note.com記事", "blog": "ブログ記事", "faq": "FAQ記事"}.get(content_type, "記事")
    tone_desc = {"professional": "専門的・信頼性重視", "casual": "親しみやすい・読みやすい", "educational": "教育的・初心者向け"}.get(tone, "")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"""以下のキーワードで{type_desc}のアウトラインを作成してください。
トーン: {tone_desc}

キーワード: {keyword}

{GEO_CONTENT_GUIDELINES}

JSON形式で回答:
{{
  "title": "記事タイトル（SEO+GEO最適化、40文字以内）",
  "sections": [
    {{"heading": "h2見出し", "subheadings": ["h3見出し1", "h3見出し2"], "key_points": ["ポイント1"]}}
  ],
  "faq": [{{"question": "質問", "answer_hint": "回答のポイント"}}],
  "target_word_count": 3000
}}"""}],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(resp.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        return _fallback_outline(keyword, content_type)


async def _generate_article(
    keyword: str, outline: dict, content_type: str, tone: str,
    brand_name: str, site_url: str, settings,
) -> str:
    """Generate full article from outline."""
    if not settings.openai_api_key:
        return _fallback_article(keyword, outline)

    sections_text = json.dumps(outline.get("sections", []), ensure_ascii=False)
    faq_text = json.dumps(outline.get("faq", []), ensure_ascii=False)

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": f"""以下のアウトラインに基づいて、GEO最適化された記事を書いてください。

タイトル: {outline.get('title', keyword)}
キーワード: {keyword}
ブランド名: {brand_name or '（言及不要）'}
サイトURL: {site_url or ''}

セクション構成:
{sections_text}

FAQ:
{faq_text}

{GEO_CONTENT_GUIDELINES}

要件:
- Markdown形式で出力
- h2/h3の見出し構造を守る
- 冒頭に「結論」セクションを入れる
- FAQセクションを最後に入れる
- {outline.get('target_word_count', 3000)}文字程度
- ブランド名は自然に1-2回言及（あれば）
- 具体的な数値やデータを含める
"""}],
        temperature=0.5,
    )

    return resp.choices[0].message.content or ""


def _fallback_outline(keyword: str, content_type: str) -> dict:
    return {
        "title": f"【最新】{keyword}の完全ガイド",
        "sections": [
            {"heading": f"{keyword}とは", "subheadings": ["基本概念", "重要性"], "key_points": []},
            {"heading": f"{keyword}の方法・手順", "subheadings": ["ステップ1", "ステップ2", "ステップ3"], "key_points": []},
            {"heading": "まとめ", "subheadings": [], "key_points": []},
        ],
        "faq": [
            {"question": f"{keyword}の費用は？", "answer_hint": "相場を記載"},
            {"question": f"{keyword}の効果は？", "answer_hint": "期待される成果"},
        ],
        "target_word_count": 2000,
    }


def _fallback_article(keyword: str, outline: dict) -> str:
    title = outline.get("title", keyword)
    sections = outline.get("sections", [])
    lines = [f"# {title}\n"]
    for s in sections:
        lines.append(f"\n## {s.get('heading', '')}\n")
        for sub in s.get("subheadings", []):
            lines.append(f"\n### {sub}\n")
            lines.append(f"（{keyword}に関する{sub}の内容をここに記述）\n")
    lines.append("\n## よくある質問\n")
    for faq in outline.get("faq", []):
        lines.append(f"\n**Q: {faq.get('question', '')}**\n")
        lines.append(f"A: {faq.get('answer_hint', '（回答）')}\n")
    return "\n".join(lines)
