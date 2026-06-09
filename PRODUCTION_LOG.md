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
