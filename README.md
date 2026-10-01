# Himanshu Bisht — Personal Portfolio

Recruiter-focused static portfolio covering software engineering, backend systems, AI applications, data engineering, distributed systems, and cloud-native engineering.

## What the site presents

- Selected engineering systems with source-repository links.
- Backend, AI, data, distributed-systems, and cloud engineering focus areas.
- Contact and professional profile links.
- Project claims intended to remain traceable to repository evidence.

## Local development

The site is static HTML/CSS/JavaScript.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Validation

Run the same checks used by Portfolio CI:

```bash
python scripts/verify_site.py
node --check script.js
```

The verifier checks HTML/navigation requirements; JavaScript syntax is checked independently.

## Deployment

The site is designed for GitHub Pages and can also be served by other static hosting providers.

Repository deployment is validated through the GitHub Pages workflow. Do not treat a successful static build as evidence that external links, third-party services, or production analytics are operational.

## Engineering hygiene

- Keep repository-local links stable.
- Preserve accessibility and navigation checks.
- Keep JavaScript free of syntax errors.
- Keep project claims tied to source repositories or reproducible evidence.
- Do not add credentials or private configuration to the static bundle.

## Review path

Start with `index.html`, `styles.css`, `script.js`, and [verification](scripts/verify_site.py). Check project links when repository names or paths change.

## License

MIT
