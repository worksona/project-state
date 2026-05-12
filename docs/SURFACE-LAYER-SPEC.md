# Surface Layer Specification — Four-State Intelligence Stack

**Version:** 1.0
**Date:** 2026-05-05
**Status:** Authoritative
**Audience:** Skill authors, pack authors, and developers wiring new delivery channels into the stack

---

## Table of Contents

1. [The Surface Layer Defined](#1-the-surface-layer-defined)
2. [Surface Registry](#2-surface-registry)
3. [Surface Send Semantics](#3-surface-send-semantics)
4. [Surface Credential Model](#4-surface-credential-model)
5. [Human-Review Gates](#5-human-review-gates)
6. [Surface Failure Handling](#6-surface-failure-handling)
7. [Surface Configuration Per Facility](#7-surface-configuration-per-facility)
8. [Surface-to-Artifact Mapping](#8-surface-to-artifact-mapping)
9. [Adding a New Surface](#9-adding-a-new-surface)
10. [Surface Testing Checklist](#10-surface-testing-checklist)

---

## 1. The Surface Layer Defined

### What surfaces are

Surfaces are the delivery endpoints where the stack's artifacts reach human attention or downstream systems. A surface is not storage and not processing — it is the last step of a pipeline that begins in a state facility and ends with a human reading, approving, or acting on something.

The four-state intelligence stack has four architectural layers:

| Layer | Concern | Examples |
|-------|---------|---------|
| 1 — Data | State storage — the four facilities | `.project-state/`, `~/work-state/`, `~/docket-state/`, `~/.strategic-state/` |
| 2 — Skill | Behavior — skills that read and write state | `project-*`, `work-*`, `docket-*`, `strategic-*` |
| 3 — Surface | Delivery — where artifacts are sent or displayed | Slack, Gmail, Calendar, scsiwyg, website, kanban |
| 4 — Integration | Cross-state data flows | project-harvester, work-orchestrator, strategic-advisor |

This document specifies Layer 3.

### Surfaces vs. facilities

The distinction is precise and matters:

- **Facilities** (data layer) store state. They are the source of truth. They are always local files on a shared drive or filesystem. Reading from a facility is always safe and free of side effects.
- **Surfaces** (surface layer) deliver artifacts. They are output sinks. They are external systems (Slack, Gmail, Google Calendar, scsiwyg, Vercel/Netlify), local web servers, or filesystem outputs intended for human consumption rather than machine reads.

A skill reads from a facility and writes to a surface. No surface ever writes back to a facility. No facility is a surface.

The one apparent exception — `file-write` outputs that land inside a facility directory — are not surface operations on the facility. They are artifacts scoped to that facility for organizational purposes, produced by skills as read-only outputs for the team, not as entity writes that alter state.

### The review-not-author principle

No surface sends automatically without human approval for any artifact addressed to external parties.

"External party" means any person or system not within the project team itself — funders, partner organizations, conference program committees, the public, or any mailing list.

Internal surfaces (work-kanban, docket-digest, report-file outputs) may auto-display or auto-write because they never reach external parties. No human-review gate applies.

The principle is operationalized at the skill level: every skill that touches an external surface creates a draft or a proposed action and stops. The system reconstructs and drafts; humans decide and send.

### Why the surface layer exists as a specification

Without this specification, each skill would independently decide:

- How to handle a disabled surface (some would silently skip; others would fail hard)
- Where to store credentials (some would hardcode paths; others would prompt the user)
- What "review required" means in practice (some would post and label; others would hold)
- What to do when the Slack API times out (some would retry indefinitely; others would drop the message)

The surface layer spec defines the delivery contract once. Every skill that touches any surface follows the same semantics, credential model, failure handling, and review gates — regardless of which facility it belongs to or which tier it occupies in the dependency graph.

---

## 2. Surface Registry

### 2.1 External communication surfaces

These surfaces send to external parties or external systems. All require a human-review gate before the artifact leaves the system.

| Surface | Identifier | Send semantics | Primary owning skills | Credential type |
|---------|-----------|---------------|----------------------|----------------|
| Gmail (draft) | `gmail-draft` | Create draft only; human sends | `project-notifier` | OAuth refresh token |
| Slack | `slack` | Auto-post to configured channel after user confirmation | `project-notifier`, `work-orchestrator`, `docket-notifier` | Bot token |
| Google Calendar | `calendar` | Propose hold + invites; human accepts | `project-notifier` | OAuth refresh token |

### 2.2 Publication surfaces

These surfaces publish content to semi-public or fully public audiences. All require a publication-review gate.

| Surface | Identifier | Send semantics | Primary owning skills | Review gate |
|---------|-----------|---------------|----------------------|-------------|
| scsiwyg blog | `scsiwyg` | Submit as draft; internal posts ship after human review; external/funded-project posts require MPA review window | `project-blog-publisher` | MPA publication review (30-day SC + 14-day funder) |
| Project website | `project-website` | Auto-deploy on `doc.published`; visibility-tier enforced | `project-website-publisher` | Visibility tier gate |

### 2.3 Local and internal surfaces

These surfaces have no external reach. They display or write locally for the project team. No send gate applies.

| Surface | Identifier | Send semantics | Primary owning skills | Access scope |
|---------|-----------|---------------|----------------------|-------------|
| Work kanban | `work-kanban` | Start local web server at localhost:3333; open browser | `work-kanban` | localhost only; no external network |
| Docket digest | `docket-digest` | Write daily `.md` file to `~/docket-state/digests/` | `docket-digest` | Local file; no network |
| Report file | `report-file` | Write `.md` or `.json` to facility `reports/` directory | `work-*`, `project-*`, `strategic-*` | Local file; no network |

### 2.4 Future surfaces

Planned surfaces that are not yet wired in the stack. Skills must not declare these in `surfaces` frontmatter until they are promoted to active status in this registry.

| Surface | Identifier | Intended use | Blocking dependency |
|---------|-----------|-------------|-------------------|
| Strategic doc export | `strategic-doc` | Generate `.docx` vision documents from strategic-state | DOCX generation tooling |
| Docket Slack alert | `docket-slack` | Overdue/urgent matter notifications to a docket-specific channel | Docket notifier skill |
| Project dashboard | `project-dashboard` | Static dashboard page embedded in the project website | project-website-publisher v2 |

---

## 3. Surface Send Semantics

Every surface has exactly one send semantic. The semantic is a system-level policy, not a per-skill choice. Skills must honor the semantic for their declared surfaces in their `## Behavior` instructions.

### 3.1 `draft-only` — gmail-draft

The skill calls the Gmail API to create a draft message. The draft is placed in the configured Gmail account's Drafts folder. The skill never calls the Gmail send endpoint. The human reviews the draft, edits if needed, and sends manually.

Skill behavior contract:
1. Compose the full email content (subject, to, cc, body) as structured data.
2. Show the composed draft to the user for review before calling the API.
3. Call the Gmail Drafts API with `create` operation only.
4. Record `{draft_id, subject, to, created_at}` in the facility's `communications/` directory as a `.yaml` file.
5. Append a `surface.gmail.draft_created` event to `logs/activity.ndjson`.
6. Return the draft ID and a direct link to the draft in Gmail.

Fallback when Gmail API is unavailable: write the full email content as a Markdown file at `communications/outbound/YYYY-MM-DD-{slug}.md` and tell the user to send it manually. Record the fallback in the activity log.

### 3.2 `auto-post` — slack

The skill posts directly to the configured Slack channel. No separate human approval gate exists at the API level, but the skill must show the message to the user and confirm before posting.

Permitted uses of `auto-post`:
- Team-internal action and coordination items
- Daily standup posts
- Phase-gate transition alerts
- Harvest completion notifications
- Deploy notifications

Prohibited uses of `auto-post`:
- Any message representing a contractual position (claim submission, change order notice, IP disclosure)
- Any message addressed to external parties (funders, partner organizations)
- Any message containing financial figures without PL sign-off

Skill behavior contract:
1. Compose the Slack message content (text, blocks, attachments).
2. Show the message to the user with the target channel name.
3. Post only after the user confirms.
4. Record the `ts` (Slack message timestamp) in the facility's `communications/` directory.
5. Append a `surface.slack.posted` event to `logs/activity.ndjson`.

### 3.3 `proposed-hold` — calendar

The skill creates a Google Calendar event with status `tentative` and sends invites to configured attendees. Attendees must accept manually. The event does not appear as confirmed on any calendar until the human accepts.

Skill behavior contract:
1. Compose the event: title, date/time, duration, description, attendees list.
2. Show the proposed event to the user for review.
3. Create the event via the Calendar API with `status: tentative`.
4. Record the event ID in `state.json` or the relevant entity file (e.g., `reports/sc-meetings/{id}.yaml:calendar_event_id`).
5. Append a `surface.calendar.hold_proposed` event to `logs/activity.ndjson`.

### 3.4 `publication-review` — scsiwyg

The skill submits a post to scsiwyg in draft status. The post never auto-publishes without human review. The review gate category determines the publication path:

| Post category | Review path |
|--------------|-------------|
| Internal team post (no funded-project or funder mention) | Human review; ship when approved |
| Consortium-tier post (mentions consortium but not funder) | SC review |
| Funded-project post (mentions funded project, funder, or partner) | MPA publication review: 30-day SC clock + 14-day funder clock |

Skill behavior contract:
1. Draft the post content.
2. Classify the post category (internal / consortium / funded-project).
3. Submit to scsiwyg as a draft.
4. Create a `publications/{pub-id}.yaml` entry with `status: under_review`, `review_started: <date>`, `review_deadline: <date>`.
5. Append a `surface.scsiwyg.draft_submitted` event to `logs/activity.ndjson`.
6. Do not call the scsiwyg publish endpoint until `publications/{pub-id}.yaml:status` is set to `approved`.
7. When `approved`, publish and update `publications/{pub-id}.yaml:status: published` and `published_url: <url>`.

### 3.5 `auto-deploy` — project-website

The skill writes or updates files in the project website repository (or a designated deploy directory) and triggers a deployment via the configured mechanism (Vercel webhook, Netlify webhook, or git push to the deploy branch).

Deployment is gated on document visibility tier:
- `public` — deploys to the live public URL
- `consortium` — deploys to an authenticated path (requires auth configured in the hosting platform)
- `internal` — does not deploy to the website at all

Skill behavior contract:
1. Read `documents/index.yaml` to identify which documents have `status: published` since the last deploy.
2. For each published document, check its `visibility` field.
3. Write or update the corresponding page in the website repository.
4. Trigger the deploy via the configured webhook or push.
5. Record the deploy in `state.json:reporting.last_website_deploy` with a timestamp and list of updated pages.
6. Append a `surface.website.deployed` event to `logs/activity.ndjson`.

Documents that have not reached `published/` in the document promotion pipeline must not be deployed, regardless of their content.

### 3.6 `local-serve` — work-kanban

The skill starts a local web server (default port 3333) and opens the browser to the kanban dashboard. No external network call is made. The server serves a read-only view of the work-state facility. The server stops when the conversation session ends.

Skill behavior contract:
1. Check whether a server is already running on port 3333.
2. If not running, start the local server process.
3. Open the browser to `http://localhost:3333`.
4. Confirm to the user that the kanban is live and the URL.
5. No credential is required. No activity log entry is required (local-only, no state change).

### 3.7 `file-write` — docket-digest, report-file

The skill writes a file to the local filesystem within the designated facility directory. No network call is made. The user reads the file directly or the skill surfaces the content inline in the conversation.

Skill behavior contract:
1. Compose the artifact content.
2. Write to the appropriate path (`~/docket-state/digests/YYYY-MM-DD.md`, `reports/weekly/YYYY-Www.md`, etc.).
3. Confirm the file path to the user.
4. Append a `surface.file.written` event to `logs/activity.ndjson` if the file is within a facility with an activity log.

---

## 4. Surface Credential Model

### 4.1 Credential location principle

Credentials are never hardcoded in skills or embedded in SKILL.md files. Every credential is stored in a file on the local filesystem at a path declared in the relevant facility's `manifest.yaml` under the `surfaces` namespace. The skill reads the credential path from the manifest and reads the credential from that path.

### 4.2 Per-surface credential locations

| Surface | Manifest field | Credential type |
|---------|---------------|----------------|
| `gmail-draft` | `surfaces.gmail.auth_ref` | OAuth refresh token |
| `slack` | `surfaces.slack.auth_ref` | Bot token |
| `calendar` | `surfaces.calendar.auth_ref` | OAuth refresh token |
| `scsiwyg` | `surfaces.scsiwyg.auth_ref` | API key |
| `project-website` | `surfaces.project_website.auth_ref` | Deployment bearer token |

### 4.3 Credential file format

All surface credential files use the same structure:

```yaml
surface: gmail
credential_type: oauth_refresh_token   # oauth_refresh_token | api_key | bearer_token | bot_token
value: "..."                           # the credential value; treat this file as a secret
scopes:                                # OAuth scopes granted; empty list for non-OAuth types
  - https://www.googleapis.com/auth/gmail.compose
  - https://www.googleapis.com/auth/gmail.readonly
account: "keystone@stonemaps.org"      # email or account identifier for this credential
refreshed_at: "2026-04-01T12:00:00Z"   # ISO datetime of last successful token refresh
```

Credential files must be stored outside the facility directory tree (they must not appear in `.project-state/`, `~/work-state/`, or similar). Recommended location: `~/.credentials/{surface}-{project-slug}.yaml`. The `auth_ref` value in `manifest.yaml` is the absolute path to this file.

### 4.4 Credential validation sequence

Before making any surface API call, the skill executes this validation sequence:

1. Read `manifest.yaml:surfaces.{surface}.enabled`. If `false` or absent, abort and surface-degrade (see §6).
2. Read `manifest.yaml:surfaces.{surface}.auth_ref`. If missing, abort and surface-degrade.
3. Read the credential file at the `auth_ref` path. If the file does not exist or cannot be parsed, abort and surface-degrade.
4. For OAuth credentials: check that `refreshed_at` is within the last 60 days. If stale, warn the user that the credential may need refreshing. Do not attempt to auto-refresh unless the skill explicitly owns token refresh logic.
5. Proceed with the surface call.

Surface-degrade means: write the intended artifact to a local fallback file, append a failure event to `logs/activity.ndjson`, and tell the user what manual action to take. See §6 for the complete failure-handling table.

### 4.5 Enabling a surface in manifest.yaml

A surface that passes credential validation but is not listed as enabled in `manifest.yaml` is treated as disabled. The manifest block for each surface follows this structure:

```yaml
surfaces:
  slack:
    enabled: true
    auth_ref: "~/.credentials/slack-ai2610.yaml"
    channels:
      daily_standup: "#ai2610-standup"
      weekly_report: "#ai2610-reports"
      alerts: "#ai2610-alerts"

  gmail:
    enabled: true
    auth_ref: "~/.credentials/gmail-ai2610.yaml"
    always_draft: true
    from_identity: "keystone@stonemaps.org"

  google_calendar:
    enabled: true
    auth_ref: "~/.credentials/calendar-ai2610.yaml"
    calendar_id: "primary"

  scsiwyg:
    enabled: true
    auth_ref: "~/.credentials/scsiwyg-ai2610.yaml"
    site_slug: "ai2610"
    publication_review_required: true

  project_website:
    enabled: true
    auth_ref: "~/.credentials/vercel-ai2610.yaml"
    framework: "nextjs"
    hosting: "vercel"
    production_url: "https://ai2610.project-state.io"
    auto_deploy_on_publish: true
    default_visibility: "consortium"
```

---

## 5. Human-Review Gates

Four distinct gates govern whether an artifact ships automatically or requires human approval. Gates are cumulative: an artifact that triggers Gate 1 and Gate 3 must satisfy both before delivery.

### 5.1 Gate 1 — External Addressee Gate

**Applies to:** `gmail-draft`, `calendar`

**Rule:** Any artifact addressed to a recipient whose email address does not appear in `manifest.yaml:team.*` requires a human to manually send. The skill creates the draft and stops.

**Implementation:** Before creating a Gmail draft or Calendar invite, the skill checks every address in `to[]` and `attendees[]` against the set of email addresses in `manifest.yaml:team.*` (expanded to include all people under each team role) and the `people/` directory entries for the current project.

**If gate applies:** create the draft (Gmail draft or Calendar tentative event), surface the draft ID and a summary to the user, and return without taking further action on that artifact.

**If gate does not apply:** internal-only drafts (e.g., a calendar hold for just the project team) can proceed to the surface without requiring the user to manually trigger the send.

### 5.2 Gate 2 — Publication Review Gate

**Applies to:** `scsiwyg`

**Rule:** Any post that references a funded project, funder organization, or partner organization triggers the MPA publication review window. The window has two sequential clocks: 30-day SC review, followed by 14-day funder review.

**Implementation:** The skill classifies the post by scanning its content for references to:
- The `project.name` or `project.long_name` from `manifest.yaml`
- Any organization listed under `stakeholders[].organization` where the role includes "Funder" or "Partner"
- Any funder namespace keys from `manifest.yaml:funder.*`

**If gate applies:**
1. Submit the post to scsiwyg as a draft.
2. Write a `publications/{pub-id}.yaml` record with `status: under_review`, `review_started: <today>`, `sc_review_deadline: <today + 30 days>`.
3. Notify the user of the review clock and what approvals are needed.
4. Do not publish until `publications/{pub-id}.yaml:status` is set to `approved`.

**If gate does not apply:** the post can proceed after human review of the draft content (no timed review window).

### 5.3 Gate 3 — Contractual Content Gate

**Applies to:** all external surfaces (`gmail-draft`, `slack`, `scsiwyg`, `project-website`)

**Rule:** Any artifact containing financial figures, milestone completion claims, or IP assertions requires PL sign-off before delivery. The skill flags these artifacts with `requires_pl_signoff: true` and does not proceed to the surface.

**Content patterns that trigger Gate 3:**
- Dollar amounts or budget figures tied to the project (e.g., CAD amounts from `manifest.yaml:funder.*`)
- Milestone percentage claims (e.g., "Milestone 3 is 100% complete")
- IP assertions or patent references
- Claim submission cover letters or financial reports

**Implementation:** The `project-notifier` skill checks this flag before calling any surface for an artifact produced by `project-funder-reporting`, `project-status-reporter` (when generating claim-related content), or `project-ip-tracker`.

**If gate applies:** present the artifact to the user with a clear marker that PL sign-off is required. Do not proceed to the surface until the user confirms sign-off.

### 5.4 Gate 4 — Visibility Tier Gate

**Applies to:** `project-website`

**Rule:** Documents classified as `consortium` or `internal` visibility must only appear on authenticated or non-public paths of the website. Documents classified as `public` require the publication review gate (Gate 2 equivalent for website content) before the auto-deploy sends them to the live public URL.

**Implementation:** The `project-website-publisher` skill reads the `visibility` field from `documents/index.yaml` for each document being deployed.

| Document visibility | Deploy behavior |
|-------------------|----------------|
| `internal` | Do not deploy to website at all |
| `consortium` | Deploy to authenticated path only; configure access control in hosting platform |
| `public` | Deploy to live URL only if `require_review_for_public: false` or publication review is complete |

### 5.5 No-gate surfaces (auto-display allowed)

The following surface interactions do not require any human-review gate:

- `slack` posts for team-internal coordination where all recipients are in `manifest.yaml:team.*`
- `work-kanban` local display (localhost only; no external party)
- `docket-digest` file writes (local file; no external party)
- `report-file` writes (local file; no external party)
- `calendar` holds where all attendees are internal team members

---

## 6. Surface Failure Handling

When a surface call fails, the stack must never silently drop the artifact. Every failure degrades to a local-file fallback and produces a user-visible explanation.

### 6.1 Failure type table

| Failure type | Detection method | Behavior |
|---|---|---|
| Surface disabled in manifest | `surfaces.{surface}.enabled: false` or field absent | Degrade to local file; tell user which surface was intended and how to enable it |
| Credential file missing | `auth_ref` path does not exist | Degrade to local file; tell user which credential file is missing and the expected format |
| Credential invalid (auth error) | API returns 401 or 403 | Degrade to local file; tell user to refresh or re-generate the credential |
| API rate limit | API returns 429 | Retry up to 3 times with exponential backoff (30s, 60s, 120s); if all retries exhausted, degrade to local file |
| API 5xx server error | API returns 500–599 | Retry once after 30 seconds; if second attempt fails, degrade to local file |
| Network unavailable | DNS failure, connection refused, timeout | Degrade immediately; do not queue for later |
| Post already exists (idempotency) | API returns 409 or equivalent "already exists" response | Return success with the existing artifact reference; do not create a duplicate |
| Malformed artifact | Skill produces content that fails API schema validation | Do not retry; log the validation error; tell user what was wrong with the artifact |

### 6.2 Degrade-to-local-file protocol

In all failure cases, the following steps are executed in order:

1. Write the intended artifact content to `communications/{type}/YYYY-MM-DD-{slug}.md` within the relevant facility directory. Use the surface type as `{type}` (e.g., `communications/slack/`, `communications/gmail/`, `communications/calendar/`).
2. Append a failure event to `logs/activity.ndjson`:

```json
{
  "ts": "2026-05-05T09:15:00Z",
  "actor": "project-notifier",
  "event": "surface.call.failed",
  "surface": "slack",
  "failure_type": "network_unavailable",
  "artifact_path": "communications/slack/2026-05-05-weekly-tracker.md",
  "detail": "Connection refused to api.slack.com"
}
```

3. Tell the user:
   - Which surface call failed
   - Where the artifact was saved locally
   - What manual action to take (e.g., "paste the content from the file into Slack channel #ai2610-reports")
   - How to retry when the surface becomes available

### 6.3 Retry behavior detail

```
Attempt 1: immediate
Attempt 2: wait 30 seconds
Attempt 3: wait 60 seconds
Attempt 4: wait 120 seconds — if still failing, degrade
```

Retries apply only to transient errors (rate limits, 5xx). Credential and configuration errors are not retried.

---

## 7. Surface Configuration Per Facility

### 7.1 work-state (`~/work-state/`)

| Surface | Configuration | Notes |
|---------|-------------|-------|
| `slack` | Optional. `~/work-state/manifest.yaml:surfaces.slack` | Used by `work-orchestrator` for harvest completion notifications and anomaly alerts |
| `work-kanban` | Always local; no credential; no manifest configuration required | Port configurable in `~/work-state/manifest.yaml:surfaces.kanban.port`; default 3333 |
| `report-file` | Always local; writes to `~/work-state/reports/` | No configuration required |

work-state has the smallest surface footprint. Most of its output is consumed internally by the skill layer or bridged to project-state via `project-harvester`.

### 7.2 docket-state (`~/docket-state/`)

| Surface | Configuration | Notes |
|---------|-------------|-------|
| `slack` (planned as `docket-slack`) | Optional. `~/docket-state/manifest.yaml:surfaces.slack` | Intended for overdue/urgent matter alerts; not yet promoted from Future Surfaces |
| `docket-digest` | Always local; writes to `~/docket-state/digests/YYYY-MM-DD.md` | No configuration required |
| `report-file` | Always local; writes to `~/docket-state/reports/` | No configuration required |

### 7.3 project-state (`.project-state/`)

Project-state has the richest surface configuration. All surfaces can be active simultaneously on a single project.

| Surface | Manifest path | Used for |
|---------|-------------|---------|
| `slack` | `surfaces.slack.channels.*` | Weekly tracker post, phase-gate alerts, deploy notifications, standup summaries |
| `gmail-draft` | `surfaces.gmail.*` | External/formal correspondence: PIC PM emails, consortium updates, SC pack cover letters, claim cover emails |
| `calendar` | `surfaces.google_calendar.calendar_id` | SC meeting holds, claim deadline reminders, milestone due-date events, phase kickoff events |
| `scsiwyg` | `surfaces.scsiwyg.site_slug` | Milestone narratives, monthly briefs, launch announcements, project insight posts |
| `project-website` | `surfaces.project_website.*` | Reference doc pages (cadence, tracker, baselines, milestone specs, team bios) |

Channel granularity for Slack:

```yaml
surfaces:
  slack:
    enabled: true
    auth_ref: "~/.credentials/slack-ai2610.yaml"
    channels:
      daily_standup: "#ai2610-standup"
      weekly_report: "#ai2610-reports"
      alerts: "#ai2610-alerts"
      deploys: "#ai2610-deploys"
```

Skills post to specific channels by purpose. `project-notifier` reads the channel mapping from the manifest. A skill that posts a phase-gate alert reads `channels.alerts`; a skill posting a weekly tracker reads `channels.weekly_report`.

Gmail address configuration:

```yaml
surfaces:
  gmail:
    enabled: true
    auth_ref: "~/.credentials/gmail-ai2610.yaml"
    always_draft: true
    from_identity: "keystone@stonemaps.org"
    draft_to:
      internal: ["jane@atomic47.ai", "bob@atomic47.ai"]
    external_to:
      funder_pm: "jane.smith@pic.global"
      funder_financial: "bob.lee@pic.global"
      consortium: ["partner-contact@partner2.org"]
```

All addresses in `external_to` automatically trigger Gate 1 (External Addressee Gate). The skill does not need to check these manually — it reads this block to determine whether a recipient is external.

### 7.4 strategic-state (`~/.strategic-state/`)

| Surface | Configuration | Notes |
|---------|-------------|-------|
| `strategic-doc` (future) | `~/.strategic-state/manifest.yaml:surfaces.strategic_doc` | Generates `.docx` vision documents locally in `~/.strategic-state/vision-docs/`; no external network call |
| `report-file` | Always local; writes to `~/.strategic-state/reports/` | No configuration required |

Strategic-state intentionally has no external surfaces. Its outputs are consumed by the project team internally and, via `project-harvester`, promoted into project-state where they may reach external surfaces.

---

## 8. Surface-to-Artifact Mapping

For each surface, the artifact types delivered there and the skills that produce them.

| Surface | Artifact types | Producing skills |
|---------|---------------|----------------|
| `slack` | Weekly tracker post, standup summary, phase-gate transition alert, harvest completion notification, deploy notification | `project-notifier`, `work-orchestrator` |
| `gmail-draft` | Monthly technical brief, SC pack cover email, quarterly claim cover email, bi-weekly stakeholder update, formal external correspondence | `project-notifier` |
| `calendar` | SC meeting proposed hold, quarterly claim deadline reminder, milestone due-date event, phase kickoff event | `project-notifier` |
| `scsiwyg` | Milestone completion narrative, monthly project brief, launch announcement, consortium-facing insight post | `project-blog-publisher` |
| `project-website` | Reference document pages (project cadence, milestone tracker, baselines, milestone specs, team directory) | `project-website-publisher` |
| `work-kanban` | Work intelligence dashboard: events by surface, velocity trend, active projects, emerging themes | `work-kanban` |
| `docket-digest` | Daily accountability summary: open matters, overdue items, waiting-on list | `docket-digest` (planned) |
| `report-file` | Weekly project report, weekly email draft, daily digest, quarterly assessment, strategic vision document | `project-status-reporter`, `work-*`, `strategic-state` |

### Artifact flow from state to surface

```
facility entity write
  → project-state logs activity
    → skill reads state
      → skill produces artifact (report or communication)
        → artifact written to facility communications/ or reports/
          → project-notifier routes artifact to surface
            → surface delivers to human
```

The notifier skill is the canonical routing layer for project-state. Other facilities (work-state, docket-state) have their own notifier or digest skills. No skill routes an artifact directly to a surface without going through the appropriate routing skill for that facility.

---

## 9. Adding a New Surface

### Step-by-step protocol

1. **Assign a surface identifier.** Use lowercase-hyphenated form (e.g., `linear-ticket`, `github-discussion`, `ms-teams`). The identifier must be unique across the entire surface registry in this document.

2. **Classify the send semantic.** Map the new surface to one of the seven defined semantics: `draft-only`, `auto-post`, `proposed-hold`, `publication-review`, `auto-deploy`, `local-serve`, `file-write`. If no existing semantic fits, define a new semantic in §3 with the full behavior contract before proceeding.

3. **Assign a human-review gate.** Based on the surface's audience:
   - External parties → at minimum Gate 1 (External Addressee Gate)
   - Public publication → Gate 2 (Publication Review Gate)
   - Contractual content → Gate 3 (Contractual Content Gate)
   - Visibility-tiered content → Gate 4 (Visibility Tier Gate)
   - Team-internal only → no gate (document this explicitly)

4. **Define the credential model.** Specify:
   - The credential type (OAuth refresh token, API key, bearer token, bot token)
   - The `manifest.yaml` field path where `auth_ref` is declared (e.g., `surfaces.linear.auth_ref`)
   - Any scopes required for OAuth types
   - The credential file format (must conform to §4.3)

5. **Define failure-handling behavior.** For each failure type in §6.1, confirm the default behavior applies or document a surface-specific override.

6. **Update SKILL-SPEC.md §7.1.** Add the new surface identifier to the allowed values table for the `surfaces` frontmatter field. Until this update is made, the installer will reject skills that declare the new surface.

7. **Update facility manifests.** Add the `auth_ref` path reference to the `manifest.yaml` for any facility that will use this surface. Use the manifest schema from §4.5 as a template.

8. **Register in this document.** Add the surface to the appropriate table in §2 (External, Publication, or Local/Internal). If it is a future surface being planned but not yet wired, add it to §2.4 with its blocking dependency.

9. **Write a surface integration test.** Before marking the surface as production-ready, complete the testing checklist in §10.

### Constraints on new surfaces

- New surfaces must not bypass any human-review gate that applies to their audience category. If the surface is external-facing in any scenario, it requires at minimum Gate 1.
- New surfaces must implement the degrade-to-local-file protocol from §6.2 before they can be declared production-ready.
- New surfaces must log every call attempt (success and failure) to `logs/activity.ndjson`.

---

## 10. Surface Testing Checklist

Complete this checklist before marking any surface integration as production-ready. Each item must be verified with a real test, not assumed.

### 10.1 Registration and configuration

- [ ] Surface identifier added to SKILL-SPEC.md §7.1 allowed values
- [ ] Surface listed in the appropriate table in §2 of this document
- [ ] Credential model documented with credential type, manifest path, and OAuth scopes (if applicable)
- [ ] `auth_ref` path reference added to relevant facility `manifest.yaml`
- [ ] `surfaces` frontmatter field in every owning skill's SKILL.md lists this surface

### 10.2 Send semantics

- [ ] Send semantic classified and documented (one of: draft-only, auto-post, proposed-hold, publication-review, auto-deploy, local-serve, file-write)
- [ ] Skill `## Behavior` instructions implement the send semantic precisely as defined in §3

### 10.3 Human-review gates

- [ ] Human-review gate(s) identified for this surface
- [ ] Gate logic implemented in the owning skill's `## Behavior` instructions
- [ ] Gate 1 (External Addressee Gate) applies if any recipient can be external — verified
- [ ] No path exists in the skill behavior that bypasses a required gate

### 10.4 Credential validation

- [ ] Skill calls `manifest.yaml:surfaces.{surface}.enabled` check before any API call
- [ ] Skill reads `auth_ref` from manifest before any API call
- [ ] Skill degrades gracefully if `auth_ref` file is missing
- [ ] Skill degrades gracefully if credential is invalid (401/403 response)

### 10.5 Failure handling

- [ ] Surface-disabled degrade: writes artifact to local file, tells user the intended surface
- [ ] Credential-missing degrade: writes artifact to local file, tells user which file is missing
- [ ] API rate limit: retries 3 times with exponential backoff (30s / 60s / 120s), then degrades
- [ ] API 5xx: retries once after 30s, then degrades
- [ ] Network unavailable: degrades immediately (no queue)
- [ ] All failure paths append a `surface.call.failed` event to `logs/activity.ndjson`
- [ ] All failure paths write artifact to `communications/{type}/YYYY-MM-DD-{slug}.md` in the facility

### 10.6 Idempotency

- [ ] Calling the skill twice with the same artifact does not create a duplicate on the surface
- [ ] If the artifact already exists on the surface, the skill returns the existing artifact reference and logs a `surface.call.idempotent` event

### 10.7 Activity logging

- [ ] Every surface call attempt (success or failure) appends an event to `logs/activity.ndjson`
- [ ] Success events include the surface identifier, artifact reference (ID, URL, or path), and timestamp
- [ ] Failure events include the surface identifier, failure type, and the local fallback path

### 10.8 End-to-end test

- [ ] Full happy-path test: artifact flows from facility write through skill to surface delivery
- [ ] Full failure-path test: surface unavailable → local file written → user told what to do manually
- [ ] Gate test: external recipient in artifact → gate fires → draft created → no auto-send
