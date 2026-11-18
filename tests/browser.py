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
        next_step = page.locator("#next")
        assert "не создана" in page.locator("#binary").inner_text()
        for _ in range(3):
            next_step.click()
        assert "Кофе" in page.locator("#source").inner_text()
        next_step.click()
        assert page.locator("#guess").evaluate("el => el === document.activeElement")
        for prediction in ("Кофе", "Чай"):
            page.locator("#guess").select_option(prediction)
            next_step.click()
            assert prediction in page.locator("#notice").inner_text()
            assert page.locator("#console").inner_text() == "Чай"
            page.locator("#back").click()
        next_step.click()
        next_step.click()
        assert "Кофе" in page.locator("#binary").inner_text()
        assert page.locator("#console").inner_text() == "Чай"
        next_step.click()
        assert page.locator("#console").inner_text() == "Кофе"
        next_step.click()
        assert page.locator("#back").is_disabled()
        assert page.locator("#guess").input_value() == ""
        page.locator("#free summary").click()
        page.locator("#draft").fill("Сок")
        page.locator("#execute").click()
        assert "Последний вывод: «Чай»" in page.locator("#free-state").inner_text()
        page.locator("#compile").click()
        page.locator("#execute").click()
        assert "Последний вывод: «Сок»" in page.locator("#free-state").inner_text()
        page.locator("#restart").click()
        assert page.locator("#draft").input_value() == "Чай"
        page.locator("#answer").select_option("old")
        assert "Верно" in page.locator("#feedback").inner_text()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        page.close()
    browser.close()
print("Desktop and mobile browser checks passed.")
