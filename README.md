# Case Timeline Financial Counseling Tool

Public-safe static web tool for Taiwan social workers, financial-health counselors, and helping professionals to organize case timelines, decision nodes, household members/cohabitants, and six life-history domains: residence/migration, employment/education, relationship/family, illness/health, social-resource use, and major financial events.

## Scope

- Static frontend with optional Vercel API routes for file extraction and AI draft analysis.
- Without `OPENAI_API_KEY`, analysis falls back to browser-local semantic rules.
- With `OPENAI_API_KEY`, `/api/analyze` sends the submitted text to OpenAI Responses API and returns structured draft events/decisions.
- `/api/extract-file` extracts readable text from DOCX, XLSX, PDF, text, CSV, and Markdown files without saving the file.
- Browser-local state through `localStorage`.
- Excel download is generated in the browser as `.xlsx`.
- Public prototype should use sample data only unless the responsible institution explicitly approves real-case handling.
- Review-stage noindex controls are intentionally enabled.
- Version `v0.23` merges the AI text-entry area so pasted text, extracted file text, and speech-to-text content accumulate in one reviewable field before analysis.
- Version `v0.22` improves timeline reading: all-case overview can show every event, year and category headers stay visible while scrolling, same-category events are packed into fewer non-overlapping rows, and linked decision nodes appear directly on the timeline.
- Version `v0.21` strengthened AI import review: mixed multi-person text is split into separate drafts, draft cards show people/event/time/place-object/classification review status, health and financial classification rules are tighter, and warning drafts ask for confirmation before archiving.

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

The AI import flow creates editable drafts only. A social worker or helping professional must confirm people, facts, time, place, objects, and the six-history classification before each draft is added to the timeline or decision cards.

## Files

- `index.html`: app shell
- `styles.css`: responsive interface styling
- `assets/case-timeline-warm-desk-v1.png`: generated warm desk/timeline masthead asset for the app shell
- `app.js`: relationship timeline, household-member filters, in-list event editing, continuous period-event rendering, decision-card, AI import draft queue, sharing checklist, and XLSX export logic
- `api/analyze.js`: optional OpenAI structured analysis endpoint
- `api/extract-file.js`: optional file text-extraction endpoint
- `robots.txt`: review-stage search blocking hint
- `vercel.json`: Vercel `X-Robots-Tag` noindex header
- `RESEARCH_NOTES.md`: source-backed synthesis without republishing transcripts
- `WIKI_CURATOR_P0_P1_CANDIDATE.md`: project-local reusable record for the P0/P1 onboarding and AI-draft review pattern
- `test-fixtures/`: public-safe fake multi-year and multi-actor intake files for testing text/file import, draft splitting, and timeline draft generation
