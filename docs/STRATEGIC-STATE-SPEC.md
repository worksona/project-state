# Strategic State — Technical Specification

**Facility path:** `~/.strategic-state/`
**Version:** 1.0
**Date:** 2026-05-05

---

## 1. Purpose and Design Philosophy

### What strategic state is

`strategic-state` is the direction layer of the four-state intelligence stack. Where work-state records what happened and project-state tracks how a project runs, strategic-state holds the answer to why any of it matters.

The facility maintains the strategic thesis as a versioned, falsifiable claim; maps every active project to the parts of that thesis it proves, stresses, or extends; and accumulates the people profiles, innovation records, client outcomes, and pipeline signals that constitute the evidence base. That evidence base is the input to generated vision documents — strategic output that is grounded in real work rather than written from scratch.

The gravitational metaphor is precise. Every project, platform, experiment, person, and client engagement exists in relationship to the thesis. The force map makes those relationships visible and queryable. When a project cannot be placed on the map — cannot be assigned to at least one axis with a coherent contribution — that is a signal that the project may be adrift, or that the thesis has not yet articulated an axis that covers it. The map exerts discipline. It is not a gatekeeping mechanism; it is a diagnostic one.

### The thesis as a falsifiable claim

The thesis is not a mission statement. It is a specific, testable claim about how work should be done — or how a market is wrong — that the portfolio is actively testing. A mission statement is an aspiration. A thesis is a bet that can be lost.

Properties of a well-formed thesis:
- Names a counterparty or a structural failure it is correcting
- Contains at least two `falsifiable_claims` — specific outcomes that would confirm or disconfirm it
- Changes when significant evidence accumulates against a claim
- Has a version history that shows how it evolved and what triggered each change

A thesis with no falsifiable claims is a mission statement wearing different clothes. The facility validation check enforces that `falsifiable_claims` is non-empty.

### The force map

The force map is the operational expression of the thesis. Each entry pairs a project with the thesis: which axes the project serves, what specifically it contributes, and how strong that contribution is.

Four evidence types are recognized:

| Evidence type | Meaning |
|---|---|
| `proves` | The project produces evidence that makes a falsifiable claim more likely true |
| `stresses` | The project tests the thesis under conditions that could falsify it |
| `extends` | The project pushes into territory the thesis points toward but has not yet specified |
| `contradicts` | The project produces outcomes that conflict with a current claim — important to record |

A project that `contradicts` the thesis is not an error to be corrected; it is information to be processed. Evolution journal entries connect contradictions to thesis revisions. If a `contradicts` entry exists for more than one assessment cycle without triggering either a thesis update or an explicit decision to hold, the assessment should flag it as a drift signal.

### Why machine-local and personal

`~/.strategic-state/` is singular: one facility per machine, owned by one person. In a founder-led company, the founder's strategic state is equivalent to the company's strategic state. In a team setting, each operator maintains their own facility, and a synthesis layer (not specified here) would reconcile multiple facilities into a shared strategic view.

This design choice is not a constraint — it is an affordance. Strategic synthesis across people requires disagreement to be preserved, not averaged out. When two operators reach different conclusions from the same portfolio, that tension is information. A shared-write facility would destroy it.

Credentials, harvest sources, and interpretation heuristics are personal. The facility does not coordinate across machines.

### Relationship to the other three states

```
Work state      — evidence: what happened (commits, publishes, messages)
Docket state    — accountability: what is owed
Project state   — operational structure: milestones, gates, decisions
Strategic state — direction: thesis, force map, axes (this facility)
```

The data flows are strictly one-directional:

| Upstream facility | What strategic state reads | What strategic state does not do |
|---|---|---|
| Work state | Commit events → axis activity evidence; `publish` events → methodology proof; `share` events → candidate signals | Does not write back to work-state |
| Project state | Milestone completions → candidate outcomes; decisions → candidate evolution entries; SC meeting minutes → candidate pipeline signals | Does not alter project-state files |
| Docket state | High-priority open matters referencing axis-tagged contexts → candidate signals; resolved matters involving pipeline companies → pipeline status candidates | Does not alter docket-state files |

Strategic-state reads from the other three. None of them know it exists.

---

## 2. Directory Layout

```
~/.strategic-state/
├── manifest.yaml               ← facility config: owner, org, cadence, harvest sources
├── state.json                  ← counters, last dates, health flags
├── SCHEMA.md                   ← canonical schema (copied from skill on init)
├── README.md                   ← human-readable guide (copied from skill on init)
├── CONCURRENCY.md              ← concurrency rules and invariants
├── docs/                       ← source documents (whitepapers, first-principles, vision docs to analyze)
├── thesis/
│   ├── current.yaml            ← the living thesis (exactly one; always current)
│   └── history/
│       └── {date}-v{n}.yaml    ← archived thesis versions, one file per version
├── axes/
│   └── {axis-id}.yaml          ← one file per strategic axis
├── force-map/
│   └── {project-id}.yaml       ← one file per project-to-thesis mapping
├── people/
│   └── {person-id}.yaml        ← team and advisor profiles as strategic assets
├── outcomes/
│   └── {outcome-id}.yaml       ← client/project outcomes with quantified metrics
├── innovations/
│   └── {innovation-id}.yaml    ← novel capabilities with competitive differentiation claims
├── pipeline/
│   └── {company-id}.yaml       ← client/prospect market validation entries
├── vision-docs/
│   └── {doc-id}/
│       ├── meta.yaml           ← audience, date, sources used, thesis version
│       └── {doc-id}.docx       ← generated document (format varies; docx by default)
├── evolution/
│   └── {id}.yaml               ← evolution journal entries (one per shift/insight)
├── assessments/
│   └── {quarter}.yaml          ← quarterly strategic coherence assessments
├── signals/
│   └── {signal-id}.yaml        ← incoming strategic signals (market, client, partner)
├── logs/
│   └── activity.ndjson         ← append-only activity log (one JSON object per line)
└── locks/
    └── *.lock                  ← advisory lockfiles, 5-minute TTL
```

File naming conventions:
- Axes: `{axis-id}.yaml` where `axis-id` is lowercase-hyphenated (e.g., `orchestration-over-specialization.yaml`)
- Force-map: `{project-id}.yaml` matching the project slug (e.g., `aimqc.yaml`)
- People: `{person-id}.yaml` lowercase-hyphenated full name (e.g., `david-olsson.yaml`)
- Outcomes: `{outcome-id}.yaml` descriptive slug (e.g., `kf-aerospace-mro-skills.yaml`)
- Innovations: `{innovation-id}.yaml` descriptive slug (e.g., `manifold-structured-intelligence.yaml`)
- Pipeline: `{company-id}.yaml` lowercase-hyphenated company name (e.g., `kf-aerospace.yaml`)
- Evolution: `evo-{YYYY-MM-DD}-{slug}.yaml` (e.g., `evo-2026-05-05-thesis-v2-infrastructure-reckoning.yaml`)
- Assessments: `{YYYY-QN}.yaml` (e.g., `2026-Q2.yaml`)
- Signals: `sig-{YYYY-MM-DD}-{slug}.yaml`

---

## 3. manifest.yaml Schema

```yaml
# ~/.strategic-state/manifest.yaml

facility:
  version: 1                        # integer — facility schema version
  name: ""                          # human-readable facility name
  owner: ""                         # operator email
  org: ""                           # legal entity name
  machine: ""                       # hostname (informational)
  initialized_at: ""                # ISO-8601 datetime

entity:                             # the business this strategy governs
  legal_name: ""
  operating_as: ""                  # trade name if different
  location: ""                      # city, country
  founder: ""                       # optional

cadence:
  assessment_quarter: "Q1"          # which quarter's first month triggers each assessment
                                    # e.g. "Q1" → January, "Q2" → April
  thesis_review_trigger:            # conditions that should prompt a thesis review
    - "new falsifiable claim established"
    - "force-map contradicts entry exists for 2+ assessment cycles"
    - "coherence_score drops below 3 in quarterly assessment"
    - "major new client domain entered"
    - "axis graduated (so foundational it no longer needs tracking)"
  evolution_review: "monthly"       # cadence for reviewing the evolution journal

harvest_sources:                    # upstream state facilities that feed this one
  work_state: true                  # ~/.work-state/
  work_state_path: "~/.work-state"
  project_state_paths:              # list of .project-state/ directories to scan
    - ""
  docket_state: false               # ~/docket-state/
  docket_state_path: "~/docket-state"

downstream_surfaces:                # where generated vision documents can be published
  scsiwyg:
    username: null
    enabled: false
  slack:
    channel: null
    enabled: false

vision_doc_defaults:
  format: "docx"                    # docx | pdf | md
  output_dir: "~/.strategic-state/vision-docs"

counters:                           # maintained by state.json; manifest copy is informational
  thesis_versions: 0
  axes: 0
  projects_mapped: 0
  people: 0
  outcomes: 0
  innovations: 0
  pipeline_entries: 0
  evolution_entries: 0
  assessments: 0
  signals: 0
```

---

## 4. Entity Schemas

### thesis/current.yaml

The living thesis. Exactly one file is current at any time. When updated, the current version moves to `thesis/history/{date}-v{n}.yaml` and a new `current.yaml` is written atomically.

```yaml
version: 1                          # integer, monotonically increasing; v1 for the first thesis
date: "2026-05-05"                  # ISO date when this version became current
statement: >                        # 1-3 sentences: the core claim
  ""
elaboration: >                      # 1-2 paragraphs: the fuller argument
  ""
falsifiable_claims:                 # concrete testable claims the portfolio is evaluating
  - >
    ""
axes:                               # axis IDs this version emphasizes (ordered: primary first)
  - ""
supersedes: null                    # integer: previous version number; null for v1
trigger: >                          # what caused this version to emerge
  ""
```

Validation rules specific to thesis:
- `version` must be exactly `max(history versions) + 1` (or 1 if history is empty)
- `supersedes` must equal `max(history versions)` (or null for v1)
- `falsifiable_claims` must be non-empty
- All IDs in `axes` must exist in `axes/`

Example (abbreviated):
```yaml
version: 2
date: "2026-05-05"
statement: >
  The hyperscaler model of AI is architecturally insufficient for any domain where
  intelligence must be trusted, domain-encoded, and sovereign.
falsifiable_claims:
  - >
    Designing AI infrastructure from first principles produces qualitatively different
    outcomes than designing from available technology capabilities.
axes:
  - methodology-as-product
  - structural-sovereignty
  - domain-specific-intelligence
supersedes: 1
trigger: >
  Strategic critique of v1 identified three structural weaknesses: thesis silent on the
  AI infrastructure reckoning; design-from-first-principles buried in axes; "knowledge
  work" container too narrow for regulated physical-world deployments.
```

### axes/{id}.yaml

One file per named strategic dimension. Axes emerge from the work; they are not defined top-down. An axis becomes `graduated` when it is so foundational that it no longer represents an active frontier — it is assumed, not contested.

```yaml
id: ""                              # slug, lowercase-hyphenated; matches filename
name: ""                            # human-readable name
definition: >                       # what this axis means (1-3 sentences)
  ""
emerged_at: ""                      # ISO date (YYYY-MM or YYYY-MM-DD) when first identified
sharpened_by:                       # project IDs or evolution entry IDs that refined this axis
  - ""
status: "active"                    # active | dormant | graduated
graduated_at: null                  # ISO date if graduated; null otherwise
notes: >                            # optional elaboration
  ""
```

Status definitions:

| Status | Meaning |
|---|---|
| `active` | A current frontier; projects are actively proving or extending it |
| `dormant` | No projects currently serving it; not graduated but inactive |
| `graduated` | So foundational it is no longer an active frontier — assumed true |

Example:
```yaml
id: orchestration-over-specialization
name: "Orchestration Over Specialization"
definition: >
  The reusable value is in the patterns that coordinate capabilities — state facilities,
  phase lifecycles, harvester/synthesizer pairs, approval gates — not in individual
  capabilities. The product is the conductor, not the instruments.
emerged_at: "2026-03"
sharpened_by:
  - skill-ecosystem
  - worksona
  - evo-2026-05-05-aimqc-portfolio-depth
status: active
graduated_at: null
notes: >
  Strongest evidence axis in the portfolio. Every facility family (project-*, notella-*,
  work-*, kf-*, emporium-*) applies the same structural pattern to a new domain.
```

### force-map/{project-id}.yaml

One file per project. Maps each project to the thesis: which axes it serves, what it contributes, and how strong that contribution is. The project ID matches the filename slug and is used as a foreign key by outcomes, innovations, people, and evolution entries.

```yaml
project_id: ""                      # slug, lowercase-hyphenated; matches filename
project_name: ""                    # human-readable name
status: "active"                    # active | paused | completed | archived
category: ""                        # platform | service | experiment | art | client-engagement
thesis_version: 1                   # which thesis version this was mapped against
axes_served:                        # axis IDs this project primarily serves
  - ""
contribution: >                     # what this project proves/stresses/extends (1-3 sentences)
  ""
evidence_type: "proves"             # proves | stresses | extends | contradicts
strength: "moderate"                # strong | moderate | nascent
dependencies:                       # other project IDs this builds on
  - ""
last_assessed: ""                   # ISO date
created: ""                         # ISO date
```

Evidence type and strength guide:

| `evidence_type` | Use when |
|---|---|
| `proves` | The project generates direct evidence that makes a falsifiable claim more likely true |
| `stresses` | The project tests the thesis in conditions that could falsify it |
| `extends` | The project pushes into territory the thesis implies but has not yet addressed |
| `contradicts` | The project generates evidence that conflicts with a current claim |

| `strength` | Use when |
|---|---|
| `strong` | The project is a primary, high-confidence proof point for the axes it serves |
| `moderate` | The project contributes evidence but is not a primary proof point |
| `nascent` | The project is early; contribution is directional but not yet established |

### people/{person-id}.yaml

Team members and advisors profiled as strategic assets. The goal is not biographical — it is to articulate what each person makes possible that others cannot, and where in the portfolio that capability appears.

```yaml
person_id: ""                       # slug, e.g. david-olsson
name: ""                            # full name
role: ""                            # founder | advisor | collaborator | client-lead
organization: ""                    # company or org affiliation
location: ""                        # city, country
status: "active"                    # active | advisor | alumni
added: ""                           # ISO date

expertise:                          # what this person knows that is rare and strategically relevant
  - domain: ""                      # e.g. "agentic AI orchestration"
    depth: ""                       # pioneer | expert | practitioner
    years: 0
    proof_points:                   # concrete evidence — built things, published things, achieved things
      - ""

track_record:                       # quantified outputs that demonstrate capability
  - item: ""                        # what was built or delivered
    scale: ""                       # quantified scope (e.g. "115+ skills across 8 facility families")
    impact: ""                      # what it changed or enabled
    date: ""                        # ISO date or year

roles_in_portfolio:                 # project_ids where this person is a key asset
  - ""

competitive_claim: >                # 1-2 sentences: what this person makes possible that others cannot
  ""
```

Depth definitions:

| `depth` | Meaning |
|---|---|
| `pioneer` | First-mover or inventor in this domain; few or no peers |
| `expert` | Deep practitioner with a substantial track record |
| `practitioner` | Competent and experienced; not at the frontier |

### outcomes/{outcome-id}.yaml

Client or project outcomes with quantified before/after metrics. Outcomes are the primary evidence base for the `client` audience lens in vision documents.

```yaml
outcome_id: ""                      # slug, e.g. kf-aerospace-mro-skills
title: ""                           # short name
client_or_context: ""               # who experienced this outcome
project_id: ""                      # links to force-map entry (required; must exist in force-map/)
date: ""                            # ISO date or range (e.g. "2025-2026")
status: "active"                    # active | completed | in-progress

before: >                           # state before the engagement — specific, observable
  ""
after: >                            # state after — specific, observable change
  ""

metrics:                            # quantified proof; at least one required
  - metric: ""                      # what was measured
    before_value: ""                # e.g. "manual, 3 days per report cycle"
    after_value: ""                 # e.g. "automated, under 30 minutes"
    improvement: ""                 # e.g. "85% time reduction"
    confidence: ""                  # high | medium | estimated

axes_demonstrated:                  # axis IDs this outcome proves
  - ""
audience_relevance:                 # vision-doc audiences this outcome is most relevant for
  - ""                              # client | investor | partner | internal

notes: ""
```

Confidence rating guide:

| `confidence` | Meaning |
|---|---|
| `high` | Directly measured; observable artifact exists |
| `medium` | Measured but methodology has caveats or the baseline was reconstructed |
| `estimated` | No direct measurement; derived from informed judgment or proxy data |

### innovations/{innovation-id}.yaml

Novel capabilities with competitive differentiation claims and moat analysis. Innovations are distinct from project deliverables — an innovation is a capability that emerged from the work and is transferable, licensable, or replicable across engagements.

```yaml
innovation_id: ""                   # slug, e.g. manifold-structured-intelligence
name: ""                            # human-readable name
date: ""                            # ISO date when it emerged or was formalized
project_id: ""                      # which project produced this (links to force-map/)

novelty_claim: >                    # 1-2 sentences: what did not exist before this
  ""
category: ""                        # framework | architecture | methodology | tool | pattern

differentiation:                    # quantified advantage claims; at least one required
  - claim: ""                       # specific advantage claim
    metric: ""                      # how it is measured or evidenced
    vs_alternative: ""              # what the alternative approach is and why it is worse

replication_cost: >                 # what it would take to replicate (time, expertise, infrastructure)
  ""
moat_type: ""                       # knowledge | infrastructure | methodology | network

axes_served:                        # axis IDs this innovation serves
  - ""
falsifiable_test: >                 # how would we know if this innovation stops being differentiating?
  ""

audience_hooks:
  client: >                         # why a client should care
    ""
  investor: >                       # why an investor should care
    ""
  partner: >                        # why a partner should care
    ""

status: "active"                    # active | superseded | foundational
added: ""                           # ISO date
```

Status definitions:

| `status` | Meaning |
|---|---|
| `active` | Current differentiator; actively maintained and cited |
| `superseded` | Replaced by a more advanced innovation; retained for history |
| `foundational` | Now so embedded in the approach that it is not separately claimed |

### pipeline/{company-id}.yaml

Market validation entries for clients and prospects. The pipeline is not a sales CRM — its strategic function is to track which companies' interest validates which axes, and what the pattern of demand tells the thesis.

```yaml
company_id: ""                      # slug, lowercase-hyphenated; matches filename
company_name: ""                    # full legal or operating name
domain: ""                          # industry/sector (e.g. "aviation MRO", "oil and gas inspection")
hq: ""                              # city, country
url: ""                             # optional

status: ""                          # prospect | active-client | landing | expanding
pipeline_stage: ""                  # top-of-funnel | in-conversation | in-negotiation |
                                    # almost-landed | client | expanding
estimated_close: ""                 # ISO date or quarter string (for prospects; e.g. "2026-Q3")

engagement_type: ""                 # domain-skill-build | sovereign-infra | orchestration-advisory |
                                    # full-facility | platform-build | hybrid
engagement_proposition: >          # what is proposed — 2-4 sentences
  ""
engagement_value: ""                # estimated annual value (range or TBD)

axes_validated:                     # which strategic axes this company's interest demonstrates demand for
  - ""
thesis_signal: >                    # what the fact of their interest tells the thesis — 1-2 sentences
  ""

primary_contact:
  name: ""
  role: ""
  email: ""

notes: ""
added: ""                           # ISO date
last_updated: ""                    # ISO date
```

Pipeline stage definitions:

| `pipeline_stage` | Meaning |
|---|---|
| `top-of-funnel` | In conversation; value proposition still being established |
| `in-conversation` | Dialogue active; both sides qualifying |
| `in-negotiation` | Scope and commercial terms being worked |
| `almost-landed` | Verbal agreement or near-close |
| `client` | Active engagement; work underway |
| `expanding` | Existing client; new scope being added |

### evolution/{id}.yaml

The strategic evolution journal. Each entry records a shift — what changed, what caused it, what it means for the thesis and axes. Entries are append-only. The journal is the record of the thesis learning.

```yaml
id: ""                              # evo-{YYYY-MM-DD}-{slug}
date: ""                            # ISO-8601
title: ""                           # short summary of the shift (1 sentence)
narrative: >                        # what changed, why, what it means (2-5 sentences, compressed)
  ""
thesis_version_before: 1            # thesis version number before this event
thesis_version_after: 1             # may be same if shift does not warrant a new thesis version
axes_affected:                      # axis IDs the entry touches
  - ""
projects_involved:                  # project IDs involved (must exist in force-map/)
  - ""
category: ""                        # thesis-shift | axis-emergence | axis-graduation |
                                    # strategic-correction | market-signal |
                                    # capability-unlock | insight
```

Category guide:

| `category` | Use when |
|---|---|
| `thesis-shift` | The core statement or falsifiable claims changed |
| `axis-emergence` | A new named dimension was identified |
| `axis-graduation` | An axis became so foundational it graduated |
| `strategic-correction` | A prior claim was found to be wrong or overstated |
| `market-signal` | External market event that changes the strategic context |
| `capability-unlock` | A new technical or methodological capability changes what is possible |
| `insight` | A realization — pattern noticed, implication drawn — that does not immediately change the thesis but is worth recording |

### assessments/{quarter}.yaml

Quarterly coherence assessments. One file per quarter. These are deliberate, periodic honest evaluations of whether the active portfolio is actually serving the thesis — and where it is drifting.

```yaml
quarter: "2026-Q2"                  # format: YYYY-QN
date: ""                            # ISO date assessment was written
thesis_version: 1                   # thesis version the assessment was written against
coherence_score: 3                  # 1-5 integer
                                    # 5: every active project clearly serves the thesis
                                    # 4: strong alignment with minor gaps
                                    # 3: clear thesis but some projects drift or are unmapped
                                    # 2: significant projects with unclear strategic contribution
                                    # 1: portfolio and thesis are substantially misaligned

drift_signals:                      # projects showing signs of strategic misalignment
  - project_id: ""
    signal: ""                      # what the drift looks like
    severity: ""                    # low | medium | high

strongest_evidence:                 # top 2-3 projects demonstrating thesis validity
  - project_id: ""
    why: ""

weakest_links:                      # projects with unclear or problematic strategic contribution
  - project_id: ""
    concern: ""

axes_momentum:                      # per-axis assessment of trajectory
  - axis_id: ""
    momentum: ""                    # advancing | stalled | retreating
    notes: ""

narrative: >                        # prose synthesis (3-5 paragraphs)
  ""
recommended_actions:                # specific strategic actions to take in the next quarter
  - ""
```

### signals/{signal-id}.yaml

Incoming strategic signals from external sources. A signal is a market, client, or partner event that has potential implications for the thesis or axes. Signals are intake — they do not modify the thesis directly; they may prompt evolution entries.

```yaml
signal_id: ""                       # sig-{YYYY-MM-DD}-{slug}
date: ""                            # ISO-8601
source_type: ""                     # client | partner | market | internal | media
source_name: ""                     # company, publication, person, or event

description: >                      # what happened or was said (factual, 2-4 sentences)
  ""
thesis_relevance: ""                # confirms | challenges | expands | noise

axes_touched:                       # axis IDs potentially affected
  - ""
action_taken: ""                    # what was done with this signal (or "none" if filed only)
added_to_evolution: false           # bool: true if this signal produced an evolution entry
```

---

## 5. state.json Schema

`state.json` is the machine-readable health record of the facility. It is updated on every write operation and used by validation to detect drift between on-disk files and recorded counts.

```json
{
  "facility_version": 1,
  "initialized_at": null,
  "last_thesis_update": null,
  "last_evolution_entry": null,
  "last_assessment": null,
  "last_validated": null,
  "counters": {
    "thesis_versions": 0,
    "axes": {
      "active": 0,
      "dormant": 0,
      "graduated": 0
    },
    "projects_mapped": 0,
    "people": 0,
    "outcomes": 0,
    "innovations": 0,
    "pipeline_entries": {
      "prospect": 0,
      "active-client": 0
    },
    "evolution_entries": 0,
    "assessments": 0,
    "signals": 0,
    "vision_docs": 0
  }
}
```

All `last_*` fields are ISO-8601 datetimes or `null`. Counters are non-negative integers. The `validate` operation checks that counter values match on-disk file counts and reports deviations without auto-correcting.

---

## 6. The Thesis Version Chain

Only one thesis is current at any time: `thesis/current.yaml`. When the thesis is updated:

1. Acquire advisory lock on `thesis/current.yaml`.
2. Read `current.yaml`; determine its `version` (call it N).
3. Write a copy to `thesis/history/{date}-v{N}.yaml` (do not modify; exact copy).
4. Write the new thesis to `thesis/current.yaml` with `version: N+1` and `supersedes: N`.
5. Release lock.
6. Log `thesis.updated` to `logs/activity.ndjson`.
7. Increment `counters.thesis_versions` in `state.json`.

The version chain invariants:

| Invariant | Check |
|---|---|
| Chain is unbroken | If current is vN, history must contain v1 through v(N-1) with no gaps |
| Current version is exactly one ahead | `current.yaml:version = max(history versions) + 1` |
| Supersedes pointer is correct | `current.yaml:supersedes = max(history versions)` (null if no history) |
| History files are immutable | No history file is ever modified after archival |

Every entity that references the thesis uses `thesis_version: N` to pin which version it was valid under. This allows assessments, force-map entries, and evolution entries to be read in their original context even after the thesis has evolved past them.

---

## 7. Operations

### Read operations (no locking required)

All read operations are lock-free. They operate on snapshot reads of individual YAML and JSON files. Concurrent reads do not require coordination.

| Operation | Description |
|---|---|
| `get-manifest` | Return parsed `manifest.yaml` |
| `get-state` | Return parsed `state.json` |
| `get-thesis` | Return parsed `thesis/current.yaml` |
| `get-thesis-history` | Return all history YAMLs plus current, sorted by version ascending |
| `get-axis id` | Return parsed `axes/{id}.yaml` |
| `list-axes [status]` | Return all axes, optionally filtered by `status` |
| `get-entity kind id` | Generic read for any entity type (force-map, people, outcomes, innovations, pipeline, evolution, assessments, signals) |
| `list-entities kind [status] [axis] [thesis_version] [limit]` | Return matching entities for a given kind with optional filters |
| `get-force-map [status] [strength]` | Return all force-map entries, optionally filtered |
| `get-force-map-entry project_id` | Return single force-map entry |
| `list-evolution [since] [until] [category] [axis] [project]` | Return evolution entries matching filters |
| `get-assessment quarter` | Return parsed `assessments/{quarter}.yaml` |
| `assess-coherence` | Compute coherence from current force-map: axes coverage, drift signals, strength distribution; does not write a new assessment file |
| `tail-log [n=50]` | Return last N lines of `logs/activity.ndjson` |
| `validate` | Check referential integrity (§8), thesis version chain, schema conformance, state.json counter accuracy; report deviations; never auto-fix |

### Write operations

Write operations follow a standard protocol:
1. Check for stale lock on the target file (reject if lock is fresh, i.e. written within 5 minutes).
2. Acquire advisory lock (write `.lock` file with timestamp and operator).
3. Read current file state.
4. Apply the change.
5. Write the updated file.
6. Release lock (delete `.lock` file).
7. Append event to `logs/activity.ndjson`.
8. Update `state.json` counters.

| Operation | Description | Lock target | Counter bumped |
|---|---|---|---|
| `init` | Scaffold full directory structure; seed manifest and state; write empty thesis stub | manifest.yaml | — |
| `update-thesis fields` | Archive current → history; write new current.yaml with bumped version; requires `trigger` field | thesis/current.yaml | `thesis_versions` |
| `add-axis fields` | Write new `axes/{id}.yaml` | state.json | `axes.active` |
| `update-axis id fields` | Update axis fields | — (file-per-entity) | — |
| `graduate-axis id` | Set `status: graduated`, set `graduated_at` | — | `axes.active--`, `axes.graduated++` |
| `map-project fields` | Write `force-map/{project_id}.yaml`; set `thesis_version` to current | state.json | `projects_mapped` |
| `update-project-mapping id fields` | Update force-map entry fields | — | — |
| `add-person fields` | Write `people/{person_id}.yaml` | state.json | `people` |
| `update-person id fields` | Update person fields | — | — |
| `add-outcome fields` | Write `outcomes/{outcome_id}.yaml` | state.json | `outcomes` |
| `update-outcome id fields` | Update outcome fields | — | — |
| `add-innovation fields` | Write `innovations/{innovation_id}.yaml` | state.json | `innovations` |
| `update-innovation id fields` | Update innovation fields | — | — |
| `add-pipeline-entry fields` | Write `pipeline/{company_id}.yaml` | state.json | `pipeline_entries` |
| `update-pipeline-entry id fields` | Update pipeline entry fields | — | — |
| `add-evolution-entry fields` | Write `evolution/evo-{date}-{slug}.yaml` | state.json | `evolution_entries` |
| `write-assessment quarter fields` | Write `assessments/{quarter}.yaml` | state.json | `assessments` |
| `add-signal fields` | Write `signals/sig-{date}-{slug}.yaml` | state.json | `signals` |
| `generate-vision-doc params` | Synthesize from entities; write `vision-docs/{doc-id}/` with meta.yaml + document file | state.json | `vision_docs` |

### Canonical activity log events

```json
{"ts":"2026-05-05T12:00:00Z","actor":"strategic-state","event":"facility.initialized","summary":"Strategic state facility initialized"}
{"ts":"2026-05-05T16:00:00Z","actor":"strategic-state","event":"thesis.updated","summary":"Thesis updated to v2","data":{"version":2,"trigger":"Strategic critique of v1..."}}
{"ts":"2026-05-05T16:01:00Z","actor":"strategic-state","event":"axis.created","summary":"Axis created: methodology-as-product","data":{"id":"methodology-as-product"}}
{"ts":"2026-05-05T16:02:00Z","actor":"strategic-state","event":"project.mapped","summary":"Project mapped: aimqc","data":{"project_id":"aimqc","evidence_type":"proves","strength":"strong"}}
{"ts":"2026-05-05T16:03:00Z","actor":"strategic-state","event":"evolution.recorded","summary":"Evolution entry recorded: evo-2026-05-05-aimqc-portfolio-depth","data":{"category":"insight"}}
{"ts":"2026-05-05T16:04:00Z","actor":"strategic-state","event":"assessment.recorded","summary":"Assessment recorded for 2026-Q2","data":{"quarter":"2026-Q2","coherence_score":4}}
{"ts":"2026-05-05T16:05:00Z","actor":"strategic-state","event":"state.validated","summary":"Validation complete — 0 violations found"}
{"ts":"2026-05-05T16:06:00Z","actor":"strategic-state","event":"vision-doc.generated","summary":"Vision document generated: 2026-q2-client-capability-brief","data":{"audience":["client"],"format":"docx"}}
```

---

## 8. Referential Integrity Rules

These ten rules are enforced by the `validate` operation. Violations are reported; none are auto-corrected.

| Rule | Check |
|---|---|
| 1 | Every `axis_id` referenced in a force-map entry's `axes_served` must exist as a file in `axes/` |
| 2 | Every `project_id` referenced in an evolution entry's `projects_involved` must exist as a file in `force-map/` |
| 3 | `thesis/current.yaml:version` must equal `max(history versions) + 1`; if history is empty, must equal 1 |
| 4 | `thesis/current.yaml:supersedes` must equal `max(history versions)`; if history is empty, must be `null` |
| 5 | Every evolution entry's `thesis_version_before` must be ≤ `thesis/current.yaml:version` |
| 6 | Every assessment's `thesis_version` must be ≤ `thesis/current.yaml:version` |
| 7 | Every `project_id` in an outcomes entry must exist as a file in `force-map/` |
| 8 | Every `axis_id` in an innovations entry's `axes_served` must exist as a file in `axes/` |
| 9 | Every `project_id` in a person's `roles_in_portfolio` must exist as a file in `force-map/` |
| 10 | Every entity ID in a vision-doc's `sources` lists (axes, projects, people, outcomes, innovations) must exist in the corresponding facility directory |

### Validation checklist (full)

- [ ] All YAML files parse without error
- [ ] All entities have required fields per schema
- [ ] Referential integrity rules 1–10 pass
- [ ] Thesis version chain is unbroken (v1, v2, v3... no gaps)
- [ ] No stale lockfiles (older than 5 minutes)
- [ ] `state.json` counters match on-disk file counts per entity type
- [ ] `logs/activity.ndjson` is valid NDJSON (each line parses as JSON)
- [ ] All outcome metrics have `confidence` ratings
- [ ] All innovations have at least one `differentiation` entry with a `metric`
- [ ] All `contradicts` force-map entries are referenced in at least one evolution entry or assessment drift signal

---

## 9. Vision Document Generation

The `generate-vision-doc` operation is the primary output of the facility. It synthesizes the full evidence base into a formatted document tuned to a specific audience.

### Inputs

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `audience` | string or array | Yes | `client` \| `investor` \| `partner` \| `internal` |
| `title` | string | Yes | Document title |
| `axes_filter` | array of axis IDs | No | Limit to specific axes; default: all active |
| `projects_filter` | array of project IDs | No | Limit to specific projects; default: all `strong` or `active` |
| `include_people` | boolean | No | Default: `true` |
| `include_outcomes` | boolean | No | Default: `true` |
| `include_innovations` | boolean | No | Default: `true` |
| `format` | string | No | `docx` \| `pdf` \| `md`; default: `docx` |

### Document sections

Each generated document contains eight sections in this order:

| Section | Content |
|---|---|
| 1. Strategic Thesis | Current thesis statement, elaboration, and falsifiable claims |
| 2. Strategic Dimensions | Active axes with definitions and summary of projects serving each |
| 3. Portfolio Evidence | Force-map entries matching strength/status filter, with contribution narratives |
| 4. Innovation Inventory | Innovations with novelty claims and differentiation metrics, framed per audience |
| 5. Team Capabilities | People profiles with expertise depth, track record, and competitive claim |
| 6. Client Outcomes | Outcome entries with before/after metrics, filtered by `audience_relevance` |
| 7. Competitive Position | Synthesis of moat types, replication costs, and axis momentum from latest assessment |
| 8. Forward Thesis | Open falsifiable claims framed as forward-looking proof points |

### Audience lenses

Each audience emphasizes different sections and frames the same evidence differently.

| Audience | Emphasizes | De-emphasizes |
|---|---|---|
| `client` | Outcomes (what changed for others), team expertise as delivery proof, innovations as practical capabilities | Falsifiable claims (too abstract); axis theory |
| `investor` | Thesis as market claim, portfolio breadth as traction evidence, innovations as moat, falsifiable claims as investment thesis | Individual outcome details |
| `partner` | Axis alignment with partner's domain, infrastructure sovereignty, structural pattern as integration surface | Client-specific outcomes |
| `internal` | Full evidence base with no framing filter — every claim, every gap, every drift signal visible | Nothing; all data shown |

### Output

The operation writes to `vision-docs/{doc-id}/`:

```
vision-docs/
└── {doc-id}/
    ├── meta.yaml       ← audience, date, sources used, thesis version
    └── {doc-id}.docx   ← (or .md or .pdf depending on format)
```

The `meta.yaml` captures exactly which entities were included, pinning the document to a specific state of the evidence base:

```yaml
doc_id: "2026-q2-client-capability-brief"
title: "Atomic 47 — Client Capability Brief Q2 2026"
date: "2026-05-05"
thesis_version: 2
audience:
  - client
format: docx
sources:
  axes:
    - methodology-as-product
    - domain-specific-intelligence
    - structural-sovereignty
  projects:
    - aimqc
    - kf-skills
    - ai26-10
  people:
    - david-olsson
  outcomes:
    - kf-aerospace-mro-skills
    - pic-project-management
  innovations:
    - manifold-structured-intelligence
    - facility-pattern
generated_by: "strategic-state"
file: "vision-docs/2026-q2-client-capability-brief/2026-q2-client-capability-brief.docx"
notes: ""
```

---

## 10. Concurrency Model

The facility uses a three-tier concurrency model that matches write risk to lock cost.

### Tier 1: File-per-entity (no lock required)

Each axis, force-map entry, person, outcome, innovation, pipeline entry, evolution entry, assessment, and signal is its own file. Two concurrent writers targeting different entities have no collision risk. No lock is required for entity-level writes.

### Tier 2: Advisory lockfiles (for shared files)

`manifest.yaml`, `state.json`, and `thesis/current.yaml` are shared files written by multiple operations. Each uses an advisory lockfile stored in `locks/`:

- Lock filename: `locks/{target-basename}.lock`
- Lock content: `{"locked_at": "{ISO-8601}", "actor": "{skill-name}", "pid": N}`
- TTL: 300 seconds (5 minutes)
- On acquiring: check if lock file exists and is younger than TTL. If so, refuse and report. If not (missing or stale), write lock file.
- On releasing: delete lock file.
- Stale locks (older than TTL) are considered abandoned and may be overwritten.

The thesis update operation locks `thesis/current.yaml` and uses a write-then-rename pattern for atomicity:

1. Write new thesis content to `thesis/current.yaml.tmp`
2. Rename `thesis/current.yaml.tmp` → `thesis/current.yaml` (atomic on POSIX)
3. Release lock

### Tier 3: Activity log (append-only, O_APPEND)

`logs/activity.ndjson` is written with `O_APPEND`. Each write is a single JSON line terminated by a newline. On POSIX systems, writes to a file opened with `O_APPEND` that are smaller than `PIPE_BUF` (4096 bytes) are atomic. Activity log entries must be kept under 4096 bytes. If an entry would exceed this, truncate the `summary` or `data` fields rather than splitting across lines.

The activity log is never rewritten, compacted, or truncated. If a write event was incorrect, the correction is a new entry with `event: "correction"` and a `corrects_id` field.

### Thesis versioning is append-only

History files (`thesis/history/`) are written once and never modified. If a historical thesis version was incorrectly archived, the correction is a new thesis update (which creates a new current and archives it), not a modification of the history file.

---

## 11. Harvesting from Other State Facilities

Strategic state enriches itself by reading from the other three state facilities. The harvest is always one-directional: strategic state reads; the source facilities do not know about strategic state and are not modified.

### From work state (`~/work-state/`)

Work state records events from connected surfaces (GitHub, Gmail, Slack, scsiwyg, Google Docs). Strategic state scans these events for strategic signal:

| Work event type | Strategic signal | Action |
|---|---|---|
| `publish` | Methodology demonstrated in public; proof that the approach is documented and shareable | Candidate evidence for force-map `contribution`; candidate innovation proof point |
| `build` (commit events in project repos) | Which projects are receiving active engineering attention | Cross-reference with force-map to identify projects with strong thesis contribution that are also actively being built — strongest evidence type |
| `share` | Information shared with clients or partners | Candidate signal entry; may reveal client interest in specific axes |
| `learn` | Correction event | Note for validation — if a learn event corrects a prior event used as thesis evidence, the evidence quality should be re-evaluated |

The harvest cursor for work state is stored in `state.json` under a `harvest_cursors.work_state` key (last harvested event timestamp). On each harvest run, only events newer than the cursor are scanned.

### From project state (`.project-state/` per project)

Each managed project may have a `.project-state/` directory. Strategic state scans the configured paths from `manifest.yaml:harvest_sources.project_state_paths`:

| Project state artifact | Strategic signal | Action |
|---|---|---|
| `milestones/*.yaml` with `status: completed` | A project deliverable has been achieved | Candidate outcome entry; `metrics` must be added manually unless quantified data is in the milestone |
| `decisions/*.yaml` | A significant project decision was made | Candidate evolution entry if the decision has strategic implications; candidate signal if it involves a pipeline company |
| `reports/*.md` or SC meeting minutes | External communication artifacts | Scan for pipeline company mentions; scan for client feedback that confirms or challenges axes |
| `logs/activity.ndjson` | Project event history | Cross-reference with force-map entry `last_assessed` date to identify staleness |

### From docket state (`~/docket-state/`)

Docket state tracks open matters — commitments, obligations, follow-ups. Strategic state scans for matters with strategic relevance:

| Docket artifact | Strategic signal | Action |
|---|---|---|
| Open high-priority matters with `context.axis_id` set | A pending commitment is tied to a strategic axis | Candidate signal entry |
| Open matters with `context.company_id` matching a pipeline entry | A commercial obligation is active with a pipeline company | Update `last_updated` on pipeline entry; may warrant pipeline stage change |
| Resolved matters that involved a pipeline company | Engagement milestone completed | Candidate pipeline status update; may be an outcome if quantified |

---

## 12. Relationship to Other State Facilities

```
                    ┌──────────────────┐
                    │  strategic-state │  direction layer
                    │  ~/.strategic-   │  thesis · axes · force map
                    │  state/          │  outcomes · innovations
                    └────────┬─────────┘
                             │ reads (one-way)
             ┌───────────────┼───────────────┐
             │               │               │
    ┌────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
    │  work-state   │ │project-state│ │  docket-state   │
    │  ~/work-state/│ │.project-    │ │  ~/docket-state/│
    │               │ │  state/     │ │                 │
    │ what happened │ │ how projects│ │ what is owed    │
    │  (evidence)   │ │    run      │ │ (accountability)│
    └───────────────┘ └─────────────┘ └─────────────────┘
```

### Work state (upstream evidence provider)

Work state is the most granular upstream source. It records what happened at the level of individual events: a commit, a published post, a sent message, a received email. Strategic state uses work state to detect where real attention is going — which repos are active, what is being published, what patterns emerge in commit cadence — and to compare that against what the force map claims the portfolio is doing.

The relationship is observational. Strategic state does not command or modify work state. Work state does not know about strategic state.

### Docket state (upstream signal provider)

Docket state tracks open obligations and commitments. Its signal to strategic state is different from work state's: where work state shows activity, docket state shows obligation. A high-priority open matter connected to a pipeline company is a signal that a commercial relationship is active and has demands on it. A cluster of open matters pointing at the same axis suggests the axis is generating real-world commitments — a form of market validation.

### Project state (upstream evidence and milestone provider)

Project state is the richest upstream source for outcomes and evolution entries. Milestone completions are the clearest candidates: when a milestone is marked complete with quantified results, it is a near-direct source for an outcome entry. Decision logs are evolution entry candidates. SC meeting minutes and communication artifacts may contain client and partner signals.

Project state operates independently of strategic state. A project can run without a `.strategic-state/` facility existing anywhere. When strategic state does exist, it reads project state; project state does not read strategic state back.

### None of the upstream facilities write to strategic state

Strategic state is enriched by reading. It is never enriched by the other facilities pushing to it. This keeps the direction layer clean: the only writes to `~/.strategic-state/` are deliberate acts — a human (or a skill acting on explicit human instruction) updating the thesis, mapping a project, or recording an outcome. Passive enrichment (harvest) requires explicit invocation.
