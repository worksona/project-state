# Skill suite — the `project-*` family

Every skill in this suite reads and writes `.project-state/`. Skills are grouped by build tier. Build P0 first, then P1, etc.

## Mental model

- **State is the source of truth.** Skills are verbs that act on state; they never hold state themselves.
- **One skill = one coherent job.** Don't fuse unrelated jobs into one skill.
- **Orchestrator is thin.** The orchestrator decides *which* skill to call next; it doesn't do the work.
- **Surfaces are last-mile.** Slack/Gmail/Calendar live behind `project-notifier`; the scsiwyg blog lives behind `project-blog-publisher`; the project website lives behind `project-website-publisher` (v1.1). The rest of the suite doesn't care which channel an artifact lands in.

## P0 — Foundations (build first; nothing else works without these)

### `project-state`
The memory layer. Read / write / list / validate every entity in `.project-state/`. Enforces schema and concurrency rules. Every other skill calls through this. Mirrors what `narrative-state` does for Woowoo.
- **Reads:** everything
- **Writes:** everything
- **Triggers on:** "what's the state", "record a decision", "create milestone M03", "log this activity"

### `project-scaffolder`
One-shot: initialize a `.project-state/` in a new folder. Run once per project. The current project is already scaffolded.
- **Writes:** full tree + manifest + state.json + phase skeletons
- **Triggers on:** "set up a new project", "scaffold project-state"

## P1 — Core operations (run the project)

### `project-phase-gate`
Manage lifecycle transitions: LOI → Approval → Planning → Execution → Closeout → Archive. Enforces required artifacts at each gate; refuses to transition if gate artifacts are missing. Writes transition events to the activity log.
- **Reads:** manifest, phases, documents
- **Writes:** state.json, phase manifests, logs
- **Triggers on:** "move to execution", "can we close phase 3?", "what's blocking the gate?"

### `project-document-curator`
Ingest a new doc into `documents/inbox/`, classify it (proposal, MPA, workbook, template, minutes, claim form, invoice, publication, ...), assign source-of-truth status if appropriate, index it into `documents/index.yaml`, and cross-reference it from the manifest or phase.
- **Reads:** documents/, manifest
- **Writes:** documents/index.yaml, symlinks into source-of-truth
- **Triggers on:** "I just dropped a doc", "classify this file", "catalog the inbox"

### `project-milestone-manager`
CRUD milestones. Updates `percent_complete`, `technical_progress`, status. Propagates to quarterly-claim drafts. Reconciles with MPA Schedule A.
- **Reads:** milestones/, MPA workbook
- **Writes:** milestones/, tracking/milestones.xlsx
- **Triggers on:** "update M03 progress", "what milestones are at risk?", "recompute overall %"

### `project-status-reporter`
Generates status reports in multiple formats from state:
- **Weekly report** (team / Slack-format)
- **Steering Committee pack** (docx, following PIC Appendix A agenda)
- **PIC quarterly claim draft** (xlsx using PIC's MS & financial tracking form)
- **Ad-hoc status** (prose for email)
- **Dashboard snapshot** (one-pager)
- **Triggers on:** "weekly report", "prep SC pack for next meeting", "draft the claim", "status update please"

## P2 — Surfaces & automation (wire in delivery)

### `project-orchestrator`
The conductor. Decides what to do next based on state. Run on-demand or scheduled. Examples:
- "It's Monday → draft the weekly report"
- "SC meeting in 7 days → generate agenda + pack and open a draft email"
- "Claim due in 14 days → draft claim + ping Finance rep"
- "Phase 3 artifacts all present → offer to transition to execution"
- **Triggers on:** "run the project", "what should I do this week", "what's pending"

### `project-notifier`
Routes artifacts to surfaces. Takes a (payload, recipients, channel) tuple and delivers via Slack/Gmail/Calendar. Always drafts Gmail (per manifest). Never sends a message without explicit go-ahead.
- **Reads:** manifest surfaces
- **Writes:** logs, drafts
- **Triggers on:** "post the weekly to Slack", "email the PIC PM a draft", "calendar the SC"

### `project-sc-meeting`
Full SC lifecycle: schedule (with 5-business-day notice + 3-month lookahead), build agenda from the PIC standard template, assemble the pack (from status-reporter), capture minutes, distribute within 5 business days, file action items back as tasks.
- **Reads:** manifest, milestones, changes, ip, publications
- **Writes:** reports/sc-meetings/, communications/meeting-minutes/, calendar events
- **Triggers on:** "schedule next SC", "prep the pack", "capture minutes"

### `project-claim-prep`
Quarterly claim automation: assembles the PIC MS & financial tracking form for Apr 20 / Jul 20 / Oct 20 / Jan 20 deadlines from milestones + financials, routes to Finance rep for review, tracks submission and payment status.
- **Reads:** milestones/, tracking/budget.xlsx, PIC-provided form
- **Writes:** reports/claims/, filled xlsx
- **Triggers on:** "draft the Q2 claim", "what's in next month's claim?", "claim status"

### `project-change-register`
Distinguishes material vs. non-material per PIC criteria. Files change-log entries for non-material; drafts Change Orders for material and routes through PIC → Steering Committee approval flow.
- **Reads:** manifest, milestones
- **Writes:** changes/
- **Triggers on:** "log a change", "we need to swap vendor", "this needs a change order?"

### `project-blog-publisher`
Progress posts to scsiwyg. Respects publication-review discipline from MPA (30/14 day Steering Committee review before public post). Drafts from weekly reports and milestone completions.
- **Reads:** reports, milestones, publications/
- **Writes:** communications/blog-drafts/, scsiwyg posts
- **Triggers on:** "blog post about M02 completion", "what should we post this month?"

### `project-website-publisher` (NEW v1.1)
Static project website hosted on Vercel/Netlify/Cloudflare Pages/GitHub Pages. Mirrors `documents/published/` to stable URLs (`/docs/<slug>`) with visibility tiers (`team`/`consortium`/`public`). Auto-deploys on `documents/published/` changes. Refuses to deploy `public`-marked docs whose MPA publication review hasn't cleared. Provides `what-url(slug)` for `project-notifier` so emails contain stable links instead of attachments. See `docs/PROJECT-WEBSITE.md` for the full integration reference.
- **Reads:** documents/published/, documents/index.yaml, manifest, tracking/, activity log
- **Writes:** website/content/docs/, website/public/downloads/, website/public/images/, state.json (deploy history)
- **Calls:** project-state, project-notifier, project-publications (clearance check)
- **Called by:** project-orchestrator, project-document-curator, user (manual rebuild)
- **Triggers on:** "publish to the site", "regenerate the website", "deploy the docs", "what URL for [doc]"

## P3 — Polish

### `project-onboarder`
Gets a new team member up to speed. Generates a personalized onboarding brief from state (who you are, what you're on the hook for, what's happening, what needs your attention first).
- **Triggers on:** "onboard Alice from Partner2"

### `project-ip-tracker`
Ongoing IP disclosures to PIC Director of IP, abstract tracking, annual questionnaire prep.
- **Triggers on:** "record an IP disclosure", "prep the annual IP update"

### `project-publications`
Tracks proposed publications through the 30/14-day SC review, funding acknowledgements, pre-publication confidentiality review.
- **Triggers on:** "we want to publish", "publication status"

### `project-lessons`
Captures Lessons Learned continuously; summarizes for closeout.
- **Triggers on:** "capture a lesson", "lessons so far"

### `project-archive`
Closes out: final reports, IP final, FTE confirmation, holdback-release tracking, archive phase.
- **Triggers on:** "close the project", "are we ready to close?"

## Dependencies

```
project-scaffolder  (one-shot)
       │
       ▼
project-state  ◄─── every other skill depends on this
       │
       ├── project-phase-gate
       ├── project-document-curator
       ├── project-milestone-manager  ──► project-status-reporter
       ├── project-change-register   ──► project-status-reporter
       │                                     │
       │                                     ▼
       │                              project-notifier ──► Slack / Gmail / Calendar
       │                                     │
       │                                     └──► project-blog-publisher ──► scsiwyg
       │
       └── project-orchestrator ──► calls any of the above based on state + cadence

project-sc-meeting          depends on status-reporter + notifier
project-claim-prep          depends on milestone-manager + notifier
project-ip-tracker          depends on state + notifier
project-publications        depends on state + notifier
project-lessons             depends on state
project-onboarder           depends on state
project-archive             depends on phase-gate + status-reporter
```

## Where skills live

Skills live in `/mnt/.claude/skills/` (project-state SKILL.md, project-phase-gate SKILL.md, etc.) so the whole team can invoke them from any folder. The *data* they read lives in this project's `.project-state/`. A skill's job is to know *how* to read/write state; it has no knowledge of *which* project it's in — it finds `.project-state/` by walking up from the current working directory.

This separation means:
- Skills are portable across projects (next PCAIS grant, next research engagement)
- Data stays with the project on the shared drive
- A teammate syncs the skill folder + the project folder and everything works
