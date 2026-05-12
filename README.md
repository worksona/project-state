# project-state

**A Claude Code plugin that turns any multi-stakeholder project into a system where routine reporting is a byproduct of normal work.**

Built by [Atomic47](https://atomic47.co) · v3.0 · [david@atomic47.co](mailto:david@atomic47.co)

---

## What it is

project-state is a **plain-filesystem operational substrate** for multi-stakeholder projects — consortium grants, client engagements, startups with boards, open-source communities, internal product teams. It stores project state as typed YAML, JSON, NDJSON, and markdown files in a `.project-state/` directory on your shared drive. No database, no API, no new SaaS tool.

The plugin ships **23 `project-*` skills** that read and write this substrate. Together they handle the full project lifecycle:

| Tier | Skills |
|---|---|
| **Foundation** | `project-state` (memory layer), `project-scaffolder` (init) |
| **Core operations** | `project-phase-gate`, `project-document-curator`, `project-milestone-manager`, `project-status-reporter` |
| **Surfaces & automation** | `project-orchestrator`, `project-notifier`, `project-review-meeting`, `project-funder-reporting`, `project-change-register`, `project-blog-publisher`, `project-website-publisher`, `project-doc-suite`, `project-sred-tracker`, `project-sred-reviewer` |
| **Polish** | `project-onboarder`, `project-ip-tracker`, `project-external-comms`, `project-lessons`, `project-archive`, `project-onboarding`, `project-harvester` |

The substrate is the source of truth. Reports, meeting packs, website pages, and Slack updates are generated *from* the substrate — not maintained in parallel.

---

## Quick start

### 1. Install the plugin

Add the Atomic47 plugin marketplace and install:

```
/plugin marketplace add github:atomic47/project-state
/plugin install project-state@atomic47
```

Or install from a local zip:

```
/plugin install --local /path/to/project-state.zip
```

### 2. Set up a new project

Navigate to your project's shared drive root, then:

```
/project-scaffolder
```

The scaffolder walks you through project details, picks a compliance pack, and creates a ready-to-use `.project-state/` facility.

### 3. Start using it

```
What phase are we in?
Show me the milestones
Draft the weekly status report
Schedule the next review meeting
What should I work on this week?
```

---

## Compliance packs

Packs configure the skills for a specific funding model or organisational context. Five generic packs ship with the plugin:

| Pack | For |
|---|---|
| `agile-default` | Engineering teams on Scrum/Kanban |
| `board-investor` | Startups with board governance |
| `client-services` | Client engagement / professional services |
| `open-source-community` | Open-source projects with community contributors |
| `sred-canada` | Canadian projects claiming SR&ED tax credits |

Load one or more packs at scaffolding time. The scaffolder guides you through selection. Packs configure meeting shape and cadence, funder reporting format, phase gate criteria, IP tracking, external comms review windows, and archival checklists.

**Building your own pack:** See `docs/PACK-AUTHORING.md`. A pack is a directory of YAML profiles — no code. If your funder or programme isn't covered, a new pack takes about an hour to author.

---

## The substrate layout

```
.project-state/
├── manifest.yaml              ← project identity, stakeholders, budget, surfaces
├── state.json                 ← current phase, counters, surface status
├── reporting-matrix.yaml      ← what report, for whom, at what cadence
├── milestones/                ← M01-slug.yaml … one file per milestone
├── risks/                     ← R-01-slug.yaml … risk register
├── decisions/                 ← YYYY-MM-DD-slug.yaml … decision log
├── people/                    ← one yaml per person
├── documents/                 ← working/ → published/ lifecycle
├── changes/                   ← change-log/ and change-orders/
├── ip/                        ← IP disclosures
├── lessons-learned/           ← continuous capture
├── reports/                   ← generated output (never source of truth)
├── references/                ← context.md and other reference material
└── logs/
    ├── activity.ndjson        ← append-only event log
    └── decisions.ndjson
```

All files are plain text. The shared drive *is* the database.

---

## Surfaces

project-state routes output to five external surfaces. All are optional; each is configured in `manifest.yaml:surfaces`.

| Surface | How it's used | Auth required |
|---|---|---|
| **Slack** | Status posts, meeting notices, deployment notifications | Slack MCP |
| **Gmail** | All email is drafted — never auto-sent | Gmail MCP |
| **Google Calendar** | Review meeting scheduling, deadline reminders | Calendar MCP |
| **scsiwyg** | Blog posts for milestone completions, retrospectives | scsiwyg MCP |
| **Website** | Live team site reading `.project-state/` at runtime | Vercel/Netlify |

---

## Key design principles

- **State is the source of truth.** Reports are generated from state. When an artifact disagrees with state, regenerate the artifact.
- **Review, don't author.** Gmail is always draft. Calendar events are proposed holds. Claims and public docs require human sign-off before they leave the facility.
- **One skill = one coherent job.** The orchestrator decides which skill to call; it doesn't do the work itself.
- **Packs configure, not code.** Pack YAML profiles drive meeting shape, report format, gate criteria. Changing your funding model means swapping a pack, not editing skills.
- **Plain files, shared drive.** Any team member with drive access and Claude has full operational capability. No infrastructure to maintain.

---

## The reporting matrix

`.project-state/reporting-matrix.yaml` encodes "for each stakeholder group, what report at what cadence in what format on which surface, produced by which skill." The orchestrator reads this on each tick and dispatches generators. Seeded from your loaded packs at scaffolding time and freely customisable after.

See `docs/REPORTING-MATRIX.md` for the full schema.

---

## Who it's for

project-state works best for **teams of 2–20** running **projects that span months to years** with **structured reporting obligations** — consortium grants, funded R&D, client engagements, regulated product development. The overhead of maintaining the substrate pays off when you have recurring reports that would otherwise require manual assembly.

It is intentionally not a project management SaaS replacement. It is a structured filesystem that Claude reads and writes fluently, combined with skills that know what to do with that structure.

---

## Compatibility

- **Claude Code** (CLI) — full support
- **Claude Coworker / FleetView** — full support
- **Claude API with skill loading** — full support

Requires Claude with skill-loading capability. MCPs for Slack, Gmail, Calendar, scsiwyg, and Google Calendar are optional but unlock the surface routing features.

---

## Version history

| Version | Date | Notes |
|---|---|---|
| v3.0 | 2026-05 | Plugin packaging. `project-doc-suite`, `project-sred-tracker/reviewer`, `project-onboarding`, `project-harvester`. Full generalization — no funder-specific defaults. |
| v2.0 | 2026-04 | Generic core + compliance packs. Reporting matrix. Pack-profile-driven skills. |
| v1.x | 2025 | Initial release. PIC/PCAIS-specific. |

---

## License

MIT — see `LICENSE`.

Built by [Atomic47 Labs](https://atomic47.co). Questions: [david@atomic47.co](mailto:david@atomic47.co)
