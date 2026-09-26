from html.parser import HTMLParser
from pathlib import Path

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.meta = {}
        self.ids = set()
        self.links = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'title':
            self.in_title = True
        if tag == 'meta' and attrs.get('name') in {'description','viewport'}:
            self.meta[attrs['name']] = attrs.get('content','')
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'img' and not attrs.get('alt'):
            raise SystemExit('Site validation failed: image is missing alt text')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data.strip()

parser = SiteParser()
parser.feed(Path('index.html').read_text(encoding='utf-8'))
required_ids = {'top','work','experience','stack','contact','year'}
missing_ids = required_ids - parser.ids
if missing_ids:
    raise SystemExit('Site validation failed: missing ids: ' + ', '.join(sorted(missing_ids)))
if not parser.title:
    raise SystemExit('Site validation failed: missing title')
if len(parser.meta.get('description','')) < 40:
    raise SystemExit('Site validation failed: meta description is missing or too short')
if not any('github.com/AloneRider-pixel' in href for href in parser.links):
    raise SystemExit('Site validation failed: GitHub link missing')
if not any('linkedin.com' in href for href in parser.links):
    raise SystemExit('Site validation failed: LinkedIn link missing')
print(f'site verification passed: {len(parser.links)} links, {len(parser.ids)} ids')