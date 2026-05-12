# Changelog

## v3.0 — 2026-05-11

### Architectural shift

**Unified reporting mechanism — one context, one document tree.** The v2.0 suite had two parallel documentation pipelines that didn't know about each other: `project-doc-suite-generator` (reading `.project-state/` → 7 Office files) and the global `doc-suite-generator-v2` skill (reading a codebase scan → 11 markdown documents). The Architecture-Overview.docx had never read the actual codebase; the technical-specification.md had no idea which milestone it was delivering against. v3.0 collapses both into a single unified suite.

### Added

- **`project-doc-suite` skill (#20)** — unified documentation suite generator. Assembles a shared context object by merging `.project-state/` substrate data (milestones, risks, phases, budget, manifest, reporting matrix) with a live codebase scan before generating any document. Produces 15 non-overlapping documents in `reports/unified-suite/YYYY-MM-DD/`. Replaces and supersedes `project-doc-suite-generator`. See `docs/UNIFIED-SUITE-V3.md`.
- **`docs/UNIFIED-SUITE-V3.md`** — full design reference. Documents the unified context schema, the complete v3 document tree (15 files, 4 bands), the two full document collapses (Architecture + tech-spec → one; Roadmap + business-benefits → one), the four enriched governance Office files, the 8-phase generation pipeline, pack extension point, and open implementation questions.
- **`v3/README.md`** — v3-specific README covering the unified suite design and upgrade path.
- **`v3/INSTALL.md`** — v3-specific install guide with fresh install and v2→v3 upgrade instructions.

### Changed

- **`project-doc-suite-generator`** — deprecated. The skill still functions on v2.x but will be removed in v3.1. Every invocation now shows a deprecation notice pointing to `project-doc-suite`. Output path was `reports/baseline/Baseline-Reports-YYYY-MM-DD/`; new path is `reports/unified-suite/YYYY-MM-DD/`.

### Document collapse (23 → 15, −35%)

| Removed | Replaced by |
|---------|-------------|
| `Baseline-Reports-Index.docx` + `00-executive-summary.md` | `00-suite-index.md` |
| `Architecture-Overview.docx` + `01-project-overview.md` + `01b-technical-specification.md` | `05-architecture-and-tech-spec.md` |
| `Roadmap-and-KPIs.docx` + `02-business-benefits.md` | `06-strategic-roadmap.md` |

### Governance documents enriched (not removed)

| Document | What's new |
|----------|------------|
| `01-project-tracker.xlsx` | Two new columns per milestone: primary codebase components + technical readiness score |
| `02-project-plan.docx` | Component Delivery Map table (phase → components entering production) |
| `03-risk-register.docx` | Technical Debt Risks section auto-populated from codebase scan readiness gaps |
| `04-milestone-specs.docx` | Delivery Components + Component Readiness section per milestone |

- **`packs/sred-canada/`** — new compliance pack for Canadian SR&ED T661 tax credit claims. Extends the substrate with `sred/` entities (TU/EX/ADV + evidence log + cost tracking). Provides funder-reporting, phase-gate, and external-comms profiles. Activates `project-sred-tracker` and `project-sred-reviewer`. See `packs/sred-canada/README.md`.
- **`project-sred-tracker` skill (#21)** — continuous capture of Technological Uncertainties, Experiments, Advancements, and evidence log entries. Enforces TU→EX→ADV traceability chain. Runs quarterly gap analysis and completeness reviews. Tracks 18-month CRA filing deadline. Active when `sred-canada` pack is loaded.
- **`project-sred-reviewer` skill (#22)** — T661 narrative review and audit-risk reduction. CRA-reviewer simulation, cross-section traceability check, risky language flagging, safer rewrites for Sections E/F/G, readiness verdict. Elevates the standalone `sred-submission-reviewer` skill into the project-state substrate. Active when `sred-canada` pack is loaded.
- **`project-onboarding` skill (#23)** — guided new-project onboarding. Interleaves facility orientation prose with targeted questions; handles pack selection (all 6 packs, branching logic), document ingestion and field extraction, stakeholder mapping, milestone capture, and freeform goals/examples/anti-patterns capture. Writes all captured context to substrate reference files. Calls `project-scaffolder` as its final step. Distinct from `project-scaffolder` (which initializes the filesystem); `project-onboarding` fills the context that makes the substrate useful. Synthetic content (when offered) is always labeled and requires user approval before writing.
- **`docs/PACK-CATALOG.md`** — updated to v3.0; `sred-canada` added; combinations table updated; roadmap cleaned of already-shipped packs.

### Migration from v2.x

Additive — no substrate changes required. ~10 minutes:
1. Symlink `project-doc-suite` into `~/.claude/skills/`
2. Replace any invocation of `project-doc-suite-generator` with `project-doc-suite`
3. Output path changes from `reports/baseline/Baseline-Reports-YYYY-MM-DD/` to `reports/unified-suite/YYYY-MM-DD/`

See `v3/INSTALL.md` for the full upgrade walkthrough.

---

## v2.0 — 2026-04-27

### Architectural shift

**Generic core + compliance packs.** The suite splits into a funder-agnostic core (12 unchanged skills + 6 abstracted skills + the new stakeholder reporting matrix) plus pluggable compliance packs that encode funder/customer/industry-specific behavior. The PIC pack reproduces v1.x behavior exactly. Other packs (`client-services`, `board-investor`, `agile-default`, `open-source-community`) ship as reference implementations.

This is the change that turns the system from a grant-management tool into a multi-stakeholder reporting tool that grants happen to be one case of.

### Added

- **Stakeholder reporting matrix** (`reporting-matrix.yaml`) — first-class entity in the substrate. Encodes "for each stakeholder group, what report at what cadence in what format on which surface, by which generator." Orchestrator scans on every tick and dispatches. See `docs/REPORTING-MATRIX.md`.
- **Pack system** — packs are collections of profile YAMLs + templates + reporting-matrix-defaults that configure the generic core. See `docs/PACK-AUTHORING.md` and `docs/PACK-CATALOG.md`.
- **`packs/pic-pcais/`** — production pack reproducing v1.x PIC behavior. Profiles for funder-reporting, review-meeting, external-comms, ip-tracker, archive, phase-gate. Templates for claim cover-email and SC Appendix-A agenda. Reporting-matrix-defaults seeding the funder.pic stakeholder.
- **`packs/client-services/`** — starter pack for consulting/customer engagements.
- **`packs/board-investor/`** — starter pack for PE/VC-backed startups.
- **`packs/agile-default/`** — starter pack for engineering teams.
- **`packs/open-source-community/`** — starter pack for OSS projects.
- **Phase preset library** in `templates/phase-presets/`: `grant-default`, `agile-default`, `waterfall-default`, `client-engagement-default`, `open-source-default`. Custom presets supported.
- **`templates/manifest-v2.yaml`** — new schema with stakeholders as first-class, phases.preset selection, packs_loaded list, reporting_matrix_path pointer, funder/customer namespaces.
- **`scripts/migrate-v1-to-v2.py`** — non-destructive migration utility. Backs up v1 manifest, writes v2 manifest with PIC fields moved to funder.pic namespace, seeds reporting matrix from loaded packs.
- **`docs/REPORTING-MATRIX.md`** — full reference for the new entity.
- **`docs/PACK-AUTHORING.md`** — how to write your own pack.
- **`docs/PACK-CATALOG.md`** — what ships, combinations, roadmap.
- **`docs/MIGRATION-V1-TO-V2.md`** — five-step walkthrough.

### Changed (skill abstractions)

- **`project-claim-prep` → `project-funder-reporting`** — generic funder/customer reporting engine. Loads template/cadence/recipient from active pack profile. PIC pack profile reproduces quarterly claim behavior.
- **`project-sc-meeting` → `project-review-meeting`** — generic recurring review meeting. Loads name/attendees/cadence/agenda from active pack profile. PIC pack profile reproduces SC behavior.
- **`project-publications` → `project-external-comms`** — generic external-comms review pipeline. Loads review-window-by-content-class from profile. PIC pack profile reproduces 30/14-day MPA behavior.
- **`project-ip-tracker`** — name unchanged but generic recipient via profile. PIC pack profile routes to PIC Director of Data and IP.
- **`project-archive`** — name unchanged but generic core + pack-driven items. PIC pack profile contributes FTE confirmation, holdback release, etc.
- **`project-phase-gate`** — name unchanged but user-defined phases via preset + pack overrides. Five presets ship; custom presets supported.

### Migration from v1.x

Non-destructive. Substrate format unchanged. ~30 minutes total for an existing project. See `docs/MIGRATION-V1-TO-V2.md`. Rollback is `mv manifest.v1.bak.yaml manifest.yaml && rm reporting-matrix.yaml`.

### Aliases

The old skill names (`project-claim-prep`, `project-sc-meeting`, `project-publications`) remain as aliases when the PIC pack is loaded, so existing user phrasings ("draft the Q2 claim", "schedule the next SC meeting", "we want to publish") continue to work.

---

## v1.1 — 2026-04-27

### Added

- **`project-website-publisher` skill (#18)** — bridges `documents/published/` to a static project website hosted on Vercel/Netlify/Cloudflare Pages/GitHub Pages. Stable URLs per doc, visibility-aware rendering (`team` / `consortium` / `public`), MPA publication-review enforcement on public pages, auto-deploy on `documents/published/` changes.
- **`docs/PROJECT-WEBSITE.md`** — full integration reference.
- **`templates/website/`** — Next.js + MDX starter template.
- **`website` block** in manifest template under `surfaces:`.

### Changed

- README and INSTALL bumped to v1.1; surface inventory now lists five surfaces (Slack, Gmail, Calendar, scsiwyg blog, project website).

---

## v1.0 — 2026-04-24

### Added

- Initial release.
- 17 skills covering project-state, scaffolder, orchestrator, phase-gate, document-curator, milestone-manager, status-reporter, notifier, sc-meeting, claim-prep, change-register, blog-publisher, onboarder, ip-tracker, publications, lessons, archive.
- `.project-state/` substrate documented.
- Templates for manifest and six phase manifests.
- Install guide with symlink/copy/Cowork options.
- Four surfaces wired: Slack, Gmail (drafts), Calendar, scsiwyg blog.

### Battle-tested on

Atomic47 × Crush Dynamics × Protein Industries Canada (PCAIS), project Ai26.10. April 2026 – March 2027. ~$1.94M CAD.
