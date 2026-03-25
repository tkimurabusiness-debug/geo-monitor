"""Action suggestion generator.

Analyzes monitoring + diagnosis data to generate prioritized improvement actions.

- Basic plan: Rule-based TOP3 suggestions
- Pro plan: AI-generated detailed suggestions with concrete steps
"""

import json
from typing import Optional
from openai import AsyncOpenAI
from ...core.config import get_settings
from ...core.supabase import get_supabase


# Rule-based action templates
RULE_TEMPLATES = [
    {
        "check": lambda diag, mon: not diag.get("technical_checks", {}).get("t_faq_schema", {}).get("passed", True),
        "priority": "critical",
        "category": "構造化データ",
        "title": "FAQ JSON-LDを未実装ページに追加",
        "description": "FAQ Schema構造化データが未実装です。AI引用率の向上に直結する重要な施策です。",
        "impact": "+8pt",
    },
    {
        "check": lambda diag, mon: not diag.get("content_checks", {}).get("c_direct", {}).get("passed", True),
        "priority": "critical",
        "category": "コンテンツ",
        "title": "記事冒頭に結論セクションを追加",
        "description": "AIは冒頭の直接回答を引用しやすい傾向があります。主要記事の冒頭を改修してください。",
        "impact": "+12pt",
    },
    {
        "check": lambda diag, mon: not diag.get("content_checks", {}).get("c_date", {}).get("passed", True),
        "priority": "high",
        "category": "E-E-A-T",
        "title": "更新日の明示とSchema対応",
        "description": "記事の公開日・更新日をdateModified Schemaで明示してください。鮮度シグナルの強化になります。",
        "impact": "+5pt",
    },
    {
        "check": lambda diag, mon: not diag.get("content_checks", {}).get("c_cite", {}).get("passed", True),
        "priority": "medium",
        "category": "コンテンツ",
        "title": "外部データの出典リンク追加",
        "description": "統計データや市場調査の出典URLを追加してください。信頼性シグナルが強化されます。",
        "impact": "+4pt",
    },
    {
        "check": lambda diag, mon: not diag.get("technical_checks", {}).get("t_llms_txt", {}).get("passed", True),
        "priority": "low",
        "category": "技術",
        "title": "llms.txt ファイルの設置",
        "description": "LLM向けのサイト情報ファイルを設置してください。AI可読性が向上します。",
        "impact": "+2pt",
    },
    {
        "check": lambda diag, mon: not diag.get("technical_checks", {}).get("t_sitemap", {}).get("passed", True),
        "priority": "high",
        "category": "技術",
        "title": "sitemap.xmlの作成・設置",
        "description": "sitemap.xmlが見つかりません。検索エンジンとAIクローラーのインデックスに必要です。",
        "impact": "+3pt",
    },
    {
        "check": lambda diag, mon: _has_lost_mentions(mon),
        "priority": "critical",
        "category": "SEO/GEO",
        "title": "言及消失キーワードの回復施策",
        "description": "一部のAIプラットフォームで言及が消失しています。該当KWのコンテンツを強化してください。",
        "impact": "+10pt",
    },
]


def _has_lost_mentions(monitoring_data: list[dict]) -> bool:
    """Check if any keywords lost mentions."""
    for r in monitoring_data:
        if r.get("brand_mentioned") is False:
            return True
    return False


async def generate_actions_basic(site_id: str, org_id: str) -> list[dict]:
    """Generate rule-based TOP actions (Basic plan)."""
    supabase = get_supabase()

    # Get latest diagnosis
    diag_resp = supabase.table("diagnosis_results") \
        .select("technical_checks, content_checks") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .order("diagnosed_at", desc=True) \
        .limit(1) \
        .execute()
    diag = diag_resp.data[0] if diag_resp.data else {}

    # Get recent monitoring results
    mon_resp = supabase.table("monitoring_results") \
        .select("brand_mentioned, brand_rank, platform, keywords(keyword)") \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .order("checked_at", desc=True) \
        .limit(50) \
        .execute()
    mon = mon_resp.data or []

    # Evaluate rules
    actions = []
    for rule in RULE_TEMPLATES:
        try:
            if rule["check"](diag, mon):
                actions.append({
                    "site_id": site_id,
                    "organization_id": org_id,
                    "priority": rule["priority"],
                    "category": rule["category"],
                    "title": rule["title"],
                    "description": rule["description"],
                    "estimated_impact": rule["impact"],
                    "status": "todo",
                })
        except Exception:
            continue

    # Sort by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    actions.sort(key=lambda a: priority_order.get(a["priority"], 9))

    return actions[:5]  # Top 5


async def generate_actions_pro(site_id: str, org_id: str) -> list[dict]:
    """Generate AI-powered detailed actions (Pro plan).

    Uses OpenAI to analyze monitoring data and generate specific,
    actionable recommendations with code examples.
    """
    settings = get_settings()
    if not settings.openai_api_key:
        return await generate_actions_basic(site_id, org_id)

    supabase = get_supabase()

    # Gather context
    diag_resp = supabase.table("diagnosis_results") \
        .select("readiness_score, geo_score, technical_checks, content_checks") \
        .eq("site_id", site_id) \
        .order("diagnosed_at", desc=True) \
        .limit(1) \
        .execute()

    site_resp = supabase.table("sites") \
        .select("url, name, geo_score") \
        .eq("id", site_id) \
        .single() \
        .execute()

    mon_resp = supabase.table("monitoring_results") \
        .select("platform, brand_mentioned, brand_rank, keywords(keyword)") \
        .eq("site_id", site_id) \
        .order("checked_at", desc=True) \
        .limit(30) \
        .execute()

    diag = diag_resp.data[0] if diag_resp.data else {}
    site = site_resp.data or {}
    mon = mon_resp.data or []

    prompt = f"""あなたはGEO対策（AI検索最適化）の専門コンサルタントです。
以下のサイト診断データとAIモニタリング結果を分析し、具体的な改善施策を生成してください。

サイト: {site.get('url', '')}
GEOスコア: {site.get('geo_score', 'N/A')}
Readinessスコア: {diag.get('readiness_score', 'N/A')}

技術チェック結果: {json.dumps(diag.get('technical_checks', {}), ensure_ascii=False)[:1000]}
コンテンツチェック結果: {json.dumps(diag.get('content_checks', {}), ensure_ascii=False)[:1000]}

最近のAI言及状況:
{json.dumps([{{'kw': r.get('keywords', {{}}).get('keyword', ''), 'platform': r.get('platform'), 'mentioned': r.get('brand_mentioned'), 'rank': r.get('brand_rank')}} for r in mon[:15]], ensure_ascii=False)}

以下のJSON形式で5-7個の施策を生成してください:
[
  {{
    "priority": "critical/high/medium/low",
    "category": "カテゴリ名",
    "title": "施策タイトル（30文字以内）",
    "description": "具体的な施策内容（コード例やテンプレートを含む。100-200文字）",
    "estimated_impact": "+Npt"
  }}
]"""

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )

        text = response.choices[0].message.content or "[]"
        data = json.loads(text)

        # Handle both array and object with "actions" key
        items = data if isinstance(data, list) else data.get("actions", data.get("suggestions", []))

        actions = []
        for item in items:
            actions.append({
                "site_id": site_id,
                "organization_id": org_id,
                "priority": item.get("priority", "medium"),
                "category": item.get("category", "一般"),
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "estimated_impact": item.get("estimated_impact", ""),
                "status": "todo",
            })

        return actions

    except Exception as e:
        print(f"[Action Generator Error] {e}")
        return await generate_actions_basic(site_id, org_id)


async def save_actions(actions: list[dict]) -> int:
    """Save generated actions to DB, replacing old ones with status=todo."""
    if not actions:
        return 0

    supabase = get_supabase()
    org_id = actions[0]["organization_id"]
    site_id = actions[0]["site_id"]

    # Delete old todo actions (keep in_progress and done)
    supabase.table("action_suggestions") \
        .delete() \
        .eq("site_id", site_id) \
        .eq("organization_id", org_id) \
        .eq("status", "todo") \
        .execute()

    # Insert new
    for action in actions:
        supabase.table("action_suggestions").insert(action).execute()

    return len(actions)
