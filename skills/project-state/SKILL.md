---
name: project-state
description: "The shared memory of a grant-funded project. Read, write, or validate project state — manifest, current phase, milestones, decisions, risks, changes, people, documents, activity log. Trigger on 'what's the project state', 'record a decision', 'log this change', 'update milestone M03', 'who is on the steering committee', 'what phase are we in', 'append to activity log', 'check state health', 'validate the manifest', or any request that reads or writes `.project-state/`. Also trigger automatically whenever another project-* skill (phase-gate, document-curator, milestone-manager, status-reporter, notifier, sc-meeting, claim-prep, change-register, orchestrator) needs to read or write state — they route through this one. Works for any `.project-state/` found by walking up from cwd."
---

# Project State — the memory layer

## Purpose

Every `project-*` skill depends on this one. `project-state` is the *only* skill that reads and writes `.project-state/` directly; every other skill expresses intent ("create milestone", "transition phase") and this skill enforces schema, concurrency, and logging.

Without this skill, state edits drift, two agents clobber each other on the shared drive, and the activity log stops being trustworthy.

## Finding `.project-state/`

Walk up from the current working directory until a `.project-state/manifest.yaml` is found. That directory is the project root. If none is found:
- If the user asked a read-only question, say so and stop.
- If the user asked to initialize, direct them to run `project-scaffolder` (or, while that skill isn't built, follow the BLUEPRINT.md in the project root).

```bash
# Locate state (pseudocode)
dir = cwd
while dir != "/":
  if exists(dir + "/.project-state/manifest.yaml"): return dir + "/.project-state"
  dir = parent(dir)
raise "No .project-state/ found walking up from " + cwd
```

## Schema

The canonical schema lives in `.project-state/SCHEMA.md` *in the project itself*. This skill validates against that file; it does not carry its own schema because different projects may extend the schema for their specific needs.

Every entity YAML has common frontmatter:
- `id` (matches filename minus extension)
- `kind` (`milestone` | `decision` | `risk` | `change-log` | `change-order` | `person` | `publication` | `ip-disclosure` | `sc-meeting` | `quarterly-claim`)
- `created`, `created_by`, `last_modified`, `last_modified_by` (ISO-8601 UTC)
- `phase` (phase this entity was created in)

Before every write, verify the document has all common frontmatter. Refuse to write if `id`, `kind`, or timestamps are missing.

## Operations

### Read operations (no locking needed)

**Get manifest.** Return parsed `manifest.yaml`.

**Get state.** Return parsed `state.json`.

**Get current phase.** `state.json:current_phase` → read `phases/<phase>/manifest.yaml`.

**Get entity.** Input: `kind` + `id`. Locate file by filename convention (see SCHEMA.md). Return parsed YAML.

**List entities.** Input: `kind`, optional filters (status, owner, phase). Return array.

**Tail activity log.** Input: `n=50`. Return last n lines of `logs/activity.ndjson` parsed.

**Count entities.** Return counters from `state.json`.

**Validate.** Walk every YAML/JSON in `.project-state/`; confirm it parses and has required frontmatter. Report deviations; do not auto-fix.

### Write operations (with locking + logging)

For every write:

1. **Find lockfile.** Check `<target>.lock`. If it exists and its `acquired + ttl_seconds` is in the future, wait (up to 30 s) or abort.
2. **Acquire lock.** Write `<target>.lock` = `{actor, acquired, ttl_seconds: 300}`.
3. **Read current state** of the target if it exists.
4. **Check staleness.** If the caller passed a `base_last_modified` and the current file's `last_modified` is newer, return a CONFLICT to the caller. Do not overwrite.
5. **Apply the change.** Update `last_modified`, `last_modified_by`, fields under change. Preserve all other fields.
6. **Write the file.**
7. **Release lock.** Delete `<target>.lock`.
8. **Append to activity log.** One NDJSON line with `ts, actor, event, id, summary`.
9. **Update state.json counters** if creating a new entity (also under the lock).

### Canonical write events

| Operation                           | Event name                  | Also bumps counter     |
| ----------------------------------- | --------------------------- | ---------------------- |
| Create milestone                    | `milestone.created`         | `counters.milestones`  |
| Update milestone                    | `milestone.updated`         | —                      |
| Complete milestone                  | `milestone.completed`       | —                      |
| Record decision                     | `decision.recorded`         | `counters.decisions`   |
| Log change (non-material)           | `change.logged`             | `counters.change_log_entries` |
| Draft change order                  | `change-order.drafted`      | `counters.change_orders` |
| Submit change order                 | `change-order.submitted`    | —                      |
| Approve change order                | `change-order.approved`     | —                      |
| Open risk                           | `risk.opened`               | `counters.risks`       |
| Close/materialize risk              | `risk.closed` / `risk.materialized` | —              |
| Register document                   | `document.registered`       | —                      |
| Promote to source-of-truth          | `document.sot.promoted`     | —                      |
| Schedule SC meeting                 | `sc.meeting.scheduled`      | `counters.sc_meetings` |
| Hold SC meeting / distribute minutes | `sc.meeting.held` / `sc.minutes.distributed` | —    |
| Draft claim / submit / paid         | `claim.drafted` / `claim.submitted` / `claim.paid` | `counters.quarterly_claims` on draft |
| Phase transition                    | `phase.transition`          | —                      |
| IP disclosure                       | `ip.disclosed`              | `counters.ip_disclosures` |
| Publication proposed / approved     | `publication.proposed` / `publication.approved` | `counters.publications` on proposed |
| Generate report                     | `report.generated`          | —                      |
| Health assessed                     | `health.assessed`           | —                      |

Event names are lowercase, dot-separated, noun.verb.

## Concurrency discipline (from CONCURRENCY.md)

- **File-per-entity** — never fuse `milestones.yaml` or `decisions.yaml`. Each entity is its own file.
- **Advisory lockfiles** with 5-minute TTL on `manifest.yaml`, `state.json`, and `tracking/*.xlsx`.
- **Append-only logs** — never rewrite `logs/*.ndjson`; correct with new entries.
- **Deterministic filenames** — two agents creating the same entity produce the same filename.

## What this skill does NOT do

- **Does not make project decisions.** Doesn't decide if a change is material (that's `project-change-register`) or if a phase gate is clearable (that's `project-phase-gate`).
- **Does not generate reports.** Just returns data (that's `project-status-reporter`).
- **Does not send notifications.** Just writes activity events (that's `project-notifier`).
- **Does not classify documents.** Just reads/writes `documents/index.yaml` (that's `project-document-curator`).

## Examples

### "What phase are we in?"
Read `state.json:current_phase`. Read `phases/<phase>/manifest.yaml`. Return phase label + gate-out checklist with done/pending counts.

### "Update M03 percent complete to 35%"
1. Load `milestones/M03-cdi-pilot-fermentation-trials.yaml`.
2. Set `percent_complete: 35`. Update `last_modified`. Keep `technical_progress` unchanged (caller didn't provide it).
3. Acquire lock, write, release, log `milestone.updated` with `id: M03-...`.
4. Return the updated entity.

### "Record a decision: engage ACME as subcontractor for M03"
1. Receive `decision.recorded` payload with id, date, title, context, options, decision, rationale, material_change.
2. Validate required fields. If `material_change: true`, cross-reference `change_order_ref` and warn if absent.
3. Write `decisions/<date>-<slug>.yaml`. Append to `logs/activity.ndjson` and `logs/decisions.ndjson`.
4. Bump `state.json:counters.decisions`.
5. If `material_change: true`, remind the caller that `project-change-register` should draft the CO.

### "Show me recent activity"
Tail `logs/activity.ndjson`. Default to last 50 events. Pretty-print with timestamp + actor + event + any `id`/`summary`.

### "Validate the state"
Walk every YAML/JSON, parse, check frontmatter completeness. Report:
- Files that don't parse
- Entities missing `id`, `kind`, or timestamps
- Filename-id mismatches
- Orphan references (e.g., a decision pointing to a nonexistent change-order)
- Stale lockfiles (older than TTL)

Return a summary; never auto-fix.

## Reference files

- `references/field-enums.yaml` — canonical enum values for `status`, `classification`, `kind`, etc.
- `references/write-protocol.md` — detailed step-by-step write protocol with code-like pseudocode.

(These reference files are optional; if missing, the above instructions in SKILL.md are self-sufficient.)
