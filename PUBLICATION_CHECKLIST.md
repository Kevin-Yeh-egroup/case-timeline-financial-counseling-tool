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
- [x] API routes return no-store JSON responses.
- [x] Production URL returns `200 OK`.
- [x] Production URL has `X-Robots-Tag`.
- [x] Production `robots.txt` returns expected content.
- [x] Production browser check renders timeline and decision cards.
- [x] Production Excel export probe produces `.xlsx` MIME and non-empty Blob.

## Production

- GitHub repo: `https://github.com/Kevin-Yeh-egroup/case-timeline-financial-counseling-tool`
- Vercel project: `egroup-task3s-projects/case-timeline-financial-counseling-tool`
- Stable URL: `https://case-timeline-financial-counseling.vercel.app/`
- Current app version: `v0.3-ai-import-drafts`
- Initial deployment inspected: `dpl_GkfmP9HzhJpJy24VGqvNSJUzKsSR`
- Project ID: `prj_5vg0uJ8VbfoUJslBxwiWiL84JShV`
- Production target: `Ready`
