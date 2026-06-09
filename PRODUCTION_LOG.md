# Production Log

## Artifact

- Name: Case Timeline Financial Counseling Tool
- Local package: `publish-ready/case-timeline-financial-counseling-tool`
- GitHub repo: `https://github.com/Kevin-Yeh-egroup/case-timeline-financial-counseling-tool`
- Repo visibility: public
- Production branch: `main`
- Vercel scope: `egroup-task3s-projects`
- Vercel project: `case-timeline-financial-counseling-tool`
- Vercel project ID: `prj_5vg0uJ8VbfoUJslBxwiWiL84JShV`
- Vercel org ID: `team_lOk9yHNRxLRBcdrU9DATWODG`
- Stable public URL: `https://case-timeline-financial-counseling.vercel.app/`

## Initial Production Deployment

- Date: 2026-06-09
- Deployment ID: `dpl_GkfmP9HzhJpJy24VGqvNSJUzKsSR`
- Deployment URL: `https://case-timeline-financial-counseling-tool-aalimnij7.vercel.app`
- Aliases:
  - `https://case-timeline-financial-counseling.vercel.app`
  - `https://case-timeline-financial-counseling-tool-egroup-task3s-projects.vercel.app`
- Target: production
- Status: Ready
- Source commit at initial deploy: `2eb3e1d0f682609ccaa9e9923777c2fa6b8dfeb1`

## Verification

- `curl -I -L https://case-timeline-financial-counseling.vercel.app/`: `200 OK`
- Header: `X-Robots-Tag: noindex, nofollow, noarchive`
- HTML meta robots: `noindex,nofollow,noarchive`
- `robots.txt`: `User-agent: *` and `Disallow: /`
- Browser desktop check:
  - title and H1 render as `個案時間軸整理工具`
  - sample metrics render as events `3`, decisions `2`, money events `1`, sensitive `1`, pending `1`
  - timeline cells render and decision cards render
  - no console errors observed
- Browser mobile check:
  - whole page has no horizontal overflow
  - timeline uses internal horizontal scroll
  - Excel download button remains visible
- Excel export probe:
  - MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - event count: `3`
  - decision count: `2`
  - Blob size: `18226`

## Safety Notes

- This is a public review-stage deployment.
- Noindex controls reduce search indexing; they are not access control.
- The prototype contains sample data only and should not receive real case data on this public URL.

## v0.2 Six-History Update

- Date: 2026-06-09
- Application update commit: `9459b7efcc8c9e17870ee5b8c76c12dc87ef63e8`
- Deployment verified before this log entry was committed: `dpl_99x5fQFRWoWdKK2kNuDCqQ8PnGRn`
- Stable public URL: `https://case-timeline-financial-counseling.vercel.app/`
- Update summary:
  - Changed timeline lanes to residence/migration, employment/education, relationship/family, illness/health, social-resource use, and major financial events.
  - Added context-tab history interpretation prompts.
  - Added event `impact` and `unknowns` fields.
  - Added Excel export sheets for six-history interpretation and research-summary notes.
  - Added `RESEARCH_NOTES.md` with source-backed synthesis and no republished transcripts.
- Production browser verification:
  - default metrics: events `6`, decisions `3`, history coverage `6/6`
  - context tab: `6` history guide cards and `10` Taiwan context rows
  - dummy event add flow: event count updated to `7`
  - Excel export probe: sheet count `7`, history guides `6`, research rows `4`
  - mobile check: no whole-page horizontal overflow; timeline and tabs use internal horizontal scroll
  - console errors: none observed

Each deployment creates a new Vercel deployment ID. Use `vercel inspect https://case-timeline-financial-counseling.vercel.app --scope egroup-task3s-projects` to confirm the current deployment behind the stable alias.

## v0.3 AI Import Drafts

- Date: 2026-06-09
- Update summary:
  - Added an AI import workspace for text, file upload, and browser voice input.
  - Added a social-worker review queue: imported material becomes editable drafts first, then requires confirmation before entering the life timeline or decision cards.
  - Added optional Vercel API routes for DOCX/XLSX/PDF text extraction and OpenAI structured analysis.
  - Kept browser-local fallback rules when `OPENAI_API_KEY` is not configured.
  - Added Excel export support for a `待確認草稿` sheet.
- Verification status: pending final production deployment and browser check.
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - API mock without `OPENAI_API_KEY`: `/api/analyze` returned `local-fallback` with `Cache-Control: no-store`.
  - API mock text extraction: `/api/extract-file` returned plain text.
  - Minimal DOCX/XLSX ZIP extraction test: DOCX and XLSX text extraction passed.
  - Browser desktop flow: text input generated `3` drafts; confirming the first draft changed events from `6` to `7` and drafts from `3` to `2`.
  - Export probe after confirmation: sheet count `8`, draft count `2`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Browser mobile width `390px`: no whole-page horizontal overflow; AI tab remained usable.
