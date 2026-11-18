"""Check each published page and capture full-page images for visual review."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

site = Path("site").resolve()
catalog = json.loads((site / "data/catalog.json").read_text())
pages = {"dashboard": "index.html", **catalog["published"]}
screenshots = Path("page-previews")
screenshots.mkdir(exist_ok=True)

with sync_playwright() as driver:
    browser = driver.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH"))
    for width in (390, 768, 1280):
        for theme in ("light", "dark"):
            for name, path in pages.items():
                page = browser.new_page(viewport={"width": width, "height": 850},
                                        color_scheme=theme, reduced_motion="reduce")
                failures = []
                page.on("pageerror", lambda error: failures.append(str(error)))
                page.on("requestfailed", lambda request: failures.append(request.url))
                page.goto((site / path).as_uri())
                page.screenshot(path=screenshots / f"{name}-{width}-{theme}.png", full_page=True)
                label = f"{name} / {width} / {theme}"
                assert not failures, (label, failures)
                assert page.locator("main").count() == 1, label
                assert page.locator("h1").count() == 1, label
                assert page.locator("main h1").is_visible(), label
                assert page.locator("html").get_attribute("data-theme") == theme, label
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), label
                # A green CI run must also prove that adjacent lesson blocks share one width.
                if name != "dashboard":
                    container = page.locator("main").bounding_box()
                    blocks = page.locator("main > :is(article, section.panel, details)").evaluate_all(
                        """nodes => nodes.map(node => {
                            const rect = node.getBoundingClientRect();
                            return {left: rect.left, width: rect.width};
                        })"""
                    )
                    assert blocks, label
                    for block in blocks:
                        assert abs(block["width"] - container["width"]) <= 2, (label, block, container)
                        assert abs(block["left"] - container["x"]) <= 2, (label, block, container)
                previous = 0
                for level in page.locator("main :is(h1,h2,h3,h4,h5,h6)").evaluate_all(
                    "headings => headings.map(h => Number(h.tagName.slice(1)))"
                ):
                    assert level <= previous + 1, (label, previous, level)
                    previous = level
                page.close()
    browser.close()
