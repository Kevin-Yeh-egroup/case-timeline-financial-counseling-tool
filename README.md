# Case Timeline Financial Counseling Tool

Public-safe static web tool for Taiwan social workers, financial-health counselors, and helping professionals to organize case timelines, decision nodes, and context-aware financial events.

## Scope

- Static frontend only.
- No backend and no network submission of case data.
- Browser-local state through `localStorage`.
- Excel download is generated in the browser as `.xlsx`.
- Public prototype uses sample data only.
- Review-stage noindex controls are intentionally enabled.

## Safety Boundaries

This tool does not provide:

- investment, insurance, lending, or financial product recommendations;
- legal advice or legal outcome predictions;
- formal social-work assessment conclusions;
- automated risk scoring or creditworthiness prediction.

Sensitive real-case use should remain inside the responsible institution's privacy, supervision, and record-keeping rules.

## Files

- `index.html`: app shell
- `styles.css`: responsive interface styling
- `app.js`: timeline, chart, decision-card, safety-check, and XLSX export logic
- `robots.txt`: review-stage search blocking hint
- `vercel.json`: Vercel `X-Robots-Tag` noindex header

