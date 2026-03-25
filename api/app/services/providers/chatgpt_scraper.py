"""ChatGPT scraper provider — Playwright-based, works WITHOUT login.

ChatGPT allows anonymous/guest queries. This scraper:
1. Opens chatgpt.com
2. Dismisses any login prompts / cookie banners
3. Types prompt in the input area
4. Waits for response to complete
5. Extracts response text
"""

import json
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from .base import AIProvider, AIResponse

SESSION_FILE = Path(__file__).parent.parent.parent.parent / "sessions" / "chatgpt_session.json"


class ChatGPTScraperProvider(AIProvider):
    platform = "chatgpt"

    async def query(self, prompt: str) -> AIResponse:
        try:
            text = await self._scrape(prompt)
            return AIResponse(
                text=text,
                model="chatgpt-web",
                platform=self.platform,
                raw_response={"method": "scraper"},
            )
        except Exception as e:
            print(f"[ChatGPT Scraper] Error: {e}")
            return AIResponse(
                text=f"[Scraper Error] {str(e)}",
                model="chatgpt-web",
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
                await page.goto("https://chatgpt.com", wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)

                # Dismiss overlays: cookie banners, login prompts, "Stay logged out" etc.
                for selector in [
                    'button:has-text("Stay logged out")',
                    'button:has-text("ログインせずに続ける")',
                    'button:has-text("Try without")',
                    'button:has-text("Dismiss")',
                    'button:has-text("Got it")',
                    'button:has-text("OK")',
                    '[aria-label="Close"]',
                    '[data-testid="close-button"]',
                ]:
                    btn = page.locator(selector)
                    if await btn.count() > 0:
                        try:
                            await btn.first.click(timeout=2000)
                            await page.wait_for_timeout(500)
                        except Exception:
                            pass

                await page.wait_for_timeout(1000)

                # Find input — ChatGPT uses #prompt-textarea or contenteditable div
                input_selectors = [
                    "#prompt-textarea",
                    'div[contenteditable="true"][data-placeholder]',
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
                    # Take screenshot for debugging
                    await page.screenshot(path="/tmp/chatgpt_debug.png")
                    return "[ChatGPT: input area not found. Screenshot saved to /tmp/chatgpt_debug.png]"

                # Type prompt
                await input_el.click()
                await page.wait_for_timeout(300)
                await input_el.fill(prompt)
                await page.wait_for_timeout(500)

                # Send — try button first, then Enter
                send_selectors = [
                    'button[data-testid="send-button"]',
                    'button[aria-label="Send prompt"]',
                    'button[aria-label="メッセージを送信"]',
                    'button[aria-label="Send"]',
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

                # Wait for response to stream
                await page.wait_for_timeout(3000)

                # Wait for streaming to finish (stop button disappears)
                for _ in range(40):  # Max 40s
                    stop = page.locator('button[aria-label="Stop generating"], button[aria-label="停止"]')
                    if await stop.count() == 0:
                        break
                    await page.wait_for_timeout(1000)
                await page.wait_for_timeout(1500)

                # Extract response
                response_selectors = [
                    '[data-message-author-role="assistant"] .markdown',
                    '[data-message-author-role="assistant"]',
                    '.agent-turn .markdown',
                    '.markdown.prose',
                ]
                for sel in response_selectors:
                    els = page.locator(sel)
                    if await els.count() > 0:
                        text = await els.last.inner_text()
                        if text and len(text.strip()) > 10:
                            return text.strip()

                # Last resort
                main_text = await page.locator("main").inner_text()
                return main_text[:3000] if main_text else "[ChatGPT: no response captured]"

            except PlaywrightTimeout:
                await page.screenshot(path="/tmp/chatgpt_timeout.png")
                return "[ChatGPT: timeout]"
            finally:
                await browser.close()

    def _parse_visibility(self, text: str, brand_name: str) -> dict:
        if text.startswith("["):  # Error message
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
