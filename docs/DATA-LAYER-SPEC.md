# Data Layer — Technical Specification

**Layer:** 1 of 4 (Data Layer)
**Version:** 1.0
**Date:** 2026-05-05
**Status:** Authoritative

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Common Facility Anatomy](#2-common-facility-anatomy)
3. [Universal Naming Conventions](#3-universal-naming-conventions)
4. [Universal Concurrency Model](#4-universal-concurrency-model)
5. [Cross-Facility Entity References](#5-cross-facility-entity-references)
6. [Universal state.json Pattern](#6-universal-statejson-pattern)
7. [Universal Activity Log Schema](#7-universal-activity-log-schema)
8. [Validation Rules Common to All Facilities](#8-validation-rules-common-to-all-facilities)
9. [Facility Initialization Protocol](#9-facility-initialization-protocol)
10. [Stack Health Check](#10-stack-health-check)

---

## 1. Stack Overview

### The four facilities

The data layer consists of four state facilities. Each occupies a distinct role in the intelligence stack:

| Facility | Path | Role |
|---|---|---|
| `work-state` | `~/work-state/` | Evidence — immutable record of what happened, per surface |
| `docket-state` | `~/docket-state/` | Accountability — matters owed, promised, or obligated |
| `project-state` | `.project-state/` (repo-local, walk up from cwd) | Operations — milestones, decisions, risks, stakeholders |
| `strategic-state` | `~/.strategic-state/` | Direction — thesis, force map, axes, innovations |

### Data-flow direction

Evidence flows upward through the stack. Direction flows downward as context. No circular dependencies exist between layers.

```
~/.strategic-state/          DIRECTION
  |  (context: what matters and why)
  v
.project-state/              OPERATIONS
  |  (context: formal project structure)
  v
~/docket-state/              ACCOUNTABILITY
  |  (consumes: work events → implicit commitments)
  v
~/work-state/                EVIDENCE
       (raw events from surfaces)
```

Lower layers provide evidence to upper layers. Upper layers provide meaning and context to lower-layer data. A work event has no strategic meaning unless strategic-state reads it. A docket matter has no project context unless it references a project slug. Upper layers read lower layers; lower layers do not read upper layers. The one directional exception is advisory cross-references (see Section 5).

### What "stack" means

This is not a flat collection of four silos. It is a semantic stack:

- `work-state` records raw facts with no interpretation.
- `docket-state` applies accountability framing: who owes what to whom.
- `project-state` applies formal structure: this milestone, this decision, this risk register.
- `strategic-state` applies meaning: this work proves this thesis claim on this axis.

Each layer requires the layer below it to have happened, and enriches the layer above it. Removing any layer degrades the intelligence available to the layers above it. The stack is only as useful as its least-maintained facility.

### Stack diagram

```
┌─────────────────────────────────────────────────────────────┐
│  ~/.strategic-state/        DIRECTION LAYER                 │
│                                                             │
│  thesis.yaml  force-map/  axes/  people/  innovations/      │
│  evolution-journal/  pipeline/  outcomes/                   │
│                                                             │
│  Reads: project slugs, work-state publish events            │
│  Writes: direction context (downward as advisory refs)      │
└───────────────────────────┬─────────────────────────────────┘
                            │ project_id refs (advisory)
                            │ axis_id refs (advisory)
┌───────────────────────────▼─────────────────────────────────┐
│  .project-state/            OPERATIONS LAYER                │
│                                                             │
│  manifest.yaml  reporting-matrix.yaml  milestones/          │
│  decisions/  risks/  people/  changes/  documents/          │
│  reports/  claims/  sc-packs/  ip-disclosures/              │
│                                                             │
│  Reads: nothing from other facilities at runtime            │
│  Accepts: advisory refs from docket-state and work-state    │
└───────────────────────────┬─────────────────────────────────┘
                            │ project slug refs (advisory)
                            │ axis_id refs (advisory)
┌───────────────────────────▼─────────────────────────────────┐
│  ~/docket-state/            ACCOUNTABILITY LAYER            │
│                                                             │
│  manifest.yaml  matters/  contacts/  threads/               │
│                                                             │
│  Reads: ~/work-state/events/ (receive, share events)        │
│  Writes: matters with work_event_ref (advisory)             │
└───────────────────────────┬─────────────────────────────────┘
                            │ event IDs (immutable)
┌───────────────────────────▼─────────────────────────────────┐
│  ~/work-state/              EVIDENCE LAYER                  │
│                                                             │
│  manifest.yaml  events/  digests/  reports/  cursors/       │
│                                                             │
│  Reads: external surfaces (GitHub, Gmail, Slack, etc.)      │
│  Writes: immutable event records                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Common Facility Anatomy

Every state facility in the stack conforms to the same structural pattern. This anatomy is the contract. New facilities joining the stack must implement all components before they are considered stack-compliant.

### Canonical layout

```
<facility-root>/
├── manifest.yaml          # Stable configuration (owner, connected surfaces, scope)
├── state.json             # Mutable counters and last-updated pointers
├── SCHEMA.md              # Entity schemas — authoritative; skills validate against this
├── CONCURRENCY.md         # Write rules specific to this facility
├── README.md              # Human-readable entry point
├── <entity-dirs>/         # One file per entity, named by convention (see Section 3)
├── logs/
│   └── activity.ndjson    # Append-only event log (see Section 7)
└── locks/
    └── <filename>.lock    # Advisory lockfiles (see Section 4)
```

### Component roles

**`manifest.yaml`**
Stable configuration. Rarely mutated after init. Contains owner identity, the surfaces or projects this facility is connected to, and top-level configuration values. All skills read it; few skills write it. Protected by Tier 2 advisory locking.

**`state.json`**
Mutable operational state. Written by harvesters after each harvest cycle and by skills after structural changes. Contains counters, last-activity pointers, and cursor timestamps. Protected by Tier 2 advisory locking.

**`SCHEMA.md`**
Authoritative entity schemas for all types stored in this facility. Skills validate entity writes against this document. SCHEMA.md is not generated — it is authored and versioned. It is the normative reference that SKILL.md files cite when describing write operations.

**`CONCURRENCY.md`**
Facility-specific concurrency rules. Describes which files require locking, the TTL used, and any facility-specific edge cases beyond the universal model in Section 4. Skills must read this before implementing write operations for that facility.

**`README.md`**
Human-readable entry point. Explains the facility's purpose, directory layout, and how to use the skill suite against it. Written during init; kept current by the maintainer.

**Entity directories**
One YAML or Markdown file per entity. Directory names are facility-specific (e.g., `milestones/`, `matters/`, `events/`). File naming follows universal conventions defined in Section 3. No subdirectory nesting beyond one level unless specified in SCHEMA.md.

**`logs/activity.ndjson`**
Append-only NDJSON event log. Every structural operation writes at least one entry. Never rewritten. See Section 7 for the line schema.

**`locks/`**
Directory for advisory lockfiles. Skills create `<filename>.lock` before writing shared mutable files and delete the lock on completion. See Section 4 for the full protocol.

---

## 3. Universal Naming Conventions

### Facility locations and scope

| Facility | Location | Scope | Discovery |
|---|---|---|---|
| `work-state` | `~/work-state/` | Personal, machine-local | Fixed path |
| `docket-state` | `~/docket-state/` | Personal, machine-local | Fixed path |
| `project-state` | `.project-state/` | Per-project, shared drive | Walk up from cwd until found |
| `strategic-state` | `~/.strategic-state/` | Personal, machine-local | Fixed path |

`project-state` is the only facility with a variable path. Skills must walk up from the current working directory until they find a `.project-state/` directory or reach the filesystem root. If not found, they abort with a clear error rather than creating a facility in the wrong location.

### Entity ID conventions

| Facility | Entity type | ID pattern | Example |
|---|---|---|---|
| `work-state` | Events | `{surface}-{type}-{YYYY-MM-DD}-{8-char-hash}` | `github-commit-2026-05-05-a3f7b2c1` |
| `docket-state` | Matters | `dkt-{YYYY-MM-DD}-{slug}` | `dkt-2026-05-05-kf-proposal` |
| `project-state` | Milestones | `M{NN}-{slug}` | `M01-data-pipeline-v1` |
| `project-state` | Risks | `R-{NN}-{slug}` | `R-03-compute-overrun` |
| `project-state` | Decisions | `{YYYY-MM-DD}-{slug}` | `2026-04-10-architecture-choice` |
| `project-state` | Changes | `{YYYY-MM-DD}-{slug}` (log) / `CO-{NN}-{slug}` (orders) | `CO-01-scope-extension` |
| `strategic-state` | Evolution entries | `evo-{YYYY-MM-DD}-{slug}` | `evo-2026-03-15-ai-pivot` |
| `strategic-state` | Signals | `sig-{YYYY-MM-DD}-{slug}` | `sig-2026-04-22-market-validation` |

Rules:
- Slugs use lowercase kebab-case. No spaces, no underscores, no special characters other than hyphens.
- Numeric counters (`NN`) are zero-padded to two digits minimum.
- Hash components in work-state IDs are the first 8 characters of a deterministic hash of the source event's unique key (surface + external ID). This makes re-ingestion idempotent.
- The `id` field in every entity file must exactly match the filename without extension.

### Timestamp conventions

| Field type | Format | Example |
|---|---|---|
| Full timestamp | ISO-8601 UTC | `2026-05-05T14:30:00Z` |
| Date-only | `YYYY-MM-DD` | `2026-05-05` |
| Filename date prefix | `YYYY-MM-DD` | `2026-05-05-scope-change.yaml` |
| Log `ts` field | ISO-8601 UTC | `2026-05-05T14:30:00Z` |

All timestamps are UTC. No local time. No timezone offsets. Fractional seconds are permitted but not required.

### Common frontmatter fields

Every entity file in every facility must carry these three fields:

```yaml
id: <matches filename without extension>
created: 2026-05-05T14:30:00Z
last_updated: 2026-05-05T14:30:00Z
```

These fields are the minimum required for validation to pass (see Section 8). Facilities extend this with type-specific fields defined in their SCHEMA.md.

### Status vocabulary

Consistent status values across all four facilities:

| Category | Values |
|---|---|
| Entity lifecycle | `active` / `paused` / `archived` |
| Process state | `open` / `in-progress` / `waiting` / `resolved` / `dismissed` |
| Health signal | `green` / `yellow` / `red` |
| Evidence strength | `strong` / `moderate` / `nascent` |

Facilities must not invent alternative status values for these categories. Extensions (facility-specific sub-states) must be additive fields, not replacements.

---

## 4. Universal Concurrency Model

All four facilities implement the same three-tier concurrency model. This section is the authoritative cross-facility reference. Facility-specific CONCURRENCY.md files may add edge cases but must not contradict this model.

### Tier 1 — File-per-entity (lock-free)

Every entity lives in its own file. Concurrent writes to different entities in the same facility are safe without any coordination.

Idempotency via deterministic IDs: writing the same entity twice produces the same file. An overwrite is safe because the content is identical. Skills that are uncertain whether a prior run completed successfully may re-derive the ID and re-write the entity without checking first.

Covered by Tier 1:
- `work-state`: all event files in `events/`
- `docket-state`: all matter files in `matters/`, contact files in `contacts/`
- `project-state`: all files in `milestones/`, `decisions/`, `risks/`, `people/`, `changes/change-log/`, `changes/change-orders/`, `documents/`, `ip-disclosures/`
- `strategic-state`: all files in `force-map/`, `axes/`, `people/`, `innovations/`, `evolution-journal/`, `pipeline/`, `outcomes/`

### Tier 2 — Shared mutable files (advisory lockfiles)

Shared mutable files are touched by multiple skills and harvesters. They require advisory locking to prevent partial reads during writes.

**Protocol:**

1. Acquire lock: write `locks/{filename}.lock` with the following content:
   ```json
   {"pid": 12345, "ts": "2026-05-05T14:30:00Z", "holder": "project-orchestrator"}
   ```
2. Check if a lock already exists:
   - If the lock file is absent or older than 300 seconds: proceed (steal stale lock by overwriting).
   - If the lock file exists and is fresher than 300 seconds: wait up to 30 seconds in 5-second increments, then abort with a clear error naming the holder.
3. Read the target file into memory.
4. Mutate in memory.
5. Write to a `.tmp` sibling file, then rename (atomic on POSIX systems).
6. Release: delete the lock file.

**Files subject to Tier 2 in each facility:**

| Facility | Protected files |
|---|---|
| `work-state` | `manifest.yaml`, `state.json` |
| `docket-state` | `manifest.yaml`, `state.json` |
| `project-state` | `manifest.yaml`, `state.json`, `reporting-matrix.yaml` |
| `strategic-state` | `manifest.yaml`, `state.json`, `thesis.yaml` |

Lock TTL is 300 seconds for all facilities. Lock files older than 300 seconds are considered abandoned and may be stolen without warning.

### Tier 3 — Append-only logs (no locking)

All `logs/*.ndjson` files use `O_APPEND`. Each write appends a single JSON object terminated by a newline.

Rules:
- Each line must be a single valid JSON object, under 4 KB.
- POSIX guarantees atomicity for writes up to PIPE_BUF (minimum 512 bytes, typically 4096 bytes). Lines under 4 KB are safe to append concurrently without coordination.
- Lines larger than 4 KB must be split into a summary line referencing a sidecar file, or the heavy payload written separately. The log line carries a reference, not the payload.
- Log files are never rewritten or compacted. Corrections are new entries with `event: "entity.corrected"` and a `corrects_id` field referencing the original entry's `ts` + `entity_id`.

### Cross-facility concurrency

No facility holds locks in another facility. Cross-facility operations are strictly sequential:

1. Complete all reads from facility A (no locks held).
2. Acquire lock in facility B if writing a Tier 2 file.
3. Write to facility B.
4. Release lock.

There is no distributed lock coordinator. No skill may hold two facilities' locks simultaneously. If a skill needs to update both `state.json` in `work-state` and a matter in `docket-state`, it completes each write independently in sequence.

---

## 5. Cross-Facility Entity References

### Reference table

Entities in one facility may carry references to entities in another facility. All cross-facility references are advisory unless explicitly marked as enforced.

| Source field | Resolves to | Target facility | Validation |
|---|---|---|---|
| `work-state` event `project` | project slug | `.project-state/manifest.yaml:project.id` | Advisory only |
| `docket-state` matter `context.project_id` | project slug | `.project-state/` | Advisory only |
| `docket-state` matter `context.work_event_ref` | event id | `~/work-state/events/` | Advisory only |
| `docket-state` matter `context.axis_id` | axis slug | `~/.strategic-state/axes/` | Advisory only |
| `docket-state` matter `contact.ref` | person-id | `~/.strategic-state/people/` | Advisory only |
| `strategic-state` force-map entry `project_id` | project slug | `.project-state/` | Advisory only |
| `strategic-state` outcome `project_id` | project_id | `~/.strategic-state/force-map/` | Enforced within strategic-state |
| `strategic-state` person `roles_in_portfolio[]` | project_id | `~/.strategic-state/force-map/` | Enforced within strategic-state |

### Advisory vs. enforced

**Advisory references:** The referencing facility does not check that the referenced entity exists in the other facility at write time. A work event may carry `project: kf-platform` even if no `.project-state/` exists in the current directory tree. A docket matter may reference `work_event_ref: github-commit-2026-05-05-a3f7b2c1` whether or not that event file is present. This prevents tight coupling between independent facilities that may be initialized at different times or maintained by different people.

**Enforced references:** Intra-facility references within `strategic-state` are validated at write time. A `force-map` entry must reference an axis that exists in `~/.strategic-state/axes/`. An outcome must reference a `project_id` that exists in `~/.strategic-state/force-map/`. These constraints are enforced because all referenced entities are within the same facility and under the same skill's control.

### Dangling references

A dangling reference is an advisory cross-facility reference that does not resolve. Dangling references are not errors. They are reported during stack health checks (Section 10) and during individual facility validation runs. They signal one of:

- The referenced entity was never created (planning artifact referencing a future project).
- The referenced facility is not initialized on this machine.
- The referenced entity was archived and its file removed (violates the append-only principle for log entries; removal of entity files should be avoided).

Skills that read cross-facility references must handle the non-existent case gracefully: skip enrichment, note the dangle in the output, and continue.

---

## 6. Universal state.json Pattern

Every facility's `state.json` follows the same base structure. Facilities extend it with their own pointers and counters.

### Base schema

```json
{
  "facility_version": 1,
  "initialized_at": null,
  "last_validated": null,
  "counters": {
    "<entity_type>_total": 0
  }
}
```

**Base field definitions:**

| Field | Type | Description |
|---|---|---|
| `facility_version` | integer | Schema version of this facility's state.json. Increment when fields are added or removed. |
| `initialized_at` | ISO-8601 UTC string or null | Written once during `init`. Never updated. Null if facility is not yet initialized. |
| `last_validated` | ISO-8601 UTC string or null | Written by the validate operation. Null until first validation run. |
| `counters` | object | Key-value map of `{entity_type}_total` counters. Values are counts of on-disk files. |

### Facility extensions

Each facility adds its own pointers and counters beyond the base:

**`work-state` extensions:**
```json
{
  "last_harvest_at": null,
  "cursors": {},
  "counters": {
    "events_total": 0,
    "digests_total": 0
  }
}
```

**`docket-state` extensions:**
```json
{
  "last_triage_at": null,
  "counters": {
    "matters_total": 0,
    "matters_open": 0,
    "matters_resolved": 0,
    "contacts_total": 0
  }
}
```

**`project-state` extensions:**
```json
{
  "last_report_at": null,
  "counters": {
    "milestones_total": 0,
    "decisions_total": 0,
    "risks_total": 0,
    "changes_total": 0,
    "documents_total": 0
  }
}
```

**`strategic-state` extensions:**
```json
{
  "last_thesis_update": null,
  "last_assessment_at": null,
  "counters": {
    "force_map_entries_total": 0,
    "axes_total": 0,
    "people_total": 0,
    "innovations_total": 0,
    "evolution_entries_total": 0
  }
}
```

### Counter update discipline

Counters are not updated on every write. They are lazy: updated during validation runs and after bulk operations. Skills that create entities increment the relevant counter after a successful write. Skills must never decrement counters when archiving entities — counters represent total created, not current active.

---

## 7. Universal Activity Log Schema

Every facility writes to `logs/activity.ndjson`. All entries share the same line format.

### Line schema

```json
{"ts":"2026-05-05T14:30:00Z","actor":"project-orchestrator","event":"milestone.updated","summary":"Milestone M02-model-training updated to 75% complete","entity_id":"M02-model-training","entity_kind":"milestone"}
```

**Field definitions:**

| Field | Required | Description |
|---|---|---|
| `ts` | Yes | ISO-8601 UTC timestamp of the event |
| `actor` | Yes | Skill name that wrote the entry (e.g., `project-orchestrator`, `work-harvester-github`) |
| `event` | Yes | Dot-separated event namespace (see canonical namespaces below) |
| `summary` | Yes | One human-readable sentence describing what happened |
| `entity_id` | No | ID of the primary entity affected, if applicable |
| `entity_kind` | No | Type of entity affected (e.g., `milestone`, `matter`, `event`, `axis`) |

Additional fields are permitted. Unknown fields are ignored by validation. Do not remove existing fields from lines already written.

### Canonical event namespaces

| Namespace prefix | Used for | Applies to |
|---|---|---|
| `facility.*` | Init, validation, rebuild, migration operations | All four facilities |
| `entity.*` | Create, update, resolve, archive on any entity type | All four facilities |
| `harvest.*` | Surface harvest runs and cursor advances | `work-state`, `strategic-state` |
| `report.*` | Report generation, draft creation | `project-state`, `work-state` |
| `integration.*` | Cross-facility data pulls and reference checks | Any facility reading another |

### Standard event names

| Event | When written |
|---|---|
| `facility.initialized` | `init` completes successfully |
| `facility.validated` | `validate` completes (pass or fail) |
| `facility.rebuilt` | A rebuild or migration operation completes |
| `entity.created` | A new entity file is written for the first time |
| `entity.updated` | An existing entity file is overwritten with changes |
| `entity.archived` | An entity's status is set to `archived` |
| `entity.resolved` | A matter, risk, or similar entity moves to `resolved` |
| `entity.corrected` | A correction entry superseding a prior entry (log corrections) |
| `harvest.started` | A harvester begins a surface poll |
| `harvest.completed` | A harvester finishes a surface poll |
| `harvest.cursor_advanced` | A surface cursor is updated after a successful harvest |
| `report.generated` | A report artifact is written to disk |
| `report.drafted` | A Gmail draft is created from a report |
| `integration.read` | A cross-facility read is performed |
| `integration.dangling_ref` | A cross-facility reference did not resolve |

---

## 8. Validation Rules Common to All Facilities

Every facility's `validate` operation runs the following checks. Order is not mandated, but all checks must be run and all violations collected before returning results.

| Rule | Check |
|---|---|
| 1. Parse integrity | All `.yaml` and `.json` files in the facility parse without error. |
| 2. Required frontmatter | Every entity file has `id`, `created`, and `last_updated` fields present and non-empty. |
| 3. ID-filename agreement | Every entity file's `id` field exactly matches its filename without extension. |
| 4. Stale locks | No lockfile in `locks/` is older than 300 seconds. Report each stale lock by filename, holder, and age. |
| 5. Counter accuracy | `state.json:counters` values match on-disk entity file counts within a lazy-update tolerance of ±5. Values outside tolerance are flagged. |
| 6. Log integrity | `logs/activity.ndjson` is valid NDJSON. Every line is a parseable JSON object. No truncated lines. |
| 7. Required subdirectories | All directories defined in this facility's canonical layout exist. Missing directories are flagged. |
| 8. Timestamp format | All `created`, `last_updated`, and `ts` values parse as ISO-8601 UTC. Non-conforming values are flagged. |

**Validation never auto-fixes.** It returns a structured report with pass/fail per rule and the list of specific violations (file path, field, found value, expected value or pattern). Auto-fix behavior belongs in a separate `repair` operation, explicitly documented in the facility's SKILL.md.

**Validation output format:**

```yaml
facility: project-state
path: /Users/davidolsson/WORKSONA/my-project/.project-state/
run_at: 2026-05-05T14:30:00Z
result: fail
rules:
  - rule: parse_integrity
    status: pass
    violations: []
  - rule: required_frontmatter
    status: fail
    violations:
      - file: milestones/M03-reporting-api.yaml
        missing_fields: [last_updated]
  - rule: id_filename_agreement
    status: pass
    violations: []
  - rule: stale_locks
    status: pass
    violations: []
  - rule: counter_accuracy
    status: pass
    violations: []
  - rule: log_integrity
    status: pass
    violations: []
  - rule: required_subdirectories
    status: pass
    violations: []
  - rule: timestamp_format
    status: pass
    violations: []
```

---

## 9. Facility Initialization Protocol

Every facility implements `init` using this protocol. Steps are sequential. Deviation from this order is not permitted.

### Steps

1. **Guard check.** Does `manifest.yaml` exist at the facility root? If yes, abort immediately with: `Facility already initialized at {path}. To reinitialize, remove manifest.yaml manually.` Do not overwrite any existing data.

2. **Create directory tree.** Create all directories defined in the facility's canonical layout. Skip directories that already exist. Do not fail if a directory is present.

3. **Write seed files.** Copy or render from `references/scaffold/` (or equivalent template source):
   - `state.json` — base schema with all values null or zero
   - `SCHEMA.md` — entity schemas for this facility
   - `CONCURRENCY.md` — pointing at this document (Section 4) plus facility-specific additions
   - `README.md` — skeleton entry point

4. **Collect configuration.** Prompt the user for values required to populate `manifest.yaml`:
   - Owner name and contact
   - Connected surfaces or project IDs
   - Any facility-specific required fields (e.g., `project.id` for project-state, `thesis` seed for strategic-state)

5. **Write `manifest.yaml`.** Render the filled manifest template and write it to the facility root. No locking required — no other process can be writing to a newly created facility.

6. **Write initial log entry.** Append to `logs/activity.ndjson`:
   ```json
   {"ts":"2026-05-05T14:30:00Z","actor":"<facility-skill>","event":"facility.initialized","summary":"Facility initialized at {path} by {owner}"}
   ```

7. **Return confirmation.** Print one of the following, matched to the facility:

| Facility | Confirmation message |
|---|---|
| `work-state` | "Facility initialized at ~/work-state/. Next: run work-harvester-github (or another harvester) to begin ingesting events." |
| `docket-state` | "Facility initialized at ~/docket-state/. Next: add your first matter with docket-state add-matter." |
| `project-state` | "Facility initialized at .project-state/. Next: add a project with project-scaffolder, or add your first milestone." |
| `strategic-state` | "Facility initialized at ~/.strategic-state/. Next: set the thesis with strategic-state set-thesis." |

---

## 10. Stack Health Check

The stack health check provides a unified view across all four facilities. It is invoked by any skill that implements `stack-health` or by the work-orchestrator's health-check mode.

### Protocol

For each of the four facilities, in stack order (work → docket → project → strategic):

1. Check: does the facility root directory exist?
2. If yes: check `manifest.yaml` exists (facility is initialized).
3. If initialized: run validation (Section 8) and collect results.
4. Read `logs/activity.ndjson` — find the most recent entry's `ts` field.
5. Count open entities (facility-specific: open matters for docket, active milestones for project, etc.).
6. Count stale locks (files in `locks/` older than 300 seconds).
7. Assign a health signal:
   - `green` — all validation rules pass, no stale locks, activity within 7 days.
   - `yellow` — any non-critical validation failure, or no activity in 7–30 days.
   - `red` — facility absent, uninitialized, parse errors, or no activity in 30+ days.

After all four facilities are checked:

8. Cross-facility reference spot-check: sample up to 20 advisory cross-facility references from docket-state matters and strategic-state force-map entries. Attempt to resolve each reference against its target facility. Count resolved vs. dangling.

### Output format

```
# Stack Health — {YYYY-MM-DD}

| Facility        | Initialized | Last Activity | Open Items                | Stale Locks | Status |
|-----------------|-------------|---------------|---------------------------|-------------|--------|
| work-state      | Yes         | 2h ago        | —                         | 0           | green  |
| docket-state    | Yes         | 1d ago        | 7 open matters            | 0           | yellow |
| project-state   | Yes         | 3h ago        | 3 milestones at-risk      | 0           | yellow |
| strategic-state | Yes         | 5d ago        | —                         | 0           | green  |

Cross-facility references sampled: 12 checked, 11 resolved, 1 dangling.
  - dkt-2026-04-30-kf-proposal → context.project_id "kf-platform-v2" not found in .project-state/
```

### Health signal definitions

| Signal | Meaning |
|---|---|
| `green` | Facility is initialized, passes all validation rules, has no stale locks, and has activity within the last 7 days. |
| `yellow` | Facility is initialized and readable, but has one or more non-critical validation failures, stale locks, or no activity in 7–30 days. |
| `red` | Facility is absent, uninitialized (no manifest.yaml), has parse errors that prevent reading, or has had no activity in 30+ days. |

A `red` facility in any position degrades the intelligence available to all facilities above it in the stack. A `red` work-state means no new evidence is flowing. A `red` strategic-state means no directional context is available to enrich lower-layer reports.

### Open item definitions by facility

| Facility | "Open items" means |
|---|---|
| `work-state` | Not applicable (events are immutable; no "open" concept) |
| `docket-state` | Matters with `status` in `["open", "in-progress", "waiting"]` |
| `project-state` | Milestones with `status: active` and `health: red` or `health: yellow` |
| `strategic-state` | Not applicable at the health check level |
