"""Check static site structure, local navigation, scripts and catalog consistency."""
import json
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = set()
        self.links = []
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in "area base br col embed hr img input link meta param source track wbr".split():
            self.stack.append(tag)
        if "id" in attrs:
            assert attrs["id"] not in self.targets, attrs["id"]
            self.targets.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs:
                self.links.append(attrs[key])

    def handle_endtag(self, tag):
        assert self.stack.pop() == tag, tag

root = Path("site").resolve()
pages = {}
for path in root.rglob("*.html"):
    page = Page()
    page.feed(path.read_text())
    assert not page.stack, path
    pages[path] = page
catalog = json.loads((root / "data/catalog.json").read_text())
module_ids = {module["id"] for module in catalog["modules"]}
for path, page in pages.items():
    for href in page.links:
        link = urlsplit(href)
        if link.scheme:
            continue
        target = (path.parent / link.path).resolve() if link.path else path
        assert target.is_file(), (path, href)
        if link.fragment:
            anchors = pages[target].targets
            if target == root / "index.html":
                anchors = anchors | module_ids
            assert link.fragment in anchors, (path, href)
for path in Path(".").rglob("*.json"):
    if not any(part in {"obj", "bin", "node_modules"} for part in path.parts):
        json.loads(path.read_text())
for path in [*root.rglob("*.js"), *Path("scripts").glob("*.mjs")]:
    subprocess.run(["node", "--check", path], check=True)
print(f"{len(pages)} HTML pages, local references, JSON and script syntax checked.")
