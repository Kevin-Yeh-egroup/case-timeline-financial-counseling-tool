# Case Timeline Financial Counseling Tool

Public-safe static web tool for Taiwan social workers, financial-health counselors, and helping professionals to organize case timelines, decision nodes, and six life-history domains: residence/migration, employment/education, relationship/family, illness/health, social-resource use, and major financial events.

## Scope

- Static frontend with optional Vercel API routes for file extraction and AI draft analysis.
- Without `OPENAI_API_KEY`, analysis falls back to browser-local semantic rules.
- With `OPENAI_API_KEY`, `/api/analyze` sends the submitted text to OpenAI Responses API and returns structured draft events/decisions.
- `/api/extract-file` extracts readable text from DOCX, XLSX, PDF, text, CSV, and Markdown files without saving the file.
- Browser-local state through `localStorage`.
- Excel download is generated in the browser as `.xlsx`.
- Public prototype should use sample data only unless the responsible institution explicitly approves real-case handling.
- Review-stage noindex controls are intentionally enabled.
- Version `v0.3` adds AI import, file upload, voice input, and a social-worker confirmation queue before events enter the life timeline.

## Safety Boundaries

This tool does not provide:

- investment, insurance, lending, or financial product recommendations;
- legal advice or legal outcome predictions;
- formal social-work assessment conclusions;
- automated risk scoring or creditworthiness prediction.

Sensitive real-case use should remain inside the responsible institution's privacy, supervision, and record-keeping rules.

## Optional AI Configuration

- `OPENAI_API_KEY`: enables structured AI analysis.
- `OPENAI_MODEL`: optional model override; default is `gpt-5-mini`.

The AI import flow creates editable drafts only. A social worker or helping professional must confirm, edit, or discard each draft before it is added to the timeline or decision cards.

## Files

- `index.html`: app shell
- `styles.css`: responsive interface styling
- `app.js`: timeline, chart, decision-card, AI import draft queue, safety-check, and XLSX export logic
- `api/analyze.js`: optional OpenAI structured analysis endpoint
- `api/extract-file.js`: optional file text-extraction endpoint
- `robots.txt`: review-stage search blocking hint
- `vercel.json`: Vercel `X-Robots-Tag` noindex header
- `RESEARCH_NOTES.md`: source-backed synthesis without republishing transcripts
