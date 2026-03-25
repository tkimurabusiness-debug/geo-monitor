"""Site crawler — fetches HTML and extracts structured data."""

import httpx
from bs4 import BeautifulSoup
from dataclasses import dataclass, field
from typing import Optional
import json
import re


@dataclass
class CrawledPage:
    url: str
    status_code: int
    title: str = ""
    meta_description: str = ""
    h1: list[str] = field(default_factory=list)
    h2: list[str] = field(default_factory=list)
    h3: list[str] = field(default_factory=list)
    body_text: str = ""
    json_ld: list[dict] = field(default_factory=list)
    ogp: dict = field(default_factory=dict)
    canonical: str = ""
    has_faq_schema: bool = False
    has_howto_schema: bool = False
    internal_links: list[str] = field(default_factory=list)
    word_count: int = 0


@dataclass
class SiteCrawlResult:
    url: str
    final_url: str
    is_https: bool
    has_robots_txt: bool
    has_sitemap: bool
    has_llms_txt: bool
    robots_txt: str = ""
    sitemap_xml: str = ""
    pages: list[CrawledPage] = field(default_factory=list)
    html_size_bytes: int = 0


async def crawl_site(url: str, max_pages: int = 15) -> SiteCrawlResult:
    """Crawl a site and extract structured data from key pages."""
    async with httpx.AsyncClient(
        follow_redirects=True, timeout=30.0,
        headers={"User-Agent": "GEOMonitor/1.0 (site-diagnosis)"},
    ) as client:
        # Normalize URL
        if not url.startswith("http"):
            url = "https://" + url

        # Fetch main page
        resp = await client.get(url)
        final_url = str(resp.url)
        is_https = final_url.startswith("https")

        # Check robots.txt
        base = f"{resp.url.scheme}://{resp.url.host}"
        robots_txt = ""
        has_robots = False
        try:
            r = await client.get(f"{base}/robots.txt")
            if r.status_code == 200:
                robots_txt = r.text
                has_robots = True
        except Exception:
            pass

        # Check sitemap.xml
        has_sitemap = False
        sitemap_xml = ""
        try:
            r = await client.get(f"{base}/sitemap.xml")
            if r.status_code == 200 and "xml" in r.headers.get("content-type", ""):
                sitemap_xml = r.text[:10000]
                has_sitemap = True
        except Exception:
            pass

        # Check llms.txt
        has_llms_txt = False
        try:
            r = await client.get(f"{base}/llms.txt")
            if r.status_code == 200:
                has_llms_txt = True
        except Exception:
            pass

        # Parse main page
        main_page = _parse_page(final_url, resp.status_code, resp.text)

        # Find internal links to crawl
        pages = [main_page]
        soup = BeautifulSoup(resp.text, "html.parser")
        links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith("/") and not href.startswith("//"):
                links.add(base + href)
            elif href.startswith(base):
                links.add(href)

        # Crawl up to max_pages internal pages
        for link in list(links)[: max_pages - 1]:
            try:
                r = await client.get(link)
                if r.status_code == 200 and "text/html" in r.headers.get("content-type", ""):
                    pages.append(_parse_page(str(r.url), r.status_code, r.text))
            except Exception:
                continue

        return SiteCrawlResult(
            url=url,
            final_url=final_url,
            is_https=is_https,
            has_robots_txt=has_robots,
            has_sitemap=has_sitemap,
            has_llms_txt=has_llms_txt,
            robots_txt=robots_txt,
            sitemap_xml=sitemap_xml,
            pages=pages,
            html_size_bytes=len(resp.content),
        )


def _parse_page(url: str, status_code: int, html: str) -> CrawledPage:
    """Parse a single HTML page."""
    soup = BeautifulSoup(html, "html.parser")

    # Title
    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    # Meta description
    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta_desc = meta_tag["content"]

    # Headings
    h1 = [h.get_text(strip=True) for h in soup.find_all("h1")]
    h2 = [h.get_text(strip=True) for h in soup.find_all("h2")]
    h3 = [h.get_text(strip=True) for h in soup.find_all("h3")]

    # Body text
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    body_text = soup.get_text(separator=" ", strip=True)[:5000]
    word_count = len(body_text)

    # JSON-LD
    json_ld = []
    has_faq = False
    has_howto = False
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            json_ld.append(data)
            ld_type = data.get("@type", "")
            if "FAQ" in str(ld_type):
                has_faq = True
            if "HowTo" in str(ld_type):
                has_howto = True
        except (json.JSONDecodeError, TypeError):
            pass

    # OGP
    ogp = {}
    for meta in soup.find_all("meta", attrs={"property": re.compile(r"^og:")}):
        ogp[meta["property"]] = meta.get("content", "")

    # Canonical
    canonical = ""
    link_canonical = soup.find("link", rel="canonical")
    if link_canonical and link_canonical.get("href"):
        canonical = link_canonical["href"]

    # Internal links
    internal_links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/"):
            internal_links.append(href)

    return CrawledPage(
        url=url,
        status_code=status_code,
        title=title,
        meta_description=meta_desc,
        h1=h1,
        h2=h2,
        h3=h3,
        body_text=body_text,
        json_ld=json_ld,
        ogp=ogp,
        canonical=canonical,
        has_faq_schema=has_faq,
        has_howto_schema=has_howto,
        internal_links=internal_links,
        word_count=word_count,
    )
