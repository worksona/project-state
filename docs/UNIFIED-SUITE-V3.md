# Unified Report Suite — v3 Design

**Version:** 3.0 (design draft)
**Supersedes:** `project-doc-suite-generator` (governance Office bundle) + `doc-suite-generator-v2` (software markdown suite)
**Status:** design — not yet implemented

---

## The problem with two suites

`project-doc-suite-generator` reads `.project-state/` YAML and produces 7 Office files.
`doc-suite-generator-v2` reads a codebase scan and produces 11 markdown documents.

They don't know about each other:

- The Architecture-Overview.docx describes the three-layer system design but has never read a line of the actual codebase.
- The technical-specification.md knows every file and dependency but has no idea which PIC milestone it is delivering against or what the budget envelope is.
- The Roadmap-and-KPIs.docx lists PIC phase gate criteria; the business-benefits.md analyzes the same project's value proposition — from an entirely different vantage point, producing a different narrative about the same thing.
- The governance Risk Register doesn't include technical debt found in the codebase scan; the technical readiness report doesn't contextualize risk against the funder's reporting requirements.

The result: two parallel document universes that disagree in voice, in structure, and sometimes in substance — and collectively cover more ground than the project has.

---

## v3 principle: one shared context, one document tree

Before any document is rendered, the suite assembles a **unified context object** by merging both source layers:

```
Unified Context
├── substrate.*          ← everything from .project-state/ (manifest, milestones, risks, phases, decisions, reporting matrix)
└── scan.*               ← everything from the codebase scan (tech stack, architecture, components, dependencies, code quality, entry points)
```

Every document generator in the suite receives this context. A document is allowed to emphasize one layer over the other, but it may never be ignorant of the other.

---

## Document tree — v3

All files land in `.project-state/reports/unified-suite/YYYY-MM-DD/`.

The tree is structured in four bands:

### Band A — Machine-readable tracking

| File | Format | Sources | Description |
|------|--------|---------|-------------|
| `01-project-tracker.xlsx` | .xlsx | substrate + scan | Milestones, risks, Gantt, deliverables — as before, but with two new columns per milestone: **primary components** (which codebase modules deliver this milestone) and **technical readiness score** (from the scan's readiness assessment for those components). Dashboard sheet gains a Technical Debt risk tile. |

### Band B — Governance / funder documents

These retain `.docx` format because funders, finance reps, and SCs need Office files. Each is enriched with technical context it previously lacked.

| File | Format | Sources | Was | What's new in v3 |
|------|--------|---------|-----|-------------------|
| `02-project-plan.docx` | .docx | substrate + scan | Project-Plan-and-Timeline.docx | Timeline section gains a **Component Delivery Map** table: phase → component(s) entering production. Surfaces section references codebase entry points. |
| `03-risk-register.docx` | .docx | substrate + scan | Risk-Register.docx | New risk category: **Technical Debt Risks** — auto-populated from the scan's readiness gaps (missing tests, weak error handling, etc.), scored using the same R-NN format, with mitigation mapped to backlog items where discoverable. |
| `04-milestone-specs.docx` | .docx | substrate + scan | Milestone-Detailed-Specs.docx | Each milestone entry gains a **Delivery Components** section: the codebase modules, services, or subsystems whose production-readiness is a condition of milestone completion. |

### Band C — Unified strategic + technical documents (the collapse)

These two documents replace two pairs of overlapping documents. Each has exactly one version, written with full awareness of both governance and technical reality.

| File | Format | Replaces | Coverage |
|------|--------|---------|---------|
| `05-architecture-and-tech-spec.md` | .md | Architecture-Overview.docx (gov) + project-overview.md + technical-specification.md (sw) | System architecture from both the substrate's three-layer model (substrate / skills / surfaces) **and** the live codebase scan (actual components, dependencies, API surface, deployment topology). One document that a funder, a new developer, and a technical reviewer can all read. |
| `06-strategic-roadmap.md` | .md | Roadmap-and-KPIs.docx (gov) + business-benefits.md (sw) | Phase gates, KPIs, and funder success criteria (from substrate) alongside business value analysis, target users, competitive advantages, and cost implications (from codebase/scan). The roadmap knows the business case; the business case knows the delivery phases. |

### Band D — Software insight documents (no governance equivalent)

These documents have no counterpart in the governance suite. They survive unchanged from the software suite's output, but now receive substrate context as input (they know the project name, funder, milestone count, budget envelope).

| File | Format | Description |
|------|--------|-------------|
| `07-technical-readiness.md` | .md | 10-dimension production readiness scoring. In v3 also flags which at-risk dimensions directly threaten upcoming milestone completion criteria. |
| `08-innovation-themes.md` | .md | What's technically novel. In v3 notes which innovations are PIC-funded deliverables vs. enabling infrastructure. |
| `09-extensibility.md` | .md | Plugin points, API surfaces, extension patterns. |
| `10-features-capabilities.md` | .md | Concrete feature inventory. |
| `11-work-zones.md` | .md | Thematic development work zones. |
| `12-portfolio-position.md` | .md | Portfolio context (multi-project runs only). |
| `13-worksona-themes.md` | .md | Leadership runbook alignment. |
| `14-worksona-first-principles.md` | .md | Structural principle alignment. |

### Band E — Navigation layer

| File | Format | Replaces | Description |
|------|--------|---------|-------------|
| `00-suite-index.md` | .md | Baseline-Reports-Index.docx (gov) + executive-summary.md (sw) | Single cover document: project identity, generation timestamp, document tree with one-sentence description per file, substrate health summary (phase, milestone counts, risk counts), and key themes from the scan. |
| `README.md` (project root) | .md | — | Standardized root README, enriched in a second pass after Band C documents are generated (incorporates funder context, milestone count, delivery phase). |

---

## Unified context object — schema

```yaml
# Assembled before any document generation
unified_context:

  # From substrate
  substrate:
    project:                   # manifest.yaml:project
    budget:                    # manifest.yaml:budget
    dates:                     # manifest.yaml:dates
    funder:                    # manifest.yaml:project.funder
    current_phase:             # state.json
    milestones: []             # milestones/*.yaml
    risks: []                  # risks/*.yaml
    phases: []                 # phases/*/manifest.yaml
    decisions: []              # decisions/*.yaml
    packs_loaded: []           # manifest.yaml:packs_loaded
    reporting_matrix: []       # reporting-matrix.yaml

  # From codebase scan
  scan:
    tech_stack: []             # languages, frameworks, runtimes
    architecture_patterns: []  # MVC, event-driven, layered, etc.
    components: []             # key modules/services/directories
    entry_points: []           # main files, API routers, CLI entrypoints
    dependencies: []           # external packages with versions
    api_surface: []            # routes, endpoints, exported functions
    config_model: []           # env vars, config files, schema
    test_coverage:             # presence, framework, rough % if detectable
    deployment:                # Dockerfile, CI/CD, hosting signals
    code_quality:              # linting, formatting, error handling patterns
    documentation:             # existing README quality, inline comments, docstrings

  # Derived cross-links (built during context assembly, before generation)
  cross_links:
    milestone_to_components: {}   # M01 → [component-a, component-b]
    component_to_milestones: {}   # component-a → [M01, M04]
    technical_risks: []           # readiness gaps → risk entries
    readiness_by_milestone: {}    # M03 → {score: 6.2, gap: "no tests for module X"}
```

---

## Document collapse — before and after

```
BEFORE (23 documents across two suites):

  Governance suite (7 Office files)          Software suite (1 README + 11 md + index)
  ─────────────────────────────────          ─────────────────────────────────────────
  00 Index.docx                              README.md
  01 Project-Tracker.xlsx                    00 executive-summary.md
  02 Project-Plan-and-Timeline.docx          01 project-overview.md
  03 Risk-Register.docx                      01b technical-specification.md
  04 Milestone-Detailed-Specs.docx           02 business-benefits.md
  05 Architecture-Overview.docx  ──────────► 03 innovation-themes.md
  06 Roadmap-and-KPIs.docx       ──────────► 04 features-capabilities.md
                                             05 extensibility.md
                                             06 work-zones.md
                                             07 portfolio-position.md
                                             08 technical-readiness.md
                                             09 worksona-themes.md
                                             10 worksona-first-principles.md

AFTER (15 documents, one suite):

  00-suite-index.md                (replaces Index.docx + executive-summary.md)
  01-project-tracker.xlsx          (enriched)
  02-project-plan.docx             (enriched)
  03-risk-register.docx            (enriched with technical debt risks)
  04-milestone-specs.docx          (enriched with delivery components)
  05-architecture-and-tech-spec.md (replaces Architecture-Overview.docx
                                    + project-overview.md
                                    + technical-specification.md)
  06-strategic-roadmap.md          (replaces Roadmap-and-KPIs.docx
                                    + business-benefits.md)
  07-technical-readiness.md
  08-innovation-themes.md
  09-extensibility.md
  10-features-capabilities.md
  11-work-zones.md
  12-portfolio-position.md         (multi-project runs only)
  13-worksona-themes.md
  14-worksona-first-principles.md
  README.md                        (project root, enriched)
```

Net: **23 → 15 documents** (-35%), all documents with both substrate and scan context.

---

## Generation pipeline

```
Phase 0: Context assembly
  0.1  Read .project-state/ via project-state skill
  0.2  Run codebase scan (project-scanner)
  0.3  Build cross_links (milestone_to_components, technical_risks, readiness_by_milestone)
  0.4  Assemble unified_context object

Phase 1: README standardization (readme-standardizer)
  → project root README.md (first pass — substrate identity + scan tech stack)

Phase 2: Governance documents (enriched)
  2.1  project-tracker.xlsx (openpyxl — adds component + readiness columns)
  2.2  project-plan.docx (python-docx — adds component delivery map)
  2.3  risk-register.docx (python-docx — adds technical debt risk section)
  2.4  milestone-specs.docx (python-docx — adds delivery components per milestone)

Phase 3: Unified strategic + technical documents
  3.1  architecture-and-tech-spec.md (new unified generator — reads both layers)
  3.2  strategic-roadmap.md (new unified generator — reads both layers)

Phase 4: Software insight documents (specialist skills from doc-suite-generator-v2)
  4.1  technical-readiness.md (technical-readiness skill + milestone context)
  4.2  innovation-themes.md (innovation-themes skill + funder context)
  4.3  extensibility.md (extensibility-analysis skill)
  4.4  features-capabilities.md (derived from scan + substrate)
  4.5  work-zones.md (work-zone-mapper skill)
  4.6  portfolio-position.md (multi-project mode only)
  4.7  worksona-themes.md (worksona-themes skill)
  4.8  worksona-first-principles.md (worksona-first-principles skill)

Phase 5: README enrichment pass (readme-standardizer)
  → project root README.md (second pass — incorporates funder context, milestone phase, business value)

Phase 6: Index generation
  → 00-suite-index.md

Phase 7: Website sync (project-website-publisher)
  → Copy bundle to .project-state/website/public/downloads/unified-suite/
  → Update website reports page

Phase 8: Notification (project-notifier, optional)
  → "Unified suite generated" → Slack / Gmail draft
```

---

## Skill relationships

The `project-doc-suite` skill (new, v3) **calls**:
- `project-state` — substrate reads
- `project-scanner` (from doc-suite-generator-v2 pipeline) — codebase scan
- `readme-standardizer` (from doc-suite-generator-v2 pipeline) — README
- `technical-specification` specialist — feeds into Phase 3.1
- `business-benefit-analysis` specialist — feeds into Phase 3.2
- `innovation-themes` specialist — Phase 4.2
- `extensibility-analysis` specialist — Phase 4.3
- `work-zone-mapper` specialist — Phase 4.5
- `technical-readiness` specialist — Phase 4.1
- `worksona-themes` specialist — Phase 4.7
- `worksona-first-principles` specialist — Phase 4.8
- `project-website-publisher` — Phase 7
- `project-notifier` — Phase 8

The `project-doc-suite-generator` (v2) is **deprecated** — replaced by `project-doc-suite`. Kept in skills/ for one release cycle with a deprecation notice.

The `doc-suite-generator-v2` global skill (at `~/.claude/commands/`) **is not deprecated** — it remains the correct tool when there is no `.project-state/` substrate (pure software projects with no governance layer). `project-doc-suite` is for projects that have both.

---

## Pack behavior

Pack profiles can extend the suite. A pack profile at `packs/<pack-id>/profiles/doc-suite.yaml` may specify:

```yaml
# Example: pic-pcais pack extension
doc_suite:
  phase_2_extras:
    - claim-ready-milestone-appendix.docx   # PIC MS & financial tracking form layout
    - sc-agenda-template.docx               # PIC Appendix A agenda seeded from substrate
  band_d_extras:
    - regulatory-readiness.md               # Canadian AI regulatory context
  index_footnote: |
    Documents marked ★ are produced for PIC/ISED funder reporting under the Master Project Agreement.
```

---

## Migration from v2

| v2 action | v3 equivalent |
|-----------|---------------|
| `project-doc-suite-generator` | `project-doc-suite` |
| `doc-suite-generator-v2` on a project that has `.project-state/` | `project-doc-suite` |
| `doc-suite-generator-v2` on a project with no `.project-state/` | `doc-suite-generator-v2` (unchanged) |
| Manual merge of governance + software docs | Not needed — unified suite produces one tree |

---

## Open questions for implementation

1. **Context assembly order**: does the scan always run fresh, or can it consume a cached scan artifact from a previous `doc-suite-generator-v2` run?
2. **Format parity**: should `05-architecture-and-tech-spec` and `06-strategic-roadmap` also exist as `.docx` for funder audiences that need Office format? Or is markdown sufficient for those?
3. **Worksona skills dependency**: `worksona-themes` and `worksona-first-principles` require bundled reference documents (leadership runbook, worksona.fp compendium). How does `project-doc-suite` locate them — via the global `doc-suite-generator-v2` skill path, or should they be copied into `project-state/skills/`?
4. **Incremental runs**: when re-running after a milestone update, should Phase 2 (governance docs) re-run but Phase 4 (software insights) be skipped unless the codebase changed?
5. **Portfolio mode**: multi-project synthesis is a first-class capability of `doc-suite-generator-v2`. Should `project-doc-suite` support it, or does portfolio synthesis remain a separate `project-portfolio-synthesis` skill?
