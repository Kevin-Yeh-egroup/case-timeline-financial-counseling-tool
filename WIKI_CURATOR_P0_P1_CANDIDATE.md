# Wiki Curator Candidate: Case Timeline P0/P1 UX And Draft Review

Date: 2026-06-23
Scope: `case-timeline-financial-counseling-tool`
Status: project-local candidate record; not promoted to global Agent OS memory, wiki, skill, or automation.

## Why This Should Be Remembered

Real tester feedback showed that the tool's value was understood, but first-time users could get lost before entering data. The safest reusable pattern is not more explanatory copy; it is a visible work path, direct entry buttons, and a draft-first review workflow that lets social workers confirm people, facts, time, place, objects, and six-history classification before archiving.

## Reusable Product Decisions

- First screen should show the work path: `匯入或新增資料 -> 確認人事時地物 -> 加入時間軸`.
- Primary actions should be concrete: `貼上紀錄請 AI 整理`, `直接新增事件`, `新增同住人口`.
- AI output must remain draft-first. No AI result should be added to the timeline without worker confirmation.
- Draft review should separate at least five checks: `人物`, `事件`, `時間`, `時地物`, and `分類`.
- Mixed multi-person or multi-money text should be split into separate draft events before review.
- The six main dimensions stay fixed for the core workflow. Extra dimensions or custom labels can be recorded as future backlog rather than replacing the six-domain model.
- `感情與家庭史` should focus on dating, marriage, separation, divorce, intimate relationships, parenting, support, and household relationship context. Family money support and debt should usually stay under `重大財務事件`.
- Terms such as `身心科`, `精神科`, `診斷`, `用藥`, and `門診` should map to `疾病與身心健康史`.
- Welfare identity or benefit-use facts such as low-income and middle-low-income status should map to `社會資源使用歷程`.

## Reusable Interaction Decisions

- Event-list selection should sync to the visual timeline and preserve page position.
- Multi-year and ongoing events should be rendered as one continuous period bar, not repeated once per year.
- Household/cohabitant records must be editable after creation, not only deletable.
- User-facing language should use `歷程`, `加入人物`, `事件人物`, and `建議多確認`; avoid engineering or judgment-heavy terms such as `泳道`, `比較人物`, and `敏感度`.
- The clarification field should list the actual details to confirm. Avoid redundant prefixes such as `可多了解`.

## Code Touchpoints

- `index.html`: start guide, timeline filters, direct add buttons, draft review entry points.
- `app.js`: timeline filters, event selection sync, period bars, draft splitting, classification rules, archive confirmation, XLSX probe.
- `api/analyze.js`: structured prompt and examples for separating welfare status, parent support, and parent debt.
- `styles.css`: warm first-screen treatment, period bars, review strips, relationship styles, mobile layout.
- `test-fixtures/`: fake multi-year and multi-actor import files for repeatable human-like tests.

## Verification Pattern

- Run syntax checks: `node --check app.js`, `node --check api/analyze.js`, `node --check api/extract-file.js`.
- Run a local semantic split test using: `個案於115年取得中低收入戶 案母每月提供5000元生活費 案父108年負債500萬`.
- Confirm the expected lanes are: `社會資源使用歷程`, `重大財務事件`, `重大財務事件`.
- Run a health classification test using: `民國78年案主身心科就診，後續持續門診用藥。`.
- Confirm the expected lane is `疾病與身心健康史` and ongoing status is preserved.
- Browser or equivalent human-like checks should cover: first-use guide buttons, AI draft review, event-list-to-timeline sync, mobile width, and Excel export.
- If the in-app browser cannot open local URLs, label the browser gap and use static, HTTP, VM, or production checks instead of claiming full browser success.

## Candidate Promotion

This pattern is reusable for Taiwan-facing helping-professional tools that combine AI import, human confirmation, timeline or graph visualization, and downloadable structured exports.

Promote only after at least one more project repeats the pattern, and only with an explicit approval gate. Promotion candidate type: project playbook or Agent OS tool-update checklist, not an automation.

## Do Not Promote Yet

- Do not create global memory from this card without Kevin's explicit request.
- Do not create a recurring automation.
- Do not merge this tool with the genogram project yet. Keep tools independent while gradually aligning shared data concepts.
