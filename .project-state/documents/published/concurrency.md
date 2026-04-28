# Concurrency on a shared drive

This project lives on a shared drive (Dropbox / Google Drive / OneDrive) from day one. Multiple teammates will read simultaneously; occasionally two will try to write at once. These rules prevent silent data loss.

## Principle 1 — file-per-entity

There is no `milestones.yaml`. There are `milestones/M01-*.yaml`, `milestones/M02-*.yaml`, ... one file per milestone. Same for decisions, risks, people, changes. This way two writers working on two different milestones never touch the same file.

Monolithic files (`manifest.yaml`, `state.json`) are write-rare and read-often.

## Principle 2 — frontmatter timestamps

Every writable file has `last_modified` and `last_modified_by` fields. Before writing, read the current file; if `last_modified` is newer than the copy you started from, you have a conflict and must re-read.

## Principle 3 — advisory lockfiles for monolithic state

For `manifest.yaml`, `state.json`, and any `tracking/*.xlsx`, before writing:

1. Write `<filename>.lock` containing `{"actor": "...", "acquired": "<ISO>", "ttl_seconds": 300}`.
2. If a `<filename>.lock` already exists and its `acquired + ttl` is in the future, **wait** or **abort** — never clobber.
3. Complete the edit.
4. Delete the lockfile.

If an agent crashed mid-edit and left a stale lockfile, the TTL (5 min default) lets the next agent proceed.

## Principle 4 — append-only logs

`logs/activity.ndjson` and `logs/decisions.ndjson` are append-only. Never rewrite them. Appending one line is atomic on all supported filesystems for lines <4KB, which ours always are.

If an agent needs to "correct" a log line, it appends a new correction entry rather than rewriting history:

```json
{"ts":"2026-04-25T..","actor":"...","event":"log.correction","target_ts":"2026-04-23T..","corrected_field":"actor","old":"...","new":"..."}
```

## Principle 5 — deterministic file names

When two agents independently decide to create a milestone for the same MPA entry, they must produce the same filename. Use `M<NN>-<kebab-slug>.yaml` where `NN` is the MPA Schedule A number and the slug is derived deterministically from the milestone title.

## Principle 6 — xlsx trackers are single-writer

Any `.xlsx` under `tracking/` is edited by **one** skill invocation at a time. We use the lockfile discipline from Principle 3. The xlsx files are generated from the YAML source-of-truth; if they diverge, regenerate the xlsx.

## Principle 7 — git-friendly

YAML + NDJSON + Markdown diff cleanly. This folder can be dropped into a git repo at any time and you'll get sensible diffs. Binary docx/xlsx under `documents/` and `tracking/` are less friendly but manageable with Git LFS later.

## Cheatsheet for a manual edit

If a skill is unavailable and you must edit by hand:

1. Check no `<file>.lock` exists (or it's expired).
2. Record `last_modified` before you started.
3. Write the file with an updated `last_modified` and your email in `last_modified_by`.
4. Append an entry to `logs/activity.ndjson` describing what you did.
5. No bulk rewrites. One entity per edit.
