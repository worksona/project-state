---
name: project-scaffolder
description: "One-shot initializer for a new .project-state/ facility. Use this skill when starting a brand-new funded project — scaffolds the directory tree, manifest, phase manifests, logs, README/SCHEMA/CONCURRENCY/SKILLS docs — and when asked to 'set up a new project', 'create a new project-state', 'scaffold a project', 'initialize project-state', 'start a new funded project', 'bootstrap a grant project', 'new consortium project', 'create the state folder for [project]', 'init project-state in this folder'. Asks clarifying questions about the project, its funder, its consortium, and seeds a manifest that the team fills in. Follow-up work (milestone seeding from proposal, people seeding from MPA) is handed off to the other project-* skills."
---

# Project Scaffolder

## Purpose

Stand up a fresh `.project-state/` in a new working directory. Ensures the facility starts correctly-shaped so the other `project-*` skills can operate.

Used once per project at kickoff.

## Trigger phrases

- "set up a new project"
- "scaffold a project"
- "initialize project-state" / "init project-state"
- "create a new .project-state"
- "start a new funded project" / "bootstrap a grant project"
- "new consortium project"

## Inputs (ask the user if not provided)

1. **Project short name** (e.g., `Proj-001`) — used as the directory handle in reports.
2. **Project long name** (e.g., "Renewable Energy Consortium Project").
3. **Funder** — which organization or program is funding this work?
4. **Program** — what program or contract is this under?
5. **Consortium Project Lead organization.**
6. **Other Consortium Members.**
7. **Project start/end dates** (if known).
8. **Proposal / LOI / approval document paths** (if already available).
9. **Team-sharing model** (shared drive / git / single user).
10. **Surfaces** — Slack / Gmail / Calendar / scsiwyg desired?

## What gets scaffolded

Run in the user's current working directory (the project root):

```
.project-state/
├── README.md             (from template)
├── SCHEMA.md             (from template; universal project-state schema)
├── CONCURRENCY.md        (from template)
├── SKILLS.md             (from template; lists the suite)
├── manifest.yaml         (seeded with inputs; TODO for MPA-dependent items)
├── state.json            (current_phase: "03-planning" by default; counters zeroed)
├── phases/
│   ├── 01-loi/manifest.yaml
│   ├── 02-approval/manifest.yaml
│   ├── 03-planning/manifest.yaml   (CURRENT)
│   ├── 04-execution/manifest.yaml
│   ├── 05-closeout/manifest.yaml
│   └── 06-archive/manifest.yaml
├── documents/            (with inbox/, source-of-truth/, working/, published/, templates/ subdirs)
├── milestones/           (empty; seed via proposal_docx → project-document-curator + project-milestone-manager)
├── people/               (empty; add via project-state)
├── decisions/            (empty)
├── changes/{change-log,change-orders}/   (empty)
├── risks/                (empty)
├── ip/                   (empty)
├── publications/         (empty)
├── lessons-learned/      (empty)
├── tracking/             (empty)
├── reports/{weekly,review-meetings,claims,adhoc}/  (empty)
├── communications/{funder-updates,consortium-updates,blog-drafts,meeting-minutes}/  (empty)
└── logs/
    ├── activity.ndjson   (with a project.scaffolded event)
    └── decisions.ndjson
```

## Ask about starting phase

Default to `03-planning` because the common case is: proposal approved, MPA in flight.

If the user is earlier (still in LOI or still drafting proposal), set `state.json:current_phase` accordingly and leave later phases `status: pending`.

## Ask about proposal seeding

If the user has an approved proposal docx / Schedule A workbook, offer to hand off to `project-document-curator` to classify them and to `project-milestone-manager` to seed milestone YAMLs. This is optional — can happen later.

## Ask about surfaces

For each of Slack / Gmail / Calendar / scsiwyg, capture:
- Enabled? (bool)
- Key config (channel names, from-identity, calendar ID, site slug)

Surface config is stored in `manifest.yaml:surfaces`. `project-notifier` reads it there.

## Output

After scaffolding:
1. Print the tree.
2. Show what's filled vs. what's `~` (TODO) in `manifest.yaml`.
3. Write one decision to `decisions.ndjson`: "Adopted .project-state/ facility for <project>. Rationale: …"
4. Write one activity event: `project.scaffolded`.
5. Print the follow-up checklist:
   - Populate manifest TODOs (agreement dates, review designates, funder contacts)
   - Seed milestones from proposal (if applicable)
   - Install the `project-*` skills (see `.project-state/skills/INSTALL.md`)

## Discipline

- **Idempotent.** If `.project-state/` exists in the target directory, abort with a warning. Offer to run `project-state validate` instead.
- **Ask before writing.** Confirm inputs with the user before creating files.
- **Never overwrite existing files.** Scaffolder touches new files only.
- **Atomic failure.** If scaffolding aborts mid-way, clean up anything partially created before exiting.

## Integration

- **project-state** — all subsequent reads/writes route through it (once scaffolded).
- **project-document-curator** — offered as a follow-up for proposal ingestion.
- **project-milestone-manager** — offered as a follow-up for milestone seeding.
- **project-phase-gate** — becomes active once scaffolded and can begin tracking gate items.

## Reference files

- `references/templates/` — the template files (README.md, SCHEMA.md, CONCURRENCY.md, SKILLS.md, phase manifests) that the scaffolder emits
- `references/starting-phase-playbook.md` — guidance on which phase to start in based on project stage
