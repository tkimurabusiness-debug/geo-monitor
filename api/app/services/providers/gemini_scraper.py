"""Gemini scraper provider — Playwright-based, works WITHOUT login.

Gemini allows anonymous queries at gemini.google.com.
"""

from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from .base import AIProvider, AIResponse

SESSION_FILE = Path(__file__).parent.parent.parent.parent / "sessions" / "gemini_session.json"


class GeminiScraperProvider(AIProvider):
    platform = "gemini"

    async def query(self, prompt: str) -> AIResponse:
        try:
            text = await self._scrape(prompt)
            return AIResponse(
                text=text,
                model="gemini-web",
                platform=self.platform,
                raw_response={"method": "scraper"},
            )
        except Exception as e:
            print(f"[Gemini Scraper] Error: {e}")
            return AIResponse(
                text=f"[Scraper Error] {str(e)}",
                model="gemini-web",
                platform=self.platform,
                raw_response={"error": str(e)},
            )

    async def check_visibility(self, keyword: str, brand_name: str, site_url: str) -> dict:
        prompt = f"{keyword} おすすめのサービスや企業を教えてください。ランキング形式で5つ挙げてください。"
        response = await self.query(prompt)
        return self._parse_visibility(response.text, brand_name)

    async def _scrape(self, prompt: str) -> str:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                ],
            )
            ctx_opts: dict = {
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "viewport": {"width": 1280, "height": 900},
                "locale": "ja-JP",
            }
            if SESSION_FILE.exists():
                ctx_opts["storage_state"] = str(SESSION_FILE)

            context = await browser.new_context(**ctx_opts)
            page = await context.new_page()

            try:
                await page.goto("https://gemini.google.com/app", wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(3000)

                # If redirected to login, try the public URL
                if "accounts.google.com" in page.url:
                    await page.goto("https://gemini.google.com", wait_until="domcontentloaded", timeout=30000)
                    await page.wait_for_timeout(3000)

                # Dismiss any cookie/consent overlays
                for selector in [
                    'button:has-text("I agree")',
                    'button:has-text("同意する")',
                    'button:has-text("Accept")',
                    'button:has-text("Dismiss")',
                    'button:has-text("Got it")',
                    'button[aria-label="Close"]',
                ]:
                    btn = page.locator(selector)
                    if await btn.count() > 0:
                        try:
                            await btn.first.click(timeout=2000)
                            await page.wait_for_timeout(500)
                        except Exception:
                            pass

                await page.wait_for_timeout(1000)

                # Find input area
                input_selectors = [
                    'div.ql-editor[contenteditable="true"]',
                    'rich-textarea div[contenteditable="true"]',
                    'div[contenteditable="true"][aria-label]',
                    'div[contenteditable="true"]',
                    "textarea",
                ]
                input_el = None
                for sel in input_selectors:
                    loc = page.locator(sel)
                    if await loc.count() > 0:
                        try:
                            await loc.first.wait_for(state="visible", timeout=5000)
                            input_el = loc.first
                            break
                        except PlaywrightTimeout:
                            continue

                if not input_el:
                    await page.screenshot(path="/tmp/gemini_debug.png")
                    return "[Gemini: input area not found. Screenshot saved to /tmp/gemini_debug.png]"

                # Type and send
                await input_el.click()
                await page.wait_for_timeout(300)
                await input_el.fill(prompt)
                await page.wait_for_timeout(500)

                # Send
                send_selectors = [
                    'button[aria-label="Send message"]',
                    'button[aria-label="送信"]',
                    'button.send-button',
                    'button[mattooltip="Send"]',
                    'button[mattooltip="送信"]',
                ]
                sent = False
                for sel in send_selectors:
                    btn = page.locator(sel)
                    if await btn.count() > 0:
                        try:
                            await btn.first.click(timeout=3000)
                            sent = True
                            break
                        except Exception:
                            continue
                if not sent:
                    await page.keyboard.press("Enter")

                # Wait for response
                await page.wait_for_timeout(5000)
                for _ in range(30):
                    loading = page.locator(
                        '.loading-indicator, mat-progress-bar, '
                        '[aria-label="Loading"], .thinking-indicator'
                    )
                    if await loading.count() == 0:
                        break
                    await page.wait_for_timeout(1000)
                await page.wait_for_timeout(2000)

                # Extract response
                response_selectors = [
                    "model-response .markdown",
                    ".model-response-text .markdown",
                    "message-content .markdown",
                    ".response-container .markdown",
                    ".conversation-container model-response",
                ]
                for sel in response_selectors:
                    els = page.locator(sel)
                    if await els.count() > 0:
                        text = await els.last.inner_text()
                        if text and len(text.strip()) > 10:
                            return text.strip()

                # Fallback
                main = page.locator("main, [role='main']")
                if await main.count() > 0:
                    text = await main.last.inner_text()
                    return text[:3000] if text else "[Gemini: no response]"

                return "[Gemini: response not captured]"

            except PlaywrightTimeout:
                await page.screenshot(path="/tmp/gemini_timeout.png")
                return "[Gemini: timeout]"
            finally:
                await browser.close()

    def _parse_visibility(self, text: str, brand_name: str) -> dict:
        if text.startswith("["):
            return {"mentioned": False, "rank": None, "response_text": text, "citations": [], "competitors": [], "sentiment": None}

        mentioned = brand_name.lower() in text.lower()
        rank = None
        competitors = []

        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            for i in range(1, 11):
                for prefix in [f"{i}.", f"{i})", f"**{i}.", f"**{i})", f"{i}位"]:
                    if line.startswith(prefix) or (len(line) > 3 and f" {prefix}" in line[:15]):
                        content = line.split(prefix, 1)[-1].strip().strip("*").strip()
                        name = content.split("—")[0].split(" - ")[0].split(":")[0].split("（")[0].strip().strip("*").strip()
                        if brand_name.lower() in name.lower() or brand_name.lower() in line.lower():
                            rank = i
                        elif name and 2 < len(name) < 50:
                            competitors.append({"brand": name, "rank": i})
                        break

        return {
            "mentioned": mentioned,
            "rank": rank,
            "response_text": text,
            "citations": [],
            "competitors": competitors[:5],
            "sentiment": None,
        }
