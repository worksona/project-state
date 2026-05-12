# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**project-state** (v3.0 in development, v2.0 released) is a generic operational substrate for multi-stakeholder projects. It provides 23 `project-*` skills and 6 compliance packs that turn any project into a system where routine reporting is a byproduct of normal work. The substrate is a typed filesystem (`.project-state/`) — plain YAML, JSON, NDJSON, and markdown files on a shared drive, no database or API.

## Architecture (three layers)

1. **Substrate** (`.project-state/`) — file-per-entity storage with append-only activity logs, advisory lockfiles, and frontmatter timestamps for concurrency. See `docs/CONCURRENCY.md`.
2. **Skills** (`skills/project-*/SKILL.md`) — 23 markdown-defined skills grouped into P0 (foundations), P1 (core ops), P2 (surfaces/automation), P3 (polish). Skills are stateless verbs that read/write the substrate via `project-state` (the memory layer). Every skill routes through `project-state`.
3. **Surfaces** — Slack (auto-post), Gmail (always draft, never auto-send), Google Calendar, scsiwyg blog, project website. All external artifacts require human review before sending.

## Key design principles

- **State is the source of truth.** Reports are generated from state; when artifacts disagree with state, regenerate the artifact.
- **Review-not-author.** Gmail is always draft. Calendar events are proposed holds. Claims, SC packs, and public docs are drafts requiring PL sign-off.
- **One skill = one coherent job.** The orchestrator decides which skill to call; it doesn't do the work itself.
- **Packs configure, not code.** Six skills are profile-driven — their behavior comes from YAML profiles shipped by compliance packs, not from hardcoded logic.

## The reporting matrix

The central v2.0 concept: `.project-state/reporting-matrix.yaml` encodes "for each stakeholder group, what report at what cadence in what format on which surface, produced by which skill." The orchestrator reads this matrix on each tick and dispatches generators. See `docs/REPORTING-MATRIX.md`.

## Skills overview

| Tier | Skills |
|------|--------|
| P0 Foundation | `project-state` (memory layer), `project-scaffolder` (init + seed matrix) |
| P1 Core | `project-phase-gate`, `project-document-curator`, `project-milestone-manager`, `project-status-reporter` |
| P2 Surfaces | `project-orchestrator`, `project-notifier`, `project-review-meeting`, `project-funder-reporting`, `project-change-register`, `project-blog-publisher`, `project-website-publisher`, `project-doc-suite-generator` _(deprecated v3.0)_, `project-doc-suite` _(v3.0 unified suite)_, `project-sred-tracker` _(v3.0, sred-canada pack)_, `project-sred-reviewer` _(v3.0, sred-canada pack)_ |
| P3 Polish | `project-onboarder`, `project-ip-tracker`, `project-external-comms`, `project-lessons`, `project-archive`, `project-onboarding` _(v3.0 guided init)_ |

Six skills are pack-profile-driven (renamed from v1.x): `project-review-meeting` (was `project-sc-meeting`), `project-funder-reporting` (was `project-claim-prep`), `project-external-comms` (was `project-publications`), `project-ip-tracker`, `project-phase-gate`, `project-archive`.

## Packs

Packs live in `packs/`. Each contains a `manifest.yaml`, profile YAMLs under `profiles/`, optional templates, and a `reporting-matrix-defaults.yaml` for seeding. See `docs/PACK-AUTHORING.md` for the authoring guide.

| Pack | Maturity |
|------|----------|
| `pic-pcais` | production |
| `client-services`, `board-investor`, `agile-default`, `open-source-community`, `sred-canada` | starter |

## File naming conventions (entities in `.project-state/`)

- Milestones: `milestones/M<NN>-<slug>.yaml`
- Decisions: `decisions/YYYY-MM-DD-<slug>.yaml`
- Risks: `risks/R-<NN>-<slug>.yaml`
- Changes: `changes/change-log/YYYY-MM-DD-<slug>.yaml`, `changes/change-orders/CO-<NN>-<slug>.yaml`
- Activity log: `logs/activity.ndjson` (append-only, never rewrite)

## Concurrency rules

- File-per-entity prevents write conflicts on different entities.
- Monolithic files (`manifest.yaml`, `state.json`, `tracking/*.xlsx`) use advisory lockfiles with 300s TTL.
- Frontmatter `last_modified` timestamps for optimistic concurrency.
- Logs are append-only; corrections are new entries, not rewrites.

## SKILL.md constraints

Every SKILL.md frontmatter `description` field must be <=1024 characters.

## Migration script

`scripts/migrate-v1-to-v2.py` — non-destructive v1.x to v2.0 conversion. Run with `--pack <pack-id>`.

## Templates

- `templates/manifest-v2.yaml` — v2 manifest template
- `templates/reporting-matrix.yaml` — reporting matrix template
- `templates/phase-presets/` — five lifecycle presets (grant, agile, waterfall, client-engagement, open-source)
- `templates/website/` — Next.js project website starter (Vercel/Netlify)
