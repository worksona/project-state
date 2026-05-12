# Integration Layer — Technical Specification

**Layer:** Integration (Layer 4 of 4 in the four-state intelligence stack)
**Version:** 1.0
**Date:** 2026-05-05

---

## 1. What the Integration Layer Is

The integration layer is the set of rules, protocols, and contracts that govern how the four state facilities exchange data. It is not a runtime component. There is no middleware, no message bus, no API gateway, and no shared database. The integration layer exists entirely as conventions — implemented by skills, documented in this specification, and enforced by the schema contracts in each facility's entity files.

The four state facilities are:

| Facility | Path | Layer | Role |
|---|---|---|---|
| work-state | `~/work-state/` | Evidence | What happened, per surface |
| docket-state | `~/docket-state/` | Accountability | What is owed |
| project-state | `.project-state/` (per-project) | Operational | Milestones, decisions, risks |
| strategic-state | `~/.strategic-state/` | Direction | Thesis, axes, force map |

### The core rule

No facility holds locks in another facility. No skill in one suite calls the memory-layer skill of another suite. Data moves between facilities in exactly two ways:

1. **Advisory cross-facility reads.** A skill in any suite may open and read files in another facility directly, without going through that facility's memory-layer skill. This is read-only and requires no locking.
2. **Harvester scans.** The receiving facility's harvester skill scans the source facility's filesystem, extracts candidates, and (after user confirmation) writes to the destination facility via the destination's own memory-layer skill.

### What the integration layer is not

| Not this | Why |
|---|---|
| A middleware runtime | There is no process mediating between facilities |
| A message bus or event queue | Events are not published to a broker; harvesters pull by scanning files |
| An API gateway | No facility exposes an API; all reads are filesystem reads |
| A synchronization system | Facilities do not keep each other in sync; divergence is expected and acceptable |
| A validation service | Cross-facility references are advisory; no facility validates foreign references at write time |

### Why explicit integration rules

Without explicit rules, developers naturally reach across facility boundaries inconsistently: sometimes reading files directly, sometimes calling foreign skills, sometimes duplicating data. This produces tight coupling that breaks when any facility's schema changes. The integration layer makes the coupling explicit, minimal, and one-directional.

---

## 2. The Integration Graph

The graph is acyclic. Data flows in one direction: work → docket → project → strategic. Strategic broadcasts context downward as a passive read; it does not push data back.

```
~/work-state/    ──────────────────────────────────────────►  ~/.strategic-state/
     │                                                                ▲
     │                                                                │
     ▼                                                                │
~/docket-state/  ──────────────────────────────────────────►  ~/.strategic-state/
     │                                                                ▲
     │                                                                │
     ▼                                                                │
.project-state/  ──────────────────────────────────────────►  ~/.strategic-state/

~/.strategic-state/ ──── context broadcast (read-only) ────►  all three below
```

### 2.1 work-state → docket-state

| Attribute | Value |
|---|---|
| Data | Work events containing implicit commitments: received emails awaiting reply, Slack messages with asks or deadlines, GitHub issues assigned to the owner |
| Initiator | `docket-harvester` |
| Trigger | Manual (`/docket-harvester`) or daily cron |
| Semantic | Candidate detection with synthesis. The harvester interprets signals (Slack messages, Gmail threads) and proposes synthesized matter fields — title, description, contact, due date, next action — derived from the signal. The raw signal text is shown to the user for confirmation but is not stored in the matter. |
| Write model | Option A: matter is self-contained. Synthesized content is written to the matter file at confirmation time. `work_event_ref` is a provenance back-pointer only — the matter can be triaged and resolved without resolving this reference. |
| Confirmation | Always required. No matter is created without user confirmation, regardless of signal confidence. |
| Advisory or enforced | Advisory |
| Reference field in destination | `context.work_event_ref` in the docket matter → work event `id` in `~/work-state/events/` (provenance only; not a dependency) |

### 2.2 work-state → strategic-state

| Attribute | Value |
|---|---|
| Data | Publish events (scsiwyg posts as axis evidence), build events (commit patterns in axis-relevant repos), share events (presentations, distributed blog posts) |
| Initiator | `strategic-harvester` |
| Trigger | Manual (`/strategic-harvester`) or weekly cron |
| Semantic | Signal enrichment. Events become signal candidates or force-map evidence entries. |
| Advisory or enforced | Advisory |
| Reference field in destination | `work_event_ref` on strategic signal → work event `id` in `~/work-state/events/` |

### 2.3 project-state → docket-state

| Attribute | Value |
|---|---|
| Data | SC meeting action items, informal commitments captured in `communications/`, overdue follow-up threads |
| Initiator | `docket-harvester` (runs alongside the work-state scan in the same harvest pass) |
| Trigger | Manual (`/docket-harvester`) or daily cron |
| Semantic | Candidate detection with synthesis. Same synthesis and confirmation model as work→docket: action items and commitments are interpreted into structured matter fields, not copied verbatim from the source document. |
| Write model | Option A: matter is self-contained. `context.project_id` is a provenance and context reference; the matter can be triaged without `.project-state/` being present. |
| Confirmation | Always required. |
| Advisory or enforced | Advisory |
| Reference field in destination | `context.project_id` in docket matter → project slug in `.project-state/manifest.yaml:project.id` (provenance and context; not a dependency) |

### 2.4 project-state → strategic-state

| Attribute | Value |
|---|---|
| Data | Completed milestones (→ outcome entries), decisions (→ evolution entries), lessons-learned documents (→ signals), published outputs (→ thesis evidence) |
| Initiator | `strategic-harvester` |
| Trigger | Manual (`/strategic-harvester`) or weekly cron |
| Semantic | Evidence enrichment. Project completions populate force-map entries with concrete, timestamped outcomes. |
| Advisory or enforced | Advisory |
| Reference field in destination | `project_id` on force-map entries and outcomes → project slug; `milestone_id` on signals → milestone filename slug |

### 2.5 docket-state → strategic-state

| Attribute | Value |
|---|---|
| Data | High-priority open matters where `context.axis_id` is set; resolved matters involving pipeline contacts |
| Initiator | `strategic-harvester` (same weekly harvest pass as project→strategic) |
| Trigger | Weekly cron, part of the same harvest pass |
| Semantic | Signal detection. Open commitments tied to strategic axes flag attention needs. Resolved matters on pipeline contacts provide commercial-traction signals. |
| Advisory or enforced | Advisory |
| Reference field in destination | `docket_matter_ref` on strategic signal → docket matter id in `~/docket-state/matters/` |

### 2.6 strategic-state → * (context broadcast)

| Attribute | Value |
|---|---|
| Data | Current thesis (`thesis/current.yaml`), active axes (`axes/*.yaml`), force map (which projects are strategically significant) |
| Initiator | Any skill in any suite (read-only, initiated on demand) |
| Trigger | On-demand. A skill reads `~/.strategic-state/` files to frame its output in strategic terms. |
| Semantic | Context provision. Strategic state provides meaning to decisions made in lower layers. It never writes back. |
| Advisory or enforced | Read-only; no cross-reference is stored in the source |

This is the one case where a skill in a lower facility opens files in another facility without going through a harvester. It is sanctioned because it is strictly read-only and produces no writes.

### 2.7 Flows that do not exist

| Direction | Reason |
|---|---|
| docket-state → work-state | Docket is downstream of work. Work records what happened; docket interprets it. No reverse flow. |
| docket-state → project-state | Docket references project by ID via `context.project_id`. Project does not read docket. |
| strategic-state → project-state | Strategic reads project; it never writes to project records. |
| strategic-state → work-state | Strategic reads work; it never modifies work events. |
| strategic-state → docket-state | Strategic reads docket matters; it never modifies them. |

---

## 3. The Harvest Protocol

The harvest protocol is the only sanctioned mechanism for cross-facility data ingestion. Every harvester that reads from another facility follows these steps in order.

### 3.1 Protocol steps

**Step 1 — Cursor read.**
Load the last harvest cursor from the destination facility's `state.json`. The cursor is always stored in the destination, never in the source.

```
docket-harvester reading work-state:
  ~/docket-state/state.json:cursors.work_state_last_read

strategic-harvester reading project-state:
  ~/.strategic-state/state.json:cursors.project_state_last_read
```

**Step 2 — Source scan.**
Read files from the source facility with `last_modified` or event timestamp after the cursor. All reads are read-only. No locking is required because the source facility uses file-per-entity storage; concurrent reads are safe.

**Step 3 — Candidate extraction.**
Apply detection rules to the scanned files to identify entities worth ingesting. Detection rules are defined per integration edge (see §2). Each candidate carries a `confidence` score (0.0–1.0) and a `reason` string explaining the detection.

**Step 4 — User confirmation.**
For commitment candidates and signal candidates: present the candidate list to the user. The user confirms or dismisses each entry individually. Auto-harvest without user confirmation is permitted only for high-confidence, non-commitment data where ambiguity is structurally impossible (a milestone marked `status: complete` with a `completed_at` date is unambiguous; a Slack message reading "I'll check on that" is not).

**Step 5 — Write.**
For each confirmed candidate, write to the destination facility using the destination facility's own memory-layer skill. Never write to a destination facility by directly creating files outside the memory-layer skill.

**Step 6 — Cursor update.**
Update the cursor in the destination facility's `state.json` to the current timestamp. Perform this step only after all Step 5 writes have succeeded. A failed write must not advance the cursor.

**Step 7 — Log.**
Append a `harvest.complete` event to the destination facility's activity log. If the source facility has an activity log, append a corresponding `harvest.complete` event there as well (with the destination facility identified).

### 3.2 Cursor format

All harvesters use the same cursor structure, stored in the destination facility's `state.json` under the `cursors` key.

```json
{
  "cursors": {
    "work_state_last_read": "2026-05-04T23:59:59Z",
    "project_state_last_read": "2026-05-04T23:59:59Z",
    "docket_state_last_read": "2026-05-04T23:59:59Z"
  }
}
```

| Cursor key | Stored in | Used by |
|---|---|---|
| `cursors.work_state_last_read` | `~/docket-state/state.json` | `docket-harvester` |
| `cursors.work_state_last_read` | `~/.strategic-state/state.json` | `strategic-harvester` |
| `cursors.project_state_last_read` | `~/docket-state/state.json` | `docket-harvester` |
| `cursors.project_state_last_read` | `~/.strategic-state/state.json` | `strategic-harvester` |
| `cursors.docket_state_last_read` | `~/.strategic-state/state.json` | `strategic-harvester` |

Cursors are never stored in the source facility. The source facility has no knowledge of who has consumed its data or how far along that consumption is.

### 3.3 Confidence scoring

| Score range | Interpretation | Confirmation required |
|---|---|---|
| 0.9–1.0 | Unambiguous structural signal | No — auto-harvest permitted, **except** for commitment-type candidates (see note) |
| 0.7–0.89 | Strong candidate, minor interpretation | Yes |
| 0.5–0.69 | Probable candidate, context-dependent | Yes |
| 0.0–0.49 | Weak candidate | Yes; user may dismiss without review |

Examples of 1.0-confidence candidates: a milestone file with `status: complete` and `completed_at` set. Examples of low-confidence candidates: a Slack message containing "we should probably..." with no named owner or deadline.

> **Commitment exception.** Commitment-type candidates — any candidate destined for docket-state as a matter, regardless of confidence score — always require user confirmation before the matter is created. A confidence score of 1.0 permits auto-harvest for structural signals (e.g., a completed milestone flowing to strategic-state); it does not bypass the docket confirmation gate. This is enforced at the edge level: see §2.1 and §2.3.

---

## 4. Cross-Facility Reference Semantics

### 4.1 Advisory references (the default)

A reference is advisory when the referencing facility does not validate that the referenced entity exists at write time. Writing a docket matter with `context.project_id: kf-aerospace` is valid even if:

- No `.project-state/` directory exists in the current working directory
- No project with slug `kf-aerospace` exists in any known project-state facility
- The `kf-aerospace` slug does not match any slug in `~/docket-state/manifest.yaml:context_maps.projects[]`

Advisory references preserve loose coupling. Each facility operates independently even when peer facilities are unavailable, misconfigured, or simply not yet initialized.

### 4.2 Enforced references (intra-facility only)

Enforced references are validated at write time. These only exist within a single facility. For example, a `strategic-state` force-map entry's `axes_served[]` values are validated against files in `~/.strategic-state/axes/` at write time.

Cross-facility references are NEVER enforced at write time.

### 4.3 Reference resolution at read time

When a skill needs to traverse a cross-facility reference, it resolves lazily:

1. Read the referencing entity.
2. Extract the cross-facility reference field.
3. Locate the target facility (see resolution paths in the table below).
4. Read the target entity file.
5. If not found: surface a warning to the user; continue processing. Do not abort.

Dangling references are expected and acceptable. They occur when a matter references a project that was later renamed, or when a work event references a project whose `.project-state/` has not been initialized on the current machine.

### 4.4 Reference resolution table

| Reference field | Resolves via | Target facility | If not found |
|---|---|---|---|
| work event `project` | Scan for `.project-state/manifest.yaml:project.id` in configured search paths | project-state | Warn; tag event as `project: unsorted` |
| docket matter `context.project_id` | Walk up from cwd for `.project-state/manifest.yaml` | project-state | Warn; preserve the ID as-is |
| docket matter `context.work_event_ref` | `~/work-state/events/` date-partitioned directory | work-state | Warn; preserve the ID as-is |
| docket matter `context.axis_id` | `~/.strategic-state/axes/<axis_id>.yaml` | strategic-state | Warn; preserve the ID as-is |
| docket matter `contact.ref` | `~/.strategic-state/people/<person_id>.yaml` | strategic-state | Warn; preserve the ID as-is |
| strategic force-map `project_id` | Walk cwd for `.project-state/manifest.yaml` | project-state | Advisory; no validation at write |
| strategic outcome `project_id` | `~/.strategic-state/force-map/<project_id>.yaml` | strategic-state | Enforced (intra-facility); block write if missing |
| strategic signal `work_event_ref` | `~/work-state/events/` date-partitioned directory | work-state | Warn; preserve the ID as-is |
| strategic signal `docket_matter_ref` | `~/docket-state/matters/<matter_id>.yaml` | docket-state | Warn; preserve the ID as-is |

---

## 5. Project ID as the Cross-State Key

The project slug is the primary cross-facility linking key. It appears in all four facilities:

| Facility | Field | Validation |
|---|---|---|
| work-state | `project` on event records | Validated against `~/work-state/manifest.yaml:projects[]` (intra-facility) |
| docket-state | `context.project_id` on matters | Validated against `~/docket-state/manifest.yaml:context_maps.projects[]` (intra-facility) |
| project-state | `project.id` in `manifest.yaml` | This is the canonical source |
| strategic-state force-map | `project_id` on force-map entries | Must exist in `~/.strategic-state/force-map/` (intra-facility enforced on outcomes) |

The canonical slug is defined in `.project-state/manifest.yaml:project.id`. All other facilities should use the same value. When a discrepancy exists (a docket matter uses `kf-aero` while project-state uses `kf-aerospace`), resolution is manual. No facility auto-renames or auto-reconciles slugs.

### 5.1 Slug conventions

- Lowercase only
- Hyphen-separated words
- No spaces, underscores, or special characters
- Maximum 32 characters

Valid: `kf-aerospace`, `ai27-02`, `scsiwyg-platform`, `iss-phase-2`
Invalid: `KF Aerospace`, `ai27_02`, `scsiwyg-platform-website-rebuild-2026`

### 5.2 Slug lifecycle

A slug is minted when a project-state facility is initialized via `project-scaffolder`. Once minted, it should not change. If a project is renamed, the slug stays the same. The `manifest.yaml:project.title` field is the human-readable name; the slug is the machine key.

If a slug must change (project merger, significant restructuring), the migration procedure is:

1. Create a new project-state facility with the new slug.
2. Update all docket matters that reference the old slug by adding `context.project_id_legacy: <old-slug>` alongside the new value.
3. Update strategic-state force-map entries.
4. Do not alter work-state events — they are immutable; the old `project` field value is preserved as historical record.

---

## 6. Person ID as a Cross-State Key

Person IDs link contacts in docket-state to people profiles in strategic-state. They also appear in project-state team files.

| Facility | Field | Format |
|---|---|---|
| docket-state | `contact.ref` on matters | `person_id` string, advisory |
| strategic-state | `person_id` in `people/*.yaml` | Canonical source for strategic-layer people |
| project-state | Filename stem of `people/{person-id}.yaml` | Maintained independently |

Person IDs are maintained independently in each facility. There is no synchronization mechanism. If a person's role changes in project-state, strategic-state is not automatically updated. If a new contact appears in a docket matter, no people file is automatically created in strategic-state.

The `strategic-harvester` may detect discrepancies (a `contact.ref` in docket-state that has no matching file in `~/.strategic-state/people/`) and surface them for manual resolution. Resolution is always manual.

### 6.1 Person ID conventions

- Lowercase, hyphenated
- Format: `firstname-lastname` or `firstname-lastname-org` for disambiguation
- Maximum 48 characters

Valid: `alice-chen`, `bob-smith-aeroco`, `jane-doe`

---

## 7. Strategic Context Broadcast

Strategic-state is the only facility that does not receive data flows from above — it sits at the top of the stack. But it provides downward context to all three lower facilities as a passive broadcast.

### 7.1 How lower facilities consume strategic context

Any skill at any layer may read `~/.strategic-state/thesis/current.yaml` and `~/.strategic-state/axes/*.yaml` to frame its output in terms of the current strategic thesis. This is a direct file read — no memory-layer skill call into strategic-state from another suite.

This is the ONE exception to the no-cross-facility-memory-layer-calls rule. It is sanctioned because:
- It is strictly read-only.
- It produces no writes to strategic-state.
- It requires no locking.
- Strategic-state files have no write-time dependencies on lower facilities.

### 7.2 Examples of strategic context consumption

| Skill | How it consumes strategic context |
|---|---|
| `project-status-reporter` | Reads active axes; surfaces "this milestone completes the Axis 3: Orchestration proof point" if the milestone's project is mapped to that axis |
| `docket-orchestrator` | Reads active axes; flags a matter as "strategically significant" if its `context.axis_id` is active |
| `work-orchestrator` | Reads force map; highlights digest items that involve force-map projects |
| `project-onboarder` | Reads thesis; frames the project's purpose in terms of the current strategic direction |

### 7.3 What skills must NOT do when consuming strategic context

- Must not write to `~/.strategic-state/` as a side effect of reading.
- Must not call `strategic-state` memory-layer skill to perform a read that could be done by opening the YAML file directly.
- Must not fail or halt if `~/.strategic-state/` does not exist. Strategic-state is optional for all lower-layer operations.

---

## 8. Integration Failure Handling

| Failure | Behavior |
|---|---|
| Source facility not initialized | Skip the harvest for that source; log `integration.source_unavailable`; continue with other sources in the same pass |
| Source facility schema mismatch (unrecognized field names) | Log `integration.schema_warning`; ingest what can be parsed; flag unrecognized fields in the candidate record for user review |
| Cursor ahead of actual data (clock skew or manual clock change) | Reset cursor to 24 hours before the current timestamp; re-scan; deduplicate candidates by entity ID before presenting |
| Target facility not initialized | Abort the harvest; present a clear error telling the user to init the target facility first; do not write partial results |
| Write fails after partial batch | Do not advance the cursor; log the partial failure with the count of succeeded and failed writes; re-run the harvest to retry failed items (dedup by ID prevents duplicates) |
| Dangling cross-facility reference found during validation | Report in the validate output; do not auto-fix; suggest the specific resolution action (rename, update, or delete) |
| Strategic-state unavailable during context broadcast read | The calling skill proceeds without strategic context; it does not fail; it does not retry |

---

## 9. Integration Events (Activity Log)

Cross-facility operations produce events in the destination facility's activity log (`logs/activity.ndjson`). All events follow the NDJSON append-only format used by the receiving facility.

| Operation | Event name | Required fields |
|---|---|---|
| Harvest pass started | `integration.harvest.started` | `source_facility`, `since_cursor` |
| Candidates surfaced to user | `integration.candidates.surfaced` | `source_facility`, `candidate_count`, `auto_harvest_count` |
| Matter created from work event | `integration.matter.created_from_work` | `matter_id`, `work_event_ref` |
| Matter created from project communication | `integration.matter.created_from_project` | `matter_id`, `project_id`, `source_document` |
| Signal created from project milestone | `integration.signal.created_from_milestone` | `signal_id`, `project_id`, `milestone_id` |
| Signal created from work event | `integration.signal.created_from_work` | `signal_id`, `work_event_ref` |
| Signal created from docket matter | `integration.signal.created_from_docket` | `signal_id`, `docket_matter_ref` |
| Harvest pass completed | `integration.harvest.completed` | `source_facility`, `ingested_count`, `dismissed_count`, `new_cursor` |
| Source facility unavailable | `integration.source_unavailable` | `source_facility`, `reason` |
| Schema warning during ingest | `integration.schema_warning` | `source_facility`, `entity_id`, `unrecognized_fields[]` |

### 9.1 Example event records

```json
{"ts": "2026-05-05T09:00:00Z", "type": "integration.harvest.started", "source_facility": "work-state", "since_cursor": "2026-05-04T23:59:59Z"}
{"ts": "2026-05-05T09:00:04Z", "type": "integration.candidates.surfaced", "source_facility": "work-state", "candidate_count": 7, "auto_harvest_count": 0}
{"ts": "2026-05-05T09:01:12Z", "type": "integration.matter.created_from_work", "matter_id": "M-2026-0042", "work_event_ref": "wse_gmail_20260504_a3f9b"}
{"ts": "2026-05-05T09:01:15Z", "type": "integration.harvest.completed", "source_facility": "work-state", "ingested_count": 3, "dismissed_count": 4, "new_cursor": "2026-05-05T09:01:15Z"}
```

---

## 10. Adding a New Integration

When a new cross-facility data flow is needed, follow these steps in order. Do not skip steps.

1. **Define the edge.** Specify the source facility, destination facility, what data flows, and the semantic (candidate detection, signal enrichment, context provision). Confirm the direction preserves the acyclic constraint: work → docket → project → strategic. Reject any edge that creates a cycle.

2. **Assign a cursor field.** Add a new key to the destination facility's `state.json:cursors` object. Name it `<source_facility_slug>_last_read`. Document it in the destination facility's STATE-SPEC file under the cursors section.

3. **Define detection rules.** Specify what structural conditions in the source data constitute a candidate. State the confidence score range the detection produces and whether user confirmation is required.

4. **Decide on confirmation model.** Default is user-confirmation-required. Auto-harvest is permitted only when the confidence is structurally guaranteed to be 1.0 — no interpretation, no ambiguity.

5. **Define the reference field.** Add the cross-facility reference field to the destination entity schema. Name it following the existing conventions (`context.work_event_ref`, `context.project_id`, `work_event_ref`, `docket_matter_ref`). Mark it optional. Document it as advisory.

6. **Implement the harvest step.** Add the new source scan, candidate extraction, and write steps to the destination facility's harvester skill. Follow the seven-step harvest protocol in §3.1 exactly.

7. **Add integration events.** Define new event names in both facilities' activity log schemas if the existing names (§9) do not cover the operation. Follow the naming convention: `integration.<entity>.<action>`.

8. **Update this specification.** Add the new edge to §2 (integration graph) and the new reference field to §4.4 (reference resolution table). Update any affected facility STATE-SPEC files.

9. **Verify the acyclic constraint.** After adding the edge, redraw the full integration graph and confirm no cycles exist.

---

## 11. Acyclic Constraint Reference

The integration graph must remain a directed acyclic graph (DAG). The permitted flow directions are:

```
work-state ──► docket-state ──► strategic-state
    │                                ▲
    └────────────────────────────────┤
                                     │
project-state ───────────────────────┘
    ▲
    │
docket-state (project_id reference, no file reads)
```

Permitted edges (data flows from source to destination):

| Source | Destination | Permitted |
|---|---|---|
| work-state | docket-state | Yes |
| work-state | strategic-state | Yes |
| docket-state | strategic-state | Yes |
| project-state | docket-state | Yes |
| project-state | strategic-state | Yes |
| strategic-state | * (read-only broadcast) | Yes (read-only) |
| docket-state | work-state | No — creates back-edge |
| docket-state | project-state | No — creates back-edge |
| strategic-state | project-state | No — creates back-edge |
| strategic-state | work-state | No — creates back-edge |
| strategic-state | docket-state | No — creates back-edge |

Any new integration proposal that creates a back-edge must be rejected and redesigned. If bidirectional data sharing is genuinely required, the correct pattern is to introduce a shared reference (a common entity ID in both facilities) rather than a bidirectional data flow.
