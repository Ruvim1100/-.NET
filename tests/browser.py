"""Run with Playwright and Chromium. CHROMIUM_PATH overrides Playwright's browser."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

with sync_playwright() as driver:
    browser = driver.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH"), args=["--no-sandbox"])
    for width in (390, 1280):
        page = browser.new_page(viewport={"width":width, "height":850})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(Path("site/index.html").resolve().as_uri())
        assert page.locator("#modules details").count() == 25
        page.keyboard.press("Tab")
        assert page.locator(":focus").get_attribute("class") == "skip"
        old = page.locator("html").get_attribute("data-theme")
        page.locator("#theme").click()
        assert page.locator("html").get_attribute("data-theme") != old
        page.locator("#search").fill("LINQ")
        assert page.locator("#modules details").count() == 1
        page.locator("#search").fill("")
        page.locator("#available").select_option("open")
        assert page.locator("#modules details").count() >= 1
        page.locator(".cta").click()
        page.locator("#op").select_option("run")
        assert "успешен" in page.locator("#result").inner_text()
        page.locator("#kit").select_option("ten")
        assert "остановлен" in page.locator("#result").inner_text()
        for key in ("edit","run"):
            page.locator("#"+key).click()
        assert "вывод: v1" in page.locator("#state").inner_text()
        for key in ("build","run"):
            page.locator("#"+key).click()
        assert "вывод: v2" in page.locator("#state").inner_text()
        page.locator("#reset").click()
        page.locator("#answer").select_option("old")
        assert "Верно" in page.locator("#feedback").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        page.close()
    browser.close()
print("Desktop and mobile browser checks passed.")
