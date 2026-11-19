"""M00-L02: independent browser regression for guided learning and report submission."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

lesson = Path("site/lessons/M00-L02/index.html").resolve().as_uri()

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH"), args=["--no-sandbox"])
    for width in (390, 768, 1280):
        for theme in ("light", "dark"):
            page = browser.new_page(
                viewport={"width": width, "height": 850},
                color_scheme=theme,
                reduced_motion="reduce",
            )
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(lesson)
            expect(page.locator("html")).to_have_attribute("data-theme", theme)
            assert page.locator("h1").count() == 1
            assert page.locator("[data-assessment-id]").count() == 10
            assert page.locator("#assessment legend").count() == 0
            assert page.locator(".assessment-question h4[data-report-title]").count() == 10
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            assert not errors, (width, theme, errors)

            # Guided, observable state transitions.
            expect(page.locator("#stage-counter")).to_have_text("Шаг 1 из 9")
            assert "не создана" in page.locator("#stage-assembly").inner_text().lower()
            for _ in range(6):
                page.locator("#stage-next").click()
            assert "Кофе" in page.locator("#stage-source").inner_text()
            assert "Чай" in page.locator("#stage-assembly").inner_text()
            page.locator("#stage-next").click()
            expect(page.locator("#stage-counter")).to_have_text("Шаг 7 из 9")
            page.locator("#stage-guess").select_option("Кофе")
            page.locator("#stage-next").click()
            expect(page.locator("#stage-console")).to_have_text("Чай")
            assert "Твой прогноз: Кофе" in page.locator("#stage-feedback").inner_text()
            page.locator("#stage-next").click()
            expect(page.locator("#stage-console")).to_have_text("Кофе")
            page.locator("#stage-reset").click()
            expect(page.locator("#stage-counter")).to_have_text("Шаг 1 из 9")

            # Artifact explorer represents binary contents honestly and changes state.
            page.locator('.artifact-choice[data-file="runtimeconfig"]').click()
            assert "Microsoft.NETCore.App" in page.locator("#artifact-display").inner_text()
            expect(page.locator('.artifact-choice[data-file="runtimeconfig"]')).to_have_attribute("aria-pressed","true")
            page.locator('.artifact-choice[data-file="dll"]').click()
            assert "IL" in page.locator("#artifact-explain").inner_text()

            # Independent experiment: direct DLL execution vs new compilation.
            page.locator("#experiment-source").select_option("Кофе")
            page.locator("#experiment-command").select_option("direct")
            page.locator("#experiment-execute").click()
            assert "Сначала выбери прогноз" in page.locator("#experiment-feedback").inner_text()
            page.locator("#experiment-guess").select_option("Чай")
            page.locator("#experiment-execute").click()
            expect(page.locator("#experiment-output")).to_have_text("Чай")
            page.locator("#experiment-command").select_option("build")
            page.locator("#experiment-guess").select_option("none")
            page.locator("#experiment-execute").click()
            expect(page.locator("#experiment-binary")).to_have_text("Кофе")
            page.locator("#experiment-command").select_option("direct")
            page.locator("#experiment-guess").select_option("Кофе")
            page.locator("#experiment-execute").click()
            expect(page.locator("#experiment-output")).to_have_text("Кофе")
            page.locator("#experiment-reset").click()
            expect(page.locator("#experiment-binary")).to_have_text("Чай")

            # Form: mixed answers, code/logs, multiline text, extra characters.
            page.locator("#q01-b").check()
            page.locator("#q02-a").check()
            page.locator("#q03-a").check()
            page.locator("#q03-b").check()
            page.locator("#q04").fill("build собирает.\nrun запускает. publish публикует. Native AOT — отдельно.")
            page.locator("#p01-log").fill("11.0.100\nBuild succeeded\nbin\\Debug\\net11.0\\TraceFlow.dll")
            page.locator("#p02-log").fill("TraceFlow.runtimeconfig.json\n{\"tfm\":\"net11.0\"}\n<runtime>&\"ok\"")
            page.locator("#p03-first").fill("dotnet TraceFlow.dll\nHello, World!")
            page.locator("#p03-code").fill('Console.WriteLine("Trace: updated");\n// <tag> & done')
            page.locator("#p03-predict").fill("Hello, World!")
            page.locator("#p03-actual").fill("Hello, World!")
            page.locator("#p04-build").fill("Build succeeded\nTrace: updated")
            page.locator("#p04-explain").fill("C# → IL → Runtime → JIT → output")
            page.locator("#p05-answer").fill("dotnet run берёт проект; direct DLL берёт сборку и runtimeconfig.")
            expect(page.locator("#assessment-count")).to_have_text("9 из 9 разделов заполнено")
            page.evaluate("""() => {
                window.__copiedM00L02 = "";
                Object.defineProperty(navigator, "clipboard", {
                  configurable: true,
                  value: {writeText: async txt => { window.__copiedM00L02 = txt; }}
                });
            }""")
            page.locator("#report-copy").click()
            expect(page.locator("#report-status")).to_contain_text("Отчёт скопирован")
            output = page.evaluate("window.__copiedM00L02")
            assert "M00-L02 — От исходника до запуска" in output
            assert "Q03. Какие файлы помогают" in output
            assert "A · TraceFlow.runtimeconfig.json; B · TraceFlow.deps.json" in output
            assert 'Console.WriteLine("Trace: updated");\n// <tag> & done' in output
            assert '<runtime>&"ok"' in output
            assert "P06. Какие ошибки возникли" in output
            assert "Не отвечено" in output

            page.reload()
            expect(page.locator("#p03-predict")).to_have_value("Hello, World!")
            assert page.locator("#q03-b").is_checked()
            expect(page.locator("#assessment-count")).to_have_text("9 из 9 разделов заполнено")
            assert page.locator("#report-result").is_hidden()
            page.evaluate("""() => Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: {writeText: () => Promise.reject(new Error("not allowed"))}
            })""")
            page.locator("#report-copy").click()
            expect(page.locator("#report-status")).to_contain_text("Автокопирование не сработало")
            assert page.locator("#report-preview").is_visible()
            assert page.locator("#report-preview").evaluate("el=>document.activeElement===el")
            page.locator("#p05-answer").fill("Исправленный ответ после экспорта.")
            assert "Исправленный ответ после экспорта." in page.locator("#report-preview").input_value()
            page.once("dialog", lambda dlg: dlg.dismiss())
            page.locator("#report-reset").click()
            assert page.locator("#q01-b").is_checked()
            page.once("dialog", lambda dlg: dlg.accept())
            page.locator("#report-reset").click()
            assert page.locator("#p02-log").input_value() == ""
            assert not page.locator("#q01-b").is_checked()
            expect(page.locator("#assessment-count")).to_have_text("0 из 9 разделов заполнено")
            assert page.locator("#report-result").is_hidden()
            page.reload()
            assert page.locator("#p03-predict").input_value() == ""
            page.locator("#report-copy").click()
            assert "Q01. Что содержит" in page.locator("#report-preview").input_value()
            assert "Ответ: Не отвечено" in page.locator("#report-preview").input_value()

            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            assert not errors, (width, theme, errors)
            page.close()
    browser.close()
print("M00-L02 interactive, accessibility, theme, clipboard and draft checks passed.")
