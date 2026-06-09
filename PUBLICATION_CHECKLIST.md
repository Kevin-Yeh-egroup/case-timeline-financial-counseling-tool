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

- [ ] Local browser opens root page.
- [ ] Timeline renders sample events.
- [ ] Add event updates metrics, timeline, and chart.
- [ ] Decision node form adds a card.
- [ ] Excel download produces `.xlsx`.
- [ ] Mobile width remains usable.
- [ ] Production URL returns `200 OK`.
- [ ] Production URL has `X-Robots-Tag`.
- [ ] Production `robots.txt` returns expected content.

