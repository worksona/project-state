# Changelog

## v2.0.1 — 2026-04-28

### Added

- **`project-doc-suite-generator` skill** — new P2 skill that generates styled `.docx` and `.xlsx` baseline report bundles from `.project-state/`. Produces 7 files: index, tracker workbook (8 sheets: Home, Dashboard, Milestones, Deliverables, Risks, Phases, Monthly Gantt, Dependencies, Legend), project plan, risk register, milestone specs, architecture overview, and roadmap/KPIs. Matching the quality standard of production projects (ai26.10).
- **`scripts/generate-baseline-reports.py`** — standalone Python script (requires `python-docx`, `openpyxl`) with CLI args: `--date`, `--output-dir`, `--state-dir`. Auto-detects `.project-state/` by walking up from script location or cwd.
- **Baseline report bundle** output to `reports/baseline/Baseline-Reports-YYYY-MM-DD/` — dated, idempotent, auditable.
- **Reporting matrix entry** `baseline-report-bundle` — event-driven (phase transitions, milestone completions, on-demand), format `docx+xlsx`, surface `website`.
- **Website reports page** updated with download links for `.docx` and `.xlsx` files, format-colored icons, file sizes.

### Changed

- **`project-status-reporter`** — SC pack and final report `.docx` rendering now references `python-docx` shared primitives with `project-doc-suite-generator` (was: non-existent "docx skill").
- **`project-orchestrator`** — new `baseline` routine added; `phase-check` routine now triggers baseline generation after phase transition.

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
