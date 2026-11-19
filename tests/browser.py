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
        # Assessment: single choice, multiple choice, long text, command logs and code.
        assert page.locator("[data-assessment-id]").count() == 10
        assert page.locator("#assessment legend").count() == 0
        assert page.locator(".assessment-question > h4[data-report-title]").count() == 10
        assert page.get_by_role("radiogroup", name="Q01. Ты изменил Program.cs после сборки. Что покажет dotnet run --no-build?").count() == 1
        assert page.get_by_role("radiogroup", name="P01. До какого этапа удалось дойти в реальном терминале?").count() == 1
        page.locator("#q01-b").check()
        page.locator("#q02-b").check()
        page.locator("#q02-c").check()
        page.locator("#q03").fill("Исходник сохранён, DLL пока прежняя.\nНужна новая сборка.")
        page.locator("#q04").fill("dotnet --list-sdks: показывает установки, но не доказывает успешную сборку проекта.")
        page.locator("#p01-a").check()
        page.locator("#env-output").fill("dotnet --version\n11.0.100\n<runtime> & \"SDK\"")
        page.locator("#env-predict").fill("net11.0 можно собрать при установленном SDK 11.")
        page.locator("#word-first").fill("Чай")
        page.locator("#word-second").fill("Кофе")
        page.locator("#program-code").fill('Console.WriteLine("Кофе");\n// <tag> & more')
        page.locator("#run1-predict").fill("Чай")
        page.locator("#run1-actual").fill("Чай")
        page.locator("#run2-predict").fill("Чай")
        page.locator("#run2-actual").fill("Чай")
        page.locator("#run3-predict").fill("Кофе")
        page.locator("#run3-actual").fill("Кофе")
        page.locator("#lab-why").fill("DLL обновляется при build. SDK собирает, Runtime исполняет.")
        expect(page.locator("#assessment-count")).to_contain_text("9 из 9")

        # Simulate successful permission to copy; the copied text must include each prompt and raw answers.
        page.evaluate("""() => {
          window.__copiedReport = null;
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText: async text => { window.__copiedReport = text; }}
          });
        }""")
        page.locator("#report-copy").click()
        expect(page.locator("#report-status")).to_contain_text("Отчёт скопирован")
        report = page.evaluate("window.__copiedReport")
        assert "M00-L01 — SDK и Runtime" in report
        assert "Q01. Ты изменил Program.cs" in report
        assert "B Текст предыдущей сборки" in report
        assert "B dotnet --list-sdks; C dotnet --list-runtimes" in report
        assert '<runtime> & "SDK"' in report
        assert 'Console.WriteLine("Кофе");\n// <tag> & more' in report
        assert "P04. Сравни прогноз" in report and "Шаг 3 — фактический вывод: Кофе" in report
        assert "P06. Что не получилось" in report and "Ошибки и вопросы: Не отвечено" in report

        # Reload must recover the local draft, but report copy needs to be explicitly requested.
        page.reload()
        assert page.locator("#word-second").input_value() == "Кофе"
        assert page.locator("#q01-b").is_checked()
        assert page.locator("#q02-c").is_checked()
        expect(page.locator("#assessment-count")).to_contain_text("9 из 9")
        assert page.locator("#report-result").is_hidden()

        # Denied clipboard permission: accessible manual selection remains available.
        page.evaluate("""() => Object.defineProperty(navigator, 'clipboard', {
          configurable: true, value: {writeText: () => Promise.reject(Error('Permission denied'))}
        })""")
        page.locator("#report-copy").click()
        expect(page.locator("#report-status")).to_contain_text("Автокопирование недоступно")
        assert page.locator("#report-preview").is_visible()
        assert "Q02. Какие команды" in page.locator("#report-preview").input_value()
        assert page.locator("#report-preview").evaluate("el => el === document.activeElement")

        # Editing after report generation updates the preview rather than leaving stale answers.
        page.locator("#q03").fill("Исправленный ответ после проверки.")
        assert "Исправленный ответ после проверки." in page.locator("#report-preview").input_value()

        # The destructive reset requires confirmation and clears persisted answers.
        page.once("dialog", lambda dialog: dialog.dismiss())
        page.locator("#report-reset").click()
        assert page.locator("#q01-b").is_checked()
        page.once("dialog", lambda dialog: dialog.accept())
        page.locator("#report-reset").click()
        assert not page.locator("#q01-b").is_checked()
        assert page.locator("#env-output").input_value() == ""
        assert page.locator("#report-result").is_hidden()
        expect(page.locator("#assessment-count")).to_contain_text("0 из 9")
        page.reload()
        assert page.locator("#word-second").input_value() == ""
        page.locator("#report-copy").click()
        assert "Q01. Ты изменил Program.cs" in page.locator("#report-preview").input_value()
        assert "Ответ: Не отвечено" in page.locator("#report-preview").input_value()
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        page.close()
    browser.close()
print("Desktop and mobile browser checks passed.")
