# Case Timeline Financial Counseling Tool

Public-safe static web tool for Taiwan social workers, financial-health counselors, and helping professionals to organize case timelines, decision nodes, household members/cohabitants, and six life-history domains: residence/migration, employment/education, relationship/family, illness/health, social-resource use, and major financial events.

## Scope

- Static frontend with optional Vercel API routes for file extraction and AI draft analysis.
- Without `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `OPENAI_API_KEY`, analysis falls back to browser-local semantic rules.
- With `GEMINI_API_KEY` or `GOOGLE_API_KEY`, `/api/analyze` sends the submitted text to Gemini structured output analysis, using Gemini 2.5 Flash by default.
- With `OPENAI_API_KEY`, `/api/analyze` can also use OpenAI Responses API as a fallback or provider override and return structured draft events/decisions.
- `/api/extract-file` extracts readable text from DOCX, XLSX, PDF, text, CSV, and Markdown files without saving the file.
- Browser-local state through `localStorage`.
- Excel download is generated in the browser as `.xlsx`.
- Timeline image downloads are generated in the browser as SVG and PNG for reports, presentations, and review notes.
- Real-case handling should follow the responsible institution's privacy, supervision, and record-keeping rules.
- Review-stage noindex controls are intentionally enabled.
- Version `v0.35` keeps visible record/update times and download filename dates on Taipei time.
- Version `v0.32` moves downloads to a `下載檔案` menu beside sharing checks, moves sample-package actions above the timeline event list, combines AI import/draft review with event data under `資料整理`, and renames decision surfaces to `決策／處遇`.
- Version `v0.31` changes the editable draft removal action from `略過` to `不採用` so the review decision reads more clearly.
- Version `v0.30` changes the first-screen saved-record area into search-only access for existing records; save and save-as controls are no longer shown there.
- Version `v0.29` removes the visible manual workbench opener from the first screen; users enter the timeline/editing workspace only after generating a life-context map or opening a saved record.
- Version `v0.28` keeps the first screen to quick start and saved records, adds browser-local saved-record management, moves the full timeline/editing workspace to a second layer, and renames draft review surfaces to `修改編輯`.
- Version `v0.27` reduces first-screen anxiety: the visible fake-data notice was removed, secondary tools are tucked under `更多工具`, the quick-paste flow shows a loading state, and post-generation guidance explains how to adjust AI timeline drafts.
- Version `v0.26` simplifies first use around quick generation of the first life-context map, shows AI drafts as a distinct timeline preview layer before archiving, collapses detailed draft fields by default, and adds SVG/PNG timeline image downloads.
- Version `v0.25` adds Gemini 2.5 Flash structured semantic analysis for user text import, while preserving OpenAI and browser-local fallback paths.
- Version `v0.24` adds a visible but unobtrusive test-version badge with the current update time so testers can identify which build they are reviewing.
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

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: enables Gemini structured semantic analysis.
- `GEMINI_SEMANTIC_MODEL` or `GEMINI_MODEL`: optional Gemini model override; default is `gemini-2.5-flash`.
- `OPENAI_API_KEY`: enables OpenAI structured analysis fallback or provider override.
- `OPENAI_MODEL`: optional OpenAI model override; default is `gpt-5-mini`.
- `AI_ANALYSIS_PROVIDER`: optional provider preference; use `gemini` or `openai`. If unset, Gemini is preferred when configured.

The AI import flow creates editable drafts only. A social worker or helping professional must confirm people, facts, time, place, objects, and the six-history classification before each draft is added to the timeline or decision cards.

## Files

- `index.html`: app shell
- `styles.css`: responsive interface styling
- `assets/case-timeline-warm-desk-v1.png`: generated warm desk/timeline masthead asset for the app shell
- `app.js`: relationship timeline, household-member filters, in-list event editing, continuous period-event rendering, decision-card, AI import draft queue, sharing checklist, and XLSX export logic
- `api/analyze.js`: optional Gemini/OpenAI structured analysis endpoint with browser-local fallback
- `api/extract-file.js`: optional file text-extraction endpoint
- `robots.txt`: review-stage search blocking hint
- `vercel.json`: Vercel `X-Robots-Tag` noindex header
- `RESEARCH_NOTES.md`: source-backed synthesis without republishing transcripts
- `WIKI_CURATOR_P0_P1_CANDIDATE.md`: project-local reusable record for the P0/P1 onboarding and AI-draft review pattern
- `test-fixtures/`: public-safe fake multi-year and multi-actor intake files for testing text/file import, draft splitting, and timeline draft generation
