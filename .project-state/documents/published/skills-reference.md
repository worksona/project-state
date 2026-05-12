# Skill suite — the `project-*` family

Every skill in this suite reads and writes `.project-state/`. Skills are grouped by build tier. Build P0 first, then P1, etc.

## Mental model

- **State is the source of truth.** Skills are verbs that act on state; they never hold state themselves.
- **One skill = one coherent job.** Don't fuse unrelated jobs into one skill.
- **Orchestrator is thin.** The orchestrator decides *which* skill to call next; it doesn't do the work.
- **Packs configure behavior.** Six skills are generic by default; compliance packs (pic-pcais, client-services, board-investor, agile-default, open-source-community) configure them for a specific funder, customer type, or discipline.
- **Surfaces are last-mile.** Slack/Gmail/Calendar live behind `project-notifier`; the scsiwyg blog lives behind `project-blog-publisher`; the project website lives behind `project-website-publisher`. The rest of the suite doesn't care which channel an artifact lands in.

## P0 — Foundations (build first; nothing else works without these)

### `project-state`
The memory layer. Read / write / list / validate every entity in `.project-state/`. Enforces schema and concurrency rules. Every other skill calls through this.
- **Reads:** everything
- **Writes:** everything
- **Triggers on:** "what's the state", "record a decision", "create milestone M03", "log this activity"

### `project-scaffolder`
One-shot: initialize a `.project-state/` in a new folder. Run once per project. In v2.0 also seeds the reporting matrix from loaded packs.
- **Writes:** full tree + manifest + state.json + phase skeletons + reporting-matrix.yaml
- **Triggers on:** "set up a new project", "scaffold project-state"

## P1 — Core operations (run the project)

### `project-phase-gate`
Manage lifecycle phase transitions. In v2.0, phases are user-defined via presets (`grant-default`, `agile-default`, `waterfall-default`, `client-engagement-default`, `open-source-default`, or custom). Active pack can augment gate criteria. Enforces required artifacts at each gate; refuses to transition if gate artifacts are missing.
- **Reads:** manifest (phases.preset), phase preset YAML, pack phase-gate profile, documents, state.json
- **Writes:** state.json, phase manifests, logs
- **Triggers on:** "move to execution", "can we close phase 3?", "what's blocking the gate?"

### `project-document-curator`
Ingest a new doc into `documents/inbox/`, classify it, assign source-of-truth status if appropriate, index it into `documents/index.yaml`, and cross-reference it from the manifest or phase.
- **Reads:** documents/, manifest
- **Writes:** documents/index.yaml, symlinks into source-of-truth
- **Triggers on:** "I just dropped a doc", "classify this file", "catalog the inbox"

### `project-milestone-manager`
CRUD milestones. Updates `percent_complete`, `technical_progress`, status. Propagates to claim drafts. Reconciles with MPA Schedule A.
- **Reads:** milestones/, MPA workbook
- **Writes:** milestones/, tracking/milestones.xlsx
- **Triggers on:** "update M03 progress", "what milestones are at risk?", "recompute overall %"

### `project-status-reporter`
Generates status reports in multiple formats from state. Reads the reporting matrix to determine which reports are due.
- **Weekly report** (team / Slack-format)
- **Review-meeting pack** (docx, following the active pack's agenda template)
- **Funder claim draft** (xlsx using the active pack's claim form)
- **Ad-hoc status** (prose for email)
- **Dashboard snapshot** (one-pager)
- **Triggers on:** "weekly report", "prep the pack for next meeting", "draft the claim", "status update please"

## P2 — Surfaces & automation (wire in delivery)

### `project-orchestrator`
The conductor. Reads the reporting matrix + current state. Decides what to do next based on date, state, deadlines. Run on-demand or scheduled.
- **Reads:** reporting-matrix.yaml, state.json, manifest, milestones, documents/inbox/
- **Writes:** reports/adhoc/ (orchestrator snapshots), logs
- **Triggers on:** "run the project", "what should I do this week", "what's pending", "morning briefing"

### `project-notifier`
Routes artifacts to surfaces. Takes a (payload, recipients, channel) tuple and delivers via Slack/Gmail/Calendar. Always drafts Gmail (per manifest). Never sends a message without explicit go-ahead.
- **Reads:** manifest surfaces
- **Writes:** logs, drafts
- **Triggers on:** "post the weekly to Slack", "email the PIC PM a draft", "calendar the SC"

### `project-review-meeting`
Generic recurring review meeting lifecycle — schedule, build agenda, assemble pack, capture minutes, distribute, file action items. Pack profile defines the meeting name, attendees, cadence, and agenda template. PIC pack profile reproduces SC meeting behavior.
- **Reads:** manifest, milestones, changes, ip, publications/; pack review-meeting profile
- **Writes:** reports/sc-meetings/ (or equivalent), communications/meeting-minutes/, calendar events
- **Calls:** project-status-reporter (pack), project-notifier
- **Triggers on:** "schedule next SC", "prep the pack", "capture minutes", "schedule next review meeting"

### `project-funder-reporting`
Generic stakeholder-bound recurring reports — assembles the claim/invoice/report per the active pack profile, routes to the appropriate recipient, tracks submission and payment status. PIC pack profile reproduces quarterly claim behavior (Apr/Jul/Oct/Jan 20 deadlines).
- **Reads:** milestones/, tracking/budget.xlsx, pack funder-reporting profile (template, cadence, recipient)
- **Writes:** reports/claims/ (or equivalent), filled xlsx/pdf
- **Calls:** project-notifier
- **Triggers on:** "draft the Q2 claim", "what's in next month's claim?", "claim status", "draft funder report"

### `project-change-register`
Distinguishes material vs. non-material per the active pack's criteria. Files change-log entries for non-material; drafts Change Orders for material and routes through approval flow.
- **Reads:** manifest, milestones
- **Writes:** changes/
- **Triggers on:** "log a change", "we need to swap vendor", "this needs a change order?"

### `project-blog-publisher`
Progress posts to scsiwyg. Respects publication-review discipline (30/14-day Steering Committee review before public post). Drafts from weekly reports and milestone completions. Defers to `project-external-comms` for formal publication proposal registration.
- **Reads:** reports, milestones, publications/
- **Writes:** communications/blog-drafts/, scsiwyg posts
- **Triggers on:** "blog post about M02 completion", "what should we post this month?"

### `project-website-publisher`
Static project website hosted on Vercel/Netlify/Cloudflare Pages/GitHub Pages. Mirrors `documents/published/` to stable URLs (`/docs/<slug>`) with visibility tiers (`team`/`consortium`/`public`). Auto-deploys on `documents/published/` changes. Refuses to deploy `public`-marked docs whose publication review hasn't cleared. Provides `what-url(slug)` for `project-notifier` so emails contain stable links instead of attachments.
- **Reads:** documents/published/, documents/index.yaml, manifest, tracking/, activity log
- **Writes:** website/content/docs/, website/public/downloads/, state.json (deploy history)
- **Calls:** project-state, project-notifier, project-external-comms (clearance check)
- **Called by:** project-orchestrator, project-document-curator, user (manual rebuild)
- **Triggers on:** "publish to the site", "regenerate the website", "deploy the docs", "what URL for [doc]"

### `project-doc-suite-generator`
Generate a complete baseline report bundle — styled `.docx` and `.xlsx` files — from `.project-state/`. Produces the index, tracker workbook, project plan, risk register, milestone specs, architecture overview, and roadmap/KPIs. Triggered by phase transitions, milestone completions, or the orchestrator's `baseline` routine.
- **Reads:** milestones/, decisions/, risks/, manifest, state.json, tracking/
- **Writes:** reports/baseline/Baseline-Reports-YYYY-MM-DD/
- **Calls:** project-state
- **Called by:** project-orchestrator (baseline routine), project-phase-gate (on transition), user
- **Triggers on:** "generate baseline reports", "create the report bundle", "produce the docx outputs", "baseline report bundle"

## P3 — Polish

### `project-onboarder`
Gets a new team member up to speed. Generates a personalized onboarding brief from state (who you are, what you're on the hook for, what's happening, what needs your attention first).
- **Triggers on:** "onboard Alice from Partner2"

### `project-ip-tracker`
IP disclosures with configurable recipient via pack profile. PIC pack profile routes to PIC Director of Data and IP. Tracks annual questionnaire prep.
- **Triggers on:** "record an IP disclosure", "prep the annual IP update"

### `project-external-comms`
Generic external-communications review pipeline. Pack profile defines review windows by content class. PIC pack profile reproduces 30-day full-publication and 14-day abstract review with PIC + ISED funding acknowledgement enforcement and patent-filing-delay coordination.
- **Triggers on:** "we want to publish", "submit an abstract", "press release", "media interview", "publication review", "clear for external"

### `project-lessons`
Captures Lessons Learned continuously; summarizes for closeout.
- **Triggers on:** "capture a lesson", "lessons so far"

### `project-archive`
Generic closeout core + pack-driven closeout items. PIC pack contributes FTE confirmation, holdback release, final reports, annual questionnaire close-out.
- **Triggers on:** "close the project", "are we ready to close?"

## Dependencies

```
project-scaffolder  (one-shot)
       │
       ▼
project-state  ◄─── every other skill depends on this
       │
       ├── project-phase-gate ──► project-doc-suite-generator (on transition)
       ├── project-document-curator ──► project-website-publisher (on publish)
       ├── project-milestone-manager  ──► project-status-reporter
       ├── project-change-register   ──► project-status-reporter
       │                                     │
       │                                     ▼
       │                              project-notifier ──► Slack / Gmail / Calendar
       │                                     │
       │                                     └──► project-blog-publisher ──► scsiwyg
       │
       └── project-orchestrator ──► calls any of the above based on state + matrix

project-review-meeting      depends on status-reporter + notifier
project-funder-reporting    depends on milestone-manager + notifier
project-doc-suite-generator depends on state
project-ip-tracker          depends on state + notifier
project-external-comms      depends on state + notifier
project-lessons             depends on state
project-onboarder           depends on state
project-archive             depends on phase-gate + status-reporter
```

## Where skills live

Skills live in `~/.claude/skills/` (symlinked per-teammate from the shared drive per INSTALL.md). The *data* they read lives in the project's `.project-state/`. A skill's job is to know *how* to read/write state; it has no knowledge of *which* project it's in — it finds `.project-state/` by walking up from the current working directory.

This separation means:
- Skills are portable across projects (next PCAIS grant, next research engagement)
- Data stays with the project on the shared drive
- A teammate syncs the skill folder + the project folder and everything works
