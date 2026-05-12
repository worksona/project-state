# project-state v2.0 — Audit Report

**Date:** 2026-05-11
**Audited from:** `project-state-v2.zip`
**Scope:** all skills, docs, packs, templates, scripts

---

## Summary

The v2.0 architecture is sound. The reporting-matrix concept, pack system, and substrate model are well-designed and the migration path is genuinely non-destructive. Four issues need attention before this ships as a distributable: one install-breaking omission, stale v1 skill names inside multiple SKILL.md bodies, and two reference docs that were never updated to v2. There are also two pack-integrity issues and a set of minor count inconsistencies throughout.

---

## 🔴 High — fix before distribution

### 1. `project-doc-suite-generator` is excluded from the install procedure

19 skills ship in `skills/`, but INSTALL.md's Step 2 symlink loop lists only 18 — `project-doc-suite-generator` is absent. A fresh install following the guide will not symlink it, so `project-orchestrator`'s `baseline` routine (which calls it explicitly) will fail at runtime.

The skill is also missing from `docs/SKILLS-REFERENCE.md` entirely. It appears in `CLAUDE.md`'s P2 table, in the orchestrator's body, and in the status-reporter's integration list — but nowhere the installer would see.

**Fixes:**
- Add `project-doc-suite-generator` to the symlink loop in `INSTALL.md` Step 2.
- Add a section for it in `docs/SKILLS-REFERENCE.md` (P2 tier, between `project-funder-reporting` and `project-change-register`).
- Update `INSTALL.md`'s description-limit note from "All 18 v2.0 skills comply" → 19.

---

### 2. Stale v1 skill names embedded in SKILL.md bodies

Six skills were renamed in v2.0 (`project-sc-meeting` → `project-review-meeting`, `project-claim-prep` → `project-funder-reporting`, `project-publications` → `project-external-comms`). Their frontmatter and opening headings were updated, but the bodies of several other skills still call the old names — meaning the skills will reference non-existent identifiers at runtime when invoked.

| File | Stale references |
|---|---|
| `skills/project-orchestrator/SKILL.md` | `project-claim-prep` (quarter-close routine, line 103), `project-sc-meeting` (sc-prep routine, line 109) |
| `skills/project-notifier/SKILL.md` | `project-sc-meeting` (lines 126–127), `project-claim-prep` (line 127), `project-publications` (discipline section, lines 117–118) |
| `skills/project-change-register/SKILL.md` | `project-sc-meeting` (line 129) |
| `skills/project-lessons/SKILL.md` | `project-sc-meeting` (line 109) |
| `skills/project-onboarder/SKILL.md` | `project-sc-meeting` (line 131) |
| `skills/project-blog-publisher/SKILL.md` | `project-publications` (line 76) |

The orchestrator is the most critical: its `quarter-close` and `sc-prep` routines call the old names directly, not as aliases. Running `/project-orchestrator` in PIC-pack mode will emit stale skill names on those paths.

**Fix:** Replace all occurrences above with the v2 names. The CHANGELOG already defines the aliases, but the skill bodies should use the canonical names so the documentation matches what actually runs.

---

### 3. `docs/SYSTEM-ARCHITECTURE.md` was not updated for v2.0

The file header still reads `Version: 1.1`. The entire "typical week flows through the system" section uses `project-claim-prep.draft`, `project-claim-prep.finalize`, `project-sc-meeting`, and `project-publications` throughout. The P2 skills table uses old names. The "Adopting for non-PIC" guidance says these three skills are "hard-wired to PIC" — accurate for v1.x, now incorrect and misleading for anyone evaluating whether to adopt v2 for a different project type.

This is the most-read overview document in the distribution and it describes v1.1, not v2.0.

**Fix:** Bump version to 2.0. Replace old skill names throughout. Update the "typical week" flow to use `project-funder-reporting`, `project-review-meeting`, `project-external-comms`. Update the "Adopting for non-PIC" section to describe the pack system (the whole point of v2).

---

### 4. `docs/SKILLS-REFERENCE.md` was not updated for v2.0

Section headers still read `project-sc-meeting`, `project-claim-prep`, `project-publications`. The dependency diagram at the bottom references all three old names and omits `project-doc-suite-generator`. The `project-website-publisher` entry in the diagram still calls out `project-publications` instead of `project-external-comms`.

This is the companion to SYSTEM-ARCHITECTURE.md — together they are the canonical skills reference, and both are shipping at v1.1.

**Fix:** Rename the three sections to their v2 names, update the dependency diagram, add a `project-doc-suite-generator` entry in the P2 section.

---

## 🟡 Medium — address before broad rollout

### 5. `open-source-community` pack ships with empty `profiles/` directory

`packs/open-source-community/manifest.yaml` declares it `provides.profiles: [external-comms, phase-gate]`. Neither file exists in `packs/open-source-community/profiles/`. If a user loads this pack and asks the system to generate content via those profiles, it will fail silently or throw a missing-profile error.

The pack's README calls it a starter and the version is `0.1.0-starter`, so this may be intentional — but the manifest `provides.profiles` field should either be empty or the files should exist. A `provides.profiles: []` with a comment "profiles planned in a future release" would be honest.

**Fix:** Either add stub profile YAMLs (even minimal ones) or set `provides.profiles: []` in the manifest and document what's missing in the README.

---

### 6. `templates/manifest.yaml` (v1 schema) ships alongside `manifest-v2.yaml`

`templates/` contains both `manifest.yaml` (schema_version: 1, header says "stable identity of your PIC project") and `manifest-v2.yaml`. A new adopter following INSTALL.md's scaffolding step could pick the wrong one. The v1 template doesn't mention that it's deprecated.

**Fix:** Either remove `templates/manifest.yaml` from the v2.0 distribution, or add a prominent deprecation notice at the top of the file pointing to `manifest-v2.yaml`.

---

### 7. `docs/PROJECT-WEBSITE.md` references `project-publications` instead of `project-external-comms`

Three occurrences in the website publisher's reference doc (lines 87, 181, 207) route public-doc clearance through `project-publications`. This affects the described build-time enforcement logic and the troubleshooting table — a user following this doc to debug a blocked deployment will look for the wrong skill.

**Fix:** Replace all three with `project-external-comms`.

---

## 🟢 Low — clean up when convenient

### 8. Skill count is inconsistent across documents

The actual count is 19 (verified by `ls skills/ | wc -l`). Across the distribution:

| Document | States |
|---|---|
| `README.md` headline | "eighteen `project-*` skills" |
| `README.md` "What you get" | "19 skills" |
| `INSTALL.md` section header | "The eighteen v2.0 skills" |
| `CLAUDE.md` | Correct (lists all 19 in P2 table) |

**Fix:** Standardize to 19 everywhere.

---

### 9. `INSTALL.md` description-limit self-check is stale

The constraint section says: "All 18 v2.0 skills comply. Verify with: …" — should be 19. Also, all 19 descriptions do comply (max observed: 981 characters), so the statement is factually correct except for the count.

---

## What's working well

**Architecture.** The three-layer model (substrate → skills → surfaces) is clean and consistent. Skills correctly route through `project-state`; the orchestrator is thin by design; surfaces are properly separated from core logic.

**Reporting matrix.** The new v2 entity is well-documented (`docs/REPORTING-MATRIX.md` is thorough), the schema is expressive, and the seed-from-pack flow is a good DX. The cadence types cover the realistic range without over-engineering.

**Pack system.** `pic-pcais` is production-quality — all six profiles are present, templates ship, and the pack's reporting-matrix-defaults are specific enough to be genuinely useful. The PACK-AUTHORING.md guide is actionable.

**Migration path.** The migration script is non-destructive, correctly scoped (manifest + matrix only), and the `MIGRATION-V1-TO-V2.md` walkthrough is accurate. The "Common issues" section covers realistic failure modes.

**Substrate schema.** Unchanged from v1 — the concurrency model, entity schemas, naming conventions, and activity log format are solid and carry over cleanly.

**Concurrency documentation.** `docs/CONCURRENCY.md` is clear and the advisory-lockfile + frontmatter-timestamp approach is appropriate for a shared-drive filesystem.

**Description field compliance.** All 19 SKILL.md `description` fields are under the 1024-character limit. The longest is `project-milestone-manager` at 981 characters.

---

## Issue register

| # | Severity | File(s) | Description |
|---|---|---|---|
| 1 | 🔴 High | `INSTALL.md`, `SKILLS-REFERENCE.md` | `project-doc-suite-generator` missing from install loop and skills reference |
| 2 | 🔴 High | 6 SKILL.md files | Stale v1 skill names in skill bodies (`project-sc-meeting`, `project-claim-prep`, `project-publications`) |
| 3 | 🔴 High | `docs/SYSTEM-ARCHITECTURE.md` | Entire doc reflects v1.1; old skill names throughout; version header not bumped |
| 4 | 🔴 High | `docs/SKILLS-REFERENCE.md` | Section headers, dependency diagram, and one cross-ref still use v1 names |
| 5 | 🟡 Medium | `packs/open-source-community/` | `provides.profiles` lists two profiles that don't exist |
| 6 | 🟡 Medium | `templates/manifest.yaml` | v1 schema template ships alongside v2; no deprecation notice |
| 7 | 🟡 Medium | `docs/PROJECT-WEBSITE.md` | Three references to `project-publications` instead of `project-external-comms` |
| 8 | 🟢 Low | `README.md`, `INSTALL.md` | Skill count inconsistency (18 vs 19) |
| 9 | 🟢 Low | `INSTALL.md` | Description-limit self-check says "18 skills" |
