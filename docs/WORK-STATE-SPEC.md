# Work State — Technical Specification

**Facility path:** `~/work-state/`
**Version:** 1.0
**Date:** 2026-05-05

---

## 1. Purpose and Design Philosophy

### What work-state is

`work-state` is a personal, machine-local, append-only evidence store of all work activity across connected surfaces. It ingests events from GitHub, scsiwyg, Gmail, Slack, Google Docs, X, and LinkedIn, writes them to a typed filesystem, and serves as the substrate from which digests, reports, and intelligence are generated.

It is not operated by a team. Each person runs one facility per machine. Team-level work intelligence is emergent from the union of member facilities — not from a shared database.

### The evidence principle

Events in `work-state` are immutable proof of work. Once written, an event is never deleted, overwritten, or amended in place. If a harvester ingests incorrect data, the correction is a new event with a `type` of `learn` and a `corrects_id` reference in the `evidence` payload. The original event remains.

This principle exists because:

- Harvesters run unattended; silent deletes would destroy audit trails.
- Downstream consumers (docket-state, strategic-state) hold references to event IDs.
- The value of work evidence compounds over time; gaps are worse than noise.

### Why it is personal

One `~/work-state/` per machine, not per team. A developer running two machines maintains two facilities; a weekly sync can union them. The boundary is intentional: harvesting credentials are personal, harvest cadences are personal, and the interpretation of events (what project does this belong to?) is personal.

### What work-state is NOT

| Not this | Use this instead |
|---|---|
| A task manager | docket-state |
| A project tracker | project-state |
| A journal or reflection tool | notella |
| A Kanban board | work-kanban |
| A notification system | work-notifier |

`work-state` does not understand what work *means*. It records what work *happened*. Meaning is applied by downstream consumers.

### Relationship to the four-state stack

```
Work state      — evidence: what happened, per surface (this facility)
Docket state    — accountability: what is owed
Project state   — operational structure: formal projects
Strategic state — direction: thesis, force map
```

The relationships between them:

| Consuming facility | What it reads from work-state | Direction |
|---|---|---|
| Docket state | Events of type `receive` and `share` to detect implicit commitments (Slack DMs, Gmail threads with asks) | work-state → docket-state |
| Project state | Independent; work events optionally carry a `project` field referencing a project slug | advisory link only |
| Strategic state | Commit patterns signal axis contribution; `publish` events surface to thesis evidence | work-state → strategic-state (one-way) |

Strategic-state reads work-state. Work-state does not know about strategic-state. The enrichment flow is strictly one-directional.

---

## 2. Directory Layout

```
~/work-state/
├── manifest.yaml                    ← facility config: surfaces, projects, cadences, retention
├── state.json                       ← counters, cursors, last-run timestamps
├── SCHEMA.md                        ← canonical schema reference (copied from skill on init)
├── README.md                        ← human-readable facility guide (copied from skill on init)
├── CONCURRENCY.md                   ← concurrency rules and invariants (copied from skill on init)
├── events/
│   └── YYYY-MM-DD/
│       ├── {event-id}.json          ← full event payload (one file per event)
│       └── YYYY-MM-DD.jsonl         ← date index: one line per event (id + key fields only)
├── daily/
│   └── YYYY-MM-DD.json              ← daily digest produced by work-daily-digest
├── weekly/
│   └── YYYY-WNN.json                ← weekly report produced by work-weekly-report
├── longitudinal/
│   ├── themes.json                  ← recurring themes across the event corpus
│   ├── velocity.json                ← output cadence and commit rate over time
│   ├── projects.json                ← per-project event density and surface mix
│   └── learning-loops.json          ← decisions made, lessons recorded, skill-run patterns
├── harvest/
│   └── {surface}/                   ← one directory per surface
│       └── cursor.json              ← last harvest position for this surface
├── logs/
│   ├── activity.ndjson              ← all facility-level operations (append-only)
│   ├── harvests.ndjson              ← per-run harvest summaries (append-only)
│   └── skills.ndjson                ← per-invocation skill run log (append-only)
└── locks/
    ├── state.json.lock              ← advisory lock for state.json writes
    └── manifest.yaml.lock           ← advisory lock for manifest.yaml writes
```

### Notes on the events directory

- Each calendar date gets its own subdirectory: `events/2026-05-05/`.
- Each event is stored as a single JSON file named by its deterministic ID: `github-build-2026-05-05-a3f9c12b.json`.
- The JSONL index file (`YYYY-MM-DD.jsonl`) contains one line per event with the id, timestamp, surface, type, and project — enough to filter without reading individual files.
- If the raw event payload exceeds 4 KB, the `raw` field in the main JSON file is truncated at 4 KB and the full payload is stored in a sidecar at `{event-id}.raw.json` in the same directory.

### Notes on the harvest directory

Each surface gets its own subdirectory. The `cursor.json` inside records the last harvest position — a timestamp, offset, or surface-specific token. The `work-state` skill also mirrors the cursor into `state.json:last_harvest_at` for fast reads without opening per-surface files.

---

## 3. manifest.yaml Schema

```yaml
facility:
  version: "1.0"
  owner: "keystone@stonemaps.org"        # email or identifier of the facility owner
  machine: "mbp-primary"                  # machine slug, user-defined
  initialized_at: "2026-05-05T09:00:00Z"  # ISO-8601 UTC, set on init, never changed

surfaces:
  github:
    enabled: true
    cadence: 6                            # hours between harvests; 0 = manual only
    auth_ref: "~/.config/work-state/github-token"  # path to credential file
  scsiwyg:
    enabled: true
    cadence: 12
    auth_ref: "~/.config/work-state/scsiwyg-token"
  gmail:
    enabled: true
    cadence: 6
    auth_ref: "~/.config/work-state/gmail-oauth.json"
  slack:
    enabled: true
    cadence: 4
    auth_ref: "~/.config/work-state/slack-token"
  gdocs:
    enabled: true
    cadence: 12
    auth_ref: "~/.config/work-state/gdocs-oauth.json"
  x:
    enabled: false
    cadence: 24
    auth_ref: "~/.config/work-state/x-token"
  linkedin:
    enabled: false
    cadence: 24
    auth_ref: "~/.config/work-state/linkedin-token"

projects:
  project-alpha:
    display_name: "Project Alpha"
    tags: ["research", "funded"]
  project-beta:
    display_name: "Project Beta"
    tags: ["client", "active"]

cadences:
  daily_digest_at: "07:00"               # local time for daily digest generation
  weekly_report_day: "monday"            # day of week for weekly report
  longitudinal_day: "sunday"             # day of week for longitudinal refresh

retention:
  events_days: 730                        # keep raw event files for this many days; 0 = forever
```

### Validation rules for manifest.yaml

- `facility.version`, `facility.owner`, `facility.machine`, `facility.initialized_at` are all required.
- Each surface key must be one of: `github`, `scsiwyg`, `gmail`, `slack`, `gdocs`, `x`, `linkedin`.
- `cadence` must be a non-negative integer. Zero means manual-only.
- `auth_ref` is required if `enabled` is true. The skill does not validate that the file exists at the path — that is the harvester's responsibility.
- `projects` keys must be slug-safe (lowercase alphanumeric and hyphens only).
- `retention.events_days` must be a non-negative integer. Zero means retain forever.

---

## 4. Event Schema

Every event in the facility must conform to this envelope. Surface-specific sub-schemas for `evidence` and `metrics` are defined in §5.

### Envelope fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Deterministic identifier: `{surface}-{type}-{YYYY-MM-DD}-{8-char-hash}`. The hash is derived from the surface + normalized content (e.g., repo + sha for GitHub commits). Same input always produces the same id. |
| `surface` | string | yes | One of the enabled surface keys in `manifest.yaml:surfaces`. |
| `type` | string | yes | One of: `build`, `publish`, `share`, `draft`, `receive`, `decide`, `learn`. |
| `timestamp` | string | yes | ISO-8601 UTC. When the event happened — not when it was ingested. For a commit, this is the commit author timestamp. |
| `project` | string | yes | A project key from `manifest.yaml:projects`, or the literal string `"unsorted"`. |
| `themes` | array of strings | yes (may be empty) | Taxonomy tags. May be empty on ingestion; `work-themes` enriches this field via correction events. |
| `title` | string | yes | One-line human-readable summary. Max 200 characters. |
| `evidence` | object | yes | Surface-specific structured proof. Schema defined per surface in §5. |
| `metrics` | object | yes | Surface-specific numeric measures. Schema defined per surface in §5. |
| `raw` | string or object | yes | Full untruncated source payload. Truncated to 4 KB in the main event file; if larger, stored in a sidecar at `{event-id}.raw.json`. |
| `ingested_at` | string | yes | ISO-8601 UTC. When the harvester wrote this event. |
| `harvester_version` | string | yes | Semver string of the harvester that produced this event. Example: `"1.2.0"`. |

### Event type definitions

| Type | Meaning | Typical surfaces |
|---|---|---|
| `build` | Code written, committed, merged, or released | github |
| `publish` | Content made publicly visible | scsiwyg, x, linkedin |
| `share` | Material sent to another person or group | gmail, slack, gdocs |
| `draft` | Content created but not yet public | scsiwyg, gdocs, gmail |
| `receive` | Inbound communication or content | gmail, slack |
| `decide` | A decision recorded or confirmed | github (PR merge), slack, gdocs |
| `learn` | A retrospective, correction, or lesson event | any |

### ID construction

```
id = "{surface}-{type}-{YYYY-MM-DD}-{sha256(surface + canonical_key)[:8]}"
```

The `canonical_key` is surface-specific:

| Surface | Canonical key for hashing |
|---|---|
| github | `{repo}/{sha}` |
| scsiwyg | `{site_slug}/{post_slug}` |
| gmail | `{thread_id}` |
| slack | `{workspace}/{channel}/{message_ts}` |
| gdocs | `{doc_id}/{revision_number}` |
| x | `{tweet_id}` |
| linkedin | `{post_urn}` |

The date component in the id is derived from `timestamp` (the event time, not ingestion time). This means the same event written on two different machines at different times produces the same id — enabling safe deduplication.

### Validation rules

An event is invalid and must be refused if:

- Any required field is absent or null.
- `surface` is not in `manifest.yaml:surfaces`.
- `type` is not one of the seven allowed values.
- `timestamp` is not a valid ISO-8601 UTC string.
- `project` is neither `"unsorted"` nor a key in `manifest.yaml:projects`.
- `id` does not match the pattern `^[a-z]+-[a-z]+-\d{4}-\d{2}-\d{2}-[a-f0-9]{8}$`.
- `themes` is not an array (it may be an empty array).
- `harvester_version` is not a valid semver string.

### Example event

```json
{
  "id": "github-build-2026-05-05-a3f9c12b",
  "surface": "github",
  "type": "build",
  "timestamp": "2026-05-05T08:14:22Z",
  "project": "project-alpha",
  "themes": ["infrastructure", "ci"],
  "title": "Fix: correct state.json counter drift on concurrent batch finalize",
  "evidence": {
    "repo": "davidolsson/work-state",
    "sha": "a3f9c12b44de9f8012345678abcdef9012345678",
    "branch": "main",
    "message": "Fix: correct state.json counter drift on concurrent batch finalize",
    "files_changed": ["src/state.py", "tests/test_state.py"],
    "pr_number": 42,
    "pr_title": "Fix counter drift",
    "event_subtype": "commit"
  },
  "metrics": {
    "lines_added": 18,
    "lines_deleted": 7,
    "files_changed_count": 2,
    "pr_comments": 3
  },
  "raw": "{\"sha\": \"a3f9c12b...\", ...}",
  "ingested_at": "2026-05-05T08:20:05Z",
  "harvester_version": "1.0.0"
}
```

---

## 5. Per-Surface Evidence Schemas

Each surface defines its own `evidence` and `metrics` sub-schemas. All fields listed as required must be present; optional fields (marked `?`) may be null or absent.

### github

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `repo` | string | yes | `owner/repo` format |
| `sha` | string | yes | Full 40-character commit SHA |
| `branch` | string | yes | Branch name at time of event |
| `message` | string | yes | Full commit message (untruncated in evidence; may be trimmed in title) |
| `files_changed` | array of strings | yes | List of file paths touched |
| `pr_number` | integer | no | Pull request number, if this event relates to a PR |
| `pr_title` | string | no | Pull request title |
| `event_subtype` | string | yes | One of: `commit`, `pr`, `release`, `review` |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `lines_added` | integer | yes | Lines added |
| `lines_deleted` | integer | yes | Lines deleted |
| `files_changed_count` | integer | yes | Number of files changed |
| `pr_comments` | integer | no | Number of review comments on the PR |

### scsiwyg

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `site_slug` | string | yes | Slug identifying the scsiwyg site |
| `post_slug` | string | yes | Slug identifying the post |
| `post_title` | string | yes | Full post title |
| `post_url` | string | yes | Canonical URL (may be null for drafts) |
| `status` | string | yes | One of: `draft`, `published` |
| `tags` | array of strings | yes | Post tags (may be empty) |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `word_count` | integer | yes | Word count of the post body |
| `reading_time_min` | integer | yes | Estimated reading time in minutes |

### gmail

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `thread_id` | string | yes | Gmail thread ID |
| `subject` | string | yes | Email subject |
| `from` | string | yes | Sender address |
| `to` | array of strings | yes | Recipient addresses |
| `direction` | string | yes | One of: `sent`, `received` |
| `has_attachment` | boolean | yes | Whether the message has attachments |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `body_length_chars` | integer | yes | Character count of the email body |

### slack

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `workspace` | string | yes | Workspace domain (e.g., `acme.slack.com`) |
| `channel` | string | yes | Channel name or ID |
| `thread_ts` | string | no | Parent message timestamp if this is a reply |
| `message_preview_100chars` | string | yes | First 100 characters of the message text |
| `has_link` | boolean | yes | Whether the message contains a URL |
| `has_mention` | boolean | yes | Whether the message contains a `@mention` |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reactions_count` | integer | no | Number of emoji reactions |
| `reply_count` | integer | no | Number of replies in the thread |

### gdocs

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `doc_id` | string | yes | Google Docs document ID |
| `doc_title` | string | yes | Document title at time of event |
| `action` | string | yes | One of: `edit`, `comment`, `share`, `publish` |
| `collaborators` | array of strings | no | List of collaborator email addresses |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `words_added` | integer | no | Approximate words added in this revision |
| `revision_number` | integer | no | Revision number at time of event |

### x (twitter)

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tweet_id` | string | yes | Tweet ID |
| `text_preview` | string | yes | First 280 characters of the tweet text |
| `is_reply` | boolean | yes | Whether this is a reply to another tweet |
| `is_quote` | boolean | yes | Whether this is a quote tweet |
| `thread_ts` | string | no | ID of the root tweet if this is part of a thread |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `likes` | integer | no | Like count at time of ingestion |
| `retweets` | integer | no | Retweet count at time of ingestion |
| `replies` | integer | no | Reply count at time of ingestion |

### linkedin

**evidence:**

| Field | Type | Required | Description |
|---|---|---|---|
| `post_urn` | string | yes | LinkedIn post URN |
| `text_preview` | string | yes | First 300 characters of the post text |
| `post_type` | string | yes | One of: `post`, `article`, `share`, `comment` |
| `is_repost` | boolean | yes | Whether this is a reshare of another post |

**metrics:**

| Field | Type | Required | Description |
|---|---|---|---|
| `reactions` | integer | no | Total reaction count at time of ingestion |
| `comments` | integer | no | Comment count at time of ingestion |
| `reposts` | integer | no | Repost count at time of ingestion |

---

## 6. state.json Schema

`state.json` holds counters, cursors, and last-run timestamps. It is the fast-read summary of the facility; counts can drift from disk reality and are periodically rebuilt. Do not treat `counters.events_by_type` and `counters.events_by_project` as authoritative — call `count-events` for accurate per-type or per-project breakdowns.

```json
{
  "facility_version": 1,
  "initialized_at": null,
  "first_harvest_at": null,
  "last_validated": null,
  "last_harvest_at": {
    "github": null,
    "scsiwyg": null,
    "gmail": null,
    "slack": null,
    "gdocs": null,
    "x": null,
    "linkedin": null
  },
  "last_digest_at": null,
  "last_weekly_at": null,
  "last_longitudinal_at": null,
  "counters": {
    "events_total": 0,
    "events_by_surface": {
      "github": 0,
      "scsiwyg": 0,
      "gmail": 0,
      "slack": 0,
      "gdocs": 0,
      "x": 0,
      "linkedin": 0
    },
    "events_by_type": {
      "build": 0,
      "publish": 0,
      "share": 0,
      "draft": 0,
      "receive": 0,
      "decide": 0,
      "learn": 0
    },
    "events_by_project": {}
  }
}
```

### Counter maintenance policy

| Counter | Updated on | Notes |
|---|---|---|
| `events_total` | `finalize-batch` | Bumped by the batch count; not per-event. |
| `events_by_surface[surface]` | `finalize-batch` | Bumped by the batch count. |
| `events_by_type` | `rebuild-state` only | Too expensive to maintain per-batch without re-reading events. |
| `events_by_project` | `rebuild-state` only | Same reason. |

All `last_harvest_at[surface]` values are ISO-8601 UTC strings or null. They are updated under the `state.json` lock on `finalize-batch`.

---

## 7. Operations

### Read operations (no locking)

All read operations are safe to run concurrently. They never acquire locks and never modify any file.

| Operation | Signature | Returns |
|---|---|---|
| `get-manifest` | — | Parsed `manifest.yaml` |
| `get-state` | — | Parsed `state.json` |
| `get-cursor` | `surface: string` | `state.json:last_harvest_at[surface]` (ISO-8601 or null) |
| `get-event` | `id: string` | Parsed event JSON. The id encodes the date: `events/YYYY-MM-DD/{id}.json`. |
| `list-events` | `since?, until?, surface?, type?, project?, theme?, limit?` | Array of event objects matching all supplied filters. Walks date directories in the relevant range. |
| `count-events` | `since?, until?, surface?, type?, project?` | `{total, by_surface, by_type, by_project}` — always computed from disk, not from `state.json` counters. |
| `tail-log` | `n=50` | Last n lines of `logs/activity.ndjson`, parsed as objects. |
| `tail-harvests` | `n=20` | Last n lines of `logs/harvests.ndjson`, parsed as objects. |
| `get-digest` | `date: YYYY-MM-DD` | Parsed `daily/YYYY-MM-DD.json` if it exists, else null. |
| `list-digests` | — | Array of date strings for which a daily digest exists. |
| `validate` | — | Validation report (see below). Never auto-fixes. |

#### validate — invariants checked

The validator walks every file in the facility and checks:

1. Every file in `events/YYYY-MM-DD/` has a corresponding entry in `events/YYYY-MM-DD.jsonl`.
2. Every line in `events/YYYY-MM-DD.jsonl` references a file that exists.
3. Counters in `state.json` match the on-disk event count (within a documented drift tolerance of zero for `events_total`).
4. No duplicate event IDs across the facility.
5. All IDs match the pattern `{surface}-{type}-{YYYY-MM-DD}-{8-char-hex}`.
6. No stale lockfiles older than 1 hour.
7. Every event has all required envelope fields.
8. Every event references a `project` that exists in manifest, or is `"unsorted"`.

The validator returns a report object:

```json
{
  "valid": true,
  "checked_at": "2026-05-05T09:00:00Z",
  "events_on_disk": 1240,
  "events_in_counters": 1240,
  "violations": [],
  "warnings": []
}
```

Violations are items that constitute schema or invariant failures. Warnings are items that may indicate drift (e.g., a counter mismatch that could be explained by an in-progress harvest). The validator never modifies any file.

### Write operations

Write operations that touch singleton files (`state.json`, `manifest.yaml`) acquire advisory locks before writing and release them after. Per-event writes are lock-free.

---

#### `init`

Scaffold the facility from scratch.

1. Create `~/work-state/` and the full directory tree from §2.
2. Copy reference files from the skill's `references/scaffold/` directory into place: `manifest.yaml`, `state.json`, `SCHEMA.md`, `README.md`, `CONCURRENCY.md`.
3. Set `state.json:initialized_at` to the current UTC timestamp.
4. Append to `logs/activity.ndjson`:
   ```json
   {"ts": "2026-05-05T09:00:00Z", "actor": "work-state", "event": "facility.initialized"}
   ```

If the facility already exists, `init` refuses unless `--force` is passed.

---

#### `write-event`

The highest-volume operation. Lock-free.

```
Input: event_json (fully populated event object)

1. Validate all required envelope fields. Refuse with error if invalid.
2. Compute target path: events/{YYYY-MM-DD}/{id}.json from event.timestamp.
3. If the target file already exists:
   Return {status: "duplicate", id} silently. Do not overwrite.
4. Create the date directory if it does not exist.
5. Atomic write:
   a. Write event_json to events/{YYYY-MM-DD}/{id}.tmp
   b. fsync the tmp file
   c. Rename {id}.tmp → {id}.json
6. Append one line to events/{YYYY-MM-DD}/{YYYY-MM-DD}.jsonl:
   {"id": ..., "ts": ..., "surface": ..., "type": ..., "project": ..., "title": ...}
   (If the line exceeds 4 KB, write only id + ts + surface + type + project)
7. Return {status: "written", id, path}
```

Counters and `last_harvest_at` are NOT updated here. That happens in `finalize-batch` after all events in a run are written.

---

#### `finalize-batch`

Called by harvesters at the end of each run.

```
Input: {surface, count, max_timestamp, harvester, harvester_version}

Under the state.json lock:
1. Bump counters.events_total by count.
2. Bump counters.events_by_surface[surface] by count.
3. If max_timestamp > last_harvest_at[surface] (or last_harvest_at[surface] is null):
   Set last_harvest_at[surface] = max_timestamp.
4. If first_harvest_at is null: set to current UTC time.
5. Write state.json atomically (tmp + rename).
6. Release lock.

After lock released:
7. Append to logs/activity.ndjson:
   {"ts": ..., "actor": harvester, "event": "events.batch.ingested",
    "surface": surface, "count": count, "max_timestamp": max_timestamp}
8. Append to logs/harvests.ndjson:
   {"ts": ..., "actor": harvester, "surface": surface, "count": count,
    "harvester_version": harvester_version, "duration_ms": ..., "errors": []}
```

`counters.events_by_type` and `counters.events_by_project` are not updated here. They require a `rebuild-state` to be accurate.

---

#### `log-digest`

```
Input: {date: YYYY-MM-DD, digest_json}

1. Write daily/{date}.json atomically (tmp + rename).
2. Under the state.json lock:
   Set last_digest_at = current UTC time.
   Write state.json atomically.
3. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-daily-digest", "event": "digest.daily.generated", "date": date}
```

---

#### `log-weekly`

```
Input: {week: YYYY-WNN, report_json}

1. Write weekly/{week}.json atomically (tmp + rename).
2. Under the state.json lock:
   Set last_weekly_at = current UTC time.
   Write state.json atomically.
3. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-weekly-report", "event": "report.weekly.generated", "week": week}
```

---

#### `log-longitudinal`

```
Input: {kind: "themes"|"velocity"|"projects"|"learning-loops", json}

1. Write longitudinal/{kind}.json atomically (tmp + rename).
2. Under the state.json lock:
   Set last_longitudinal_at = current UTC time.
   Write state.json atomically.
3. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-longitudinal", "event": "longitudinal.{kind}.rebuilt"}
```

---

#### `log-skill-run`

```
Input: {skill, args, outcome, duration_ms}

Append to logs/skills.ndjson (O_APPEND, no lock):
{"ts": ..., "skill": skill, "args": args, "outcome": outcome, "duration_ms": duration_ms}
```

No lock needed. Single-line appends under 4 KB are atomic per POSIX.

---

#### `rebuild-index`

```
Input: date: YYYY-MM-DD

1. Read every *.json file in events/{date}/ (excluding *.tmp files).
2. Extract id, ts, surface, type, project, title from each.
3. Sort by timestamp ascending.
4. Write events/{date}/{date}.jsonl atomically (tmp + rename).
5. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-state", "event": "index.rebuilt", "date": date}
```

Use when the JSONL index is missing or its contents diverge from the JSON files.

---

#### `rebuild-state`

Recomputes all counters from scratch. Slow; not a daily operation.

```
1. Walk every events/YYYY-MM-DD/{id}.json file across all dates.
2. Tally: total, by_surface, by_type, by_project.
3. Under the state.json lock:
   Write the new counters into state.json atomically.
4. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-state", "event": "state.counters.rebuilt"}
```

---

#### `rebuild-cursors`

```
1. For each enabled surface:
   Find the max timestamp across all events with that surface.
   Set last_harvest_at[surface] to that timestamp.
2. Under the state.json lock:
   Write state.json atomically.
3. Append to logs/activity.ndjson:
   {"ts": ..., "actor": "work-state", "event": "state.cursors.rebuilt"}
```

Idempotent. Safe to run after a failed harvest run.

---

### Canonical activity log events

| Operation | `event` value in activity.ndjson |
|---|---|
| Facility initialized | `facility.initialized` |
| Batch ingested by harvester | `events.batch.ingested` |
| Daily digest generated | `digest.daily.generated` |
| Weekly report generated | `report.weekly.generated` |
| Longitudinal rebuilt | `longitudinal.{kind}.rebuilt` |
| Validation run | `state.validated` |
| Index rebuilt for a date | `index.rebuilt` |
| State counters rebuilt | `state.counters.rebuilt` |
| Cursors rebuilt | `state.cursors.rebuilt` |
| Manifest edited | `manifest.edited` |

Single event writes are not logged individually to `activity.ndjson` — the volume would make the log unusable. They are captured in aggregate via `finalize-batch`.

---

## 8. Concurrency Model

### Per-event writes: lock-free

Event files are named by deterministic ID. Two processes writing the same event produce the same filename and payload. The atomic tmp-then-rename sequence ensures:

- If the file already exists: the rename is a no-op (detected by `write-event` pre-check; returns `duplicate`).
- If two processes race to create the same file: one rename wins; the other's pre-check on retry returns `duplicate`.
- No partial writes are ever visible to readers.

### state.json and manifest.yaml: advisory lockfiles

```
Lock path: locks/state.json.lock
Lock path: locks/manifest.yaml.lock
```

Lock protocol:

1. Write the lock file with `{"pid": <pid>, "acquired_at": "<ISO-8601>"}` using `O_CREAT | O_EXCL`. If this fails, another process holds the lock.
2. On failure: check the lock file's `acquired_at`. If older than 300 seconds (5 minutes), the lock is stale — remove it and retry.
3. On success: perform the write (tmp + rename). Release the lock by deleting the lock file.

The 5-minute TTL prevents a crashed harvester from permanently blocking future runs.

### Append-only logs: O_APPEND

`logs/activity.ndjson`, `logs/harvests.ndjson`, and `logs/skills.ndjson` are opened with `O_APPEND`. Single-line JSON writes under 4 KB are atomic on POSIX-compliant filesystems. No lock is needed.

Lines must not contain embedded newlines. Each line is a complete JSON object.

### Singleton files: atomic rename

`daily/*.json`, `weekly/*.json`, `longitudinal/*.json`, and `state.json` are written via:

1. Write to `{target}.tmp`.
2. `fsync` the tmp file.
3. `rename({target}.tmp, {target})`.

Never overwrite in place. This ensures readers always see a complete file.

### Idempotency requirement

Every `write-event` call must be safe to retry. A harvester that crashes mid-batch and restarts will re-submit the same events; `write-event` must return `{status: "duplicate"}` for already-written events rather than failing or corrupting.

`finalize-batch` is safe to retry if the harvester crashes after writing events but before calling finalize: the batch count will be re-applied, but the next `rebuild-state` will correct the counters.

### Concurrency invariants

| Invariant | Enforcement |
|---|---|
| No two processes write the same event file | Atomic rename + duplicate detection |
| No two processes update state.json simultaneously | Advisory lockfile |
| No two processes update manifest.yaml simultaneously | Advisory lockfile |
| Log files are always internally consistent | O_APPEND + single-line writes |
| Singleton output files are always complete | Atomic rename |
| Stale locks do not block indefinitely | 300-second TTL with auto-expiry |

---

## 9. What This Facility Is NOT Responsible For

The following operations are explicitly out of scope for `work-state`. Requests to perform these operations must be routed to the appropriate skill.

| Out-of-scope operation | Responsible skill |
|---|---|
| Fetching events from GitHub, Gmail, Slack, scsiwyg, GDocs, X, or LinkedIn | `work-harvester-{surface}` |
| Generating daily digest prose or intelligence brief | `work-daily-digest` |
| Generating weekly report | `work-weekly-report` |
| Inferring or updating themes on existing events | `work-themes` |
| Reclassifying events to a different project | `work-themes` via correction events |
| Sending notifications or posting to Slack | `work-notifier` |
| Opening or operating the kanban dashboard | `work-kanban` |
| Deciding what to harvest next, what's overdue | `work-orchestrator` |
| Deleting events | Not permitted by any skill. Evidence is immutable. |

---

## 10. Relationships to Other State Facilities

### Docket state

Docket state consumes work events to detect implicit commitments: a received email containing a request, a Slack DM with a deadline, a GitHub issue assigned to the owner. When docket-state creates a docket item from a work event, the item carries a `work_event_ref` field with the originating event ID.

The link is reference-only. Work-state does not know which events have been consumed by docket-state. Docket-state queries work-state via `list-events` with appropriate filters.

### Project state

Project state is a distinct structured layer with its own `.project-state/` filesystem and skills. Work events optionally carry a `project` field that references a project-state project slug.

This link is advisory:

- Work-state does not validate that the project slug exists in any `.project-state/`.
- A project that exists in manifest.yaml may have no corresponding `.project-state/` directory (a person can track work against a label without a formal project).
- Project-state does not read work-state directly. The two facilities are independent; integration is mediated by a human or by `project-orchestrator` reading both.

### Strategic state

Strategic state maintains a force map: a structured model of strategic theses, axes, and evidence. It reads work-state events to enrich this map:

- Commit patterns by repository and tag signal contribution to strategic axes.
- `publish` events on scsiwyg or X surface to thesis evidence.
- High-volume `build` weeks in specific domains update velocity signals on the force map.

This enrichment is strictly one-directional. Strategic-state reads work-state; work-state does not hold any reference to strategic-state and does not know when or how its events have been consumed.

Work-state does not modify events when strategic-state consumes them. Strategic-state maintains its own state of which events it has processed, using work-state cursors it manages independently.
