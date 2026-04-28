# Schema reference

Every entity in `.project-state` is a YAML file with frontmatter-style fields, OR a JSON file, OR an xlsx/docx under `tracking/` / `documents/`. This doc defines the shape of each YAML entity.

## Naming conventions

- **Milestones:** `milestones/M<NN>-<slug>.yaml` — e.g., `M01-data-pipeline-v1.yaml`. `NN` matches the MPA Schedule A numbering.
- **Decisions:** `decisions/YYYY-MM-DD-<slug>.yaml` — e.g., `2026-04-25-hire-subcontractor-acme.yaml`.
- **SC meetings:** `reports/sc-meetings/YYYY-QN-<seq>.yaml` — e.g., `2026-Q2-01.yaml`.
- **Claims:** `reports/claims/YYYY-QN.yaml` — e.g., `2026-Q2.yaml`.
- **Weekly reports:** `reports/weekly/YYYY-Www.md` (ISO week) — e.g., `2026-W17.md`.
- **Change log entries:** `changes/change-log/YYYY-MM-DD-<slug>.yaml`.
- **Change orders:** `changes/change-orders/CO-<NN>-<slug>.yaml` — e.g., `CO-01-add-subcontractor-acme.yaml`.
- **Risks:** `risks/R-<NN>-<slug>.yaml`.
- **People:** `people/<slug>.yaml` — e.g., `jane-doe-atomic47.yaml`.
- **Publications:** `publications/YYYY-MM-DD-<slug>.yaml`.
- **IP disclosures:** `ip/IP-<NN>-<slug>.yaml`.

## Common frontmatter (every YAML)

```yaml
id: M01-data-pipeline-v1        # matches filename minus extension
kind: milestone                  # one of: milestone | decision | risk | ...
created: 2026-04-23T10:15:00Z
created_by: keystone@stonemaps.org
last_modified: 2026-04-23T10:15:00Z
last_modified_by: keystone@stonemaps.org
phase: 03-planning               # phase this entity was created in
```

## Milestone (`milestones/M<NN>-<slug>.yaml`)

```yaml
id: M01-data-pipeline-v1
kind: milestone
mpa_reference: "Schedule A, Milestone 1"
title: "Deliver Data Pipeline v1"
owner_org: "Atomic47 Labs Inc."
owner_person: jane-doe-atomic47      # → people/jane-doe-atomic47.yaml
description: |
  Two-paragraph description from the MPA Schedule A workbook.
planned_start: 2026-05-01
planned_end: 2026-08-30
actual_start: ~
actual_end: ~
percent_complete: 0                  # PIC requires this
technical_progress: ""               # PIC requires a narrative; empty until first update
deliverables:
  - id: D01a
    title: "Pipeline architecture doc"
    status: planned                  # planned | in_progress | delivered | accepted
  - id: D01b
    title: "Working pipeline running on sample data"
    status: planned
budget_category: "Direct Labor"      # from financial assessment workbook
status: planned                      # planned | in_progress | at_risk | complete | blocked
at_risk_reason: ~
```

## Decision (`decisions/YYYY-MM-DD-<slug>.yaml`)

```yaml
id: 2026-04-25-hire-subcontractor-acme
kind: decision
date: 2026-04-25
title: "Engage ACME Analytics as subcontractor for M03"
context: "M03 requires specialized NLP capability we do not have in-house."
options_considered:
  - "Hire FTE (rejected — timeline too long)"
  - "Engage ACME Analytics (chosen)"
  - "Use open-source toolkit only (rejected — insufficient for M03 accuracy)"
decision: "Engage ACME Analytics"
rationale: "ACME has the only team with the domain + technical fit in our timeline."
material_change: true                # triggers a Change Order per PIC PM Guide
change_order_ref: "CO-01-add-subcontractor-acme"
approvers:
  - jane-doe-atomic47
  - john-smith-partner2
```

## Change Log Entry (`changes/change-log/YYYY-MM-DD-<slug>.yaml`)

```yaml
id: 2026-05-10-swap-cloud-vendor
kind: change-log
date: 2026-05-10
description: "Swap cloud storage vendor from AWS to GCS for M02."
reason: "GCS academic credit covers 100% of storage cost."
impact: "Zero budget impact. No IP implication. Timeline unchanged."
responsible_party: "Atomic47 Labs Inc."
approved_by_steering_committee: "2026-05-15"   # Non-material, SC can approve
classification: "non-material"                 # PIC arbiter confirms
```

## Change Order (`changes/change-orders/CO-<NN>-<slug>.yaml`)

```yaml
id: CO-01-add-subcontractor-acme
kind: change-order
co_number: 1
date_raised: 2026-04-25
title: "Add ACME Analytics as subcontractor for M03"
classification: "material"
material_reason: "Subcontractor addition per PIC PM Guide"
decision_ref: "2026-04-25-hire-subcontractor-acme"
affected_milestones: [M03]
budget_impact_cad: 75000
budget_shift:
  from: {category: "Direct Labor — M03", amount_cad: 75000}
  to:   {category: "Subcontractor — ACME", amount_cad: 75000}
ip_rationale_change: false
status: drafted                      # drafted | submitted | under_review | approved | rejected
pic_submitted: ~
pic_approved: ~
sc_approved: ~
mpa_amendment_incorporated: ~
```

## Risk (`risks/R-<NN>-<slug>.yaml`)

```yaml
id: R-01-key-person-dependency
kind: risk
title: "Key person dependency on Jane for M01 and M03"
likelihood: medium    # low | medium | high
impact: high          # low | medium | high
score: 6              # likelihood × impact, 1-9 scale
owner: jane-doe-atomic47
mitigation: "Pair-program M01; document M03 design decisions to wiki weekly."
contingency: "Cross-train John on M03 starting Q3."
status: open          # open | mitigated | closed | materialized
last_reviewed: 2026-04-23
```

## Person (`people/<slug>.yaml`)

```yaml
id: jane-doe-atomic47
kind: person
full_name: "Jane Doe"
organization: "Atomic47 Labs Inc."
title: "CTO"
email: "jane@atomic47.ai"
role_on_project: "Project Lead"
sc_designations:
  - project_lead
  - signing_authority
voting_rights: true
pic_primary_contact: false
```

## SC Meeting (`reports/sc-meetings/YYYY-QN-NN.yaml`)

Follows PIC Standard Agenda (PM Guide Appendix A). See `phases/03-planning/first-sc-meeting-template.yaml` for the kickoff-specific template.

## Quarterly Claim (`reports/claims/YYYY-QN.yaml`)

```yaml
id: 2026-Q2
kind: quarterly-claim
period_start: 2026-04-01
period_end: 2026-06-30
due_date: 2026-07-20
submitted_date: ~
submitted_by: ~
pic_ms_financial_form_path: ~       # path to the PIC-provided MS & financial tracking form (filled)
milestone_updates:                   # one entry per active milestone
  - milestone: M01
    percent_complete: 35
    technical_progress: "Architecture doc complete; sample-data pipeline stood up."
member_claim_packages: []            # one per Consortium Member
total_claim_cad: 0
status: drafted                      # drafted | submitted | under_review | paid
```

## Activity log (`logs/activity.ndjson`)

One JSON object per line, append-only. Example lines:

```
{"ts":"2026-04-23T10:15:00Z","actor":"keystone@stonemaps.org","event":"phase.transition","from":"02-approval","to":"03-planning"}
{"ts":"2026-04-23T10:32:04Z","actor":"keystone@stonemaps.org","event":"milestone.created","id":"M01-data-pipeline-v1"}
{"ts":"2026-04-23T10:45:19Z","actor":"keystone@stonemaps.org","event":"document.registered","path":"documents/source-of-truth/mpa-signed.pdf"}
```

Event types (canonical):

- `phase.transition`
- `milestone.created` | `milestone.updated` | `milestone.completed`
- `decision.recorded`
- `change.logged` | `change-order.drafted` | `change-order.submitted` | `change-order.approved`
- `risk.opened` | `risk.closed` | `risk.materialized`
- `document.registered` | `document.sot.promoted`   (sot = source-of-truth)
- `sc.meeting.scheduled` | `sc.meeting.held` | `sc.minutes.distributed`
- `claim.drafted` | `claim.submitted` | `claim.paid`
- `ip.disclosed` | `publication.proposed` | `publication.approved`
- `report.generated` | `report.sent`
- `health.assessed`
