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
  - Changed the timeline structure to residence/migration, employment/education, relationship/family, illness/health, social-resource use, and major financial events.
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
- Production deployment: `dpl_66baAd4rfTj1eQbQ5X44wCsdytRV`
- Stable public URL: `https://case-timeline-financial-counseling.vercel.app/`
- Production verification:
  - stable URL returned `200 OK` with `X-Robots-Tag: noindex, nofollow, noarchive`
  - `robots.txt` returned `User-agent: *` and `Disallow: /`
  - `/api/analyze` returned `local-fallback` and `Cache-Control: no-store` when `OPENAI_API_KEY` was not configured
  - `/api/extract-file` returned text extraction and `Cache-Control: no-store`
  - browser flow confirmed drafts remain in review before being added to the timeline
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - API mock without `OPENAI_API_KEY`: `/api/analyze` returned `local-fallback` with `Cache-Control: no-store`.
  - API mock text extraction: `/api/extract-file` returned plain text.
  - Minimal DOCX/XLSX ZIP extraction test: DOCX and XLSX text extraction passed.
  - Browser desktop flow: text input generated `3` drafts; confirming the first draft changed events from `6` to `7` and drafts from `3` to `2`.
  - Export probe after confirmation: sheet count `8`, draft count `2`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Browser mobile width `390px`: no whole-page horizontal overflow; AI tab remained usable.

## v0.4 Taiwan Wording Pass

- Date: 2026-06-09
- Update summary:
  - Replaced reader-facing `泳道` with `歷程`.
  - Renamed awkward history labels to `就業與就學史`, `感情與家庭史`, and `疾病與身心健康史`.
  - Replaced interface wording such as `production`, `本機語意規則`, `可選選項`, `脈絡化解讀`, and `當事人說法` with Taiwan social-work-facing wording.
  - Added migration mapping so older saved lane names are normalized to the new wording.
- Local predeployment verification:
  - `rg` wording scan found awkward terms only in migration aliases and this log entry, not in reader-facing UI.
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - API mock without `OPENAI_API_KEY`: `/api/analyze` returned `local-fallback`, `Cache-Control: no-store`, and the revised warning text.
  - Browser desktop wording check: timeline head `歷程`; AI heading `AI 輔助匯入`; no visible `泳道`, `production`, `可選選項`, `脈絡化解讀`, `當事人說法`, or `疾病身心史`.
  - Browser mobile width `390px`: no whole-page horizontal overflow; long history label remained visible.

## v0.5 Related People / Network Member Update

- Date: 2026-06-09
- Update summary:
  - Added a `關係人` workspace for roles beyond the client, such as children, caregivers, landlords, creditors, social workers, and service windows.
  - Added default public-safe sample related people using roles/call-signs instead of real names.
  - Added related-person linking to event forms, decision forms, event lists, decision cards, and Excel export.
  - Added a dedicated `關係人` Excel sheet.
  - Kept `案主本人` as the required default actor while counting other related people separately.
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser flow using dummy data: added `房東`, linked it to a new event, linked it to a new decision card, and confirmed both rendered the related person.
  - Export probe after related-person flow: events `7`, decisions `4`, related people `6`, sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Mobile width `390px`: no whole-page horizontal overflow.
  - Console errors: none observed.

## v0.6 Household Members First

- Date: 2026-06-09
- Update summary:
  - Refocused the people layer from broad `關係人` to `同住人口`.
  - Replaced default sample people with household/cohabiting roles: client, child, primary caregiver, cohabiting relative, and spouse/partner.
  - Removed landlord, creditor, and service-window roles from the primary people workflow for now.
  - Updated event and decision labels from `相關關係人` to `相關同住人口`.
  - Renamed the Excel sheet and columns to `同住人口`.
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser flow using dummy data: added `同住哥哥`, linked it to a new event, linked it to a new decision card, and confirmed both rendered the household member.
  - Wording scan: current UI did not show broad `關係人`, `利益關係人`, or `房東` wording.
  - Export probe after household-member flow: events `7`, decisions `4`, household members `6`, sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Mobile width `390px`: no whole-page horizontal overflow.
  - Console errors: none observed.

## v0.7 Relationship Timeline Controls

- Date: 2026-06-10
- Update summary:
  - Added timeline controls for primary person, comparison people, shared/related-event matching, history filtering, and optional Taiwan system-background reference.
  - Replaced the `歷程分布` bar chart with a classified event list that stays centered on the selected person and selected relationship view.
  - Made timeline event pills clickable so workers can review an event summary and enter the event-edit form.
  - Added event editing through the existing event form while preserving the manual confirmation workflow.
  - Added a separate Taiwan system-background reference row in the visual timeline, using `P001`-style reference IDs rather than case-event IDs.
  - Fixed the visual timeline grid so empty years retain visible table borders.
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser flow using dummy data: reset sample, selected `案主本人`, added `子女` as comparison, confirmed shared-event count changed from `6` to `3`.
  - Browser flow clicked `E006 信用卡或借貸付款中斷`, opened the event summary, entered edit mode, saved an updated title, and confirmed the timeline reflected the edit.
  - Taiwan system-background checkbox: visible reference pills changed from `10` to `0`; export probe `policyTimelineCount` changed to `0`.
  - Export probe after relationship filter: sheet count `9`, selected actors `2`, filtered events `1`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Mobile width `390px`: no whole-page horizontal overflow; timeline controls collapsed to one column.
  - Console errors: none observed.
- Production deployment: pending Kevin approval for external GitHub/Vercel write.

## v0.8 In-List Editing And Period Events

- Date: 2026-06-10
- Update summary:
  - Reworked the event-list interaction so clicking an event expands its summary directly below the event card.
  - Added quick editing inside the event list; workers can save and remain on the timeline without switching tabs.
  - Added event period fields: `開始民國年`, `結束民國年`, and `仍在持續`.
  - Added visual continuation markers for events that span multiple years or continue to the current ROC year.
  - Updated event and draft Excel exports with start/end/ongoing fields and a readable period display.
- Local predeployment verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser flow using dummy data: clicked `E006` from the event list and confirmed the summary expanded in place while the active tab stayed `時間軸`.
  - Quick-edit flow: edited `E006` in the event list, changed it from `民國 110 年至今` to `民國 110-112 年`, saved, and confirmed the same event card remained expanded.
  - Timeline continuation marker: clicked the continuation marker for `E002 工作型態轉為不定時` and confirmed the matching event card expanded in the list.
  - Export probe: version `v0.8-inline-duration`, period events `5`, sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
  - Mobile width `390px`: no whole-page horizontal overflow; in-list quick edit collapsed to one column.
  - Console errors: none observed.
- Production deployment: pending Kevin approval for external GitHub/Vercel write.

## v0.9 Test Package And Human Flow Verification

- Date: 2026-06-10
- Update summary:
  - Added `年` to timeline year headers for ROC/AD display.
  - Strengthened timeline/event-list selection so clicking a visible timeline event preserves page scroll while syncing the active event and inline summary.
  - Separated sample content into a reloadable/deletable `範例測試包`, including migration support for legacy sample events, decisions, and old sample people labels.
  - Removed the native browser confirmation for deleting the sample package because it only removes reloadable fake sample data and keeps user-added records.
  - Added public-safe multi-year fake intake fixtures in TXT, XLSX, and DOCX formats under `test-fixtures/`.
  - Fixed XML numeric entity decoding in the file extraction API so XLSX Chinese text is extracted as normal Traditional Chinese.
  - Tightened local semantic rules so pure `需確認` or `案主說` fragments do not become standalone event drafts without a year or event action.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - File extraction handler direct tests: TXT `plain-text`, XLSX `xlsx`, and DOCX `docx` returned `200`, `Cache-Control: no-store`, normal Chinese text, and multi-year period content.
  - Browser year-header check: first headers rendered as `75年`, `76年`, and `77年`.
  - Timeline click test: after pre-positioning the event in the viewport, clicking `工作型態轉為不定時` synced the timeline and event list; scroll delta remained `0`.
  - Sample package test: after deleting samples, probe showed sample events `0`, sample stakeholders `0`, events `1` (the user-confirmed test draft), stakeholders `1`; after reload, sample events `6` and sample stakeholders `4`.
  - AI text import test used a fake multi-year narrative spanning ROC 92-96, 98-104, and 109-now; generated editable drafts and confirming one draft increased event count to `7` and duration-event count to `1`.
  - File-content import test used `test-fixtures/multi-year-life-context-intake.txt`; generated five event drafts for ROC 98-104, 101-now, 105-107, 108-110, 110-now plus one decision draft.
  - Mobile width around `390px`: no whole-page horizontal overflow; top buttons and `年` headers remained visible.
  - Local static preview note: `/api/analyze` returns unsupported POST on the Python static server, so the browser correctly uses local semantic fallback there.
- GitHub/Vercel production deployment:
  - Commit: `63f9aac Add v0.9 timeline test package flow`.
  - Verification deployment: `dpl_88jH7272GGgmd5Z3r8hKh1V66PzL`, status `Ready`, target `production`.
  - Stable URL: `https://case-timeline-financial-counseling.vercel.app/`.
  - Stable URL verification: root `200`, `app.js` contains `v0.9-test-pack-human-flow`, `robots.txt` returns `Disallow: /`, and `X-Robots-Tag: noindex, nofollow, noarchive` remains active.
  - Production API verification: `/api/extract-file` returned text extraction with `Cache-Control: no-store`; `/api/analyze` returned `local-fallback` because production has no `OPENAI_API_KEY` configured.
