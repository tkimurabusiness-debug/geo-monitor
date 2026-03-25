"""Save browser login sessions for ChatGPT and Gemini scrapers.

Usage:
  python scripts/save_browser_session.py chatgpt
  python scripts/save_browser_session.py gemini

Opens a visible browser window. Log in manually, then press Enter in terminal.
Session cookies are saved to api/sessions/ for scraper reuse.
"""

import sys
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

SESSIONS_DIR = Path(__file__).parent.parent / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)

TARGETS = {
    "chatgpt": {
        "url": "https://chatgpt.com",
        "storage_file": SESSIONS_DIR / "chatgpt_session.json",
    },
    "gemini": {
        "url": "https://gemini.google.com",
        "storage_file": SESSIONS_DIR / "gemini_session.json",
    },
}


async def save_session(target_name: str):
    target = TARGETS.get(target_name)
    if not target:
        print(f"Unknown target: {target_name}")
        print(f"Available: {', '.join(TARGETS.keys())}")
        return

    print(f"\n{'='*50}")
    print(f"  {target_name.upper()} ログインセッション保存")
    print(f"{'='*50}")
    print(f"\n1. ブラウザが開きます")
    print(f"2. {target['url']} にログインしてください")
    print(f"3. ログイン完了したらこのターミナルに戻って Enter を押してください\n")

    async with async_playwright() as p:
        # Open visible browser (not headless)
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()
        await page.goto(target["url"])

        # Wait for user to log in
        input(f"\n>>> {target_name} にログインしたら Enter を押してください... ")

        # Save storage state (cookies + localStorage)
        await context.storage_state(path=str(target["storage_file"]))
        print(f"\n✅ セッション保存完了: {target['storage_file']}")

        await browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/save_browser_session.py [chatgpt|gemini]")
        print("\nBoth:")
        print("  python scripts/save_browser_session.py chatgpt")
        print("  python scripts/save_browser_session.py gemini")
        sys.exit(1)

    asyncio.run(save_session(sys.argv[1]))
