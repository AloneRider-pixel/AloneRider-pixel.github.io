# Himanshu Bisht — Engineering Portfolio

[![Portfolio CI](https://github.com/AloneRider-pixel/AloneRider-pixel.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/AloneRider-pixel/AloneRider-pixel.github.io/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Recruiter-facing static portfolio for backend engineering, AI systems, data engineering, distributed systems, and cloud-native development.

## Site purpose

The site presents selected engineering work and links each project back to its source repository. Project descriptions are intended to remain consistent with repository evidence rather than become a second, drifting source of truth.

## Selected projects

| Project | Focus |
|---|---|
| [Aegis](https://github.com/AloneRider-pixel/aegis) | AI incident response, RAG, controlled remediation |
| [StockSense AI](https://github.com/AloneRider-pixel/stocksense-ai) | Chronological ML evaluation and market intelligence |
| [Cloud Data Platform](https://github.com/AloneRider-pixel/cloud-data-platform) | Ingestion, Airflow, dbt, data quality |
| [ForgeAI](https://github.com/AloneRider-pixel/forgeai) | PR risk analysis and governance |
| [Event-Driven Platform](https://github.com/AloneRider-pixel/event-driven-platform) | Kafka, outbox, idempotency, failure handling |
| [CareerOS](https://github.com/AloneRider-pixel/Ai-job-search) | Evidence-backed job search and outcome learning |
| [Payment Reliability OS](https://github.com/AloneRider-pixel/payment-reliability-os) | Leakage-safe payment-behavior modeling |

## Local development

The portfolio is plain HTML/CSS/JavaScript.

```bash
git clone https://github.com/AloneRider-pixel/AloneRider-pixel.github.io.git
cd AloneRider-pixel.github.io
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Verification

```bash
python scripts/verify_site.py
node --check script.js
```

Portfolio CI validates the site's required structure/navigation and JavaScript syntax. GitHub Pages deployment is handled by the repository workflow.

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

- Keep project links aligned with current repository names and paths.
- Preserve semantic HTML, keyboard accessibility, and navigation checks.
- Keep credentials and private configuration out of the static bundle.
- Treat external links and third-party services as runtime dependencies rather than CI guarantees.

## Evidence standard

Portfolio claims should map to source repositories or reproducible evidence. Deterministic fixtures, design targets, and synthetic validation results should never be described as production outcomes.

Quantitative claims should identify their source, measurement method, environment, denominator/sample count, and producing commit.

## Documentation

- [Evidence index](docs/evidence-index.md)
- [Site verifier](scripts/verify_site.py)

## License

MIT
