# Research Notes

## Why v0.2 Adds Six History Domains

The training materials Kevin provided repeatedly connect financial decisions with six life-history domains:

- Residence and migration history
- Employment and education history
- Relationship and family history
- Illness, health, and caregiving history
- Social-resource use history
- Major financial events

The design change in v0.2 is to make these six domains the primary timeline structure. This keeps the tool from becoming a narrow debt ledger and helps practitioners read decisions through available options, safety pressure, family obligations, health limits, resource access, and Taiwan policy context.

The user-provided InfoCenter materials were used for synthesis only. The public tool does not republish transcripts, audio links, case details, or raw short URLs.

## Source-Backed Taiwan Context

- Social Safety Net materials define vulnerable families through multiple intersecting factors such as poverty, unemployment, severe disability or caregiving needs, family-care function, and other risks. Tool implication: a single money problem should still trigger multi-domain context review.
- Social assistance and anti-poverty materials emphasize low-income and middle-low-income eligibility, work, vocational training, income treatment, and asset-building goals. Tool implication: employment decisions should be read together with eligibility and self-reliance incentives.
- The Children and Youth Future Education and Development Account policy frames matched saving as asset formation for education, employment, vocational training, or entrepreneurship. Tool implication: missed deposits can be a cash-flow signal, not proof that caregivers do not value the child's future.
- Consumer debt pre-negotiation materials identify official pre-negotiation with the largest creditor as a formal pathway before court debt procedures. Tool implication: the tool should prepare facts and questions, not provide legal or financial advice.
- Housing-rent subsidy policies affect rent burden, documentation, and housing stability. Tool implication: residence/migration history belongs beside financial and resource histories.
- Personal Data Protection Act materials include marriage, family, education, occupation, medical, health, financial status, and social activity as personal data categories. Tool implication: the tool must keep minimum-necessary collection and sharing checks visible.

## Design Decisions

- Replace generic event categories with the six history domains.
- Add `impact` and `unknowns` fields to every event.
- Add a context tab with history prompts and Taiwan policy background.
- Export six-history prompts and research summary into Excel.
- Keep noindex controls and public-safe sample data only.

## Public Safety Boundary

This public prototype is for tool review and training discussion. Real-case use should happen only inside the responsible institution's privacy, supervision, consent, record-keeping, and professional-role rules.
