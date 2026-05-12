# project-state
### The operational substrate for multi-stakeholder projects

**Built by Atomic47 · v3.0 · david@atomic47.co**

---

## The problem

Every multi-stakeholder project — consortium grants, funded R&D, client engagements — runs the same invisible tax: weekly status reports assembled by hand, meeting packs pulled together the night before, milestone trackers that drift from reality, onboarding docs that describe a project that no longer exists.

Project Leads spend 20–30% of their time on reporting *about* the work instead of doing it. And the artefacts they produce — reports, packs, trackers — aren't connected. They're snapshots that age the moment they're written.

---

## The solution

**project-state** is a Claude Code plugin that turns project operations into a byproduct of normal work.

It stores everything that matters — milestones, risks, decisions, people, documents, phase status — as plain YAML files in a `.project-state/` directory on your shared drive. Then 23 purpose-built skills read that state and generate whatever you need: weekly reports, meeting packs, funder claims, onboarding briefs, a live project website.

**State is the source of truth. Reports are generated from state. When a report is wrong, you fix the state — not the report.**

---

## How it works

```
.project-state/          ← plain YAML/JSON/MD on your shared drive
├── manifest.yaml        ← project identity, stakeholders, budget
├── milestones/          ← one file per milestone, always current
├── risks/ decisions/    ← running logs, not snapshots
└── reporting-matrix.yaml ← who gets what report, at what cadence

        ↓ 23 project-* skills read and write this

Weekly report     →  Slack post or email draft
Meeting pack      →  docx agenda + pre-read bundle
Funder claim      →  xlsx with milestone percentages
Project website   →  live Next.js site, auto-updating
Onboarding brief  →  personalised per new team member
```

---

## Compliance packs

Skills are generic. **Packs** configure them for your context — meeting names, report formats, gate criteria, IP routing, comms review windows. Five ship with the plugin:

| Pack | For |
|---|---|
| `agile-default` | Scrum / Kanban engineering teams |
| `board-investor` | Startups with board governance |
| `client-services` | Client engagements, QBR cadence |
| `open-source-community` | Community-governed projects |
| `sred-canada` | Canadian SR&ED tax credit claims |

Custom packs take about an hour to author. No code — just YAML profiles.

---

## The 23 skills

**Foundation** — `project-state` · `project-scaffolder`

**Core operations** — `project-phase-gate` · `project-document-curator` · `project-milestone-manager` · `project-status-reporter`

**Surfaces** — `project-orchestrator` · `project-notifier` · `project-review-meeting` · `project-funder-reporting` · `project-change-register` · `project-blog-publisher` · `project-website-publisher` · `project-doc-suite` · `project-sred-tracker` · `project-sred-reviewer`

**Polish** — `project-onboarder` · `project-ip-tracker` · `project-external-comms` · `project-lessons` · `project-archive` · `project-onboarding` · `project-harvester`

---

## What you get

- **No new infrastructure.** The shared drive you already use *is* the database.
- **No parallel maintenance.** One source of truth, many generated surfaces.
- **Any team member with Claude can operate it.** Skills are distributed with the project.
- **Compliant by default.** Packs encode the rules so you can't miss a gate or skip a review window.
- **Works with what you already use.** Slack, Gmail (drafts), Google Calendar, scsiwyg blog — all optional, all additive.

---

## Works with

Claude Code · Claude Coworker / FleetView · Claude API with skill loading

---

## Install

```
/plugin marketplace add github:atomic47/project-state
/plugin install project-state@atomic47
```

Then: `/project-scaffolder` — takes 5 minutes to set up a new project.

---

**atomic47.co · david@atomic47.co · MIT License**
