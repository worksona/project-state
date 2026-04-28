# .project-state — project source of truth

This folder is the shared memory of the project. Every skill in the `project-*` suite reads and writes here. Every status report, Steering Committee pack, quarterly claim, and PIC submission is generated from these files.

## What lives where

| Folder                   | Contents                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `manifest.yaml`          | Stable project identity — MPA, consortium, PIC contacts, phases   |
| `state.json`             | Mutable state — current phase, counters, last-updated pointers    |
| `phases/`                | One folder per lifecycle phase; gates, artifacts, phase decisions |
| `documents/`             | Document registry — source-of-truth, working, published, inbox    |
| `tracking/`              | Live xlsx trackers — milestones, budget, risks, actions           |
| `milestones/`            | One YAML per milestone (% complete, technical progress, owner)    |
| `people/`                | One YAML per person — role, organization, contact, SC designation |
| `decisions/`             | Decision log — one file per decision, dated, authored             |
| `changes/change-log/`    | Non-material changes (PIC definition)                             |
| `changes/change-orders/` | Material changes requiring Schedule A amendment                   |
| `risks/`                 | Risk register — one file per risk                                 |
| `ip/`                    | IP disclosures, IP rationale updates                              |
| `publications/`          | Proposed and approved publications / presentations                |
| `reports/`               | Generated reports — weekly, SC packs, quarterly claims            |
| `communications/`        | PIC updates, consortium updates, blog drafts, meeting minutes     |
| `lessons-learned/`       | Captured continuously from project start                          |
| `logs/`                  | `activity.ndjson` (append-only), `decisions.ndjson`               |

## Reading the state

- Start with `manifest.yaml` for the stable facts.
- Check `state.json` for "where are we right now?"
- Browse `phases/<NN>-<name>/manifest.yaml` for the current phase's gate and required artifacts.
- `logs/activity.ndjson` tells you what has happened recently (one event per line).

## Writing the state

**Never edit `state.json`, `manifest.yaml`, or anything under `milestones/`, `decisions/`, etc. by hand on a shared drive.** Use the `project-*` skills — they handle concurrency, timestamping, and logging.

If you must edit manually, follow `CONCURRENCY.md`.

## Source of truth rule

For any fact in this project, there is **one** file in `.project-state/` that is authoritative. Everything else (emails, slides, xlsx for PIC submission, blog posts) is *generated from* that file, not typed in alongside it. When two files disagree, the one in `.project-state/` wins and the other gets regenerated.
