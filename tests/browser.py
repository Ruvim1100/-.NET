"""Run with Playwright and Chromium. CHROMIUM_PATH overrides Playwright's browser."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

with sync_playwright() as driver:
    browser = driver.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH"), args=["--no-sandbox"])
    for width in (390, 1280):
        page = browser.new_page(viewport={"width":width, "height":850})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(Path("site/index.html").resolve().as_uri())
        assert page.locator("#modules a").count() == 25
        page.keyboard.press("Tab")
        assert page.locator(":focus").get_attribute("class") == "skip"
        old = page.locator("html").get_attribute("data-theme")
        page.locator("#theme").click()
        assert page.locator("html").get_attribute("data-theme") != old
        page.locator("#search").fill("LINQ")
        assert page.locator("#modules a").count() == 1
        assert "LINQ" in page.locator("#module").inner_text()
        page.locator("#search").fill("M00-L02")
        assert page.locator(".lesson-row").count() == 1
        assert page.locator("a.lesson-row").count() == 0
        page.locator("#search").fill("zzzzzz")
        assert page.locator("#empty").is_visible()
        page.locator("#clear").click()
        page.locator("#modules a[href='#M14']").click()
        expect(page.locator("#module h3")).to_have_text("Данные и PostgreSQL")
        page.reload()
        assert page.locator("#modules a[aria-current]").get_attribute("href") == "#M14"
        page.locator("#module .info a").click()
        expect(page.locator("#modules a[aria-current]")).to_have_attribute("href", "#M13")
        page.locator("#category").select_option("Платформа")
        assert page.locator("#modules a").count() < 25
        page.locator("#category").select_option("")
        page.locator("#search").fill("")
        page.locator("#available").select_option("open")
        assert page.locator("#modules a").count() >= 1
        page.locator("a.lesson-row").first.click()
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
