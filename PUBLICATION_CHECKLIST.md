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
- [x] Timeline can filter by primary person and comparison people.
- [x] Multi-person timeline can show shared events or any related events.
- [x] Clicking a timeline event opens an event summary and edit entry point.
- [x] Timeline grid keeps full borders through empty years.
- [x] Timeline side panel shows a classified event list instead of a history-distribution bar chart.
- [x] Taiwan system background can appear as an optional reference timeline and export flag.
- [x] Event list supports in-place summary review and quick editing without switching tabs.
- [x] Events can record start year, end year, or ongoing status.
- [x] Timeline shows continuing events with clickable continuation markers.
- [x] Excel export includes start/end/ongoing fields for events and drafts.
- [x] Timeline year headers include `年` in ROC/AD display.
- [x] Clicking a visible timeline event keeps page scroll position while syncing the event list selection.
- [x] Sample content is separated as a reloadable/deletable `範例測試包`.
- [x] Legacy sample content from earlier browser state is recognized and can be batch-deleted as sample data.
- [x] Multi-year fake intake fixtures are available in TXT, XLSX, and DOCX formats for import testing.
- [x] Local semantic import creates editable drafts for multi-year and ongoing events before timeline insertion.
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
- Current app version: `v0.9-test-pack-human-flow`
- Initial deployment inspected: `dpl_GkfmP9HzhJpJy24VGqvNSJUzKsSR`
- Latest deployment inspected: `dpl_88jH7272GGgmd5Z3r8hKh1V66PzL`
- Project ID: `prj_5vg0uJ8VbfoUJslBxwiWiL84JShV`
- Production target: `Ready`
