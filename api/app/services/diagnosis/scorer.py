"""GEO Readiness scoring engine.

Ported from seo-geo-scorer/src/lib/scoring/ with adaptations for Python.
"""

from dataclasses import dataclass
from .crawler import SiteCrawlResult, CrawledPage


@dataclass
class CheckResult:
    id: str
    label: str
    passed: bool
    detail: str
    suggestion: str = ""
    max_score: float = 1.0
    score: float = 0.0


def score_technical(crawl: SiteCrawlResult) -> list[CheckResult]:
    """Technical requirements check."""
    main = crawl.pages[0] if crawl.pages else None
    checks = []

    # SSL/HTTPS
    checks.append(CheckResult(
        id="t_https", label="SSL/HTTPS",
        passed=crawl.is_https,
        detail="HTTPS有効" if crawl.is_https else "HTTPSが無効です",
        suggestion="" if crawl.is_https else "SSL証明書を設定してください",
        max_score=1.0, score=1.0 if crawl.is_https else 0.0,
    ))

    # robots.txt
    checks.append(CheckResult(
        id="t_robots", label="robots.txt",
        passed=crawl.has_robots_txt,
        detail="robots.txt検出" if crawl.has_robots_txt else "robots.txtが見つかりません",
        suggestion="" if crawl.has_robots_txt else "robots.txtを設置してください",
        max_score=1.0, score=1.0 if crawl.has_robots_txt else 0.0,
    ))

    # sitemap.xml
    checks.append(CheckResult(
        id="t_sitemap", label="sitemap.xml",
        passed=crawl.has_sitemap,
        detail="sitemap.xml検出" if crawl.has_sitemap else "sitemap.xmlが見つかりません",
        suggestion="" if crawl.has_sitemap else "sitemap.xmlを作成してください",
        max_score=1.0, score=1.0 if crawl.has_sitemap else 0.0,
    ))

    if main:
        # JSON-LD
        has_jsonld = len(main.json_ld) > 0
        checks.append(CheckResult(
            id="t_jsonld", label="JSON-LD構造化データ",
            passed=has_jsonld,
            detail=f"{len(main.json_ld)}件のJSON-LD検出" if has_jsonld else "JSON-LDが見つかりません",
            suggestion="" if has_jsonld else "Organization, FAQ等のJSON-LDを追加してください",
            max_score=2.0, score=2.0 if has_jsonld else 0.0,
        ))

        # OGP
        has_ogp = len(main.ogp) >= 2
        checks.append(CheckResult(
            id="t_ogp", label="OGPメタタグ",
            passed=has_ogp,
            detail=f"{len(main.ogp)}個のOGPタグ検出" if has_ogp else "OGPタグが不足しています",
            suggestion="" if has_ogp else "og:title, og:description, og:imageを設定してください",
            max_score=1.0, score=1.0 if has_ogp else 0.0,
        ))

        # Semantic HTML (h1-h6)
        has_h1 = len(main.h1) == 1
        has_hierarchy = len(main.h1) > 0 and len(main.h2) > 0
        checks.append(CheckResult(
            id="t_semantic", label="セマンティックHTML（h1-h6）",
            passed=has_h1 and has_hierarchy,
            detail=f"h1:{len(main.h1)} h2:{len(main.h2)} h3:{len(main.h3)}" if has_hierarchy else "見出し階層が不十分",
            suggestion="" if has_hierarchy else "h1を1つ、h2-h3で階層構造を作ってください",
            max_score=1.5, score=1.5 if (has_h1 and has_hierarchy) else (0.5 if has_hierarchy else 0.0),
        ))

        # Canonical
        has_canonical = bool(main.canonical)
        checks.append(CheckResult(
            id="t_canonical", label="canonical URL",
            passed=has_canonical,
            detail="canonical URL設定済み" if has_canonical else "canonical URLが未設定",
            suggestion="" if has_canonical else "全ページにcanonical URLを設定してください",
            max_score=0.5, score=0.5 if has_canonical else 0.0,
        ))

        # FAQ Schema
        any_faq = any(p.has_faq_schema for p in crawl.pages)
        checks.append(CheckResult(
            id="t_faq_schema", label="FAQ / HowTo Schema",
            passed=any_faq,
            detail="FAQ/HowTo Schema検出" if any_faq else "FAQ Schemaが見つかりません",
            suggestion="" if any_faq else "FAQ形式のページにFAQPage Schemaを追加してください",
            max_score=1.5, score=1.5 if any_faq else 0.0,
        ))

    # llms.txt
    checks.append(CheckResult(
        id="t_llms_txt", label="llms.txt",
        passed=crawl.has_llms_txt,
        detail="llms.txt検出" if crawl.has_llms_txt else "llms.txtが見つかりません",
        suggestion="" if crawl.has_llms_txt else "LLM向けサイト情報ファイルを設置を推奨",
        max_score=0.5, score=0.5 if crawl.has_llms_txt else 0.0,
    ))

    return checks


def score_content(crawl: SiteCrawlResult) -> list[CheckResult]:
    """Content requirements check."""
    checks = []
    all_text = " ".join(p.body_text for p in crawl.pages)
    main = crawl.pages[0] if crawl.pages else None

    # E-E-A-T (author info)
    eeat_keywords = ["著者", "執筆者", "監修", "プロフィール", "経歴", "実績", "資格"]
    has_eeat = any(kw in all_text for kw in eeat_keywords)
    checks.append(CheckResult(
        id="c_eeat", label="E-E-A-T要素（著者情報）",
        passed=has_eeat,
        detail="著者情報・実績の記載あり" if has_eeat else "著者情報が見当たりません",
        suggestion="" if has_eeat else "著者プロフィール・実績・専門性を明示してください",
        max_score=2.0, score=2.0 if has_eeat else 0.0,
    ))

    # Q&A content
    qa_keywords = ["よくある質問", "FAQ", "Q&A", "Q.", "A."]
    has_qa = any(kw in all_text for kw in qa_keywords)
    checks.append(CheckResult(
        id="c_qa", label="Q&A形式コンテンツ",
        passed=has_qa,
        detail="Q&A形式のコンテンツあり" if has_qa else "Q&A形式のコンテンツなし",
        suggestion="" if has_qa else "FAQ形式のコンテンツを追加してください。AI引用されやすくなります",
        max_score=1.5, score=1.5 if has_qa else 0.0,
    ))

    # Direct answer structure
    direct_keywords = ["結論", "まとめ", "ポイント", "要点"]
    has_direct = any(kw in all_text[:2000] for kw in direct_keywords)
    checks.append(CheckResult(
        id="c_direct", label="直接回答型コンテンツ",
        passed=has_direct,
        detail="冒頭に結論・まとめあり" if has_direct else "記事冒頭に結論がありません",
        suggestion="" if has_direct else "記事冒頭に「結論」セクションを追加し、AIが引用しやすい構造に",
        max_score=1.5, score=1.5 if has_direct else 0.0,
    ))

    # TOC
    toc_keywords = ["目次", "table of contents", "toc"]
    has_toc = any(kw.lower() in all_text.lower() for kw in toc_keywords)
    checks.append(CheckResult(
        id="c_toc", label="目次（TOC）",
        passed=has_toc,
        detail="目次あり" if has_toc else "目次が見当たりません",
        suggestion="" if has_toc else "記事に目次を追加してください",
        max_score=0.5, score=0.5 if has_toc else 0.0,
    ))

    # Numeric data
    import re
    numbers = re.findall(r'\d{2,}[%万円件]', all_text)
    has_numbers = len(numbers) >= 3
    checks.append(CheckResult(
        id="c_numbers", label="具体的数値・データ",
        passed=has_numbers,
        detail=f"{len(numbers)}件の数値データ検出" if has_numbers else "具体的数値が少ない",
        suggestion="" if has_numbers else "統計データや具体的な数値を記載してください",
        max_score=1.0, score=1.0 if has_numbers else 0.0,
    ))

    # Update date
    date_keywords = ["更新日", "最終更新", "updated", "modified"]
    has_date = any(kw.lower() in all_text.lower() for kw in date_keywords)
    checks.append(CheckResult(
        id="c_date", label="更新日の明示",
        passed=has_date,
        detail="更新日の記載あり" if has_date else "更新日の記載なし",
        suggestion="" if has_date else "記事の公開日・更新日をスキーマ含めて明示してください",
        max_score=1.0, score=1.0 if has_date else 0.0,
    ))

    # Citations/sources
    cite_keywords = ["出典", "参照", "引用元", "ソース", "参考文献"]
    has_cite = any(kw in all_text for kw in cite_keywords)
    checks.append(CheckResult(
        id="c_cite", label="引用元・出典の明示",
        passed=has_cite,
        detail="出典の記載あり" if has_cite else "出典の記載なし",
        suggestion="" if has_cite else "統計データや調査結果に出典リンクを追加してください",
        max_score=1.0, score=1.0 if has_cite else 0.0,
    ))

    return checks


def calculate_readiness_score(
    technical: list[CheckResult], content: list[CheckResult]
) -> float:
    """Calculate GEO Readiness score (0-100)."""
    tech_max = sum(c.max_score for c in technical)
    tech_score = sum(c.score for c in technical)
    content_max = sum(c.max_score for c in content)
    content_score = sum(c.score for c in content)

    total_max = tech_max + content_max
    total_score = tech_score + content_score

    if total_max == 0:
        return 0.0

    return round((total_score / total_max) * 100, 1)
