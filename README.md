# Himanshu Bisht — Engineering Portfolio

Recruiter-facing static portfolio for backend engineering, AI systems, data engineering, distributed systems, and cloud-native development.

## Site scope

The site presents selected projects, engineering focus areas, professional links, and repository-backed claims. Project descriptions are intended to remain traceable to the corresponding GitHub repositories.

## Local development

The site is plain HTML/CSS/JavaScript.

```bash
git clone https://github.com/AloneRider-pixel/AloneRider-pixel.github.io.git
cd AloneRider-pixel.github.io
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Validation

```bash
python scripts/verify_site.py
node --check script.js
```

Portfolio CI validates HTML/navigation requirements and JavaScript syntax. GitHub Pages deployment is also covered by the repository workflow.

## Repository structure

```text
index.html
styles.css
script.js
favicon.svg
robots.txt
sitemap.xml
scripts/verify_site.py
docs/
.github/workflows/
```

## Engineering hygiene

- Keep project links aligned with current repository paths.
- Preserve keyboard accessibility, navigation checks, and semantic structure.
- Keep credentials and private configuration out of the static bundle.
- Treat external links and third-party services as runtime dependencies, not CI guarantees.

## Evidence standard

Portfolio claims should map to source repositories or reproducible evidence. Do not present deterministic fixtures, design targets, or synthetic validation results as production outcomes.

## Documentation

See [evidence index](docs/evidence-index.md) and [site verifier](scripts/verify_site.py).

## License

MIT
