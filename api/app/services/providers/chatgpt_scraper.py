"""ChatGPT scraper provider — Playwright-based fallback when no API key.

Uses headless Chromium to interact with chatgpt.com.
Falls back gracefully if login is required or site blocks automation.
"""

import json
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from .base import AIProvider, AIResponse

SESSION_FILE = Path(__file__).parent.parent.parent.parent / "sessions" / "chatgpt_session.json"


class ChatGPTScraperProvider(AIProvider):
    platform = "chatgpt"

    async def query(self, prompt: str) -> AIResponse:
        """Send a query to ChatGPT via browser automation."""
        try:
            text = await self._scrape_chatgpt(prompt)
            return AIResponse(
                text=text,
                model="chatgpt-scraper",
                platform=self.platform,
                raw_response={"method": "scraper"},
            )
        except Exception as e:
            print(f"[ChatGPT Scraper] Error: {e}")
            return AIResponse(
                text=f"[Scraper Error] {str(e)}",
                model="chatgpt-scraper",
                platform=self.platform,
                raw_response={"error": str(e)},
            )

    async def check_visibility(
        self, keyword: str, brand_name: str, site_url: str
    ) -> dict:
        prompt = f"{keyword} おすすめのサービスや企業を教えてください。ランキング形式で5つ挙げてください。"
        response = await self.query(prompt)
        return self._parse_visibility(response.text, brand_name)

    async def _scrape_chatgpt(self, prompt: str) -> str:
        """Open ChatGPT in headless browser and get response."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
            )
            # Load saved session if available
            context_opts = {
                "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "viewport": {"width": 1280, "height": 800},
            }
            if SESSION_FILE.exists():
                context_opts["storage_state"] = str(SESSION_FILE)
                print("[ChatGPT Scraper] Using saved session")
            context = await browser.new_context(**context_opts)
            page = await context.new_page()

            try:
                # Navigate to ChatGPT
                await page.goto("https://chatgpt.com", wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(3000)

                # Check if we need to log in (free tier allows some queries without login)
                # Look for the text input area
                textarea = page.locator('div[contenteditable="true"], textarea[placeholder], #prompt-textarea')
                try:
                    await textarea.first.wait_for(timeout=10000)
                except PlaywrightTimeout:
                    # May need to click "Stay logged out" or similar
                    stay_btn = page.locator('button:has-text("Stay logged out"), button:has-text("Try without"), button:has-text("without")')
                    if await stay_btn.count() > 0:
                        await stay_btn.first.click()
                        await page.wait_for_timeout(2000)
                        await textarea.first.wait_for(timeout=10000)
                    else:
                        return "[ChatGPT requires login - scraper cannot proceed]"

                # Type the prompt
                await textarea.first.click()
                await textarea.first.fill(prompt)
                await page.wait_for_timeout(500)

                # Submit (press Enter or click send button)
                send_btn = page.locator('button[data-testid="send-button"], button[aria-label="Send"]')
                if await send_btn.count() > 0 and await send_btn.first.is_enabled():
                    await send_btn.first.click()
                else:
                    await page.keyboard.press("Enter")

                # Wait for response to complete
                await page.wait_for_timeout(3000)

                # Wait for the response to stop streaming
                # ChatGPT shows a "stop generating" button while streaming
                for _ in range(30):  # Max 30 seconds
                    stop_btn = page.locator('button[aria-label="Stop generating"], button:has-text("Stop")')
                    if await stop_btn.count() == 0:
                        break
                    await page.wait_for_timeout(1000)

                await page.wait_for_timeout(1000)

                # Extract the last assistant message
                messages = page.locator('[data-message-author-role="assistant"], .markdown')
                count = await messages.count()
                if count > 0:
                    text = await messages.last.inner_text()
                    return text.strip()

                # Fallback: get all text from the response area
                body_text = await page.locator('main').inner_text()
                return body_text[:3000] if body_text else "[No response captured]"

            except PlaywrightTimeout:
                return "[ChatGPT scraper timeout]"
            finally:
                await browser.close()

    def _parse_visibility(self, text: str, brand_name: str) -> dict:
        """Parse brand visibility from scraped response."""
        mentioned = brand_name.lower() in text.lower()
        rank = None
        competitors = []

        # Try to find ranking pattern (1. Brand, 2. Brand, etc.)
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            for i in range(1, 11):
                prefixes = [f"{i}.", f"{i})", f"#{i}", f"**{i}.", f"**{i})", f"{i}位"]
                for prefix in prefixes:
                    if line.startswith(prefix) or f" {prefix}" in line[:10]:
                        # Extract brand name from this line
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
