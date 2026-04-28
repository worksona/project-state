---
name: project-funder-reporting
description: Generic funder/customer reporting engine. Reads funder-specific behavior from a profile YAML loaded by the active pack — claim form template, deadlines, format spec, cover-email template, signoff routing. The PIC pack ships a profile that reproduces v1.x quarterly claim behavior (Apr/Jul/Oct/Jan 20, MS & financial xlsx, percent_complete + technical_progress mapping). Other packs ship customer-invoicing profiles, board-pack profiles, and stage-gate profiles. Use whenever the user says 'draft the [stakeholder] report', 'quarterly claim', 'monthly invoice', 'board pack', 'funder report', 'customer billing', 'prepare the report', or any request to produce a stakeholder-bound recurring report. Also trigger when the orchestrator detects an upcoming reporting deadline from the stakeholder reporting matrix. Drafts only — never submits.
---

# Project Funder Reporting (v2.0 — was project-claim-prep)

This skill produces stakeholder-bound recurring reports — anything that one named recipient (or recipient group) needs at a defined cadence in a defined format. Funder claims are one case; customer invoices, board packs, milestone-billing reports, and stage-gate submissions are others.

The skill itself is generic. Funder/customer/recipient-specific behavior comes from a **profile** loaded by the active pack:

- **PIC pack** profile (`packs/pic-pcais/profiles/funder-reporting.yaml`) — quarterly claim, Apr/Jul/Oct/Jan 20 deadlines, MS & financial xlsx field mapping, PIC PM cover-email template, percent-complete + technical-progress per-milestone fields. Reproduces v1.x behavior.
- **Client-services pack** profile — monthly customer invoicing, milestone-based billing entries, customer change-order coordination.
- **Board-investor pack** profile — board pack template, KPI dashboard data, monthly cadence.

## What it owns

- Reading the active profile from the loaded pack(s)
- Pulling milestone state, tasks, expenses, KPIs from the substrate
- Filling the configured template (xlsx / docx / pdf / md)
- Generating the cover delivery (Gmail draft via `project-notifier`)
- Writing the report artifact to `reports/<stakeholder>/<YYYY-QN>-<report-kind>.<ext>`
- Logging the deliverable and signoff to the activity log

## What it does not own

- Authoring funder-specific templates — those live in the pack
- Submitting reports — always stops at a draft for human signoff
- Defining the cadence — that's in the stakeholder reporting matrix

## Sub-actions

### `draft <stakeholder> <report-kind>`
Produces the next cycle's draft. Reads matrix entry → loads profile → assembles report.

### `lookahead [days]`
Lists upcoming reporting deadlines from the matrix. Default 30 days.

### `finalize <draft-id>`
Marks a draft as PL-signed-off, writes signoff event to activity log, hands to `project-notifier` for delivery.

## Triggers (handled by orchestrator + matrix)

- 14 days before a quarterly deadline → draft
- Monthly close day → all month-end reports drafted in batch
- On `funder-reporting.<stakeholder>.requested` event in activity log → ad-hoc draft

## Migration from v1.x

The v1.x `project-claim-prep` skill was hard-wired to the PIC quarterly form. v2.0 reads the same form template — now living at `packs/pic-pcais/templates/ms-and-financial-tracking.xlsx` — through the profile system. Same xlsx output; new authoring path. Existing claim drafts in `reports/claims/` are unchanged and continue to be referenced.

If you load only the PIC pack, behavior is identical to v1.x. Loading a customer pack alongside adds new reporting matrix entries (customer invoices, customer reports) without affecting the PIC claim flow.
