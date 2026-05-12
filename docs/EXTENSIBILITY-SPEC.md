# Extensibility Specification — project-state-suite as Plugins, Skills, and Slash Commands

**Version:** 1.0  
**Status:** Draft  
**Audience:** Developers packaging or extending the suite; design partners evaluating integration depth

---

## Purpose

This document defines the canonical patterns for distributing the project-state-suite stack as three composable extension primitives:

| Primitive | What it is | Who installs it |
|-----------|-----------|-----------------|
| **Plugin** | A self-contained, versioned package of one or more skills + optional references + optional packs | End users, via a package manager or git |
| **Skill** | A single `SKILL.md`-defined behavior unit that Claude loads and invokes | Part of a plugin; can also be installed à-la-carte |
| **Slash command** | A `/name` trigger in CLAUDE.md that maps to a skill with optional args | Auto-registered on plugin install; editable by user |

The three primitives stack: a plugin contains skills; each skill gets a slash command on install. Packs extend the core plugin with compliance-specific profiles.

---

## 1. Taxonomy

### 1.1 Plugin types

| Type | Contains | Example |
|------|----------|---------|
| **Suite plugin** | All skills in a coherent suite + references + default CLAUDE.md block | `project-state-suite` |
| **Skill plugin** | A single skill, installable alone | `project-orchestrator` |
| **Pack plugin** | Profile YAMLs + templates that configure the suite for a specific funder/customer | `project-state-suite-pic-pcais` |
| **Reference plugin** | Read-only context documents (`references/`) used by one or more skills | `project-state-suite-references` |

### 1.2 Skill tiers (installation priority)

When a suite plugin is installed, skills are registered in tier order. Nothing in P1+ works without P0.

| Tier | Skills | Required |
|------|--------|----------|
| **P0** Foundation | `project-state`, `project-scaffolder` | Always |
| **P1** Core ops | `project-phase-gate`, `project-document-curator`, `project-milestone-manager`, `project-status-reporter` | Always |
| **P2** Surfaces | `project-orchestrator`, `project-notifier`, `project-review-meeting`, `project-funder-reporting`, `project-change-register`, `project-blog-publisher`, `project-website-publisher` | Default-on; individually opt-out |
| **P3** Polish | `project-onboarder`, `project-ip-tracker`, `project-external-comms`, `project-lessons`, `project-archive` | Default-on; individually opt-out |

---

## 2. Plugin anatomy

### 2.1 Suite plugin layout

```
project-state-suite/
├── plugin.yaml                        ← plugin manifest (required)
├── README.md                          ← human-readable entry point
├── CLAUDE.md.block                    ← CLAUDE.md fragment to inject on install
│
├── skills/                            ← all skill SKILL.md files
│   ├── project-state/
│   │   └── SKILL.md
│   ├── project-scaffolder/
│   │   └── SKILL.md
│   ├── project-orchestrator/
│   │   └── SKILL.md
│   └── ... (one sub-dir per skill)
│
├── references/                        ← read-only context docs used by skills
│   ├── SYSTEM-ARCHITECTURE.md
│   ├── SCHEMA.md
│   ├── CONCURRENCY.md
│   ├── REPORTING-MATRIX.md
│   ├── PACK-AUTHORING.md
│   └── SKILLS-REFERENCE.md
│
└── packs/                             ← optional bundled packs
    └── pic-pcais/
        ├── manifest.yaml
        ├── profiles/
        └── reporting-matrix-defaults.yaml
```

### 2.2 `plugin.yaml` schema

```yaml
plugin:
  id: "project-state-suite"           # unique slug; lowercase, dashes
  name: "project-state-suite"
  version: "2.0.1"                    # semver
  type: suite                         # suite | skill | pack | reference
  description: |
    Structured intelligence system for multi-stakeholder projects.
    19 skills + 5 compliance packs. Turns any project into a system
    where routine reporting is a byproduct of normal work.
  authors:
    - "Atomic 47 Labs <hello@atomic47.co>"
  license: "Proprietary"
  homepage: "https://project-state.atomic47.co"
  released: "2026-05-01"

compatibility:
  claude_code: ">=1.0"               # Claude Code version floor
  claude_api: "claude-sonnet-4-6"    # minimum model; suite requires tool use

skills:
  namespace: "project"               # slash command prefix: /project-*
  install_path: "~/.claude/skills"   # where SKILL.md dirs are placed
  tiers:
    P0: [project-state, project-scaffolder]
    P1: [project-phase-gate, project-document-curator, project-milestone-manager, project-status-reporter]
    P2: [project-orchestrator, project-notifier, project-review-meeting, project-funder-reporting,
         project-change-register, project-blog-publisher, project-website-publisher]
    P3: [project-onboarder, project-ip-tracker, project-external-comms, project-lessons, project-archive]
  install_tiers: [P0, P1, P2, P3]   # which tiers to install by default

references:
  install_path: "~/.claude/skills/project-state-suite/references"

packs:
  bundled: [pic-pcais]              # packs included in this plugin
  install_path: "~/.claude/skills/project-state-suite/packs"

claude_md:
  inject: true                      # inject CLAUDE.md.block on install
  section_heading: "# project-state skills"

depends_on:
  plugins: []                       # other plugins required before install
```

---

## 3. Skill packaging spec

### 3.1 SKILL.md format (canonical)

Every skill is a directory containing a single `SKILL.md`. The frontmatter `description` field is the primary dispatch signal for Claude — it must be ≤1024 characters, dense with trigger phrases, and actionable.

```
skills/<skill-slug>/
└── SKILL.md
```

**SKILL.md frontmatter schema:**

```yaml
---
name: <skill-slug>                  # matches directory name; no spaces
description: "<≤1024 char string>"  # trigger phrases + what the skill does
plugin: "project-state-suite"       # (optional) parent plugin id
version: "2.0.1"                    # (optional) semver; inherits from plugin if omitted
tier: P1                            # P0 | P1 | P2 | P3
depends_on:                         # skills that must be loaded first
  skills: [project-state]
surfaces:                           # which external surfaces this skill touches
  - slack
  - gmail-draft
  - calendar
  - scsiwyg
  - project-website
---
```

### 3.2 Skill dependency declaration

Skills declare upstream skill dependencies in frontmatter. The installer validates the DAG before writing CLAUDE.md trigger lines. P0 skills have no dependencies; all other skills depend on at least `project-state`.

```
project-state          (P0, no deps)
project-scaffolder     (P0, no deps)
    ↓
project-phase-gate     (P1, deps: project-state)
project-document-curator (P1, deps: project-state)
project-milestone-manager (P1, deps: project-state)
project-status-reporter (P1, deps: project-state, project-milestone-manager)
    ↓
project-orchestrator   (P2, deps: project-state, all P1)
project-notifier       (P2, deps: project-state)
project-review-meeting (P2, deps: project-state, project-notifier)
project-funder-reporting (P2, deps: project-state, project-notifier, pack profile required)
project-change-register (P2, deps: project-state, project-notifier)
project-blog-publisher (P2, deps: project-state, project-notifier)
project-website-publisher (P2, deps: project-state)
    ↓
project-onboarder      (P3, deps: project-state)
project-ip-tracker     (P3, deps: project-state, project-notifier, pack profile required)
project-external-comms (P3, deps: project-state, project-notifier, pack profile required)
project-lessons        (P3, deps: project-state)
project-archive        (P3, deps: project-state, project-notifier, pack profile required)
```

### 3.3 Pack-required skills

Six skills require a pack profile to operate fully. They degrade gracefully without one (surface the missing-profile warning rather than failing), but are only fully functional once a pack is active:

- `project-funder-reporting` — needs `funder-reporting.yaml` profile
- `project-review-meeting` — needs `review-meeting.yaml` profile
- `project-external-comms` — needs `external-comms.yaml` profile
- `project-ip-tracker` — needs `ip-tracker.yaml` profile
- `project-phase-gate` — reads `phase-gate.yaml` profile if present; uses generic presets otherwise
- `project-archive` — needs `archive.yaml` profile

---

## 4. Slash command registration

### 4.1 CLAUDE.md injection block

On install, the installer injects a single block into `~/.claude/CLAUDE.md`. The block is idempotent — reinstalling replaces the old block. The block is delimited by sentinel comments so it can be surgically updated or removed.

```markdown
<!-- project-state-suite:begin v2.0.1 -->
# project-state skills
When the user types any `/project-*` slash command, invoke the Skill tool with the matching skill name and pass any arguments as args.

- **project-state** — shared memory layer; read/write/validate all project state. Trigger: `/project-state`
- **project-scaffolder** — one-shot initializer for new `.project-state/`; seeds reporting matrix from packs. Trigger: `/project-scaffolder`
- **project-phase-gate** — lifecycle phase transitions with preset-driven gate enforcement. Trigger: `/project-phase-gate`
- **project-document-curator** — classify, index, and promote project documents. Trigger: `/project-document-curator`
- **project-milestone-manager** — CRUD milestones, percent_complete, technical_progress. Trigger: `/project-milestone-manager`
- **project-status-reporter** — generate status reports (weekly, SC pack, claim draft, dashboard). Trigger: `/project-status-reporter`
- **project-orchestrator** — calendar-aware conductor; reads reporting matrix, dispatches generators. Trigger: `/project-orchestrator`
- **project-notifier** — route artifacts to Slack/Gmail (drafts)/Calendar. Trigger: `/project-notifier`
- **project-review-meeting** — generic recurring review-meeting lifecycle (SC, board, QBR, retro). Trigger: `/project-review-meeting`
- **project-funder-reporting** — generic stakeholder-bound recurring reports (claims, invoices, board packs). Trigger: `/project-funder-reporting`
- **project-change-register** — material vs. non-material change classification and routing. Trigger: `/project-change-register`
- **project-blog-publisher** — scsiwyg bridge with publication-review respect. Trigger: `/project-blog-publisher`
- **project-website-publisher** — static project website with stable URLs for reference docs. Trigger: `/project-website-publisher`
- **project-onboarder** — personalized onboarding briefs for new teammates. Trigger: `/project-onboarder`
- **project-ip-tracker** — IP disclosures with configurable recipient via pack profile. Trigger: `/project-ip-tracker`
- **project-external-comms** — external-communication review pipeline. Trigger: `/project-external-comms`
- **project-lessons** — continuous lessons-learned capture + closeout summary. Trigger: `/project-lessons`
- **project-archive** — project closeout and archival. Trigger: `/project-archive`
<!-- project-state-suite:end -->
```

### 4.2 Slash command conventions

| Pattern | Meaning |
|---------|---------|
| `/project-<skill>` | Invoke the named skill with no args |
| `/project-<skill> <subcommand>` | Pass subcommand as args to the skill |
| `/project-<skill> --dry-run` | Skill previews actions without writing |
| `/project-<skill> --help` | Skill returns its own usage summary |

All argument passing is positional text appended after the trigger. The skill itself is responsible for parsing args.

### 4.3 Skill-level slash command metadata

Each skill's SKILL.md frontmatter may include a `slash_command` block:

```yaml
slash_command:
  trigger: "/project-orchestrator"
  subcommands:
    - name: "--dry-run"
      description: "Preview the action plan without executing"
    - name: "--only-step <n>"
      description: "Run only the nth decision-loop step"
  examples:
    - "/project-orchestrator"
    - "/project-orchestrator --dry-run"
    - "/project-status-reporter weekly"
    - "/project-milestone-manager update M03 percent_complete=75"
```

---

## 5. Pack as plugin pattern

A pack plugin extends the suite plugin. It ships profiles that configure the six pack-required skills, plus a `reporting-matrix-defaults.yaml` that seeds the matrix on scaffolding.

### 5.1 Pack plugin layout

```
project-state-suite-pic-pcais/
├── plugin.yaml                        ← pack plugin manifest
├── README.md
│
└── packs/
    └── pic-pcais/
        ├── manifest.yaml
        ├── profiles/
        │   ├── funder-reporting.yaml
        │   ├── review-meeting.yaml
        │   ├── external-comms.yaml
        │   ├── ip-tracker.yaml
        │   ├── archive.yaml
        │   └── phase-gate.yaml
        ├── templates/
        │   ├── claim-cover-email.md
        │   └── meeting-agenda.md
        └── reporting-matrix-defaults.yaml
```

### 5.2 Pack plugin manifest

```yaml
plugin:
  id: "project-state-suite-pic-pcais"
  name: "PIC/PCAIS Pack for project-state-suite"
  version: "1.0.0"
  type: pack
  description: |
    Configures project-state-suite for Protein Industries Canada (PIC)
    PCAIS-funded projects: quarterly claim deadlines, SC meeting cadence,
    IP disclosure to PIC Director, and 30/14-day publication review.

depends_on:
  plugins:
    - id: "project-state-suite"
      version: ">=2.0,<3.0"

pack:
  id: "pic-pcais"
  install_path: "~/.claude/skills/project-state-suite/packs"
```

### 5.3 Active pack resolution

When a skill that needs a pack profile runs, it resolves the active pack in this order:

1. `manifest.yaml:pack.active_pack` in the project's `.project-state/`
2. Plugin default pack declared in `plugin.yaml`
3. No pack — skill runs in generic mode with degraded functionality

---

## 6. Installation mechanisms

### 6.1 Manual (current baseline)

```bash
# Clone the repo
git clone https://github.com/atomic47/project-state-suite ~/.claude/skills/project-state-suite-repo

# Symlink or copy skills into install path
cp -r ~/.claude/skills/project-state-suite-repo/skills/* ~/.claude/skills/

# Inject CLAUDE.md block
cat ~/.claude/skills/project-state-suite-repo/CLAUDE.md.block >> ~/.claude/CLAUDE.md
```

### 6.2 Claude Code plugin install (target mechanism)

The target is a first-class `/install` command within Claude Code that reads `plugin.yaml` and handles placement + CLAUDE.md injection automatically:

```
/install project-state-suite
/install project-state-suite-pic-pcais
```

Implementation requires:
- Claude Code to expose a plugin registry or accept a local path / git URL
- The installer script to parse `plugin.yaml`, resolve deps, copy skills, and inject the CLAUDE.md block between sentinels
- An `/uninstall` that removes the block and skill dirs

### 6.3 Git-based install (interim)

Until the Claude Code plugin system matures, the recommended installation path is a shell script shipped with the plugin:

```bash
# install.sh
SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
CLAUDE_MD="${CLAUDE_MD:-$HOME/.claude/CLAUDE.md}"
PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Copy skills
mkdir -p "$SKILLS_DIR"
for skill_dir in "$PLUGIN_DIR/skills"/*/; do
  cp -r "$skill_dir" "$SKILLS_DIR/"
done

# 2. Copy references
cp -r "$PLUGIN_DIR/references" "$SKILLS_DIR/project-state-suite/"

# 3. Inject CLAUDE.md block (idempotent via sentinel)
SENTINEL_BEGIN="<!-- project-state-suite:begin"
if grep -q "$SENTINEL_BEGIN" "$CLAUDE_MD" 2>/dev/null; then
  # Replace existing block
  sed -i.bak "/<!-- project-state-suite:begin/,/<!-- project-state-suite:end -->/d" "$CLAUDE_MD"
fi
cat "$PLUGIN_DIR/CLAUDE.md.block" >> "$CLAUDE_MD"

echo "project-state-suite installed. Skills: $SKILLS_DIR. CLAUDE.md updated."
```

---

## 7. Suite-level namespace conventions

### 7.1 Skill namespacing in Claude's skill list

When Claude lists available skills, namespaced skills appear as:

```
project-state-suite:project-orchestrator
project-state-suite:project-state
project-state-suite:project-scaffolder
```

The namespace is the plugin `id`. Slash commands use only the short form (`/project-orchestrator`) for ergonomics, but the `Skill` tool invocation uses the full namespace where disambiguation is needed.

### 7.2 Skill tool invocation pattern

In CLAUDE.md, the dispatch line is:

```
When the user types any `/project-*` slash command, invoke the Skill tool
with the matching skill name and pass any arguments as args.
```

For namespaced invocation (when two plugins share a prefix), use:

```
invoke the Skill tool with skill: "project-state-suite:<skill-name>"
```

### 7.3 Conflict resolution

If two installed plugins register the same slash command prefix:

1. The last-installed plugin wins (CLAUDE.md injection appends; later sections are checked first by Claude)
2. The user may disambiguate by using the full namespaced form: `/project-state-suite:project-orchestrator`
3. The `plugin.yaml` `conflicts_with` field declares known conflicts and the installer warns

---

## 8. Versioning and compatibility

### 8.1 Versioning rules

- Suite plugin uses semver: `MAJOR.MINOR.PATCH`
- **MAJOR** — breaking change to any SKILL.md behavior, state schema, or slash command signature
- **MINOR** — new skill added, new optional frontmatter field, new subcommand
- **PATCH** — wording fix, description update, non-behavioral change

Pack plugins version independently from the suite.

### 8.2 Compatibility matrix

| Suite | Compatible pack versions |
|-------|--------------------------|
| 2.x | pack `>=1.0,<2.0` |
| 3.x | pack `>=2.0,<3.0` |

The pack's `plugin.yaml` declares its `depends_on.plugins` version constraint. The installer enforces this.

### 8.3 SKILL.md backwards compatibility

The `description` field is the primary dispatch contract. Changing it is a breaking change if it removes trigger phrases that users depend on. When evolving descriptions:
- Append new trigger phrases; do not remove existing ones in MINOR versions
- Removals require a MAJOR bump and a migration note

---

## 9. Reference plugin pattern

Some skills read context documents (architecture guides, schema references) that are not SKILL.md files. These live in a `references/` directory alongside `skills/`:

```
~/.claude/skills/project-state-suite/
├── references/
│   ├── SYSTEM-ARCHITECTURE.md
│   ├── SCHEMA.md
│   └── ...
└── project-state/
    └── SKILL.md       ← references these docs via relative path
```

Skills reference these documents in their instructions:

```markdown
## Context documents

Before operating, read the schema from:
`~/.claude/skills/project-state-suite/references/SCHEMA.md`
```

The installer places references at the declared `references.install_path` in `plugin.yaml`.

---

## 10. Open questions

These items are unresolved and block specific implementation phases:

| # | Question | Blocks |
|---|----------|--------|
| 1 | Does Claude Code expose a first-class plugin registry API, or is manual CLAUDE.md injection the permanent mechanism? | §6.2 |
| 2 | How does Claude resolve skill conflicts when two installed suites share a prefix? Is namespace scoping enforced by the harness or by convention? | §7.3 |
| 3 | Should packs be bundled inside the suite plugin (current: `packs/` subdir) or always distributed as separate pack plugins? | §5 |
| 4 | Can SKILL.md frontmatter `depends_on` be enforced at runtime (Claude refuses to invoke a skill whose deps are unmet), or is it advisory only? | §3.2 |
| 5 | What is the canonical home for `references/` — inside each skill dir, or at the plugin root? | §9 |

---

## Appendix A — Full skill list with slash commands

| Tier | Skill | Slash command | Pack required |
|------|-------|---------------|---------------|
| P0 | `project-state` | `/project-state` | No |
| P0 | `project-scaffolder` | `/project-scaffolder` | No |
| P1 | `project-phase-gate` | `/project-phase-gate` | Optional |
| P1 | `project-document-curator` | `/project-document-curator` | No |
| P1 | `project-milestone-manager` | `/project-milestone-manager` | No |
| P1 | `project-status-reporter` | `/project-status-reporter` | No |
| P2 | `project-orchestrator` | `/project-orchestrator` | No |
| P2 | `project-notifier` | `/project-notifier` | No |
| P2 | `project-review-meeting` | `/project-review-meeting` | Yes |
| P2 | `project-funder-reporting` | `/project-funder-reporting` | Yes |
| P2 | `project-change-register` | `/project-change-register` | No |
| P2 | `project-blog-publisher` | `/project-blog-publisher` | No |
| P2 | `project-website-publisher` | `/project-website-publisher` | No |
| P3 | `project-onboarder` | `/project-onboarder` | No |
| P3 | `project-ip-tracker` | `/project-ip-tracker` | Yes |
| P3 | `project-external-comms` | `/project-external-comms` | Yes |
| P3 | `project-lessons` | `/project-lessons` | No |
| P3 | `project-archive` | `/project-archive` | Yes |

---

## Appendix B — Minimal plugin.yaml for a single-skill plugin

```yaml
plugin:
  id: "project-orchestrator"
  name: "project-orchestrator (standalone)"
  version: "2.0.1"
  type: skill

depends_on:
  plugins:
    - id: "project-state-suite"
      version: ">=2.0,<3.0"
      install_tiers: [P0, P1]     # only P0+P1 are needed for orchestrator

skills:
  namespace: "project"
  install_path: "~/.claude/skills"
  list: [project-orchestrator]

claude_md:
  inject: true
  section_heading: "# project-state skills"
  lines:
    - "- **project-orchestrator** — calendar-aware conductor; reads reporting matrix, dispatches generators. Trigger: `/project-orchestrator`"
```
