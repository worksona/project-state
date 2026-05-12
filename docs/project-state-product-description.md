# project-state — Product Description

**Version:** 3.0  
**Built by:** Atomic47 Labs · david@atomic47.co  
**License:** MIT  
**Compatibility:** Claude Code · Claude Coworker / FleetView · Claude API

---

## Executive Summary

project-state is a Claude Code plugin that provides an operational substrate for multi-stakeholder projects. It replaces the recurring manual work of project reporting — status updates, meeting packs, funder claims, onboarding briefs — with a system where those artefacts are generated from a single source of truth maintained as plain files on a shared drive.

Version 3.0 ships as a distributable plugin with 23 skills, 5 compliance packs, and a ready-to-deploy project website template. It is designed for teams of 2–20 running projects with structured reporting obligations: consortium grants, funded R&D, client engagements, regulated product development.

---

## The Problem

Multi-stakeholder projects run an invisible administrative tax. Project Leads routinely spend 20–30% of their time on:

- **Status assembly.** Pulling milestone percentages from scattered sources, reconciling tracker sheets, writing the same update in four formats for four audiences.
- **Meeting preparation.** Assembling pre-read packs the night before a review meeting, reformatting the same data that was in the last report.
- **Onboarding.** Writing project briefs for new team members that describe the project as it was, not as it is.
- **Compliance tracking.** Monitoring publication review clocks, IP disclosure windows, gate checklists — manually, across multiple documents that drift from each other.

The deeper problem: these artefacts aren't connected. A weekly report, a meeting pack, a milestone tracker, and a funder claim all describe the same project — but they're maintained independently, age at different rates, and frequently contradict each other. When something changes, every document needs to be updated manually.

---

## The Solution: A State-Driven Operations System

project-state inverts the relationship between data and documents.

**Traditional approach:** Maintain documents → try to keep them consistent.  
**project-state approach:** Maintain state → generate documents from state on demand.

The substrate is a typed filesystem — plain YAML, JSON, NDJSON, and markdown files in a `.project-state/` directory on the team's shared drive. No database, no API, no new SaaS platform. The shared drive the team already uses becomes the project's operational backbone.

Twenty-three purpose-built Claude skills read and write this substrate. They handle everything from phase gate enforcement to funder claim generation to personalised onboarding briefs. All of them route through a single memory layer (`project-state`) that enforces schema and concurrency rules.

The result: when milestone M04 is updated in the substrate, the next weekly report, the next meeting pack, and the next funder claim all reflect that update automatically — because they're generated from state, not maintained in parallel.

---

## Architecture

### Three layers

```
┌─────────────────────────────────────────────────────────┐
│  Surfaces                                               │
│  Slack · Gmail (draft) · Calendar · scsiwyg · Website  │
└──────────────────────────┬──────────────────────────────┘
                           │ project-notifier · project-blog-publisher
                           │ project-website-publisher
┌──────────────────────────▼──────────────────────────────┐
│  Skills  (23 project-* skills)                         │
│  phase-gate · milestone-manager · status-reporter      │
│  funder-reporting · review-meeting · doc-suite · …     │
└──────────────────────────┬──────────────────────────────┘
                           │ all reads/writes via project-state
┌──────────────────────────▼──────────────────────────────┐
│  Substrate  (.project-state/)                          │
│  manifest · milestones · risks · decisions · people    │
│  reporting-matrix · documents · logs · references      │
└─────────────────────────────────────────────────────────┘
```

### The substrate

```
.project-state/
├── manifest.yaml           ← project identity, stakeholders, budget, surfaces, packs loaded
├── state.json              ← current phase, counters, last-run timestamps
├── reporting-matrix.yaml   ← the reporting schedule: who, what, when, how, which skill
├── milestones/             ← M01-slug.yaml … one file per milestone
│   └── M01-discovery.yaml  ← percent_complete, owner, status, technical_progress, …
├── risks/                  ← R-01-slug.yaml … risk register entries
├── decisions/              ← YYYY-MM-DD-slug.yaml … formal decision log
├── people/                 ← one YAML per person (role, org, contact, onboarded)
├── documents/
│   ├── inbox/              ← drop zone for new documents
│   ├── working/            ← drafts under active revision
│   ├── published/          ← approved, versioned documents
│   └── index.yaml          ← slug → path + visibility + status
├── changes/
│   ├── change-log/         ← YYYY-MM-DD-slug.yaml … all material changes
│   └── change-orders/      ← CO-NN-slug.yaml … formal change orders
├── ip/                     ← IP disclosures with recipient routing
├── lessons-learned/        ← continuous capture, fed into closeout report
├── reports/                ← generated output only; never source of truth
├── references/             ← context.md and project-specific reference material
└── logs/
    ├── activity.ndjson     ← append-only event log
    └── decisions.ndjson    ← decision events
```

All files are plain text. The directory is the database. Any team member with shared drive access and Claude has full operational capability — no separate server, no sync service, no per-seat SaaS license.

### The reporting matrix

The central orchestration concept. `.project-state/reporting-matrix.yaml` encodes the complete reporting schedule as data:

```yaml
entries:
  - id: weekly-team-status
    stakeholder_group: team
    report_type: weekly-status
    cadence: weekly
    day_of_week: friday
    format: slack-post
    surface: slack
    generator_skill: project-status-reporter
    enabled: true
```

The orchestrator reads this matrix on each invocation, checks dates and states, and dispatches the appropriate skill for each overdue entry. Seeded from loaded compliance packs at project setup; freely customisable after.

---

## The 23 Skills

### P0 — Foundation

| Skill | What it does |
|---|---|
| `project-state` | Memory layer. Every other skill routes reads and writes through this. Enforces schema, concurrency rules, and entity naming conventions. |
| `project-scaffolder` | One-shot project initialiser. Creates the full `.project-state/` tree, seeds the manifest from user inputs, selects a phase preset, loads packs, and seeds the reporting matrix. |

### P1 — Core Operations

| Skill | What it does |
|---|---|
| `project-phase-gate` | Manages lifecycle phase transitions using configurable presets (grant-default, agile-default, waterfall-default, client-engagement-default, open-source-default, or custom). Enforces gate-in and gate-out checklists; refuses transitions if required artefacts are missing. |
| `project-document-curator` | Ingests documents from `inbox/`, classifies them, assigns source-of-truth status, indexes into `documents/index.yaml`, and cross-references from the manifest or active phase. |
| `project-milestone-manager` | Full milestone CRUD. Updates `percent_complete`, `technical_progress`, and status. Propagates changes to tracking workbooks and flags at-risk items. |
| `project-status-reporter` | Generates status reports in multiple formats from state: weekly Slack-format, review-meeting pack (docx), funder claim draft (xlsx), ad-hoc prose, dashboard snapshot. Reads the reporting matrix to determine which reports are due. |

### P2 — Surfaces & Automation

| Skill | What it does |
|---|---|
| `project-orchestrator` | Calendar-aware conductor. Reads the reporting matrix and current state, determines what's due, and dispatches generator skills. Run on-demand or on a schedule. |
| `project-notifier` | Routes artefacts to external surfaces: Slack post, Gmail draft, or Google Calendar event. All email is draft — never auto-sent. |
| `project-review-meeting` | Full recurring review-meeting lifecycle: schedule, agenda assembly, pre-read pack, run/minutes, action-item filing. Meeting shape (name, cadence, attendees, agenda template) comes from the loaded pack's profile. |
| `project-funder-reporting` | Generates structured funder reports: claim packages, milestone completion evidence, financial reconciliation. Format and deadlines come from the pack profile. |
| `project-change-register` | Classifies proposed changes as material vs. non-material. Routes material changes through formal change-order workflow. Maintains the change log. |
| `project-blog-publisher` | Publishes project narrative updates (milestone completions, retrospectives, public briefs) to a scsiwyg blog. Respects publication review windows before any public post. |
| `project-website-publisher` | Builds and deploys a live Next.js project website from `.project-state/`. Pages are server components that read state at request time — no rebuild needed when data changes. |
| `project-doc-suite` | Unified document suite (v3). Merges substrate data and codebase scan into a single context, then generates 11 documents covering architecture, strategic roadmap, risk register, milestone specs, technical readiness, innovation themes, extensibility, and features. |
| `project-sred-tracker` | Continuous SR&ED (Scientific Research & Experimental Development) capture. Logs Technical Uncertainty events, experimental work, and evidence for Canadian tax credit claims. Active with the `sred-canada` pack. |
| `project-sred-reviewer` | Reviews accumulated SR&ED evidence against T661 form requirements. Simulates CRA scrutiny and flags gaps before submission. Active with the `sred-canada` pack. |

### P3 — Polish

| Skill | What it does |
|---|---|
| `project-onboarder` | Generates a personalised onboarding brief for a new team member: project context, their role's milestones, key contacts, working agreements, where to find things. |
| `project-ip-tracker` | Logs IP disclosures with configurable recipient routing. Tracks foreground vs. background IP, commercialisation reporting, and Annual Questionnaire obligations. |
| `project-external-comms` | Manages the publication review pipeline for externally-facing content. Tracks review clocks, required approvals, and clearance status. |
| `project-lessons` | Continuous lessons-learned capture throughout the project lifecycle. Feeds into the closeout report. |
| `project-archive` | Full project closeout and archival. Generates final report, confirms deliverable completion, releases financial holdbacks per the pack's closeout checklist. |
| `project-onboarding` | Guided nine-chapter initialisation for new project-state adopters. Covers pack selection, document ingestion, stakeholder mapping, goals and constraints, substrate init, and team briefing. |
| `project-harvester` | Harvests external signals (Slack, Gmail, Google Docs, scsiwyg) relevant to the project and deposits them as intel documents in `.project-state/documents/inbox/`. |

---

## Compliance Packs

Skills are generic. Packs configure them for a specific context by providing YAML profiles that skills read at runtime. Loading a pack doesn't change any skill's code — it changes the data those skills operate on.

### Five packs ship with the plugin

**`agile-default`** — Engineering teams on Scrum or Kanban. Configures sprint retrospectives (not quarterly SCs), sprint-aligned phase gates, sprint cadence meeting notices, and backlog-linked action items.

**`board-investor`** — Startups with board governance. Configures monthly board meetings, board pack templates, investor update cadence, board-member roster management, and cap-table-aware IP tracking.

**`client-services`** — Client-facing engagements. Configures Quarterly Business Reviews, client attendee management, engagement health metrics, and client-specific comms review windows.

**`open-source-community`** — Community-governed projects. Configures community call cadence, RFC review periods, contributor onboarding, and public-by-default publication posture.

**`sred-canada`** — Canadian projects claiming SR&ED (Scientific Research & Experimental Development) tax credits. Configures TU/EX/ADV event capture, evidence standards, T661 narrative structure, and CRA-aligned phase gate criteria.

### Authoring a custom pack

A pack is a directory of YAML profiles — no code. If your funder or programme isn't covered by the five generic packs, a new pack takes about an hour to author. See `docs/PACK-AUTHORING.md` for the schema and an annotated example. The `pic-pcais` pack (for Protein Industries Canada PCAIS consortiums) is a production-grade reference available separately.

---

## External Surfaces

All surfaces are optional. Each is configured in `manifest.yaml:surfaces` and activated by the corresponding MCP connection.

| Surface | What project-state uses it for | Notes |
|---|---|---|
| **Slack** | Weekly status posts, meeting notices, deployment notifications, milestone alerts | `project-notifier` routes to configured channels |
| **Gmail** | All outbound email | Always created as drafts. Never auto-sent. Human review required before sending. |
| **Google Calendar** | Review meeting scheduling, deadline reminders, proposed holds | Events are proposed; accepted by the recipient |
| **scsiwyg** | Blog posts for milestone completions, retrospectives, monthly public briefs | Respects external-comms review window before public posts |
| **Website** | Live team site with dashboard, milestones, risks, decisions, team, blog, wiki | Next.js App Router template; deploys to Vercel or Netlify; ISR 5-minute revalidation |

---

## The Project Website

The `templates/website/` directory in the plugin is a complete Next.js 16 App Router project that renders `.project-state/` as a live team website.

- **Runtime reading** — pages are server components that read `.project-state/` at request time. No rebuild needed when milestone data, risks, or decisions change.
- **ISR** — 5-minute revalidation. Changes are visible within 5 minutes without a deploy.
- **Password protected** — JWT cookie auth (`AUTH_SECRET` + `AUTH_PASSWORD` env vars). All routes protected.
- **Stakeholder colours** — dynamic 5-slot palette assigned by org order in `manifest.yaml:stakeholders`. No hardcoding.
- **REPORTS_DIR auto-discovery** — scans for `reports/` or `Baseline-Reports-*/` automatically.
- **Deploys to Vercel or Netlify** — `npm run vercel-build` handles state sync before the Next.js build.

Pages: Dashboard · Milestones · People · Blog · Wiki · Calendar · Context · Decisions · Risks · Reporting · Documents · About.

---

## Getting Started

### 1. Install the plugin

```
/plugin marketplace add github:atomic47/project-state
/plugin install project-state@atomic47
```

### 2. Scaffold a new project

Navigate to the root of your project's shared drive folder:

```
/project-scaffolder
```

The scaffolder asks about your project (name, funder, consortium members, dates), selects a compliance pack, configures surfaces, and creates a complete `.project-state/` ready to use.

### 3. Load state and start operating

```
What phase are we in?           →  project-phase-gate
Show me the milestones          →  project-milestone-manager  
What's due this week?           →  project-orchestrator
Draft the weekly status report  →  project-status-reporter
Schedule the next review meeting →  project-review-meeting
Onboard Alex from OrgB          →  project-onboarder
```

---

## Design Principles

**State is the source of truth.** Reports are generated from state. When an artefact disagrees with state, regenerate the artefact — don't patch the artefact.

**Review, don't author.** Gmail is always draft. Calendar events are proposed holds. Claims, meeting packs, and public documents require human sign-off before they leave the facility.

**One skill = one coherent job.** The orchestrator decides which skill to call; it doesn't do the work itself. Skills are composable, not monolithic.

**Packs configure, not code.** Meeting shape, report format, gate criteria, IP routing — all of this comes from YAML profiles in the active pack. Changing your funding model or governance structure means loading a different pack, not editing skills.

**Plain files, shared drive.** Any team member with shared drive access and Claude has full operational capability. No infrastructure to provision, no service to subscribe to, no per-seat licence to manage.

**Append-only logs.** `logs/activity.ndjson` is never rewritten. Corrections are new entries. This makes the substrate auditable and concurrency-safe.

---

## Technical Requirements

- Claude Code, Claude Coworker / FleetView, or Claude API with skill loading
- Shared drive accessible to all team members (Google Drive, OneDrive, Dropbox, or any synced filesystem)
- Optional: Slack MCP, Gmail MCP, Google Calendar MCP, scsiwyg MCP for surface routing
- Optional: Node.js 18+ and a Vercel or Netlify account for the project website

---

## Version History

| Version | Date | Highlights |
|---|---|---|
| **v3.0** | May 2026 | Plugin packaging for Claude Code / Coworker. `project-doc-suite` unified suite. `project-sred-tracker` and `project-sred-reviewer` for Canadian SR&ED. `project-onboarding` guided nine-chapter init. `project-harvester` external signal ingestion. Full generalization — no funder-specific defaults. Next.js App Router website template. MIT licence. |
| **v2.0** | April 2026 | Generic core + compliance packs. Reporting matrix. Six pack-profile-driven skills. `project-scaffolder` seeds matrix from packs. Phase presets replacing hard-coded phases. |
| **v1.x** | 2025 | Initial release. PIC/PCAIS-specific. Single funder, hard-coded defaults. |

---

## Contact & Distribution

Built by **Atomic47 Labs**  
David Olsson · [david@atomic47.co](mailto:david@atomic47.co) · [atomic47.co](https://atomic47.co)

The `pic-pcais` compliance pack for Protein Industries Canada PCAIS consortiums is available separately. Contact david@atomic47.co.

Custom pack authoring, onboarding support, and design partnerships available on request.

**MIT Licence** — free to use, modify, and distribute. See `LICENSE`.
