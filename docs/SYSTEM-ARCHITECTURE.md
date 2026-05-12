# System Architecture — `.project-state/` + project-* skills

**Version:** 2.0
**Audience:** Project Leads, technical leads, and anyone evaluating whether to adopt this suite

This document is the architectural overview of the system. It explains what the pieces are, how they fit together, and why the design choices were made. Read this first if you want to understand the suite as a whole. Read the per-skill SKILL.md files and the per-doc references (SCHEMA, CONCURRENCY, REPORTING-MATRIX, PROJECT-WEBSITE) for the details.

## One-line summary

A multi-stakeholder project's operating substrate, made of three things: a typed filesystem (`.project-state/`), a suite of nineteen skills (`project-*`) that read and write that filesystem, and a small set of last-mile surface bridges (Slack, Gmail-as-drafts, Calendar, scsiwyg blog, project website) that route artifacts the substrate produces to where they're consumed.

## Why a substrate, not an app

A project this size — twelve months, two-member consortium, a third-party funder, a Master Project Agreement, quarterly claim deadlines, mandated steering committee cadence — generates enough state that someone has to know where the truth is. The default outcome is that truth lives in a Project Lead's head, an inbox, and three or four spreadsheets that drift. When asked "where are we?", the answer is reconstructed each time.

The substrate exists so that the truth lives in one queryable place, with append-only history. Skills write to the substrate; reports are generated *from* the substrate. The reports are never the source of truth; the substrate is. When two artifacts disagree, the substrate wins and the artifact is regenerated.

## The three layers

### Layer 1 — the substrate (`.project-state/`)

A typed filesystem on a shared drive (Google Drive, OneDrive, Dropbox, or any sync'd shared FS). Every entity in the project — milestones, decisions, risks, IP disclosures, documents, people, changes, publications, lessons learned, communications, reports — has its own file with a defined schema. An append-only `logs/activity.ndjson` records every event, so the project's history is replayable.

Key properties:
- **No database, no API.** Plain YAML, JSON, NDJSON, and markdown files.
- **One source of truth per fact.** The schema enforces this; the curator skill enforces this at promotion time.
- **Concurrency via advisory lockfiles + frontmatter timestamps.** Documented in `CONCURRENCY.md`.
- **Source-of-truth promotion is explicit.** Documents move through `inbox/` → `working/` → `published/`. Only `published/` is referenced by other entities.

See `STATE-FACILITY-README.md` for the directory tree, `SCHEMA.md` for entity schemas, `CONCURRENCY.md` for the write rules.

### Layer 2 — the skills (`project-*`)

Nineteen skills, each owning a coherent slice of project work. Skills read and write the substrate via the `project-state` skill (the memory layer). They never hold state themselves — they're verbs that act on state.

In v2.0 the skill set splits into a **generic core** (twelve unchanged skills + six abstracted/renamed) plus **compliance packs** that configure the generic skills for specific funders, customer types, and project disciplines. The PIC pack reproduces v1.x behavior exactly.

Grouped by build tier:

**P0 — Foundations (build first; nothing else works without these)**
| Skill | Job |
|---|---|
| `project-state` | Read/write/list/validate every entity. The memory layer. Every other skill calls through it. |
| `project-scaffolder` | One-shot initializer for a new `.project-state/`. Also seeds the reporting matrix from loaded packs. |

**P1 — Core operations (run the project)**
| Skill | Job |
|---|---|
| `project-phase-gate` | User-defined phases via presets + pack overrides. Enforces gate-in/gate-out checklists. |
| `project-document-curator` | Classify/index/promote docs. Owns `documents/index.yaml` and visibility classification. |
| `project-milestone-manager` | CRUD milestones; `percent_complete` + `technical_progress` per funder requirements. |
| `project-status-reporter` | Weekly report / review-meeting pack / claim draft / ad-hoc status / dashboard snapshot. Reads the reporting matrix. |

**P2 — Surfaces & automation (last-mile delivery)**
| Skill | Job |
|---|---|
| `project-orchestrator` | Calendar-aware conductor. Reads the reporting matrix; decides what to do next based on date, state, deadlines. |
| `project-notifier` | Slack post / Gmail draft / Calendar event routing. |
| `project-review-meeting` | Generic recurring review meeting lifecycle (was `project-sc-meeting`). Pack profile defines name, attendees, cadence, agenda. |
| `project-funder-reporting` | Generic stakeholder-bound recurring reports (was `project-claim-prep`). Pack profile defines template, cadence, recipient. |
| `project-change-register` | Material vs. non-material; Change Log entry vs. Change Order draft. |
| `project-blog-publisher` | scsiwyg narrative surface bridge with publication-review respect. |
| `project-website-publisher` | Static project website — stable URLs for reference docs. Visibility-tier enforced. |
| `project-doc-suite-generator` | ⚠️ Deprecated in v3.0. Use `project-doc-suite`. |
| `project-doc-suite` | **v3.0 unified suite.** Merges substrate + codebase scan; produces 15 non-overlapping docs (governance Office files enriched with technical context + unified strategic/technical docs + software insight suite). See `docs/UNIFIED-SUITE-V3.md`. |

**P3 — Polish (nice to have once core is running)**
| Skill | Job |
|---|---|
| `project-onboarder` | Personalized onboarding brief for new teammates from `.project-state/`. |
| `project-ip-tracker` | IP disclosures with configurable recipient via pack profile. |
| `project-external-comms` | Generic external-comms review pipeline (was `project-publications`). Pack profile defines review windows by content class. |
| `project-lessons` | Continuous Lessons Learned capture + closeout summary. |
| `project-archive` | Generic closeout core + pack-driven closeout items. |

See `SKILLS-REFERENCE.md` for what each skill reads, writes, and triggers on.

### Layer 3 — the surfaces

Skills produce artifacts. Surfaces are where those artifacts end up. Five surfaces are wired:

| Surface | Owned by | Used for | Send semantics |
|---|---|---|---|
| **Slack** | `project-notifier` | Action/coordination posts, daily standup, alert pings, deploy notifications | Auto-post |
| **Gmail** | `project-notifier` | External / formal communication (PIC, member orgs, legal) | **Always draft, never auto-send** |
| **Google Calendar** | `project-notifier` | SC meetings, PIC claim deadlines, milestone events, builder syncs | Proposed holds + invites |
| **scsiwyg blog** | `project-blog-publisher` | Narrative updates, milestone completions, monthly briefs, public-facing stories | Publication-review-respecting; team posts ship directly |
| **Project website** | `project-website-publisher` | Reference docs (cadence, tracker, baselines, milestone specs) at stable URLs | Auto-deploy on doc.published; visibility-tier enforced |

The principle is "every artifact has a home." Action goes to Slack. Formal goes to Gmail (as a draft). Time-bound goes to Calendar. Narrative goes to the blog. Reference goes to the website.

## The reporting matrix

New in v2.0: `.project-state/reporting-matrix.yaml` encodes "for each stakeholder group, what report at what cadence in what format on which surface, produced by which skill." The orchestrator reads this matrix on every tick and dispatches generators. Pack defaults seed the matrix at scaffold time; the Project Lead customizes from there.

See `docs/REPORTING-MATRIX.md` for the full reference.

## How a typical week flows through the system

```
Monday morning
  ↓
project-status-reporter generates the Monday tracker email
  reads: documents/published/, milestones/, logs/activity.ndjson, last week's retro
  writes: communications/weekly/<date>-monday-tracker.md
  ↓
project-notifier creates a Gmail DRAFT for the email
  ↓ Project Lead reviews + sends manually

Tuesday — Builders Sync (30 min, in-person/video)
  ↓
Notes captured by attending PL or note-taker into reports/builders/<date>-builders-sync.md
  ↓
project-state.append_activity logs:
  - meeting.held (id: builders-sync-<date>)
  - decisions_recorded (linked decision IDs)
  - blockers_raised (linked task IDs)

Wednesday — PL Sync (30 min, PLs only)
  ↓
Same notes flow as Tuesday. Decisions promoted to decisions/ with full record.

Friday afternoon
  ↓
project-orchestrator detects "end of week" → triggers project-status-reporter.weekly_retrospective
  reads: this week's activity log slice, milestone deltas, decisions, meeting notes
  writes: reports/weekly/<date>-retrospective.md
  ↓
Project Lead reviews. Edits trigger document.updated events.
  ↓
project-website-publisher.regenerate picks up the published retro,
  rebuilds, and (if auto-deploy enabled) deploys to /docs/retros/<date>

Bi-weekly Friday (alternating)
  ↓
project-status-reporter.stakeholder_update
  produces a written update summarizing two weeks of activity
  ↓
project-notifier creates a Gmail draft to consortium + PIC PM CC
  ↓ Project Lead reviews + sends

Month-end
  ↓
project-orchestrator detects month-end → triggers monthly close workflow:
  - project-funder-reporting.draft (rolling claim with current quarter data)
  - member-invoicing draft (CDI invoices A47 per Schedule A)
  - Crush reporting draft (per the side-letter to the MPA)
  ↓
All three artifacts go to Gmail as DRAFTS for finance rep review.

Every six weeks
  ↓
project-orchestrator triggers risk + IP + KPI refresh
  - project-state.diff against last refresh
  - draft updates for risk register, IP rationale, KPI baseline
  - PL reviews, advances if appropriate, files updates

Quarterly
  ↓
project-review-meeting (5 business days notice min) →
  agenda from PIC PM Guide Appendix A built from substrate →
  project-status-reporter assembles the SC pack docx →
  project-notifier sends invites + pack as Calendar invite + Gmail draft →
  meeting runs, minutes captured →
  project-state writes minutes to reports/sc-meetings/<id>.md →
  project-notifier distributes minutes within 5 business days
  ↓
Action items become tasks in tracking/. Decisions captured.
  ↓
project-website-publisher regenerates so the public-facing summary updates.

Apr / Jul / Oct / Jan 20
  ↓
project-funder-reporting.finalize — quarterly PIC claim
  reads: milestone percent_complete + technical_progress, member expense submissions
  writes: PIC-provided MS & financial tracking xlsx (filled in)
  ↓
project-notifier drafts the cover email to PIC PM
  ↓ PL signs off, submits to PIC
```

The Project Lead's role across all of this: review and sign off. The system drafts; humans decide.

## Discipline — review-not-author

Every external-facing artifact passes through human review before it leaves the system:

- **Gmail items are always drafts.** Never auto-sent. The `project-notifier.send` action does not exist. Only `project-notifier.draft`.
- **Calendar items are proposed holds + invites.** Holds go on the PL's calendar; invites are drafted with attendees but require PL send.
- **Quarterly claims are drafts.** PL signs off before submission. The skill never submits to PIC directly.
- **SC packs are drafts.** PL adjusts, signs off, then sends.
- **Public website docs cleared by `project-external-comms`.** No public publication without the review clock passing.
- **Blog posts respect publication review.** Team-internal blog posts ship directly; consortium-tier requires consortium review; public-tier requires full SC review.

The discipline is that the system reconstructs status, drafts artifacts, and routes them to the right surface — but humans hold the send button.

## Adding a new skill

Skills are markdown files with `name:` and `description:` frontmatter. To add a new skill:

1. Pick a coherent job. One skill = one verb.
2. Create `skills/<skill-name>/SKILL.md` with frontmatter + a body covering: what it owns, what it does not own, mental model, sub-actions, configuration, inputs/outputs, acceptance criteria, failure modes.
3. Decide which existing skills it calls (always `project-state`; sometimes others).
4. Decide which existing skills should call it (the orchestrator? the curator? user-triggered only?).
5. Add it to `SKILLS-REFERENCE.md` and the catalog in `INSTALL.md` and `README.md`.

## Adopting the suite for a non-PIC project

The v2.0 pack system is the answer here — you no longer need to strip or replace skills. Instead:

1. Choose a phase preset (`agile-default`, `waterfall-default`, `client-engagement-default`, `open-source-default`, or write a custom one).
2. Load the pack that matches your funder or customer type. The pack's profiles configure `project-review-meeting`, `project-funder-reporting`, `project-external-comms`, `project-ip-tracker`, `project-archive`, and `project-phase-gate` for your context.
3. Seed the reporting matrix from the loaded packs. Customize cadences, recipients, and formats to match your stakeholder map.
4. Keep the substrate, the orchestrator, and the surface bridges as-is — they're funder-agnostic.

The PIC pack ships with this distribution and reproduces v1.x behavior exactly. Four other reference packs ship as starters: `client-services`, `board-investor`, `agile-default`, `open-source-community`.

See `docs/PACK-AUTHORING.md` to write your own.

## Versions

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-04-24 | Initial release. 17 skills. Slack / Gmail / Calendar / scsiwyg surfaces. |
| 1.1 | 2026-04-27 | Added `project-website-publisher` (skill #18) + `PROJECT-WEBSITE.md` doc + `templates/website/` starter. |
| **2.0** | **2026-04-27** | **Generic core + compliance pack system. Stakeholder reporting matrix. Six skills abstracted/renamed. Five reference packs. Phase preset library. Migration script. 19 skills total.** |

See `CHANGELOG.md` for the full per-version diff.
