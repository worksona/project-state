# Skill Layer Specification

**Version:** 1.0
**Status:** Draft
**Date:** 2026-05-05
**Audience:** Skill authors building new skills across any of the four state suites; architects designing inter-suite coordination; developers extending the integration layer

---

## 1. The skill layer defined

The four-state intelligence stack has four architectural layers:

| Layer | Role |
|-------|------|
| Data layer | The four state facilities as a unified substrate (`~/work-state/`, `~/docket-state/`, `.project-state/`, `~/.strategic-state/`) |
| **Skill layer** | The behavior suite — skills that read state, act on it, and write back through the state layer |
| Surface layer | Output delivery — Slack, Gmail, Calendar, scsiwyg, project website, kanban UI |
| Integration layer | Cross-state data flows — reads from one facility, writes to another |

The skill layer is the behavioral tier that sits above the data layer and below the surface layer. It contains every `work-*`, `docket-*`, `project-*`, and `strategic-*` skill in the stack.

### 1.1 What a skill is

A skill is a stateless verb. It has no persistent state of its own. Between invocations, it is inert — no background threads, no cached data, no in-process memory. On each invocation it:

1. Reads state from the relevant data-layer facility via that facility's memory-layer skill
2. Performs actions (file I/O routed through the memory layer, surface calls, agent spawning)
3. Returns output to the user or to the calling skill
4. Has no residue

This is not merely convention — it is the invariant that makes the skill layer safe to run in parallel. Two harvesters running concurrently produce the same events because neither holds intermediate state; all coordination happens via the data layer's concurrency primitives (advisory lockfiles, atomic renames, append-only logs).

### 1.2 The memory-layer pattern

Every state facility has exactly one memory-layer skill:

| Facility | Memory-layer skill |
|----------|--------------------|
| `~/work-state/` | `work-state` |
| `~/docket-state/` | `docket-state` |
| `.project-state/` | `project-state` |
| `~/.strategic-state/` | `strategic-state` |

**This is the single most important architectural rule of the skill layer:** all reads from and writes to a state facility must route through the facility's memory-layer skill. No other skill in the suite opens files in the facility directly.

The memory-layer skill is where schema validation, concurrency enforcement, activity logging, and optimistic-concurrency checks are concentrated. Bypassing it — by having another skill use `Read`, `Write`, or `Bash` directly against facility paths — silently removes all of those guarantees.

The memory-layer pattern applies identically to all four suites. The `work-state` SKILL.md states this explicitly:

> `work-state` is the *only* skill that reads and writes `~/work-state/` directly; every other skill expresses intent and this skill enforces schema, concurrency, and logging.

The same sentence appears, mutatis mutandis, in the `project-state` and `strategic-state` SKILL.md files. It is not optional.

### 1.3 The orchestrator pattern

Every state facility has exactly one orchestrator skill:

| Facility | Orchestrator skill |
|----------|--------------------|
| `~/work-state/` | `work-orchestrator` |
| `~/docket-state/` | `docket-orchestrator` |
| `.project-state/` | `project-orchestrator` |
| `~/.strategic-state/` | `strategic-advisor` |

The orchestrator decides what to do next. It does not do the work. Specifically:

- It reads state (via the memory-layer skill)
- It computes what is due, overdue, or pending
- It builds a prioritized action list
- It delegates each action to the specialist skill that handles it
- It returns control to the user after each delegation

If an orchestrator is generating content, writing entities, or sending to surfaces, it is doing too much. The `work-orchestrator` SKILL.md states this: "Thin by design — this skill routes, it does not do the lifecycle work itself."

### 1.4 The harvester pattern

Harvesters are ingest skills that pull external signals into a state facility:

- They connect to an external source (a third-party API or another state facility)
- They pull new data since the last cursor position
- They normalize it to the facility's event or entity schema
- They write via the memory-layer skill
- They update the cursor in the facility after a successful write
- They finalize the batch (updating state counters) via the memory-layer skill
- They are idempotent: running twice on the same data produces the same result because event IDs are deterministic
- They are stateless: all cursor state lives in the facility, not in the harvester

---

## 2. Skill suites by state facility

### 2.1 Work state skill suite

8 skills. Facility path: `~/work-state/`.

| Skill | Role | Job | Status |
|-------|------|-----|--------|
| `work-state` | Memory layer | Read/write/validate `~/work-state/` — manifest, events, digests, cursors, activity log | Exists |
| `work-orchestrator` | Orchestrator | Decide what to harvest, digest, and report next based on state and calendar | Exists |
| `work-harvester-github` | Harvester | Harvest GitHub commits, PRs, releases | Exists |
| `work-harvester-scsiwyg` | Harvester | Harvest scsiwyg posts and newsletter sends | Exists |
| `work-harvester-gmail` | Harvester | Harvest Gmail sent + filtered inbound | Exists |
| `work-harvester-slack` | Harvester | Harvest Slack messages, DMs, mentions | Exists |
| `work-harvester-gdocs` | Harvester | Harvest Google Docs edits and shares | Exists |
| `work-kanban` | UI | Start local kanban/dashboard at `localhost:3333` and open the browser | Exists |

**Planned additions** (see section 9):

| Skill | Role | Job | Status |
|-------|------|-----|--------|
| `work-daily-digest` | Reporter | Generate daily intelligence brief from events | To build |
| `work-weekly-report` | Reporter | Weekly synthesis across all surfaces | To build |
| `work-themes` | Analyzer | Longitudinal theme extraction from event corpus | To build |
| `work-metrics` | Analyzer | Velocity, output rate, project attribution | To build |

### 2.2 Docket state skill suite

5 skills. Facility path: `~/docket-state/`. **All skills in this suite are to be built.** See `docs/DOCKET-STATE-SPEC.md` for the facility design.

| Skill | Role | Job | Status |
|-------|------|-----|--------|
| `docket-state` | Memory layer | Read/write/validate `~/docket-state/` — matters, commitments, threads, deadlines, activity log | To build |
| `docket-orchestrator` | Orchestrator | Triage matters, surface overdue and urgent items, route to owner | To build |
| `docket-harvester` | Harvester | Scan work-state events for implicit commitments and unresolved threads | To build |
| `docket-notifier` | Notifier | Route overdue and urgent matters to Slack | To build |
| `docket-digest` | Reporter | Daily docket summary — open matters, deadlines, blocked items | To build |

`docket-state` must be built before any other docket skill. It is the memory layer; the others cannot function without it.

### 2.3 Project state skill suite

19 skills organized in four tiers. Facility path: `.project-state/` (found by walking up from cwd). All 19 exist.

| Skill | Tier | Job | Pack required |
|-------|------|-----|:---:|
| `project-state` | P0 | Memory layer — read/write/validate `.project-state/` | No |
| `project-scaffolder` | P0 | One-shot initializer; seeds reporting matrix from packs | No |
| `project-phase-gate` | P1 | Lifecycle phase transitions with preset-driven gate enforcement | Yes |
| `project-document-curator` | P1 | Classify, index, and promote project documents | No |
| `project-milestone-manager` | P1 | CRUD milestones, percent_complete, technical_progress | No |
| `project-status-reporter` | P1 | Generate status reports (weekly, SC pack, claim draft, dashboard) | No |
| `project-orchestrator` | P2 | Calendar-aware conductor; reads reporting matrix, dispatches generators | No |
| `project-notifier` | P2 | Route artifacts to Slack, Gmail drafts, Calendar | No |
| `project-review-meeting` | P2 | Generic recurring review-meeting lifecycle (SC, board, QBR, retro) | Yes |
| `project-funder-reporting` | P2 | Generic stakeholder-bound recurring reports (claims, invoices, board packs) | Yes |
| `project-change-register` | P2 | Material vs. non-material change classification and routing | No |
| `project-blog-publisher` | P2 | scsiwyg bridge with publication-review respect | No |
| `project-website-publisher` | P2 | Static project website with stable URLs for reference docs | No |
| `project-onboarder` | P3 | Personalized onboarding briefs for new teammates | No |
| `project-ip-tracker` | P3 | IP disclosures with configurable recipient via pack profile | Yes |
| `project-external-comms` | P3 | External-communication review pipeline | Yes |
| `project-lessons` | P3 | Continuous lessons-learned capture + closeout summary | No |
| `project-archive` | P3 | Project closeout and archival | Yes |
| `project-harvester` | P2 | Harvest external signals (Slack, Gmail, GDocs, scsiwyg) into `documents/inbox/` | No |

Tier definitions within the project suite:

- **P0** — foundation; no dependencies on other project skills
- **P1** — core operations; depends on `project-state`
- **P2** — surfaces and automation; depends on `project-state` and relevant P1 skills
- **P3** — polish and lifecycle; depends on `project-state` and `project-notifier`

### 2.4 Strategic state skill suite

4 skills. Facility path: `~/.strategic-state/`.

| Skill | Role | Job | Status |
|-------|------|-----|--------|
| `strategic-state` | Memory layer | Read/write/validate `~/.strategic-state/` — thesis, signals, vision docs, activity log | Exists |
| `strategic-advisor` | Orchestrator | Surface thesis drift, prioritize signal review, recommend updates, generate perspective | Exists |
| `strategic-harvester` | Harvester | Pull signals from work-state, project-state, and docket-state into `~/.strategic-state/signals/` | To build |
| `strategic-doc-generator` | Generator | Generate vision documents and strategic briefs from the facility | To build |

---

## 3. The memory-layer pattern

### 3.1 The rule

One memory-layer skill per state facility. No other skill in the suite reads or writes the facility's directory directly.

```
Caller (any skill)
    |
    | "create milestone M07 with these fields"
    v
[project-state]   ← the only path to .project-state/
    |
    |  1. validate schema
    |  2. acquire lockfile
    |  3. check optimistic concurrency (base_last_modified)
    |  4. apply change
    |  5. write file
    |  6. release lock
    |  7. append to logs/activity.ndjson
    |  8. update state.json counters
    v
return {status, id, path}
```

This is the write protocol. Every mutation in every facility follows this shape. The lock granularity differs by facility (file-per-entity for milestones and events; advisory locks for manifests and state.json) but the pattern is identical.

### 3.2 Why the rule exists

Centralizing all reads and writes in the memory-layer skill enforces:

| Guarantee | Mechanism |
|-----------|-----------|
| Schema validation on every write | Memory-layer validates before writing |
| No two agents clobber the same file | Advisory lockfile with TTL |
| Complete audit trail | `logs/activity.ndjson` append on every write |
| Optimistic concurrency for shared files | `base_last_modified` check; CONFLICT returned, not silently overwritten |
| Idempotency | Deterministic IDs; duplicate-check before write |

Bypassing the memory layer silently removes all five guarantees. A skill that uses `Write` directly against `.project-state/milestones/M07-slug.yaml` does not validate, does not lock, does not log, and does not check for concurrent modification. The state drifts from the index; two agents writing in parallel clobber each other; the activity log becomes untrustworthy.

### 3.3 The caller contract

The calling skill expresses intent. The memory-layer skill decides how to fulfill it.

```
Caller says:    "create milestone M07 — title X, owner Y, due Z"
Memory layer:   validates fields, computes path, acquires lock, writes, logs
Caller receives: {status: "written", id: "M07-slug", path: "..."}
```

The caller never knows the file path ahead of time. It passes intent and receives a result. This keeps path logic and naming conventions centralized in one place.

### 3.4 What the memory-layer skill does not do

The memory-layer skill enforces; it does not decide. Specifically:

- It does not decide what to create or when — that is the orchestrator's job
- It does not generate report content — that is the reporter's job
- It does not classify documents — that is the document-curator's job
- It does not send to surfaces — that is the notifier's job
- It does not harvest from external sources — that is the harvester's job
- It does not delete evidence — evidence in all four facilities is immutable

### 3.5 Invocation patterns

The memory-layer skill is invoked in two contexts:

**User-direct invocation:** the user types `/work-state get-cursor github` or asks "what phase are we in?" Claude activates the memory-layer skill and runs the read operation.

**Skill-to-skill invocation:** another skill in the suite instructs Claude to invoke the memory-layer skill via the `Skill` tool:

```
Skill(skill: "project-state", args: "get-entity kind=milestone id=M07")
```

In SKILL.md body text, this is written as: "Via `project-state`, read `manifest.yaml`." The instruction is to Claude; Claude executes it by invoking the appropriate skill.

---

## 4. The orchestrator pattern

### 4.1 The rule

One orchestrator per state facility. The orchestrator reads state and delegates to specialist skills. It does not do the work itself.

### 4.2 The decision loop

All four orchestrators share the same decision-loop structure:

```
1. Read state
   └── Via the memory-layer skill: get manifest, get state.json, get recent activity

2. Compute what is due / overdue / pending
   └── Calendar arithmetic + state comparisons
   └── Examples: days since last report, days to next deadline, inbox size, gate status

3. Build a prioritized action list
   └── Order: URGENT deadlines → gate-blocking items → pending reports →
             at-risk entities → routine work → opportunities

4. Present the list to the user (interactive) or execute the top item (automated/cron)
   └── Interactive: "Here's what's pending. Proceed?"
   └── Unattended: log the plan and execute the top item; report outcomes

5. Delegate each action to the specialist skill
   └── Skill(skill: "work-harvester-github", args: "...")
   └── Skill(skill: "project-status-reporter", args: "weekly")

6. Return control to the user after each delegation
   └── Summary of what ran, what was produced, what failed
   └── Never auto-chain without user acknowledgment (interactive mode)
```

This structure is the same across `work-orchestrator`, `docket-orchestrator`, `project-orchestrator`, and `strategic-advisor`. The domain-specific content (which deadlines matter, which specialist skills exist, what "at-risk" means for this facility) varies; the loop does not.

### 4.3 Orchestrators are thin by design

If an orchestrator is doing any of the following, it is doing too much:

- Generating report content
- Writing entities to the facility
- Making API calls to external surfaces
- Harvesting data from external sources
- Computing themes or velocity metrics

When this happens, the offending logic belongs in a specialist skill. Extract it.

The `work-orchestrator` SKILL.md is explicit: "Does not write events. Does not generate report content. Does not infer themes. Does not auto-recover from errors. Does not retry failed harvests."

### 4.4 Cross-state orchestration

No single orchestrator spans all four state facilities. A `work-orchestrator` run does not call into `project-orchestrator` or `strategic-advisor`. Inter-state coordination happens in the integration layer — data flows from one facility to another; orchestrators do not call across suite boundaries.

The one permitted exception: an orchestrator may read state from another facility via that facility's memory-layer skill to make scheduling decisions. Example: `project-orchestrator` may read `~/work-state/state.json` to see whether harvesters have run today before deciding whether to run `project-harvester`. This is a read, not an invocation of another orchestrator.

### 4.5 Named routines

Each orchestrator supports named routines — named sequences of checks and delegations that correspond to a time-based or event-based trigger:

| Suite | Named routines |
|-------|---------------|
| `work-orchestrator` | `daily-routine`, `weekly-routine`, `longitudinal-routine`, `status`, `catch-up` |
| `docket-orchestrator` | `triage`, `daily`, `status`, `catch-up` |
| `project-orchestrator` | `daily`, `weekly`, `monthly`, `quarter-close`, `sc-prep`, `baseline`, `phase-check` |
| `strategic-advisor` | (facility-specific; see `STRATEGIC-STATE-SPEC.md`) |

Routines are named subcommands, not separate skills. They are handled by the single orchestrator skill via subcommand dispatch.

---

## 5. The harvester pattern

### 5.1 Where harvesters exist

| Suite | Harvesters | Source |
|-------|-----------|--------|
| Work state | `work-harvester-github`, `-scsiwyg`, `-gmail`, `-slack`, `-gdocs` | Third-party APIs |
| Docket state | `docket-harvester` | `work-state` events (another facility) |
| Project state | `project-harvester` | Slack, Gmail, GDocs, scsiwyg (third-party APIs) |
| Strategic state | `strategic-harvester` (planned) | `work-state`, `project-state`, `docket-state` (other facilities) |

Note: `docket-harvester` and `strategic-harvester` are facility-to-facility harvesters — they read from one state facility and write to another. The write path still goes through the destination facility's memory-layer skill.

### 5.2 The harvester run protocol

Every harvester follows this protocol:

```
1. Read cursor
   └── Via memory-layer skill: get-cursor <surface>
   └── If null: default to configured lookback (e.g., 30 days)

2. Fetch from source
   └── API call or facility read, paginated, since cursor
   └── Stop when response is empty or all items are before cursor

3. Normalize each item to the facility event/entity schema
   └── Compute deterministic ID: {surface}-{type}-{date}-{hash}
   └── Validate all required envelope fields

4. Write each item via memory-layer skill
   └── log-event or create-entity per item
   └── If duplicate ID: skip silently (idempotent)
   └── If validation fails: log error, continue with remaining items

5. Finalize batch via memory-layer skill
   └── finalize-batch {surface, count, max_timestamp, harvester, harvester_version}
   └── Updates state.json counters and cursor atomically

6. Log harvester run
   └── Via memory-layer skill: log-skill-run {skill, args, outcome, duration_ms}
   └── Appended to logs/skills.ndjson

7. Report outcomes to caller
   └── {surface, count, errors: [], cursor_advanced_to}
```

### 5.3 Idempotency

All harvesters must be idempotent. Running the same harvester twice over the same time window produces the same result. This is enforced by:

- Deterministic event IDs: two ingestions of the same source item produce the same ID
- Duplicate check in the memory-layer write protocol: if the ID already exists, return `{status: "duplicate"}` and skip
- Cursor-based fetch: the harvester only requests items newer than the last cursor, but idempotency does not rely on the cursor being set correctly — it relies on the ID uniqueness guarantee

### 5.4 Cursor state lives in the facility

A harvester has no persistent state. The cursor — the high-water mark of what has been ingested — lives in the facility's `state.json`. If a harvester is killed mid-run, the cursor has not advanced (it advances only in `finalize-batch`). On the next run, the harvester re-fetches items it may have partially written; the duplicate-ID check makes this safe.

### 5.5 Error handling in harvesters

Harvesters do not retry on transient errors. They log the error and continue with remaining items. If the external source is unavailable, they log the failure and return early. The orchestrator surfaces failures; a human decides whether to rerun.

---

## 6. Skill tiers

### 6.1 Within the project suite (P0–P3)

The project suite uses explicit tier labels in frontmatter:

| Tier | Skills | Dependencies |
|------|--------|-------------|
| P0 | `project-state`, `project-scaffolder` | None |
| P1 | `project-phase-gate`, `project-document-curator`, `project-milestone-manager`, `project-status-reporter` | `project-state` |
| P2 | `project-orchestrator`, `project-notifier`, `project-review-meeting`, `project-funder-reporting`, `project-change-register`, `project-blog-publisher`, `project-website-publisher`, `project-harvester` | `project-state` + relevant P1 skills |
| P3 | `project-onboarder`, `project-ip-tracker`, `project-external-comms`, `project-lessons`, `project-archive` | `project-state` + `project-notifier` |

### 6.2 Cross-suite tier equivalents

The P0–P3 system applies within the project suite. The equivalent functional roles across all four suites:

| Role | Cross-suite tier | Skills |
|------|-----------------|--------|
| Memory layers | Foundation | `work-state`, `docket-state`, `project-state`, `strategic-state` |
| Orchestrators | Conductor | `work-orchestrator`, `docket-orchestrator`, `project-orchestrator`, `strategic-advisor` |
| Harvesters | Ingest | `work-harvester-*`, `docket-harvester`, `project-harvester`, `strategic-harvester` |
| Reporters | Workers | `work-daily-digest`, `work-weekly-report`, `docket-digest`, `project-status-reporter`, `project-review-meeting`, `project-funder-reporting`, `strategic-doc-generator` |
| Curators and managers | Workers | `project-document-curator`, `project-milestone-manager`, `project-change-register`, `project-phase-gate`, `project-onboarder`, `project-lessons`, `project-archive`, `project-ip-tracker`, `project-external-comms` |
| Notifiers | Workers | `project-notifier`, `docket-notifier`, `project-blog-publisher`, `project-website-publisher` |
| UIs | Local surfaces | `work-kanban` |

---

## 7. Skill invocation model

### 7.1 The two invocation mechanisms

**Skill tool invocation**

A skill invokes another skill via the `Skill` tool:

```
Skill(skill: "project-milestone-manager", args: "update M07 percent_complete=45")
```

Used when:
- The called skill is a peer in the same suite
- The work is synchronous — the caller needs the result before continuing
- The scope is bounded — one entity, one operation

Example in SKILL.md body text: "Via `project-milestone-manager`, update M07 percent_complete to 45."

**Agent tool invocation**

A skill spawns a subagent that runs a skill independently with its own context window:

```
Agent(task: "Run work-harvester-github since cursor 2026-04-01T00:00:00Z and return the result")
```

Used when:
- The work is long-running (a full harvest of 500 commits)
- Multiple skills can run in parallel (five harvesters simultaneously)
- The called skill needs its own context space to avoid overrunning the parent's context

The `work-orchestrator` running all five harvesters in parallel uses agent invocation for each harvester. Each runs in its own context and returns a result summary.

### 7.2 Cross-state skill invocation

**Default rule:** a skill in one suite does not directly invoke a skill in another suite.

A `work-*` skill does not call `Skill(skill: "project-orchestrator", ...)`. A `project-*` skill does not call `Skill(skill: "strategic-advisor", ...)`.

Cross-state work is mediated by the integration layer: a skill reads data from another facility (via that facility's memory-layer skill) and processes it locally. The distinction is:

```
Permitted:   project-harvester reads from Gmail (external source)
Permitted:   strategic-harvester reads ~/work-state/state.json via work-state skill
Permitted:   docket-harvester reads ~/work-state/events/ via work-state skill
Not permitted: project-orchestrator invokes work-orchestrator directly
Not permitted: strategic-advisor invokes project-orchestrator directly
```

**The one exception:** orchestrators may read state from other facilities via the other facility's memory-layer skill to make scheduling decisions. This is a unidirectional read. The orchestrator does not delegate work to the other facility's orchestrator; it reads data and uses it locally.

### 7.3 Invocation direction

The invocation graph is a DAG rooted at the memory-layer skills:

```
User
 └── orchestrator
      ├── memory-layer skill (reads)
      ├── harvester-A (via Agent)
      ├── harvester-B (via Agent)
      └── reporter (via Skill)
           └── memory-layer skill (reads + writes)
```

Specialist skills never invoke the orchestrator. The orchestrator is not a service; it is an entry point.

---

## 8. Slash command coverage

Each suite has a defined set of slash commands — one per skill. Slash commands are deterministic activators: the user types the command and Claude activates the named skill without description matching.

### 8.1 Work state commands

```
/work-state
/work-orchestrator
/work-harvester-github
/work-harvester-scsiwyg
/work-harvester-gmail
/work-harvester-slack
/work-harvester-gdocs
/work-kanban
```

Planned (when skills are built):

```
/work-daily-digest
/work-weekly-report
/work-themes
/work-metrics
```

### 8.2 Docket state commands (all planned)

```
/docket-state
/docket-orchestrator
/docket-harvester
/docket-notifier
/docket-digest
```

### 8.3 Project state commands

```
/project-state
/project-scaffolder
/project-orchestrator
/project-phase-gate
/project-document-curator
/project-milestone-manager
/project-status-reporter
/project-notifier
/project-review-meeting
/project-funder-reporting
/project-change-register
/project-blog-publisher
/project-website-publisher
/project-onboarder
/project-ip-tracker
/project-external-comms
/project-lessons
/project-archive
/project-harvester
```

### 8.4 Strategic state commands

```
/strategic-state
/strategic-advisor
```

Planned:

```
/strategic-harvester
/strategic-doc-generator
```

### 8.5 Slash command contract

Every slash command must:

1. Map to exactly one skill (one-to-one)
2. Support `--help` as a subcommand even if not declared in frontmatter
3. Support `--dry-run` for any skill that writes state or contacts surfaces
4. Be registered in `~/.claude/CLAUDE.md` with the trigger phrase format:
   ```
   - **skill-name** — <description excerpt>. Trigger: `/skill-name`
   ```

---

## 9. Cross-state skill gaps

Skills that are designed (in specs or implied by the architecture) but not yet built, organized by priority.

### 9.1 Docket state (all skills to build — highest priority)

The entire docket suite is absent. No docket-state facility exists until `docket-state` is built. Build order is strict: `docket-state` must exist before any other docket skill can be built or tested.

| Skill | Priority | Blocker |
|-------|----------|---------|
| `docket-state` | Build first | None |
| `docket-orchestrator` | Build second | `docket-state` |
| `docket-harvester` | Build third | `docket-state`, `work-state` (read source) |
| `docket-notifier` | Build fourth | `docket-state` |
| `docket-digest` | Build fifth | `docket-state` |

Reference: `docs/DOCKET-STATE-SPEC.md` for facility design.

### 9.2 Work state gaps

| Skill | Role | Priority | Notes |
|-------|------|----------|-------|
| `work-daily-digest` | Reporter | High | `work-orchestrator` already knows to call it; it's called from the decision loop but the skill doesn't exist |
| `work-weekly-report` | Reporter | High | Same — `work-orchestrator weekly-routine` expects it |
| `work-themes` | Analyzer | Medium | Longitudinal pattern detection; enriches events with themes |
| `work-metrics` | Analyzer | Medium | Velocity, output rate, project attribution |

### 9.3 Strategic state gaps

| Skill | Role | Priority | Notes |
|-------|------|----------|-------|
| `strategic-harvester` | Harvester | High | Pulls signals from work/project/docket into `~/.strategic-state/signals/`; prerequisite for keeping strategic state current without manual input |
| `strategic-doc-generator` | Generator | Medium | Currently `generate-vision-doc` is an operation within `strategic-state`; extracting it to a dedicated skill gives it full slash-command coverage and `--dry-run` support |

### 9.4 Project state

Complete. All 19 project skills exist. No gaps.

---

## 10. Skill authoring standards

These rules apply to every skill in every suite. They extend the project-suite-specific rules in `docs/SKILL-SPEC.md` to the full four-state stack.

### 10.1 The ten rules

| # | Rule |
|---|------|
| 1 | Every skill routes all state reads and writes through the memory-layer skill for its facility |
| 2 | Every skill declares `depends_on.skills` in frontmatter, including the memory-layer skill |
| 3 | Every skill declares `surfaces` in frontmatter for every external system it contacts (including conditional contacts) |
| 4 | Every write-capable skill implements `--dry-run` |
| 5 | Every skill implements `--help` (explicitly or implicitly) |
| 6 | Every skill's `description` field is ≤1024 characters and contains ≥5 natural-language trigger phrases |
| 7 | No skill holds state between invocations |
| 8 | No skill reads another facility's files directly — inter-facility reads go through that facility's memory-layer skill |
| 9 | Every skill logs its run to the facility's `logs/skills.ndjson` via the memory-layer skill |
| 10 | No skill directly invokes a skill in another suite (except: orchestrators may read another facility's memory-layer skill for scheduling decisions) |

### 10.2 Frontmatter requirements (all suites)

```yaml
---
name: <suite>-<slug>                    # required; matches directory name
description: "..."                      # required; ≤1024 chars; ≥5 trigger phrases
version: "1.0.0"                        # semver; required or inherited from plugin
depends_on:
  skills:
    - <suite>-state                     # memory-layer skill always listed first
    - <other-dependencies>
surfaces:                               # every contacted surface, including conditional
  - slack
  - gmail-draft
slash_command:
  trigger: "/<suite>-<slug>"
  subcommands:
    - name: "--help"
      description: "Show usage summary"
    - name: "--dry-run"                 # required for write skills
      description: "Preview without writing"
  examples:
    - "/<suite>-<slug>"
    - "/<suite>-<slug> --dry-run"
---
```

### 10.3 Required body sections

Every SKILL.md must contain these sections in order:

```
## Purpose
## Trigger phrases
## Inputs
## Outputs
## Behavior
## Output format
## Error handling
```

Within `## Behavior`, every state I/O instruction must be expressed as a call through the memory-layer skill:

```markdown
# Correct
Via `work-state`, get the cursor for surface `github`.

# Incorrect
Read `~/work-state/state.json` and extract `last_harvest_at.github`.
```

### 10.4 The `--dry-run` contract

Any skill that writes state or contacts a surface must support `--dry-run`. When `--dry-run` is passed:

- No state is written
- No surface is contacted
- The skill produces a preview of what it would do, formatted identically to the normal output but prefixed with `[DRY RUN]`
- The activity log is not written to

### 10.5 The `--help` contract

When the user invokes `/<skill> --help`, Claude returns:

```
# /<skill>

<purpose paragraph>

## Usage
/<skill> [subcommand]

## Subcommands
--dry-run     Preview without writing state or contacting surfaces
--help        Show this message

## Examples
/<skill>
/<skill> --dry-run

## Surfaces
- <surface1>
- <surface2>

## Depends on
- <memory-layer-skill>
- <other-skills>
```

This output is constructed from the SKILL.md content at runtime. It is not a static string.

### 10.6 Skill run logging

Every skill logs its run to the facility's `logs/skills.ndjson` via the memory-layer skill. The log entry shape:

```json
{
  "ts": "2026-05-05T08:12:04Z",
  "skill": "work-harvester-github",
  "args": "since=2026-05-04T06:00:00Z",
  "outcome": "ok",
  "count": 14,
  "duration_ms": 4320,
  "errors": []
}
```

For skills that produce no side effects (read-only operations), logging is optional but encouraged for auditing.

### 10.7 Validation checklist for new skills

Before a skill is submitted for installation:

```
Frontmatter
  [ ] name matches parent directory name exactly
  [ ] name matches ^[a-z][a-z0-9-]+$
  [ ] description is ≤1024 characters
  [ ] description contains ≥5 trigger phrases in quotes
  [ ] description opens with a one-sentence job statement
  [ ] description ends with scope-limiting language
  [ ] depends_on.skills lists the memory-layer skill first
  [ ] surfaces lists every contacted surface
  [ ] slash_command.trigger matches /<name>
  [ ] --dry-run subcommand declared (write skills only)
  [ ] --help subcommand declared

Body
  [ ] ## Purpose is one paragraph (not a list, not steps)
  [ ] ## Trigger phrases has ≥5 phrases covering ≥3 trigger forms
  [ ] ## Inputs lists every file, argument, and pack profile read
  [ ] ## Outputs lists every file written, surface touched, artifact produced
  [ ] ## Behavior is step-by-step with no ambiguous branching
  [ ] Every state I/O in ## Behavior is expressed as a call to the memory-layer skill
  [ ] ## Output format includes a concrete example in a code block
  [ ] ## Error handling covers: missing facility, missing pack profile (if applicable),
       surface unavailable (per surface), invalid input

Design
  [ ] The skill does exactly one coherent job
  [ ] The skill does not invoke the orchestrator (invocation is always orchestrator → specialist)
  [ ] Every surface contact respects send semantics (no auto-sends, no review bypass)
  [ ] No direct Read/Write/Bash calls against facility paths
  [ ] If pack-required: degrades gracefully without the pack (warning, not crash)
  [ ] Skill run logged to logs/skills.ndjson via memory-layer skill
```

---

## Appendix A — Memory-layer skill comparison

| Dimension | `work-state` | `docket-state` | `project-state` | `strategic-state` |
|-----------|-------------|---------------|-----------------|-------------------|
| Facility path | `~/work-state/` | `~/docket-state/` | `.project-state/` (walk up) | `~/.strategic-state/` |
| Primary entities | Events (surface events, append-only) | Matters, commitments, threads | Milestones, decisions, risks, changes, people, documents | Thesis, signals, vision docs |
| ID scheme | `{surface}-{type}-{date}-{hash}` | `{kind}-{date}-{hash}` | File-per-entity: `M<NN>-<slug>.yaml` | (facility-specific) |
| Concurrency model | Per-event lock-free + state.json advisory lock | Per-matter lock-free + state.json advisory lock | Per-entity lock-free + manifest advisory lock | Advisory locks for singleton files |
| Evidence mutability | Immutable (events never deleted) | Matters closeable, not deletable | Entities updatable with last_modified; logs append-only | Signals append-only; thesis versioned |
| Activity log | `logs/activity.ndjson` | `logs/activity.ndjson` | `logs/activity.ndjson` | `logs/activity.ndjson` |
| Skill log | `logs/skills.ndjson` | `logs/skills.ndjson` | `logs/skills.ndjson` | `logs/skills.ndjson` |

---

## Appendix B — Suite dependency graph

```
strategic-state (memory layer)
  └── strategic-advisor (orchestrator)
       └── reads: work-state, project-state, docket-state (via their memory layers)
  └── strategic-harvester (planned)
       └── reads: work-state, project-state, docket-state (via their memory layers)
       └── writes: strategic-state (via strategic-state skill)
  └── strategic-doc-generator (planned)
       └── reads: strategic-state (via strategic-state skill)

work-state (memory layer)
  └── work-orchestrator (orchestrator)
       └── work-harvester-github
       └── work-harvester-scsiwyg
       └── work-harvester-gmail
       └── work-harvester-slack
       └── work-harvester-gdocs
       └── work-daily-digest (planned)
       └── work-weekly-report (planned)
  └── work-kanban (UI; reads work-state)

docket-state (memory layer) [TO BUILD]
  └── docket-orchestrator (orchestrator) [TO BUILD]
  └── docket-harvester → reads work-state via work-state skill [TO BUILD]
  └── docket-notifier [TO BUILD]
  └── docket-digest [TO BUILD]

project-state (memory layer)
  └── project-orchestrator (orchestrator)
       └── project-phase-gate
       └── project-document-curator
       └── project-milestone-manager
       └── project-status-reporter
       └── project-notifier
            └── project-review-meeting
            └── project-funder-reporting
            └── project-change-register
            └── project-blog-publisher
            └── project-website-publisher
       └── project-onboarder
       └── project-ip-tracker
       └── project-external-comms
       └── project-lessons
       └── project-archive
       └── project-harvester
  └── project-scaffolder (no orchestrator dependency)
```

Cross-suite data flows (integration layer, not skill-to-skill):

```
work-state → docket-harvester → docket-state
work-state → strategic-harvester → strategic-state
project-state → strategic-harvester → strategic-state
docket-state → strategic-harvester → strategic-state
```

---

## Appendix C — Send semantics reference

All skills that contact external surfaces must honor these semantics. They are system-level policies, not per-skill choices.

| Surface | Auto-send? | User approval | Draft survives session? |
|---------|:----------:|:-------------:|:-----------------------:|
| Slack | No | Yes — confirm before post | No |
| Gmail | Never | N/A — always draft | Yes |
| Google Calendar | No | Yes — confirm or adjust | Yes (hold persists) |
| scsiwyg | Conditional | Required if publication-review gate is active | Yes — saved as draft |
| Project website | On `doc.published` | Implicit (user set status to `published`) | N/A — deploy is final |

Skills that auto-send email, auto-publish without review, or auto-confirm calendar events violate the review-not-author design principle. This applies across all four suites, not only the project suite.
