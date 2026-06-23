# Publication Checklist

## Sensitivity

- [x] Public-safe sample data only.
- [x] No raw InfoCenter links or training transcripts.
- [x] No real case names, addresses, identifiers, debt documents, medical data, or service records.
- [x] Tool states that noindex is not privacy protection.

## Review-Stage Noindex

- [x] HTML meta robots: `noindex,nofollow,noarchive`
- [x] `robots.txt`: `Disallow: /`
- [x] Vercel header: `X-Robots-Tag: noindex, nofollow, noarchive`

## Functional Checks

- [x] Local browser opens root page.
- [x] Timeline renders sample events.
- [x] Add event updates metrics, timeline, and chart.
- [x] Decision node form adds a card.
- [x] Excel export probe produces `.xlsx` MIME and non-empty Blob.
- [x] Mobile width remains usable.
- [x] Six-history guide renders on the context tab.
- [x] Excel export includes event impact, unknowns, six-history guide, and research summary sheets.
- [x] AI import tab accepts text, file upload, and voice input controls.
- [x] AI analysis creates editable drafts instead of directly modifying the timeline.
- [x] Confirming a draft adds it to the timeline or decision-card list.
- [x] Excel export includes a `待確認草稿` sheet.
- [x] Tool focuses the people layer on household members/cohabitants first.
- [x] Events and decision cards can link to related household members.
- [x] Excel export includes a `同住人口` sheet and household-member columns.
- [x] Timeline can set a primary person and add related household members.
- [x] Multi-person timeline uses `一起呈現` so primary-person events, added-person events, and shared events stay visible together with distinct styles.
- [x] Clicking a timeline event opens an event summary and edit entry point.
- [x] Timeline grid keeps full borders through empty years.
- [x] Timeline side panel shows a classified event list instead of a history-distribution bar chart.
- [x] Taiwan system background can appear as an optional reference timeline and export flag.
- [x] Event list supports in-place summary review and quick editing without switching tabs.
- [x] Events can record start year, end year, or ongoing status.
- [x] Timeline shows multi-year or continuing events as one clickable period bar instead of repeating one marker per year.
- [x] Excel export includes start/end/ongoing fields for events and drafts.
- [x] Timeline year headers include `年` in ROC/AD display.
- [x] Clicking a visible timeline event keeps page scroll position while syncing the event list selection.
- [x] Sample content is separated as a reloadable/deletable `範例測試包`.
- [x] Legacy sample content from earlier browser state is recognized and can be batch-deleted as sample data.
- [x] Multi-year fake intake fixtures are available in TXT, XLSX, and DOCX formats for import testing.
- [x] Local semantic import creates editable drafts for multi-year and ongoing events before timeline insertion.
- [x] Import drafts require confirmation of people, event facts, time, place, objects, and six-history classification before archiving.
- [x] Relationship-family classification is limited to marriage, dating, partner, separation, divorce, and intimate-relationship context; family money support is treated as major financial context.
- [x] Drafts can record related history dimensions and extra tags without replacing the six main dimensions.
- [x] Household/cohabitant records can be edited after creation.
- [x] Timeline duration events keep stable vertical positions across years to reduce misreading from row jumps.
- [x] Multi-actor fake intake fixture is available for testing case-owner, mother, father, work, and relationship events in one import.
- [x] Events without a confirmed start year stay out of the visual timeline and are marked as not shown on the visual timeline in the event list.
- [x] Draft event cards can be split into two editable drafts or merged with the next event draft.
- [x] Draft actor prompts can add an unlinked person as a household member or link the draft to an existing household member.
- [x] Draft event cards show a pre-archive review strip for `人物`, `事件`, `時間`, `時地物`, and `分類`.
- [x] Mixed multi-person or multi-money AI drafts are re-split on the frontend before review.
- [x] AI/API prompt explicitly separates case-owner welfare status, mother's living-expense support, and father's debt into separate drafts.
- [x] Health terms such as `身心科`, `精神科`, `診斷`, `用藥`, and `門診` classify as `疾病與身心健康史`.
- [x] Drafts with warnings ask for confirmation before archiving into the timeline.
- [x] Interface uses a project-local generated masthead asset and warmer colors without adding readable fake case data to the image.
- [x] Visual polish keeps timeline, event list, and draft review flows as the first-screen working surface rather than turning the app into a landing page.
- [x] Timeline screen has direct `新增事件` and `新增同住人口` entry points.
- [x] First-use start guide shows a clear `匯入或新增資料 -> 確認人事時地物 -> 加入時間軸` flow.
- [x] Start-guide buttons open AI import, new-event, and new-household-member entry points directly.
- [x] Clicking an event-list card selects the event and focuses the matching item on the visual timeline.
- [x] Multi-year or ongoing events have a visible `時間段` / `持續至今` period caption.
- [x] Household-member list states that records can be edited after creation instead of deleted and rebuilt.
- [x] Timeline has a `全案總覽（所有事件）` view that keeps all events visible instead of hiding added people's events.
- [x] Timeline relation styles include a distinct `全案事件` state separate from `主軸人物`, `加入人物`, and `共同事件`.
- [x] Timeline year headers and left-side classification labels stay visible while scrolling the timeline grid.
- [x] Same-category timeline events are packed into non-overlapping rows so ended events do not force every later event downward.
- [x] Linked decision nodes appear as their own timeline row when their connected event is visible.
- [x] Export probe includes `caseAxisEventCount` and `timelineDecisionCount`.
- [x] Per-event sensitivity is no longer presented in the main workflow; `下一步` wording is changed to `建議多確認`.
- [x] `建議多確認` is the only visible clarification label; the content directly lists details to confirm, with `協助判斷` only in the expanded summary.
- [x] Event list, expanded summaries, event tables, and Excel exports explicitly show `事件人物` for each event.
- [x] Event table places `事件人物` as a standalone column between `ID` and `期間`.
- [x] API routes return no-store JSON responses.
- [x] Taiwan wording pass removes reader-facing `泳道`, engineering terms, and awkward field labels.
- [x] Production URL returns `200 OK`.
- [x] Production URL has `X-Robots-Tag`.
- [x] Production `robots.txt` returns expected content.
- [x] Production browser check renders timeline and decision cards.
- [x] Production Excel export probe produces `.xlsx` MIME and non-empty Blob.

## Production

- GitHub repo: `https://github.com/Kevin-Yeh-egroup/case-timeline-financial-counseling-tool`
- Vercel project: `egroup-task3s-projects/case-timeline-financial-counseling-tool`
- Stable URL: `https://case-timeline-financial-counseling.vercel.app/`
- Local app version: `v0.22-p2-timeline-overview-decisions`
- Current production app version before next deployment: `v0.18-event-people-column`
- Initial deployment inspected: `dpl_GkfmP9HzhJpJy24VGqvNSJUzKsSR`
- v0.9 verification deployment inspected: `dpl_88jH7272GGgmd5Z3r8hKh1V66PzL`
- Project ID: `prj_5vg0uJ8VbfoUJslBxwiWiL84JShV`
- Production target: `Ready`
