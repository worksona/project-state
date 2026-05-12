# Docket State — Technical Specification

**Version:** 1.0.0
**Date:** 2026-05-05
**Status:** Draft

---

## Table of Contents

1. [Purpose and Design Philosophy](#1-purpose-and-design-philosophy)
2. [Directory Layout](#2-directory-layout)
3. [manifest.yaml Schema](#3-manifestyaml-schema)
4. [Matter Schema](#4-matter-schema)
5. [Matter Types](#5-matter-types)
6. [Status Model](#6-status-model)
7. [Contact Schema](#7-contact-schema)
8. [state.json Schema](#8-statejson-schema)
9. [Operations](#9-operations)
10. [Concurrency Model](#10-concurrency-model)
11. [Triage Output Format](#11-triage-output-format)
12. [Harvesting Implicit Commitments from Work State](#12-harvesting-implicit-commitments-from-work-state)
13. [Relationships to Other State Facilities](#13-relationships-to-other-state-facilities)

---

## 1. Purpose and Design Philosophy

### 1.1 What the docket is

The docket is a personal register of matters requiring resolution. A matter is something that has been promised, requested, decided, or owed — by or to a specific person — with a deadline and a clear next action. The docket is not a backlog, not a to-do list, and not a project plan. It is an accountability ledger.

The word comes from legal and administrative practice: a docket is a calendar of cases to be heard, matters to be acted on before they lapse. Like a legal docket, each entry has a party, a substance, a status, and a forward obligation. Unlike a task list, a docket item is not implementation-focused. Unlike a project, it is not structured or stakeholder-governed. A matter exists because something was said, asked, or owed.

### 1.2 The four-state intelligence stack

Docket state occupies a specific layer in a four-facility architecture:

| Facility | Layer | Question answered |
|---|---|---|
| `~/work-state/` | Evidence | What happened, per surface? |
| `~/docket-state/` | Accountability | What is owed, to whom, by when? |
| `.project-state/` | Operations | What are the formal milestones, decisions, and stakeholders? |
| `~/.strategic-state/` | Direction | What is the thesis, the force map, the axes? |

Work state captures raw events from external surfaces — GitHub commits, Gmail threads, Slack messages. Project state manages the formal structure of individual projects with milestones, claims, and SC packs. Strategic state tracks direction: what matters and why.

Between work state and project state lives a large category of accountability that neither handles. A Slack message from a client asking for something is not a project milestone. A promise made in a meeting is not a GitHub commit. A proposal request still in the queue is not in any formal project structure. These are matters, and they accumulate invisibly unless tracked explicitly. The docket makes them visible.

### 1.3 Not a task list

A task list is implementation-focused, personal, and often ephemeral. Tasks have no parties. A task like "write proposal" has no contact, no substance, no history, and no accountability trail. Tasks can be deleted without consequence.

A docket matter cannot be deleted. It can be resolved or dismissed, but its history — who asked, when, what was said — is preserved in the thread. Matters exist in relation to another person or obligation, not just as personal reminders.

### 1.4 Not a project

A project has formal structure: milestones with owners, a reporting matrix, stakeholders, a budget, a phase lifecycle. Projects are institutional. A docket matter has none of this structure. It has a contact, a substance, a due date, and a next action. A matter may reference a project, but the matter itself is personal accountability — it belongs to the docket owner, not to a project team.

### 1.5 Design principles

**Lightweight capture, not heavy structure.** Adding a matter should take under 30 seconds. Only `title`, `type`, and `contact.name` are required at capture time. Every other field has a sensible default or is optional.

**Every matter has an owner and a next action.** If it is on the docket, someone is responsible (`next_action_owner`) and something specific can be done (`next_action`). Vague items do not belong on the docket.

**Status is binary at any point in time: waiting or acting.** The status field clarifies which side is acting. `open` and `in-progress` mean the next move is mine. `waiting` means the next move is theirs. This binary is what makes triage fast.

**Cross-context references are advisory.** A matter can reference a work event, a project, or a strategic axis. None of these are required. The docket functions without any cross-references.

**Immutable thread.** Updates are appended to the matter's `thread` array. The file is never rewritten to remove history. If something changed, a new thread entry explains what changed and why.

**The docket is personal.** One facility per person per machine, at `~/docket-state/`. Team accountability is managed at the project-state layer, not here. Docket state does not support multi-user access.

**Capture-low, resolve-fast.** The goal is not a perfectly organized archive of every commitment ever made. The goal is that open matters are cleared quickly and nothing important falls through. Resolved and dismissed matters are kept on disk for reference but are excluded from triage by default.

---

## 2. Directory Layout

```
~/docket-state/
├── manifest.yaml              # owner, preferences, context maps
├── state.json                 # counters, last dates, health
├── SCHEMA.md                  # schema reference (shipped by skill on init)
├── README.md                  # human-readable orientation
├── CONCURRENCY.md             # concurrency rules for this facility
├── matters/
│   └── YYYY-MM-DD/
│       └── {matter-id}.yaml   # one file per matter, bucketed by created date
├── contacts/
│   └── {contact-id}.yaml      # auto-built from matters; never created manually
├── digests/
│   └── YYYY-MM-DD.md          # daily triage output, one file per date run
├── logs/
│   ├── activity.ndjson        # all facility operations, append-only
│   └── skills.ndjson          # per-invocation skill run log
└── locks/
    ├── state.json.lock
    └── manifest.yaml.lock
```

### 2.1 Directory notes

**`matters/YYYY-MM-DD/`** — matters are bucketed by their `created` date, not their `due` date. This keeps directory sizes manageable and makes chronological traversal predictable. The matter ID encodes the creation date, so the directory it lives in is always derivable from its ID.

**`contacts/`** — contact files are rebuilt automatically whenever a matter references a new person. They are never created or edited manually. The skill maintains them as a derived index. See Section 7.

**`digests/`** — triage output is written here for reference. Digests are append-safe; if triage is run twice on the same date, the second run overwrites the digest for that date.

**`logs/activity.ndjson`** — append-only. Every read operation that mutates state (resolve, dismiss, reopen) and every write operation appends one NDJSON line here. Corrections are new entries, not rewrites.

**`locks/`** — advisory lockfiles for `state.json` and `manifest.yaml`. See Section 10.

---

## 3. manifest.yaml Schema

```yaml
facility:
  version: "1.0.0"
  owner: ""                       # email address of the docket owner
  machine: ""                     # hostname or machine identifier
  initialized_at: ""              # ISO-8601 UTC timestamp

preferences:
  default_priority: "normal"      # urgent | high | normal | low
  overdue_threshold_days: 0       # days after due date before flagged OVERDUE (0 = same day)
  stale_threshold_days: 14        # days of no thread activity before flagged STALE

context_maps:
  projects: []                    # list of project slugs from .project-state manifests
                                  # used for cross-reference validation in add-matter
  axes: []                        # list of axis IDs from ~/.strategic-state/axes/
                                  # used for cross-reference validation in add-matter
  people: []                      # list of person IDs from ~/.strategic-state/people/
                                  # used for contact enrichment during upsert
```

### 3.1 Field notes

`preferences.overdue_threshold_days` — set to `0` to flag a matter as OVERDUE on its due date. Set to `1` to give a one-day grace period before flagging. Default is `0`.

`preferences.stale_threshold_days` — matters with no thread activity in this many days are surfaced in triage under the STALE section. Default is `14`.

`context_maps` entries are advisory lists used for validation. If a matter references a `project_id` not in `context_maps.projects`, the skill emits a warning but does not reject the matter. These lists are updated manually or by the docket-orchestrator when a new project or axis is initialized.

---

## 4. Matter Schema

The matter is the atomic unit of the docket. Each matter is one YAML file at `matters/YYYY-MM-DD/{matter-id}.yaml`.

```yaml
id: ""                            # dkt-{YYYY-MM-DD}-{slug}  e.g. dkt-2026-05-05-kf-proposal-feedback
title: ""                         # one-line description of what needs to happen
type: ""                          # commitment | request | decision | follow-up | review | obligation
status: ""                        # open | in-progress | waiting | resolved | dismissed
priority: ""                      # urgent | high | normal | low

due: ""                           # ISO date YYYY-MM-DD (optional but strongly recommended)

# Who this matter is with or for
contact:
  name: ""                        # person name, free text; required
  org: ""                         # organization, free text; optional
  ref: ""                         # person-id in ~/.strategic-state/people/ if known; optional

# What context this matter belongs to
context:
  project_id: ""                  # .project-state project slug; optional
  axis_id: ""                     # strategic axis id from ~/.strategic-state/axes/; optional
  work_event_ref: ""              # work-state event id that originated this matter; optional

# The substance — synthesized by the harvester or written by the user.
# These fields are self-contained: the matter can be read, triaged, and acted on
# without resolving context.work_event_ref. The ref is provenance, not a dependency.
description: ""                   # what needs to happen and why; 2–5 sentences
next_action: ""                   # the specific next step; one sentence
next_action_owner: ""             # "me" or a contact name

# Thread — append-only history of updates; never remove entries
thread:
  - ts: ""                        # ISO-8601 UTC timestamp
    actor: ""                     # "me", a contact name, or a skill name
    note: ""                      # what happened or what changed

# Resolution — required when status is resolved or dismissed
resolved_at: ""                   # ISO date YYYY-MM-DD
resolution: ""                    # what actually happened; required on resolve or dismiss

# Timestamps
created: ""                       # ISO date YYYY-MM-DD
last_updated: ""                  # ISO date YYYY-MM-DD; updated on every write
```

### 4.1 ID format

Matter IDs follow the pattern `dkt-{YYYY-MM-DD}-{slug}` where `YYYY-MM-DD` is the creation date and `slug` is a short kebab-case label derived from the title.

```
dkt-2026-05-05-kf-proposal-feedback
dkt-2026-05-06-pic-quarterly-claim
dkt-2026-05-07-mpa-signature-check
```

Slugs are truncated to 40 characters. If a slug collision exists within the same date bucket, a numeric suffix is appended (`-2`, `-3`).

### 4.2 Required fields at capture

At minimum, a matter must be created with:

| Field | Required | Notes |
|---|---|---|
| `title` | yes | One line |
| `type` | yes | See Section 5 |
| `contact.name` | yes | Free text; no schema requirement |
| `status` | yes | Defaults to `open` |
| `priority` | yes | Defaults to `preferences.default_priority` in manifest |

All other fields default to empty string or empty array and may be populated later via `update-matter` or `add-thread-note`.

### 4.3 Complete example

```yaml
id: dkt-2026-05-05-kf-proposal-feedback
title: Send revised proposal to KF
type: commitment
status: in-progress
priority: high
due: 2026-05-09

contact:
  name: Karen Fitzgerald
  org: NRC Canada
  ref: karen-fitzgerald

context:
  project_id: pic-pcais
  axis_id: ""
  work_event_ref: "slack-evt-2026-05-05-T0847392"

description: >
  Promised Karen I would send the revised cost breakdown and timeline for Phase 2
  by end of week. She flagged the current proposal as missing the sub-contractor
  cost column. This unblocks her internal review.
next_action: Finalize the cost table and attach to revised proposal draft
next_action_owner: me

thread:
  - ts: "2026-05-05T14:23:00Z"
    actor: me
    note: Committed to Karen in Slack that I would send the revision by Friday.
  - ts: "2026-05-06T09:11:00Z"
    actor: docket-state
    note: Status updated from open to in-progress.

resolved_at: ""
resolution: ""

created: 2026-05-05
last_updated: 2026-05-06
```

---

## 5. Matter Types

Six matter types are defined. Each type has a precise definition. Choosing the wrong type does not break anything, but it affects triage grouping and harvest logic, so accuracy matters.

### `commitment`

**Definition:** I said I would do something for someone else. The obligation runs from me to the contact. I am the debtor.

**When to use:** After any verbal, written, or implied promise that I have not yet fulfilled. If I told someone I would send something, review something, or show up somewhere, and I have not done it, that is a commitment.

**Example:** "Promised to send KF the revised proposal by Friday."

**Triage priority:** High. Open commitments that are overdue are the most reputationally significant items on the docket.

---

### `request`

**Definition:** Someone asked me for something and I have not yet responded. The obligation runs from the contact to me, but the ball is in my court to reply.

**When to use:** When someone sent me an email, Slack message, or made a request in a meeting, and I have not yet responded or fulfilled it. The contact is waiting for me.

**Example:** "Client asked for updated cost breakdown via email on May 3."

**Triage priority:** Normal by default. Escalate to high if the contact has followed up or if the request is time-sensitive.

---

### `decision`

**Definition:** A decision that needs to be made and documented before work can proceed or a commitment can be given. No specific contact owns the ask, but the matter has material consequences if left unresolved.

**When to use:** When something is in a holding pattern because a call has not been made. Decision matters typically block other matters. Once decided, the resolution field documents what was decided and why.

**Example:** "Decide whether to accept equity in lieu of cash for the scsiwyg integration."

**Triage priority:** Assign based on what is blocked. A decision blocking a client commitment should be urgent.

---

### `follow-up`

**Definition:** Something I initiated that I need to check on. I am not waiting passively — I need to proactively verify that something happened or that the other party has moved.

**When to use:** After I send something and expect a response. After a milestone is delivered and I need to confirm receipt or acceptance. After I ask someone to do something.

**Example:** "Check if the MPA signature has come through — sent the agreement on May 1."

**Triage priority:** Normal. Escalate if the follow-up is time-sensitive or if a deadline depends on the outcome.

---

### `review`

**Definition:** Something I need to assess and act on. Content, a document, a decision record, or a proposal has arrived and requires my attention and a downstream action.

**When to use:** When someone has shared something for my input or approval. Review matters are different from requests in that the obligation is substantive assessment, not just a reply.

**Example:** "Review the latest draft of the funder reporting profile before the SC meeting."

**Triage priority:** Normal. Escalate if the review is on the critical path for something time-sensitive.

---

### `obligation`

**Definition:** A standing or recurring obligation with a fixed deadline, typically imposed by a contract, regulation, or formal agreement. Not originated by a single interaction — it recurs on a schedule.

**When to use:** For funder reporting deadlines, compliance submissions, contractual deliverables. These are calendar-anchored. When resolved, a new obligation matter for the next cycle should be created.

**Example:** "Submit PIC quarterly claim by April 20."

**Triage priority:** Assign based on urgency. Overdue obligations are always treated as urgent in triage.

---

## 6. Status Model

Five statuses are defined. At any point in time, a matter is either waiting for me to act (`open`, `in-progress`) or waiting for someone else (`waiting`). Closed statuses (`resolved`, `dismissed`) remove the matter from active triage.

### Status definitions

| Status | Definition |
|---|---|
| `open` | Matter exists. The next action is with me. Nothing has been started. |
| `in-progress` | I am actively working on this. The next action is still with me. |
| `waiting` | I have done what I can for now. The next action is with another party. |
| `resolved` | The matter is complete. A resolution has been documented. |
| `dismissed` | The matter will not be acted on. A dismissal reason has been documented. |

### State machine

```
         add-matter
             │
             ▼
           open ──────────────────────────────────────┐
             │                                        │
    start work│                                       │
             ▼                                        │
        in-progress ──────────────────────────────────┤
             │                                        │
    send/delegate│                                    │
             ▼                                        │
          waiting                                     │
             │                                        │
    reply received│                                   │
             ▼                                        │
           open ◄──────────────────────────────────── │
             │                                        │
             ├── resolve-matter ──► resolved           │
             │                                        │
             └── dismiss-matter ──► dismissed ◄───────┘
```

**Allowed transitions:**

| From | To | Operation |
|---|---|---|
| `open` | `in-progress` | `update-matter status: in-progress` |
| `open` | `waiting` | `update-matter status: waiting` |
| `open` | `resolved` | `resolve-matter` |
| `open` | `dismissed` | `dismiss-matter` |
| `in-progress` | `waiting` | `update-matter status: waiting` |
| `in-progress` | `open` | `update-matter status: open` |
| `in-progress` | `resolved` | `resolve-matter` |
| `in-progress` | `dismissed` | `dismiss-matter` |
| `waiting` | `open` | `reopen-matter` or `update-matter status: open` |
| `waiting` | `in-progress` | `update-matter status: in-progress` |
| `waiting` | `resolved` | `resolve-matter` |
| `waiting` | `dismissed` | `dismiss-matter` |
| `resolved` | `open` | `reopen-matter` (requires explanatory note) |
| `dismissed` | `open` | `reopen-matter` (requires explanatory note) |

Transitioning from `resolved` or `dismissed` back to `open` is permitted but requires an explanatory note in the thread. This handles cases where a matter was closed prematurely or circumstances changed.

### Resolution requirement

`resolved` and `dismissed` both require the `resolution` field to be populated before the transition completes. A resolve operation that omits the resolution text is rejected. This is enforced in the `resolve-matter` and `dismiss-matter` operations. See Section 9.

---

## 7. Contact Schema

Contacts are a derived index, not a primary entity. They are auto-built from matter `contact` fields. A contact file is created or updated whenever a matter references a new `contact.name`. Contact files are never created or edited manually.

```yaml
contact_id: ""          # kebab-slug derived from name; e.g. "karen-fitzgerald"
name: ""                # full name as it appears in matters
org: ""                 # most recent org value seen across matters
email: ""               # optional; populated if contact.ref resolves to a strategic-state person with email
strategic_ref: ""       # person-id in ~/.strategic-state/people/ if known; taken from contact.ref
matter_ids: []          # list of all matter IDs that reference this contact
first_seen: ""          # ISO date of earliest matter created date
last_seen: ""           # ISO date of most recent matter created date
```

### 7.1 Contact ID derivation

The `contact_id` is derived by:
1. Lowercasing the full name.
2. Replacing spaces and punctuation with hyphens.
3. Stripping leading and trailing hyphens.
4. Truncating to 50 characters.

Examples:
- `Karen Fitzgerald` → `karen-fitzgerald`
- `Dr. Yuen-Ming Chan` → `dr-yuen-ming-chan`

If two distinct people produce the same slug, the second is disambiguated with the org name: `karen-fitzgerald-nrc`.

### 7.2 Auto-update rules

When a matter is added or updated, the skill:
1. Derives the `contact_id` from `contact.name`.
2. If `contacts/{contact_id}.yaml` does not exist, creates it.
3. If it exists, appends the matter ID to `matter_ids` if not already present, and updates `last_seen`.
4. If the matter's `contact.org` is populated and the contact file's `org` is empty, sets `org`.
5. If the matter's `contact.ref` is populated and the contact file's `strategic_ref` is empty, sets `strategic_ref`.

The `email` field is populated only if the `strategic_ref` resolves to a person YAML in `~/.strategic-state/people/` that contains an email field. The skill does not prompt for email.

### 7.3 rebuild-contacts

The `rebuild-contacts` operation walks all matter files, drops the `contacts/` directory, and rebuilds it from scratch. This is safe to run at any time and is idempotent. It should be run after any manual matter edits or after a file system sync conflict.

---

## 8. state.json Schema

```json
{
  "facility_version": 1,
  "initialized_at": null,
  "last_triage": null,
  "last_validated": null,
  "counters": {
    "matters_total": 0,
    "matters_by_status": {
      "open": 0,
      "in-progress": 0,
      "waiting": 0,
      "resolved": 0,
      "dismissed": 0
    },
    "matters_by_type": {
      "commitment": 0,
      "request": 0,
      "decision": 0,
      "follow-up": 0,
      "review": 0,
      "obligation": 0
    },
    "matters_by_priority": {
      "urgent": 0,
      "high": 0,
      "normal": 0,
      "low": 0
    }
  }
}
```

### 8.1 Counter maintenance

Counters are incremented and decremented on every write operation. They are never the authoritative record — `matters/` files are. If counters drift from reality (due to a crash, sync conflict, or manual edit), run `rebuild-state` to recompute from disk. See Section 9.

`last_triage` is updated to the current ISO date whenever `triage` is called and results are written to `digests/`.

`last_validated` is updated whenever `validate` completes without fatal errors.

---

## 9. Operations

Operations are divided into read operations (no locking, no state.json mutation) and write operations (advisory locking for monolithic files, counter updates, activity log append).

### 9.1 Read operations

All read operations return data without acquiring locks or modifying any file.

---

#### `get-manifest`

Returns the parsed contents of `manifest.yaml`.

---

#### `get-state`

Returns the parsed contents of `state.json`.

---

#### `get-matter id`

Returns the parsed YAML of the matter at `matters/{YYYY-MM-DD}/{id}.yaml`. The date bucket is derived from the ID. If the file does not exist, returns a not-found error.

---

#### `list-matters [filters]`

Returns an array of matter summaries matching the given filters. All filters are optional and combinable.

| Filter | Type | Description |
|---|---|---|
| `status` | string | Match one status value |
| `type` | string | Match one type value |
| `priority` | string | Match one priority value |
| `contact` | string | Substring match against `contact.name` |
| `project_id` | string | Exact match against `context.project_id` |
| `due_before` | ISO date | Include only matters with `due` on or before this date |
| `since` | ISO date | Include only matters with `created` on or after this date |
| `limit` | integer | Maximum results to return (default: 100) |

Returns matter summaries (id, title, type, status, priority, due, contact.name, next_action) sorted by due date ascending, then by priority descending, then by created ascending.

---

#### `triage`

Surfaces all open, in-progress, and waiting matters that meet one or more conditions:

- **Overdue:** `due` is in the past by more than `preferences.overdue_threshold_days` days.
- **Due soon:** `due` is within 3 days from today.
- **Urgent:** `priority` is `urgent`.
- **Stale:** No thread entry in the last `preferences.stale_threshold_days` days and status is not `resolved` or `dismissed`.
- **Waiting (informational):** Status is `waiting` — surfaces for awareness even if not overdue or stale.

A matter may appear in multiple sections if it meets multiple conditions. The triage operation also updates `state.json.last_triage` and writes a digest to `digests/YYYY-MM-DD.md`. See Section 11 for output format.

---

#### `count-matters [status] [type]`

Returns integer counts. If both filters are supplied, returns the count matching both. If neither is supplied, returns `matters_total` from state.json.

---

#### `tail-log [n=50]`

Returns the last `n` lines of `logs/activity.ndjson` as parsed NDJSON objects. Default is 50.

---

#### `validate`

Checks the facility for schema violations, referential integrity issues, and stale locks. Returns a structured report. Never auto-fixes anything.

Checks performed:

| Check | Description |
|---|---|
| Schema validation | Every matter file has required fields with correct types |
| ID-path consistency | Matter ID matches its directory date bucket |
| Contact index | Every matter contact reference exists in `contacts/` |
| Project cross-references | Every `context.project_id` is in `context_maps.projects` in manifest (warning only) |
| Axis cross-references | Every `context.axis_id` is in `context_maps.axes` in manifest (warning only) |
| Counter drift | state.json counters match actual matter file counts |
| Stale locks | Any lockfile in `locks/` with `acquired + ttl_seconds` in the past |
| Resolution completeness | Any matter with status `resolved` or `dismissed` that has an empty `resolution` field |

---

### 9.2 Write operations

All write operations that touch `state.json` or `manifest.yaml` acquire advisory locks before writing and release them after. All write operations append one entry to `logs/activity.ndjson`.

---

#### `init`

Scaffolds the facility directory structure. Creates `manifest.yaml`, `state.json`, `SCHEMA.md`, `README.md`, `CONCURRENCY.md`, and all required subdirectories. Populates `manifest.yaml` with the owner email from the environment and the current machine hostname. Appends a `facility.initialized` event to the activity log.

Idempotent: if `manifest.yaml` already exists, exits with a warning and does not overwrite.

---

#### `add-matter matter_fields`

Creates a new matter file.

Steps:
1. Validate that `title`, `type`, and `contact.name` are present.
2. Derive the matter ID from the current date and a slug of the title.
3. Check idempotency: if `matters/{YYYY-MM-DD}/{id}.yaml` already exists, return the existing matter without modifying anything.
4. Set defaults: `status = open`, `priority = preferences.default_priority`, `created = today`, `last_updated = today`.
5. Write the YAML file.
6. Upsert the contact file in `contacts/`.
7. Acquire state.json lock, increment counters, release lock.
8. Append `matter.created` event to activity log.

Returns the created matter.

---

#### `update-matter id {field: value}`

Patches specific fields on an existing matter.

Steps:
1. Read the current matter file; record `last_updated`.
2. Validate the field names and values.
3. If `status` is being changed, validate the transition is permitted (see Section 6). Reject invalid transitions.
4. If `status` is being set to `resolved` or `dismissed`, require `resolution` to be supplied in the same operation or already present.
5. Apply field patches.
6. Append a thread note summarizing the change: `"Field {field} updated from {old} to {new}."` Actor is `docket-state`.
7. Set `last_updated = today`.
8. Write the updated YAML (tmp + atomic rename).
9. If `status` changed, acquire state.json lock, update counters, release lock.
10. Upsert contact if `contact.name` changed.
11. Append `matter.updated` event to activity log.

---

#### `add-thread-note id note`

Appends one entry to the `thread` array of an existing matter.

Steps:
1. Read the matter file.
2. Append `{ts: now, actor: "me", note: note}` to `thread`.
3. Set `last_updated = today`.
4. Write the updated YAML.
5. Append `matter.thread_note` event to activity log.

Does not modify status or counters.

---

#### `resolve-matter id resolution`

Closes a matter as resolved.

Steps:
1. Read the matter file.
2. Validate that `resolution` is non-empty.
3. Set `status = resolved`, `resolved_at = today`, `resolution = resolution`.
4. Append thread note: `"Matter resolved: {resolution}"`. Actor is `"me"`.
5. Set `last_updated = today`.
6. Write the updated YAML.
7. Acquire state.json lock, decrement the previous status counter, increment `resolved`, release lock.
8. Append `matter.resolved` event to activity log.

---

#### `dismiss-matter id reason`

Closes a matter as dismissed.

Steps:
1. Read the matter file.
2. Validate that `reason` is non-empty.
3. Set `status = dismissed`, `resolved_at = today`, `resolution = reason`.
4. Append thread note: `"Matter dismissed: {reason}"`. Actor is `"me"`.
5. Set `last_updated = today`.
6. Write the updated YAML.
7. Acquire state.json lock, decrement the previous status counter, increment `dismissed`, release lock.
8. Append `matter.dismissed` event to activity log.

---

#### `reopen-matter id note`

Reopens a resolved or dismissed matter.

Steps:
1. Read the matter file.
2. Validate that `note` is non-empty (explanation required).
3. Set `status = open`, clear `resolved_at`.
4. Append thread note: `"Matter reopened: {note}"`. Actor is `"me"`.
5. Set `last_updated = today`.
6. Write the updated YAML.
7. Acquire state.json lock, decrement the previous status counter, increment `open`, release lock.
8. Append `matter.reopened` event to activity log.

---

#### `rebuild-contacts`

Rebuilds the entire `contacts/` directory from matter files.

Steps:
1. Walk all files in `matters/`.
2. Parse each matter's `contact` block.
3. Recompute all contact files from scratch (drop and recreate `contacts/`).
4. Attempt to enrich email fields from `~/.strategic-state/people/` where `strategic_ref` is set.
5. Append `contacts.rebuilt` event to activity log.

Safe to run at any time. Idempotent.

---

#### `rebuild-state`

Recomputes all `state.json` counters by walking the matter files on disk.

Steps:
1. Walk all files in `matters/`.
2. Count by status, type, and priority.
3. Acquire state.json lock.
4. Overwrite counters in `state.json`. Preserve `initialized_at`, `last_triage`, `last_validated`.
5. Release lock.
6. Append `state.rebuilt` event to activity log.

Safe to run at any time. Idempotent.

---

### 9.3 Activity log entry format

Every operation appends one NDJSON line to `logs/activity.ndjson`:

```json
{"ts": "2026-05-05T14:23:00Z", "actor": "me", "skill": "docket-state", "op": "matter.created", "id": "dkt-2026-05-05-kf-proposal-feedback", "detail": ""}
```

| Field | Description |
|---|---|
| `ts` | ISO-8601 UTC timestamp |
| `actor` | `"me"` for user-initiated operations; skill name for automated operations |
| `skill` | The skill that performed the operation |
| `op` | One of: `facility.initialized`, `matter.created`, `matter.updated`, `matter.thread_note`, `matter.resolved`, `matter.dismissed`, `matter.reopened`, `contacts.rebuilt`, `state.rebuilt`, `validate.run` |
| `id` | Matter ID for matter operations; empty for facility operations |
| `detail` | Optional short string with additional context (e.g., old and new status for updates) |

---

## 10. Concurrency Model

Docket state is a personal facility on a local filesystem. It is not designed for concurrent multi-user access. However, multiple skill invocations may run in the same session, and the facility may live on a synced drive (Dropbox, iCloud Drive). The following rules prevent data loss in both scenarios.

### Per-matter files: no locking required

Each matter is one file. Two operations on different matters never touch the same file. Per-matter writes use tmp + atomic rename (write to `{id}.yaml.tmp`, then `rename()` to `{id}.yaml`). This is atomic on POSIX filesystems and safe on macOS APFS.

### Monolithic files: advisory lockfiles

`state.json` and `manifest.yaml` are written rarely (only on write operations) but are read frequently. Before writing either file:

1. Attempt to write `locks/{filename}.lock` containing:
   ```json
   {"actor": "docket-state", "acquired": "2026-05-05T14:23:00Z", "ttl_seconds": 300}
   ```
2. If a lockfile already exists and `acquired + ttl_seconds` is in the future, wait up to 10 seconds and retry. If still locked after 10 seconds, abort the write and surface an error.
3. Complete the write (tmp + atomic rename).
4. Delete the lockfile.

If the skill crashed mid-write and left a stale lockfile, the 300-second TTL allows the next operation to proceed.

### Activity log: O_APPEND writes

`logs/activity.ndjson` is opened with `O_APPEND`. Each entry is one line under 4KB. Single-line appends under 4KB are atomic on macOS APFS and Linux ext4. No locking is needed.

### Idempotency

`add-matter` with an ID that already exists on disk is a no-op. It returns the existing matter without modification and without appending to the activity log. This handles the case where a skill is interrupted after writing the matter file but before incrementing counters — the next invocation detects the existing file and skips creation.

`init` with an existing `manifest.yaml` is a no-op with a warning.

### Synced drive behavior

If the `~/docket-state/` directory is inside a synced folder (iCloud Drive, Dropbox), there is a short window during which sync may deliver a file that conflicts with a local write. To minimize risk:

- Always use tmp + atomic rename, never write directly to the target path.
- Always check `last_updated` before writing a matter you read more than 30 seconds ago.
- Run `validate` after any sync-conflict warning from the OS.

---

## 11. Triage Output Format

The triage operation writes a markdown digest to `digests/YYYY-MM-DD.md` and returns the same content to the caller. The format is:

```markdown
# Docket Triage — YYYY-MM-DD

**Open:** N  |  **In-progress:** N  |  **Waiting:** N  |  **Total active:** N

---

## Overdue (N items)

| ID | Title | Type | Due | Contact | Next action |
|---|---|---|---|---|---|
| dkt-2026-04-28-pic-q1-claim | Submit PIC Q1 claim | obligation | 2026-04-20 | NRC Program Officer at NRC | Submit via the online portal |

---

## Due in 3 days (N items)

| ID | Title | Type | Due | Contact | Next action |
|---|---|---|---|---|---|

---

## Urgent (N items)

| ID | Title | Type | Due | Contact | Next action |
|---|---|---|---|---|---|

---

## Stale — no activity in 14+ days (N items)

| ID | Title | Type | Last updated | Contact | Next action |
|---|---|---|---|---|---|

---

## Waiting on others (N items — informational)

| ID | Title | Type | Due | Contact | Waiting for |
|---|---|---|---|---|---|

---

*Triage run at HH:MM UTC. Stale threshold: N days. Overdue threshold: N days.*
```

### 11.1 Format notes

A matter may appear in multiple sections if it meets multiple conditions (e.g., a matter that is both overdue and urgent appears in both the Overdue and Urgent tables).

The "Waiting for" column in the Waiting section is populated from `next_action` when `next_action_owner` is not `"me"`.

If a section has zero items, the section heading and table are omitted entirely from the digest. The digest for a clean docket reads:

```markdown
# Docket Triage — YYYY-MM-DD

**Open:** 0  |  **In-progress:** 0  |  **Waiting:** 3  |  **Total active:** 3

Nothing requires immediate attention.

## Waiting on others (3 items — informational)
...
```

---

## 12. Harvesting Implicit Commitments from Work State

The docket-state skill (or a companion `docket-harvester` skill) can scan recent work-state events to surface implicit commitment candidates. Harvesting is always candidate-only: the skill presents candidates and asks for confirmation before writing any matter. It never adds matters automatically.

### Synthesis model

When the harvester detects a candidate, it **synthesizes** matter content from the signal — it does not copy the raw event payload. The signal (a Slack message, a Gmail thread) is interpreted to produce a structured commitment: an owner, a contact, a due date, a next action. The raw signal text appears in the candidate presentation under `Signal:` for the user's reference, but what gets written to the matter file is the synthesized interpretation.

`context.work_event_ref` stores the source event's ID as a provenance back-pointer. It allows the user to trace a matter back to the signal that created it. It is not a lookup the matter depends on — the matter is fully self-contained without it. If the source event is later purged from work-state, the matter remains valid.

This distinction matters for triage: a matter can be read, updated, and resolved without work-state being present or initialized on the current machine.

### 12.1 Detection rules

| Work event type | Signal | Candidate matter type |
|---|---|---|
| Gmail `received` with no reply in 48h | Sender + subject | `request` |
| Gmail `sent` followed by no reply from recipient in 72h | Recipient + subject | `follow-up` |
| Slack message containing "I'll", "I will", "by [day/date]" | Message author = me | `commitment` |
| Slack message containing "can you", "could you", "would you mind" directed at me | Sender + channel | `request` |
| Project-state milestone transition to `complete` | Stakeholder name from project manifest | `follow-up` (notify stakeholder) |
| Project-state SC meeting record created | Attendees with open action items | `commitment` |

### 12.2 Candidate presentation format

For each detected candidate, the skill presents:

```
Candidate matter detected

  Type:      commitment
  Source:    slack-evt-2026-05-05-T0847392
  Contact:   Karen Fitzgerald (NRC Canada)
  Title:     Send revised proposal to KF
  Signal:    "I'll get you the revised numbers by Friday" (Slack, #pic-pcais, 2026-05-05 08:47)
  Due:       2026-05-09

  Add to docket? [yes / no / edit]
```

If the user responds `yes`, `add-matter` is called with the candidate fields and `context.work_event_ref` populated. If `edit`, the user supplies overrides before `add-matter` is called. If `no`, the candidate is logged to `logs/activity.ndjson` with `op: harvest.rejected` and discarded.

### 12.3 Harvest cursor

The harvester tracks the last scanned work-state event timestamp in `manifest.yaml` under a `harvest.last_cursor` field. On each harvest run, it scans only events after the cursor to avoid re-surfacing the same candidates.

```yaml
harvest:
  last_cursor: "2026-05-05T14:00:00Z"   # ISO-8601 UTC; updated after each harvest run
  surfaces:
    - gmail
    - slack
```

### 12.4 What harvesting does not do

Harvesting does not create matters from project-state milestones automatically. It does not scan documents, calendar events, or voice transcripts. It does not interpret ambiguous signals as definitive commitments. The human reviews every candidate.

---

## 13. Relationships to Other State Facilities

### 13.1 Work state (upstream)

Work state is the evidence layer. It records what happened on each surface: a GitHub commit was pushed, a Gmail thread arrived, a Slack message was sent. Docket state reads work state during harvest runs to surface commitment candidates.

The relationship is one-directional: docket reads from work, work does not read from docket. Matter files carry `context.work_event_ref` to link back to the originating work-state event for audit purposes.

Docket state does not replace or duplicate work state. It interprets a subset of work events as accountability obligations and makes them actionable.

### 13.2 Project state (peer)

Project state manages the formal structure of individual projects: milestones with percent complete, SC meeting packs, funder claims, change orders. Docket state manages informal and cross-project accountability.

The two facilities operate in parallel. They do not read from each other directly. The connection is human-mediated:

- An SC meeting record in project state may produce several open action items. The project lead creates corresponding docket matters manually or via harvest.
- A docket matter with `context.project_id` set provides traceability back to the relevant project.
- A docket obligation for a funder reporting deadline mirrors a project-state milestone, but the docket matter is the personal reminder layer, not the authoritative project record.

Docket state does not replace project-state milestones. Milestones are formal, institutional, and stakeholder-visible. Docket matters are personal and accountability-focused. The same event can have a milestone in project state and a corresponding matter in docket state.

### 13.3 Strategic state (downstream consumer)

Strategic state tracks direction: axes, force maps, theses, and bets. Docket matters that are strategically significant can carry `context.axis_id` to link them to a strategic axis.

Strategic state assessments may query open docket matters to identify execution gaps — instances where an axis has open commitments that have gone stale, or where the docket has no active follow-ups on a high-priority axis. This query is advisory: it does not modify docket state.

The relationship is downstream: strategic state consumes signals from docket state, not the reverse.

### 13.4 Relationship summary

```
work-state ──(harvest)──► docket-state ──(axis_id)──► strategic-state
                               │
                     (project_id ref only,
                      no data flow)
                               │
                               ╌╌╌╌╌╌╌╌► project-state
```
> Dashed arrow = advisory reference link (a field in the matter carries the project slug). No data flows from docket-state into project-state and no automated read/write occurs in either direction.

| Relationship | Direction | Mechanism |
|---|---|---|
| work-state → docket-state | Upstream source | Harvest scan reads work-state events; `work_event_ref` links back |
| docket-state → project-state | Advisory peer | `context.project_id` carries the link; no automated read/write |
| docket-state → strategic-state | Advisory downstream | `context.axis_id` carries the link; strategic state may query docket matters |
