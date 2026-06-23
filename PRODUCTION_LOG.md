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

## v0.10 Confirm-Before-Archive Optimization

- Date: 2026-06-16
- Update summary:
  - Added a stronger draft review card before archiving: original evidence, identified people, objects/money/resources, place/window, primary history dimension, related dimensions, extra tags, and warning notes.
  - Tightened classification rules so relationship/family history is reserved for marriage, dating, partner, separation, divorce, and intimate-relationship events; family money support, living-cost support, debt, borrowing, and repayment stay under major financial events.
  - Improved local import splitting for multi-person, multi-year, and multi-amount notes so "case owner", "mother", and "father" events are less likely to merge into one draft.
  - Added editable household/cohabitant records so workers can correct a role or status without deleting and recreating it.
  - Stabilized timeline duration-event positioning by reserving a consistent track slot for each event across years.
  - Expanded XLSX export columns for related history dimensions, extra tags, actor text, place/window, objects/resources, and source evidence.
  - Added `test-fixtures/multi-actor-confirmation-intake.txt` for fake multi-actor confirmation testing.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser human-like verification on `http://127.0.0.1:4176/`: pasted the fake multi-actor intake, generated 6 review drafts, and confirmed one draft increased the event count from `6` to `7`.
  - Draft classification check: case owner low/mid-income status stayed under social-resource use; mother monthly living-cost support and father debt stayed under major financial events; partner separation stayed under relationship/family history.
  - Household-member flow: added `案母`, edited her status to `曾同住`, and confirmed the draft actor checklist included the new household member.
  - Timeline/export check: year headers remained like `75年`; duration markers used event-specific labels with `延續` / `至今`; export probe returned sheet count `9` and non-empty XLSX blob.
  - Mobile width around `390px`: no whole-page horizontal overflow; draft and evidence grids collapsed to one column.
  - Console errors/warnings: none observed.
- GitHub/Vercel deployment:
  - Not performed in this update. Kevin asked to optimize locally; production remains at the previous deployed version until explicit push/deploy approval.

## v0.11 Review Controls For Missing Time And Draft Triage

- Date: 2026-06-16
- Update summary:
  - Changed missing-year events so they remain in the event list and Excel but do not appear on the visual timeline until a start ROC year is confirmed.
  - Added a visible `待補時間` note on draft cards and a `未放入視覺時間軸` note in the event list for archived events without confirmed time.
  - Added draft controls to split an event draft into two editable drafts or merge it with the next event draft.
  - Added one-card actor handling: unlinked people such as `案母` or `案父` can be added as household members or linked to an existing household member from the draft card.
  - Added export-probe support for missing-time event counts and kept blank AD-year cells blank instead of showing a misleading year.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser human-like verification on `http://127.0.0.1:4177/`: imported fake multi-actor text, confirmed the no-year mother living-cost draft showed `待補時間`, added `案母` as a household member from the draft card, and archived the draft.
  - Missing-time behavior check: the archived mother living-cost event appeared in the event list with `未放入視覺時間軸`, did not appear in the visual timeline chart, and export probe reported `missingTimeEventCount = 1`.
  - Draft triage check: split the father debt draft into two editable event drafts, then merged it back with the next event draft while preserving source text.
  - Export probe after missing-time archive: sheet count `9`, non-empty XLSX blob.
  - Mobile width around `390px`: no whole-page horizontal overflow; draft action buttons wrap.
  - Console errors/warnings: none observed.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains unchanged until Kevin explicitly asks for push/deploy.

## v0.12 Warm Interface Pass

- Date: 2026-06-16
- Update summary:
  - Added a project-local generated raster masthead asset at `assets/case-timeline-warm-desk-v1.png`.
  - Shifted the interface from a colder dashboard feel toward a warm professional workbench: paper-like surface, soft daylight masthead, muted teal primary actions, and low-saturation history colors.
  - Kept the tool as a working app rather than a landing page: timeline, event list, draft review, and Excel controls remain the first-screen workflow.
  - Avoided readable fake documents, money imagery, bank-card/debt-ad cues, hospital/clinic cues, and identifiable people in the generated image.
  - Fixed related-history normalization so empty related-history input no longer defaults to `重大財務事件`.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4178/`: masthead background asset loaded, H1 rendered, sample metrics rendered, no whole-page horizontal overflow, and console warnings/errors were empty.
  - Browser interaction check: clicked timeline event `E001`; right-side event list selected the event and expanded its summary.
  - Related-history fix check: after reloading the sample test pack, `E001` no longer displayed `相關歷程重大財務事件`.
  - Browser mobile width around `390px`: no whole-page horizontal overflow; tabs and timeline use internal scroll; top actions wrap and remain visible; console warnings/errors were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains unchanged until Kevin explicitly asks for push/deploy.

## v0.13 Continuous Period Timeline And Clear Add Actions

- Date: 2026-06-16
- Update summary:
  - Changed multi-year and ongoing events from repeated yearly continuation markers into one continuous clickable period bar spanning the event's start and end years.
  - Kept single-year events as event cards at the event year while retaining the year grid for visual reference.
  - Reworded timeline people controls from `比較人物` to `加入關聯人物` / `已加入人物` so the feature reads as relationship viewing rather than person comparison.
  - Added direct `新增事件` and `新增同住人口` buttons on the timeline event-list panel so workers do not need to infer that the `事件資料` or `同住人口` tabs contain creation forms.
- Verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: rendered `5` continuous `.period-bar` elements, `0` old `.duration-marker` elements, and the `工作型態轉為不定時` event rendered as one 97-103 period bar.
  - Wording check: reader-facing `比較人物` wording no longer appears; timeline summary now reads `加入關聯人物`.
  - Quick-add check: clicking `新增事件` switched to `事件資料`, focused `開始民國年`, and showed the `新增事件` form; clicking `新增同住人口` switched to `同住人口`, focused `稱謂或角色`, and showed the `新增同住人口` form.
  - Browser mobile width around `390px`: no whole-page horizontal overflow; tabs and timeline use internal scroll; quick-add buttons remain visible; console warnings/errors were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.12-warm-interface` until Kevin explicitly asks for push/deploy.

## v0.14 Confirmation Wording And No Sensitivity Presentation

- Date: 2026-06-16
- Update summary:
  - Removed per-event `敏感度` presentation from the main workflow, including summary metrics, event forms, inline quick edit, AI draft cards, event tables, household-member cards, and timeline visual emphasis.
  - Changed event-table and Excel wording from `下一步` to `建議多確認`.
  - Kept internal compatibility for existing sample/local records that still carry a `sensitivity` value, but no longer asks the worker to classify each event with that field in the main workflow.
  - Kept sharing-related judgment in the dedicated `分享前檢查` area, where social workers can decide what needs masking, consent, legal basis, or supervision before sharing.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: summary metrics no longer include `高度敏感`; visible page text does not include `敏感度`; timeline renders `5` continuous `.period-bar` elements and `0` `.duration-marker` elements.
  - Event data tab: table headers are `ID`, `期間`, `歷程`, `事件`, `建議多確認`; no sensitivity select or `下一步` wording appears.
  - Household-member tab: no sensitivity select and no sensitivity badges appear.
  - Timeline quick-edit flow: opened `E002`, entered inline editing, confirmed the inline form has no sensitivity field, saved successfully, and saw no console errors or warnings.
  - AI import flow: pasted fake multi-year text and generated `4` editable drafts; draft cards retained `主歷程面向` classification confirmation and did not show sensitivity fields; test drafts were cleared afterward.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41211` bytes; visible page text did not include `敏感度` or `下一步`.
  - Mobile width around `390px`: no whole-page horizontal overflow; visible metrics no longer include sensitivity wording; console errors/warnings were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.12-warm-interface` until Kevin explicitly asks for push/deploy.

## v0.15 Clarification Cards For Suggested Follow-Up

- Date: 2026-06-16
- Update summary:
  - Reworked `建議多確認` from a plain table value into an event-detail clarification aid.
  - Added `可多了解` wording for the event details worth clarifying, and `協助判斷` wording for how those details support social-work judgment.
  - Added clarification cards in the timeline event summary and compact clarification cards in the event table.
  - Made `建議多確認` editable from the main event form, inline quick edit, and AI draft cards.
  - Migrated old sample/local phrases such as `確認搬遷資料...`, `補收入區間...`, and `納入下一次討論` into the new `可多了解...` tone without requiring users to reset the sample pack.
  - Kept the wording as clarification support rather than conclusion, score, order, financial advice, or legal advice.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: old follow-up phrases no longer appeared; timeline event summary showed `建議多確認`, `可多了解`, and `協助判斷`; timeline still rendered `5` continuous `.period-bar` elements and `0` `.duration-marker` elements.
  - Inline quick-edit flow: opened `E002`, edited the `建議多確認` textarea, saved successfully, and confirmed the event summary updated without console errors or warnings.
  - AI import flow: generated editable drafts from fake multi-year text; event draft cards included `建議多確認` fields whose values used `可多了解...`; test drafts were cleared afterward.
  - Event data tab: table headers remain `ID`, `期間`, `歷程`, `事件`, `建議多確認`; the table shows `6` compact clarification cards; no `敏感度` wording appears.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41505` bytes.
  - Mobile width around `390px`: no whole-page horizontal overflow; visible clarification cards remained readable; console errors/warnings were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.12-warm-interface` until Kevin explicitly asks for push/deploy.

## v0.16 Simplified Clarification Label

- Date: 2026-06-16
- Update summary:
  - Kept `建議多確認` as the only visible clarification label because there is not currently a second status category.
  - Removed the redundant `可多了解` sub-label from event summary cards, compact event-table cards, form defaults, and editable clarification text.
  - Cleaned existing stored/sample values that start with `可多了解`, `可補充了解`, or `協助判斷` so the visible content becomes the actual detail to confirm.
  - Kept `協助判斷` only as a supporting explanation in the expanded event summary, not as a status.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: visible page text no longer included `可多了解`; `建議多確認` remained visible; expanded event summary kept `協助判斷` as supporting explanation.
  - Inline quick-edit flow: opened `E002`, edited the `建議多確認` textarea without the `可多了解` prefix, saved successfully, and confirmed the event summary updated without console errors or warnings.
  - AI import flow: generated editable drafts from fake multi-year text; draft `建議多確認` values did not include `可多了解`; test drafts were cleared afterward.
  - Event data tab: table headers remain `ID`, `期間`, `歷程`, `事件`, `建議多確認`; the compact cards did not include `可多了解` or `協助判斷`.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41433` bytes.
  - Mobile width around `390px`: no whole-page horizontal overflow; visible page text did not include `可多了解`; console errors/warnings were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.12-warm-interface` until Kevin explicitly asks for push/deploy.

## v0.17 Explicit Event People Labels

- Date: 2026-06-16
- Update summary:
  - Added an explicit `事件人物` line to each timeline event-list card so workers can immediately see who the event is about.
  - Changed expanded event summaries from `同住人口` to `事件人物` for the event-specific people view.
  - Changed event-table detail rows from `同住人口` to `事件人物`.
  - Changed the event timeline Excel column from `相關同住人口` to `事件人物（同住人口）`, preserving the current people source while making the event-level meaning clearer.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: the timeline event list rendered `6` event cards and all `6` included the `事件人物` label.
  - Event-list card check: first sample card showed `事件人物` with `案主本人` and `主要照顧者`.
  - Expanded summary check: opened `E003`; summary showed `事件人物` with `案主本人`, `子女`, and `主要照顧者`, and no longer used `同住人口` as the event-specific label.
  - Event data tab: table content showed `事件人物`, no longer showed `同住人口` in the event rows, and rendered `6` rows.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41445` bytes.
  - Mobile width around `390px`: no whole-page horizontal overflow; `6` event-people rows remained visible; timeline still rendered `5` period bars and `0` old duration markers.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.12-warm-interface` until Kevin explicitly asks for push/deploy.

## v0.18 Event People Table Column

- Date: 2026-06-16
- Update summary:
  - Moved `事件人物` out of the event-detail text in the event data table.
  - Added `事件人物` as a standalone table column between `ID` and `期間`.
  - Kept the same chip-based person display so multi-person events remain scannable.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Browser desktop check on `http://127.0.0.1:4179/`: event data table headers rendered as `ID`, `事件人物`, `期間`, `歷程`, `事件`, `建議多確認`.
  - First event row check: row cells rendered `E001`, then `事件人物` with `案主本人` and `主要照顧者`, then `民國 85 年`.
  - Table duplication check: `事件` detail cell no longer repeated `事件人物`.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41445` bytes.
  - Mobile width around `390px`: no whole-page horizontal overflow; timeline event cards still showed `6` event-people rows and `5` period bars.
- GitHub/Vercel deployment:
  - Performed after local verification on commit `4e5ce58`.
  - Production deployment `dpl_3nkMA2bjz2r23TUjDtWHnWsPqJ3W` was verified at `https://case-timeline-financial-counseling.vercel.app/`.

## v0.19 Layered People Timeline

- Date: 2026-06-18
- Update summary:
  - Changed the multi-person timeline default from intersection-style matching to `一起呈現`.
  - Migrated old saved `shared` / `related` timeline settings into the new `layered` mode so existing browser state no longer hides events after adding a person.
  - Kept the main person's events and added people's events visible together, while marking each event as `主軸人物`, `加入人物`, or `共同事件`.
  - Added distinct visual styles for the three relation types in the visual timeline and timeline event list.
  - Added relation-count fields to the export probe: `primaryAxisEventCount`, `compareAxisEventCount`, and `sharedAxisEventCount`.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Local preview: started `http://127.0.0.1:4179/` with a static Python server.
  - Browser flow using sample data: selected `案主本人` as primary and added `子女`; the timeline stayed in `一起呈現`, kept `6` filtered events visible, and showed `3` `主軸人物` events plus `3` `共同事件` events.
  - Browser flow using sample data: selected `主要照顧者` as primary and added `子女`; the event list showed all three styles at once: `2` `主軸人物`, `2` `加入人物`, and `1` `共同事件`.
  - Export probe: sheet count `9`, MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, non-empty XLSX blob `41439` bytes, and relation counts matched the visible event-list classes.
  - Mobile width around `390px`: no whole-page horizontal overflow; the event list still showed `主軸人物`, `加入人物`, and `共同事件` labels; console errors/warnings were empty.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.18-event-people-column` until Kevin explicitly asks for push/deploy.

## v0.20 P0 Onboarding And Timeline Focus

- Date: 2026-06-23
- Update summary:
  - Added a first-use start guide above the metrics with the practical flow `匯入或新增資料 -> 確認人事時地物 -> 加入時間軸`.
  - Added guide buttons for AI import, direct event creation, and household-member creation.
  - Connected event-list cards to the visual timeline: selecting a list item now preserves the page position, scrolls the timeline to the matching event, and briefly highlights it.
  - Added locator attributes to visual timeline events for targeted event-list-to-timeline syncing.
  - Strengthened multi-year and ongoing event bars with clearer continuous period styling and `時間段` / `持續至今` captions.
  - Added a visible household-member edit hint so workers know records can be edited instead of deleted and rebuilt.
  - Added export-probe fields for the start guide and timeline locator count.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Local preview: started `http://127.0.0.1:4181/` with a static Python server and confirmed HTTP `200`.
  - UTF-8 HTTP content check: confirmed the start guide, visual timeline heading, and guide action buttons are present.
  - Static P0 behavior check: confirmed guide buttons are wired, quick-add buttons are wired, event-list-to-timeline focus code exists, visual events have timeline locators, period-bar styling exists, and mobile guide breakpoints are present.
  - Browser-use note: in-app browser navigation to the local URL was blocked by Browser Use URL policy and showed a crashed page, so full human-like browser interaction could not be completed in this turn.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.18-event-people-column` until Kevin explicitly asks for push/deploy.

## v0.21 P1 Draft Review And Splitting

- Date: 2026-06-23
- Update summary:
  - Added a draft review strip showing whether `人物`, `事件`, `時間`, `時地物`, and `分類` are ready before archiving.
  - Strengthened local semantic splitting so mixed text with case owner, mother, father, years, amounts, and welfare status becomes separate event drafts.
  - Added frontend post-processing for OpenAI/API drafts so a mixed single draft can still be re-split before the worker reviews it.
  - Added explicit API prompt examples for `個案於115年取得中低收入戶`, `案母每月提供5000元生活費`, and `案父108年負債500萬`.
  - Tightened classification rules: welfare status remains `社會資源使用歷程`, living-expense support/debt remains `重大財務事件`, and `身心科` / diagnosis / medication / outpatient terms map to `疾病與身心健康史`.
  - Added a confirmation prompt when a draft still has warnings and the worker clicks archive.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Local semantic test: `個案於115年取得中低收入戶 案母每月提供5000元生活費 案父108年負債500萬` produced 3 event drafts with lanes `社會資源使用歷程`, `重大財務事件`, and `重大財務事件`.
  - Health classification test: `民國78年案主身心科就診，後續持續門診用藥。` classified as `疾病與身心健康史` and preserved ongoing status.
  - API mixed-draft repair test: a simulated OpenAI response containing the three mixed events as one draft was re-split into 3 drafts with the expected lanes.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at the previously deployed `v0.18-event-people-column` until Kevin explicitly asks for push/deploy.

## v0.22 P2 Timeline Overview And Decision Nodes

- Date: 2026-06-23
- Update summary:
  - Added `全案總覽（所有事件）` as a timeline view so the worker can see case-owner and added-person events together without treating the feature as person comparison.
  - Added a distinct `全案事件` visual state across timeline events, period bars, relation tags, and event-list cards.
  - Packed same-category events into non-overlapping rows so ended events no longer force every later event into a new row.
  - Made timeline year headers and left-side classification labels sticky inside the timeline scroller.
  - Added a `決策節點` timeline row that displays linked decision cards at the year of their connected event.
  - Disabled the relation-mode select while in all-case overview because all events are already included.
  - Added export-probe fields `caseAxisEventCount` and `timelineDecisionCount`.
  - Added `WIKI_CURATOR_P0_P1_CANDIDATE.md` as a project-local candidate record for the reusable P0/P1 onboarding and draft-review pattern.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Wording scan for `泳道`, `比較人物`, `敏感度`, `可多了解`, and `下一步`: remaining hits are only in project documentation describing avoided terms or in the legacy clarification normalizer.
  - VM all-case logic check: version `v0.22-p2-timeline-overview-decisions`, all-case filtered events `6`, `caseAxisEventCount = 6`, selected actors `5`, compare actors cleared, and linked decision items `3` at years `97`, `101`, and `110`.
  - VM render check: timeline HTML included `全案事件`, `3` `.decision-marker` items, `5` `.period-bar` items, and the `決策節點` row.
  - Local HTTP check on `http://127.0.0.1:4181/`: root returned `200`, UTF-8 HTML included the first-use guide, and `app.js` included `v0.22-p2-timeline-overview-decisions` plus `visibleTimelineDecisionItems`.
  - In-app browser preview on `http://127.0.0.1:4181/`: page rendered `個案時間軸整理工具`, first-use guide, `5` period bars, `3` decision markers, and the `全案總覽（所有事件）` option.
  - All-case browser flow: selected `全案總覽`, confirmed `6` event-list cards and `6` visual timeline items used the `全案事件` style, `caseAxisEventCount = 6`, `selectedActorCount = 5`, and the relation-mode select became disabled.
  - Event-list browser flow: clicked visible `E003` from the event list and confirmed the event list card, visual timeline item, and inline summary all selected `E003`.
  - Mobile browser check at `390px`: no whole-page horizontal overflow, first-use guide remained present, timeline scroller stayed horizontally scrollable, and `5` period bars plus `3` decision markers rendered.
  - VM export check: XLSX MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, blob `41255` bytes, `9` sheets, `caseAxisEventCount = 6`, and `timelineDecisionCount = 3`.
  - Download browser note: the page probe reported XLSX MIME and `41439` bytes, and VM export generated a valid XLSX blob; the in-app browser did not emit a download event for the blob URL within `10s`, with no console errors.
- GitHub/Vercel deployment:
  - Performed after local and browser verification on commit `955b51e`.
  - Production deployment `dpl_DctqioCLFfC75bREzQUc5N85sF96` was verified at `https://case-timeline-financial-counseling.vercel.app/`.
  - Stable URL HTTP check: returned `200`, `X-Robots-Tag: noindex, nofollow, noarchive`, expected `robots.txt`, and `app.js` included `v0.22-p2-timeline-overview-decisions`.
  - Production browser check: page rendered `個案時間軸整理工具`, first-use guide, `全案總覽（所有事件）`, `3` decision markers, and no visible `敏感度`, `泳道`, or `比較人物`.
  - Production all-case browser flow: selected `全案總覽` and confirmed all visible event cards and visual timeline items used `全案事件`; in the current browser's saved test state, `caseAxisEventCount = filteredEventCount = 8`.

## v0.23 AI Input Field Merge

- Date: 2026-06-23
- Update summary:
  - Merged the AI import `文字輸入` and `待整理文字` textareas into one field named `貼上或匯入內容`.
  - Kept pasted text, extracted file text, and speech-to-text content in the same editable field so workers can review and remove personal data before analysis.
  - Simplified submit logic to analyze the single combined field only.
  - Reworded the speech-recognition fallback from `文字輸入` to `貼上文字`.
- Local verification:
  - `node --check app.js`, `node --check api/analyze.js`, and `node --check api/extract-file.js`: passed.
  - Static scan confirmed the AI import section has one combined textarea and no separate `文字輸入` / `待整理文字` textarea labels.
  - In-app browser check on `http://127.0.0.1:4181/`: AI import tab showed exactly `1` textarea, label `貼上或匯入內容`, submit button `整理成待確認草稿`, and the old `文字輸入` / `待整理文字` labels were not visible in the AI import section.
  - Browser fill check: entered fake text into the merged field and confirmed the field accepted input without changing stored drafts.
- GitHub/Vercel deployment:
  - Not performed in this update. Production remains at `v0.22-p2-timeline-overview-decisions` until Kevin explicitly asks for push/deploy.
