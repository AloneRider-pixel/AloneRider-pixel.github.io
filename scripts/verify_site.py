from html.parser import HTMLParser
from pathlib import Path
import re

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta = {}
        self.ids = set()
        self.links = []
        self.images = 0
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "title":
            self.in_title = True
        if tag == "meta" and attrs.get("name") in {"description", "viewport"}:
            self.meta[attrs["name"]] = attrs.get("content", "")
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "img":
            self.images += 1
            if not attrs.get("alt"):
                raise SystemExit("Site validation failed: image is missing alt text")

parser = SiteParser()
parser.feed(Path("index.html").read_text(encoding="utf-8"))
required_ids = {"top", "main-content", "work", "experience", "stack", "contact", "year"}
missing_ids = required_ids - parser.ids
if missing_ids:
    raise SystemExit("Site validation failed: missing ids: " + ", ".join(sorted(missing_ids)))

title_match = re.search(r"<title[^>]*>\s*(.*?)\s*</title>", Path("index.html").read_text(encoding="utf-8"), re.I | re.S)
if not title_match or not title_match.group(1).strip():
    raise SystemExit("Site validation failed: missing title")

if len(parser.meta.get("description", "")) < 40:
    raise SystemExit("Site validation failed: meta description is missing or too short")

html = Path("index.html").read_text(encoding="utf-8")
for marker in (
    '<meta property="og:title"',
    '<meta property="og:description"',
    '<link rel="canonical" href="https://himanshubisht.is-a.dev/"',
    '"@type":"Person"',
):
    if marker not in html:
        raise SystemExit(f"Site validation failed: missing trust/SEO marker {marker}")

if "github.com/AloneRider-pixel/AloneRider-pixel.github.io/blob/main/docs/evidence-index.md" not in html:
    raise SystemExit("Site validation failed: portfolio evidence index link missing")

for href in parser.links:
    if href.startswith("#"):
        target = href[1:]
        if target and target not in parser.ids:
            raise SystemExit(f"Site validation failed: broken internal anchor '#{target}'")
    elif not href.strip():
        raise SystemExit("Site validation failed: empty link target")

if not any("github.com/AloneRider-pixel" in href for href in parser.links):
    raise SystemExit("Site validation failed: GitHub link missing")

if not any("linkedin.com" in href for href in parser.links):
    raise SystemExit("Site validation failed: LinkedIn link missing")

print(
    f"site verification passed: {len(parser.links)} links, "
    f"{len(parser.ids)} ids, {parser.images} images with alt text"
)
