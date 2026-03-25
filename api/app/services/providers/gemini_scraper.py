"""Gemini scraper provider — Playwright-based fallback when no API key.

Uses headless Chromium to interact with gemini.google.com.
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from .base import AIProvider, AIResponse

SESSION_FILE = Path(__file__).parent.parent.parent.parent / "sessions" / "gemini_session.json"


class GeminiScraperProvider(AIProvider):
    platform = "gemini"

    async def query(self, prompt: str) -> AIResponse:
        """Send a query to Gemini via browser automation."""
        try:
            text = await self._scrape_gemini(prompt)
            return AIResponse(
                text=text,
                model="gemini-scraper",
                platform=self.platform,
                raw_response={"method": "scraper"},
            )
        except Exception as e:
            print(f"[Gemini Scraper] Error: {e}")
            return AIResponse(
                text=f"[Scraper Error] {str(e)}",
                model="gemini-scraper",
                platform=self.platform,
                raw_response={"error": str(e)},
            )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = f"{keyword} おすすめのサービスや企業を教えてください。ランキング形式で5つ挙げてください。"
        response = await self.query(prompt)
        return self._parse_visibility(response.text, brand_name)

    async def _scrape_gemini(self, prompt: str) -> str:
        """Open Gemini in headless browser and get response."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            context_opts = {
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "viewport": {"width": 1280, "height": 800},
            }
            if SESSION_FILE.exists():
                context_opts["storage_state"] = str(SESSION_FILE)
                print("[Gemini Scraper] Using saved session")
            context = await browser.new_context(**context_opts)
            page = await context.new_page()

            try:
                # Navigate to Gemini
                await page.goto("https://gemini.google.com/app", wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(3000)

                # Find the input area
                # Gemini uses a rich text editor
                input_area = page.locator(
                    'div[contenteditable="true"], '
                    'rich-textarea div[contenteditable], '
                    '.ql-editor, '
                    'textarea'
                )

                try:
                    await input_area.first.wait_for(timeout=10000)
                except PlaywrightTimeout:
                    # Check for Google login requirement
                    if "accounts.google.com" in page.url:
                        return "[Gemini requires Google login - scraper cannot proceed]"
                    return "[Gemini input area not found]"

                # Type prompt
                await input_area.first.click()
                await input_area.first.fill(prompt)
                await page.wait_for_timeout(500)

                # Submit — click send button or press Enter
                send_btn = page.locator(
                    'button[aria-label="Send message"], '
                    'button[aria-label="送信"], '
                    'button.send-button, '
                    'button[mattooltip="Send"]'
                )
                if await send_btn.count() > 0:
                    await send_btn.first.click()
                else:
                    await page.keyboard.press("Enter")

                # Wait for response
                await page.wait_for_timeout(5000)

                # Wait for response to complete (loading indicator disappears)
                for _ in range(30):
                    loading = page.locator('.loading-indicator, .thinking, [aria-label="Loading"]')
                    if await loading.count() == 0:
                        break
                    await page.wait_for_timeout(1000)

                await page.wait_for_timeout(2000)

                # Extract response text
                # Gemini renders responses in model-response or message-content elements
                response_selectors = [
                    'model-response .markdown',
                    '.model-response-text',
                    '.response-content',
                    'message-content .markdown',
                    '.conversation-container .model-response',
                ]

                for selector in response_selectors:
                    elements = page.locator(selector)
                    if await elements.count() > 0:
                        text = await elements.last.inner_text()
                        if text and len(text) > 20:
                            return text.strip()

                # Fallback: grab main content
                main = page.locator('main, .chat-container, [role="main"]')
                if await main.count() > 0:
                    text = await main.last.inner_text()
                    return text[:3000] if text else "[No response captured]"

                return "[Gemini response not captured]"

            except PlaywrightTimeout:
                return "[Gemini scraper timeout]"
            finally:
                await browser.close()

    def _parse_visibility(self, text: str, brand_name: str) -> dict:
        """Parse brand visibility from scraped response."""
        mentioned = brand_name.lower() in text.lower()
        rank = None
        competitors = []

        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            for i in range(1, 11):
                prefixes = [f"{i}.", f"{i})", f"#{i}", f"**{i}.", f"**{i})", f"{i}位"]
                for prefix in prefixes:
                    if line.startswith(prefix) or f" {prefix}" in line[:10]:
                        content = line.split(prefix, 1)[-1].strip().strip("*").strip()
                        name = content.split("—")[0].split("-")[0].split(":")[0].strip().strip("*").strip()
                        if brand_name.lower() in name.lower() or brand_name.lower() in line.lower():
                            rank = i
                        elif name and len(name) < 50:
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
