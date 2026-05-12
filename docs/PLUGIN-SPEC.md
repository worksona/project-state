# Plugin Layer — Technical Specification

**Version:** 1.0
**Status:** Authoritative
**Companion document:** `docs/EXTENSIBILITY-SPEC.md` (read that first for taxonomy and overview)
**Audience:** Developers packaging project-state-suite skills for distribution; integrators extending the suite with custom skills or compliance packs

---

## Purpose

This document is the authoritative, complete specification for the **Plugin** primitive in the project-state-suite extensibility system. It covers the manifest schema, directory layouts, CLAUDE.md injection mechanics, install and uninstall procedures, versioning semantics, conflict detection, testing checklist, and a placeholder for future registry support.

All normative language in this document applies to plugin authors. Implementers of a plugin manager or registry must treat this document as the ground truth for what a valid plugin looks like and how it behaves.

---

## 1. What Is a Plugin

A **plugin** is a self-contained, versioned, installable package of one or more Claude Code skills, optional reference documents, and optional compliance pack profiles. It is the unit of distribution for the project-state-suite extensibility system — individual `SKILL.md` files are not distributed or installed independently.

A plugin satisfies three guarantees:

1. **Self-description.** A `plugin.yaml` manifest at the plugin root declares everything the installer needs: identity, skill list, install paths, CLAUDE.md injection instructions, dependency constraints, and conflict declarations.
2. **Idempotency.** Installing a plugin twice produces the same result as installing it once. Reinstallation replaces the prior installation without leaving orphaned files or duplicate CLAUDE.md blocks.
3. **Composability.** A plugin declares its dependencies on other plugins and its conflicts with known incompatible plugins. The installer can resolve and validate the full dependency graph before writing anything to disk.

### 1.1 Plugin types

| Type | Contains | When to use |
|------|----------|-------------|
| `suite` | All skills in a coherent suite + references + optional bundled packs + CLAUDE.md block | Distributing the full project-state-suite as a single installable unit |
| `skill` | A single skill directory (`skills/<slug>/SKILL.md`) + minimal CLAUDE.md injection | Distributing one skill independently, outside a suite context |
| `pack` | Compliance profile YAMLs + templates + `reporting-matrix-defaults.yaml` | Adding funder- or customer-specific configuration to an already-installed suite |
| `reference` | One or more read-only markdown context documents consumed by skills | Distributing shared documentation that multiple skills read at runtime |

These types are mutually exclusive per plugin. A single plugin does not mix types. A suite plugin may bundle packs in its `packs/` directory, but that is distinct from the standalone `pack` plugin type.

The plugin is the unit of distribution. Authors do not publish individual `SKILL.md` files to a registry or share them as ad-hoc files. Authors publish versioned plugins.

---

## 2. plugin.yaml — The Manifest

Every plugin has exactly one `plugin.yaml` at its root. This file is the sole source of truth for the installer. No information required for installation is assumed from directory structure alone.

### 2.1 Full annotated schema

```yaml
# ── Identity ────────────────────────────────────────────────────────────────
plugin:
  id: "project-state-suite"
  # Required. Unique identifier. Must be lowercase letters, digits, and hyphens
  # only. No underscores, dots, or uppercase. Globally unique within a registry
  # or install context. Example valid values: "project-state-suite",
  # "my-org-custom-reporter", "pic-pcais-pack".

  name: "project-state-suite"
  # Required. Human-readable display name. May include spaces, capitalization,
  # and punctuation. Used in log output and future registry UIs.

  version: "2.0.1"
  # Required. Semver string: MAJOR.MINOR.PATCH. Pre-release suffix allowed:
  # "2.1.0-beta.1". Must be a valid semver string; the installer rejects
  # non-conforming values.

  type: suite
  # Required. One of: suite | skill | pack | reference. Controls which
  # top-level directories the installer processes.

  description: |
    Structured intelligence system for multi-stakeholder projects.
    19 skills + 5 compliance packs. Turns any project into a system
    where routine reporting is a byproduct of normal work.
  # Required. Plain text, no markdown formatting. Maximum 512 characters
  # (including newlines). Truncated in registry listings at 160 chars.

  authors:
    - "Atomic 47 Labs <hello@atomic47.co>"
  # Required. Array of strings. Each entry is "Name <email>" or plain name.
  # At least one entry required.

  license: "Proprietary"
  # Required. SPDX identifier or "Proprietary". Used in registry metadata.
  # Examples: "MIT", "Apache-2.0", "Proprietary".

  homepage: "https://project-state.atomic47.co"
  # Optional. URL to documentation or marketing page.

  released: "2026-05-01"
  # Optional. ISO 8601 date of this version's release. Used in registry
  # changelogs. Not enforced by the installer.

# ── Compatibility ────────────────────────────────────────────────────────────
compatibility:
  claude_code: ">=1.0"
  # Required. Semver range for the minimum Claude Code harness version.
  # The installer reads the Claude Code version and warns if the constraint
  # is not met. Does not block installation (advisory warning only, because
  # Claude Code does not always expose its version programmatically).

  claude_api: "claude-sonnet-4-6"
  # Required. Minimum Claude model ID required to run the skills in this
  # plugin. Skills that use tool use or extended thinking require at least
  # a Sonnet-class model. The installer warns if this model is not available
  # in the current session context.

# ── Skills block (suite and skill plugin types only) ─────────────────────────
skills:
  namespace: "project"
  # Required for suite and skill types. The slash command prefix. All skills
  # in this plugin are invoked as /<namespace>-<skill-slug>. Must be a single
  # lowercase word (no hyphens, no underscores). Example: "project" produces
  # triggers like /project-state, /project-orchestrator.

  install_path: "~/.claude/skills"
  # Required for suite and skill types. Absolute or home-relative path where
  # skill directories are placed. Each skill dir is copied as a direct child:
  # <install_path>/<skill-slug>/SKILL.md. Tilde expansion is performed by the
  # installer.

  tiers:
    P0: [project-state, project-scaffolder]
    P1: [project-phase-gate, project-document-curator, project-milestone-manager, project-status-reporter]
    P2: [project-orchestrator, project-notifier, project-review-meeting, project-funder-reporting,
         project-change-register, project-blog-publisher, project-website-publisher]
    P3: [project-onboarder, project-ip-tracker, project-external-comms, project-lessons, project-archive]
  # Required for suite type; omit for skill type. Maps tier labels to ordered
  # lists of skill slugs. Tier labels are P0, P1, P2, P3. P0 skills have no
  # inter-skill dependencies and must be installed before any higher tier.
  # Order within a tier is not significant.

  install_tiers: [P0, P1, P2, P3]
  # Required for suite type; omit for skill type. Specifies which tiers to
  # install by default. Users may override at install time by passing
  # --tiers=P0,P1 to install.sh. P0 is always installed regardless of this
  # setting; omitting P0 from this list is silently corrected.

# ── References block (suite and reference plugin types) ──────────────────────
references:
  install_path: "~/.claude/skills/project-state-suite/references"
  # Required when the plugin ships reference documents. The references/
  # directory from the plugin root is copied verbatim to this path.
  # Skills reference these documents by absolute path in their SKILL.md
  # instructions.

# ── Packs block (suite and pack plugin types) ────────────────────────────────
packs:
  bundled: [pic-pcais]
  # Optional (suite type only). List of pack IDs included in the plugin's
  # packs/ directory. The installer copies these packs to install_path.
  # Pack IDs correspond to subdirectory names under packs/.

  install_path: "~/.claude/skills/project-state-suite/packs"
  # Required when bundled packs are declared. Target path for pack directories.

# ── CLAUDE.md injection block ────────────────────────────────────────────────
claude_md:
  inject: true
  # Required. When true, the installer injects the plugin's CLAUDE.md.block
  # into ~/.claude/CLAUDE.md using sentinel comments. When false, the
  # installer skips CLAUDE.md modification entirely (useful for pack and
  # reference plugin types that add no new slash commands).

  section_heading: "# project-state skills"
  # Required when inject: true. The markdown heading that appears as the
  # first line inside the sentinel block. Must be a valid markdown heading.

  lines:
  # Optional. When present, overrides the content of CLAUDE.md.block entirely.
  # Each entry is one markdown list item line. Used by skill plugin type to
  # inject a single trigger line without shipping a CLAUDE.md.block file.
  # When absent, the installer reads CLAUDE.md.block from the plugin root.
  #
  # Example (skill plugin type):
  #   - "- **project-orchestrator** — calendar-aware conductor. Trigger: `/project-orchestrator`"

# ── Dependencies ─────────────────────────────────────────────────────────────
depends_on:
  plugins:
    - id: "project-state-suite"
      version: ">=2.0,<3.0"
    # Array of plugin dependency objects. Each entry has:
    #   id: plugin id (string, required)
    #   version: semver range string (required). Uses comma-separated
    #            constraints: ">=2.0,<3.0". Spaces around commas are allowed.
    # The installer checks that each declared dependency is installed and
    # satisfies the version constraint. Unmet dependencies produce a warning
    # but do not block installation (see §5 for rationale).

# ── Conflict declarations ─────────────────────────────────────────────────────
conflicts_with:
  plugins:
    - id: "legacy-project-skills"
    # Array of plugin id strings that are known to be incompatible with this
    # plugin. The installer checks for installed conflicting plugins and warns
    # before proceeding. Does not block installation.
```

### 2.2 Field reference table

| Field | Type | Required | Default | Constraint |
|-------|------|----------|---------|------------|
| `plugin.id` | string | Yes | — | Lowercase letters, digits, hyphens only; no underscores or dots |
| `plugin.name` | string | Yes | — | Any printable string |
| `plugin.version` | string | Yes | — | Valid semver: `MAJOR.MINOR.PATCH[-pre]` |
| `plugin.type` | enum | Yes | — | `suite`, `skill`, `pack`, `reference` |
| `plugin.description` | string | Yes | — | Max 512 characters |
| `plugin.authors` | array | Yes | — | At least one entry |
| `plugin.license` | string | Yes | — | SPDX identifier or `Proprietary` |
| `plugin.homepage` | string | No | — | Valid URL |
| `plugin.released` | string | No | — | ISO 8601 date |
| `compatibility.claude_code` | string | Yes | — | Semver range |
| `compatibility.claude_api` | string | Yes | — | Claude model ID string |
| `skills.namespace` | string | Conditional | — | Required for `suite` and `skill` types; single lowercase word |
| `skills.install_path` | string | Conditional | `~/.claude/skills` | Required for `suite` and `skill` types |
| `skills.tiers` | map | Conditional | — | Required for `suite` type only |
| `skills.install_tiers` | array | Conditional | — | Required for `suite` type only; P0 always implied |
| `references.install_path` | string | Conditional | — | Required when plugin ships references |
| `packs.bundled` | array | No | `[]` | Suite type only |
| `packs.install_path` | string | Conditional | — | Required when `packs.bundled` is non-empty |
| `claude_md.inject` | bool | Yes | — | — |
| `claude_md.section_heading` | string | Conditional | — | Required when `inject: true` |
| `claude_md.lines` | array | No | — | Overrides CLAUDE.md.block file |
| `depends_on.plugins` | array | No | `[]` | Each entry: `{id, version}` |
| `conflicts_with.plugins` | array | No | `[]` | Array of id strings |

### 2.3 Validation rules

The installer validates `plugin.yaml` before executing any file operations. A plugin that fails validation is rejected with a diagnostic message.

| Rule | Error condition |
|------|----------------|
| `plugin.id` format | Contains uppercase, underscores, dots, or spaces |
| `plugin.version` format | Not a valid semver string |
| `plugin.description` length | Exceeds 512 characters |
| `plugin.type` value | Not one of `suite`, `skill`, `pack`, `reference` |
| `skills.namespace` format | Contains hyphens, underscores, digits, or uppercase |
| `depends_on.plugins[*].version` | Not a valid semver range (comma-separated constraints) |
| `claude_md.inject: true` without `section_heading` | Missing required heading |
| `packs.bundled` non-empty without `packs.install_path` | Missing install path |
| Skill slug in `tiers` not present as `skills/<slug>/` subdirectory | Declared skill not found in plugin |

---

## 3. Directory Layouts

### 3.1 Suite plugin layout

```
project-state-suite/
├── plugin.yaml                          # plugin manifest (required)
├── README.md                            # human entry point; not installed
├── CLAUDE.md.block                      # CLAUDE.md fragment injected on install
├── install.sh                           # installer script (see §5)
├── uninstall.sh                         # uninstaller script (see §6)
│
├── skills/                              # one subdirectory per skill
│   ├── project-state/
│   │   └── SKILL.md                     # P0 memory layer
│   ├── project-scaffolder/
│   │   └── SKILL.md                     # P0 initializer
│   ├── project-phase-gate/
│   │   └── SKILL.md                     # P1
│   ├── project-document-curator/
│   │   └── SKILL.md                     # P1
│   ├── project-milestone-manager/
│   │   └── SKILL.md                     # P1
│   ├── project-status-reporter/
│   │   └── SKILL.md                     # P1
│   ├── project-orchestrator/
│   │   └── SKILL.md                     # P2
│   ├── project-notifier/
│   │   └── SKILL.md                     # P2
│   ├── project-review-meeting/
│   │   └── SKILL.md                     # P2
│   ├── project-funder-reporting/
│   │   └── SKILL.md                     # P2
│   ├── project-change-register/
│   │   └── SKILL.md                     # P2
│   ├── project-blog-publisher/
│   │   └── SKILL.md                     # P2
│   ├── project-website-publisher/
│   │   └── SKILL.md                     # P2
│   ├── project-onboarder/
│   │   └── SKILL.md                     # P3
│   ├── project-ip-tracker/
│   │   └── SKILL.md                     # P3
│   ├── project-external-comms/
│   │   └── SKILL.md                     # P3
│   ├── project-lessons/
│   │   └── SKILL.md                     # P3
│   └── project-archive/
│       └── SKILL.md                     # P3
│
├── references/                          # read-only context documents
│   ├── SYSTEM-ARCHITECTURE.md
│   ├── SCHEMA.md
│   ├── CONCURRENCY.md
│   ├── REPORTING-MATRIX.md
│   ├── PACK-AUTHORING.md
│   └── SKILLS-REFERENCE.md
│
└── packs/                               # bundled compliance packs
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

Notes:
- `plugin.yaml`, `CLAUDE.md.block`, and `install.sh` must be at the root.
- `README.md` and `uninstall.sh` are strongly recommended but not required.
- Each entry under `skills/` is a directory named exactly as the skill slug declared in `skills.tiers`. The installer rejects mismatches.
- A skill directory contains exactly one file: `SKILL.md`. Additional files in a skill directory are ignored by the installer.
- The `references/` directory is installed verbatim to `references.install_path`. Skills reference these documents by absolute path.
- The `packs/` directory is only present for suite plugins that bundle packs. Standalone pack plugins use the layout in §3.3.

### 3.2 Skill plugin layout

A skill plugin is the minimal installable unit: one skill distributed independently of the suite.

```
project-orchestrator/
├── plugin.yaml                          # plugin manifest (required)
├── CLAUDE.md.block                      # single trigger line (or use claude_md.lines)
├── install.sh
└── skills/
    └── project-orchestrator/
        └── SKILL.md
```

Notes:
- `skills.tiers` is omitted. The installer reads a `skills.list` key instead (declared inline in `plugin.yaml`; see Appendix B of `EXTENSIBILITY-SPEC.md` for example).
- `references/` and `packs/` are absent.
- `CLAUDE.md.block` typically contains a single trigger line, or `claude_md.lines` overrides it inline in `plugin.yaml`.
- A skill plugin must declare `depends_on.plugins` for every other skill it requires. The installer validates this at install time.

### 3.3 Pack plugin layout

A pack plugin ships compliance profiles that configure pack-required skills. It does not contain `SKILL.md` files and does not inject slash commands.

```
project-state-suite-pic-pcais/
├── plugin.yaml                          # plugin manifest (required)
├── README.md
├── install.sh
└── packs/
    └── pic-pcais/
        ├── manifest.yaml                # pack identity and metadata
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

Notes:
- `claude_md.inject` is `false` for pack plugins. No slash commands are added.
- `skills/` and `references/` are absent.
- The `packs/<id>/` directory structure must match the convention expected by pack-required skills. See `docs/PACK-AUTHORING.md` for the pack manifest and profile schemas.
- `depends_on.plugins` must declare the suite plugin and version range this pack targets.

### 3.4 Reference plugin layout

A reference plugin distributes read-only documentation consumed by skills at runtime. It adds no slash commands and installs no `SKILL.md` files.

```
project-state-suite-references/
├── plugin.yaml                          # plugin manifest (required)
├── install.sh
└── references/
    ├── SYSTEM-ARCHITECTURE.md
    ├── SCHEMA.md
    ├── CONCURRENCY.md
    └── SKILLS-REFERENCE.md
```

Notes:
- `claude_md.inject` is `false`.
- `skills/` and `packs/` are absent.
- `references.install_path` in `plugin.yaml` determines where the `references/` directory is copied.
- Reference plugins are typically a dependency of a suite plugin, not installed independently by users.

---

## 4. CLAUDE.md.block Format

### 4.1 Sentinel comment system

The installer wraps injected content in a pair of sentinel HTML comments. The opening sentinel encodes the plugin id and the installed version. The closing sentinel uses only the plugin id.

```
<!-- project-state-suite:begin v2.0.1 -->
<block content>
<!-- project-state-suite:end -->
```

Rules:
- The opening sentinel is exactly: `<!-- <plugin-id>:begin v<version> -->`
- The closing sentinel is exactly: `<!-- <plugin-id>:end -->`
- No whitespace variants are permitted. The installer matches these strings literally.
- The sentinels and all content between them constitute the **block**. The block is the atomic unit of injection, replacement, and removal.
- Sentinels must appear on lines by themselves with no leading or trailing characters on the same line.
- Multiple plugins each produce their own sentinel pair. Nesting (one plugin's block inside another's) is not allowed and is treated as a corrupt state.

### 4.2 Block content

The block contains, in order:

1. The `claude_md.section_heading` value on its own line.
2. A blank line.
3. A preamble dispatch line that tells Claude how to handle the slash command namespace.
4. A blank line.
5. One bullet list item per installed skill, in tier order (P0 first, P3 last).

The preamble dispatch line pattern for a suite plugin with namespace `project`:

```
When the user types any `/project-*` slash command, invoke the Skill tool with the matching skill name and pass any arguments as args.
```

Each skill bullet follows this exact format:

```
- **<skill-slug>** — <one-line description from SKILL.md>. Trigger: `/<trigger>`
```

Full example block for the suite plugin at version 2.0.1:

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

### 4.3 Idempotency

When the installer runs and a block for the same plugin id already exists in `CLAUDE.md`, the installer replaces the existing block in place. The replacement algorithm:

1. Find the line matching `<!-- <plugin-id>:begin`.
2. Find the next line matching `<!-- <plugin-id>:end -->`.
3. Delete all lines from the begin sentinel to the end sentinel, inclusive.
4. Insert the new block at the same position in the file.

The position of the block within `CLAUDE.md` is preserved on reinstall. If the begin sentinel is not found, the new block is appended to the end of `CLAUDE.md`.

The version string in the opening sentinel is updated to the new version on each install. The closing sentinel is version-agnostic and does not change.

### 4.4 Conflict resolution for overlapping slash commands

When two installed plugins register the same slash command prefix (e.g., two plugins both use `/project-*`):

1. Claude reads `CLAUDE.md` top to bottom. The last matching instruction in the file takes precedence for that prefix.
2. "Last injected" means the plugin whose block appears later in `CLAUDE.md`. The installer appends new blocks unless an existing block is being replaced in place.
3. A user experiencing a conflict may force disambiguation by using the full namespaced invocation form: `plugin-id:skill-name` as the `skill` argument to the Skill tool. This form bypasses CLAUDE.md routing entirely.
4. The `conflicts_with` field in `plugin.yaml` is the mechanism for declaring known conflicts. The installer surfaces a warning when a conflicting plugin is detected so the user can decide before proceeding.

---

## 5. install.sh Reference Implementation

The following is the reference implementation of `install.sh`. It is POSIX sh — no bash-isms (`[[`, arrays, `local` with assignment, etc.). Authors must use this script or a compatible implementation.

```sh
#!/bin/sh
# install.sh — POSIX sh installer for a project-state-suite plugin
# Usage: sh install.sh [--tiers P0,P1] [--dry-run]
#
# Environment variables (all optional; defaults shown):
#   CLAUDE_SKILLS_DIR   install path for skill dirs   (default: ~/.claude/skills)
#   CLAUDE_MD           path to CLAUDE.md              (default: ~/.claude/CLAUDE.md)
#   PLUGIN_DIR          plugin root dir                (default: dir of this script)

set -e

# ── Configuration ────────────────────────────────────────────────────────────

SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
CLAUDE_MD="${CLAUDE_MD:-$HOME/.claude/CLAUDE.md}"
PLUGIN_DIR="${PLUGIN_DIR:-$(cd "$(dirname "$0")" && pwd)}"
DRY_RUN=0
INSTALL_TIERS=""

# ── Argument parsing ─────────────────────────────────────────────────────────

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --tiers=*)
      INSTALL_TIERS="${arg#--tiers=}"
      ;;
    *)
      printf 'Unknown argument: %s\n' "$arg" >&2
      exit 1
      ;;
  esac
done

# ── YAML parsing (minimal; requires yq or python3) ───────────────────────────
# The installer requires one of: yq (https://github.com/mikefarah/yq) or
# python3 with PyYAML. It probes for yq first.

PLUGIN_YAML="$PLUGIN_DIR/plugin.yaml"

if ! [ -f "$PLUGIN_YAML" ]; then
  printf 'ERROR: plugin.yaml not found at %s\n' "$PLUGIN_YAML" >&2
  exit 1
fi

if command -v yq >/dev/null 2>&1; then
  PLUGIN_ID="$(yq e '.plugin.id' "$PLUGIN_YAML")"
  PLUGIN_VERSION="$(yq e '.plugin.version' "$PLUGIN_YAML")"
  PLUGIN_TYPE="$(yq e '.plugin.type' "$PLUGIN_YAML")"
  SKILL_INSTALL_PATH="$(yq e '.skills.install_path // "~/.claude/skills"' "$PLUGIN_YAML")"
  REF_INSTALL_PATH="$(yq e '.references.install_path // ""' "$PLUGIN_YAML")"
  PACKS_INSTALL_PATH="$(yq e '.packs.install_path // ""' "$PLUGIN_YAML")"
  INJECT_CLAUDE_MD="$(yq e '.claude_md.inject' "$PLUGIN_YAML")"
  DEFAULT_TIERS="$(yq e '.skills.install_tiers | join(",")' "$PLUGIN_YAML" 2>/dev/null || printf '')"
elif command -v python3 >/dev/null 2>&1; then
  _yaml_get() {
    python3 -c "
import sys, yaml
doc = yaml.safe_load(open('$PLUGIN_YAML'))
keys = '$1'.split('.')
val = doc
for k in keys:
  val = val.get(k, '') if isinstance(val, dict) else ''
print(val if val is not None else '')
"
  }
  PLUGIN_ID="$(_yaml_get plugin.id)"
  PLUGIN_VERSION="$(_yaml_get plugin.version)"
  PLUGIN_TYPE="$(_yaml_get plugin.type)"
  SKILL_INSTALL_PATH="$(_yaml_get skills.install_path)"
  REF_INSTALL_PATH="$(_yaml_get references.install_path)"
  PACKS_INSTALL_PATH="$(_yaml_get packs.install_path)"
  INJECT_CLAUDE_MD="$(_yaml_get claude_md.inject)"
  DEFAULT_TIERS=""
else
  printf 'ERROR: install.sh requires yq or python3 with PyYAML.\n' >&2
  exit 1
fi

# Expand tilde in paths
SKILL_INSTALL_PATH="$(printf '%s' "$SKILL_INSTALL_PATH" | sed "s|^~|$HOME|")"
REF_INSTALL_PATH="$(printf '%s' "$REF_INSTALL_PATH" | sed "s|^~|$HOME|")"
PACKS_INSTALL_PATH="$(printf '%s' "$PACKS_INSTALL_PATH" | sed "s|^~|$HOME|")"

# Determine which tiers to install
TIERS="${INSTALL_TIERS:-$DEFAULT_TIERS}"

# ── Validation ───────────────────────────────────────────────────────────────

printf '==> Installing plugin: %s v%s (type: %s)\n' \
  "$PLUGIN_ID" "$PLUGIN_VERSION" "$PLUGIN_TYPE"

if [ "$DRY_RUN" = "1" ]; then
  printf '    (dry-run mode: no files will be written)\n'
fi

# ── Step 1: Check depends_on ─────────────────────────────────────────────────
# Advisory check: warn if declared dependencies are not installed.
# The installer does NOT block on unmet dependencies.

if command -v yq >/dev/null 2>&1; then
  DEP_COUNT="$(yq e '.depends_on.plugins | length' "$PLUGIN_YAML" 2>/dev/null || printf '0')"
  i=0
  while [ "$i" -lt "$DEP_COUNT" ]; do
    DEP_ID="$(yq e ".depends_on.plugins[$i].id" "$PLUGIN_YAML")"
    DEP_VER="$(yq e ".depends_on.plugins[$i].version" "$PLUGIN_YAML")"
    # Check for installed plugin sentinel in CLAUDE.md
    if [ -f "$CLAUDE_MD" ] && ! grep -q "<!-- $DEP_ID:begin" "$CLAUDE_MD" 2>/dev/null; then
      printf 'WARN: dependency not found: %s (%s)\n' "$DEP_ID" "$DEP_VER"
    fi
    i=$((i + 1))
  done
fi

# ── Step 2: Check conflicts_with ─────────────────────────────────────────────

if command -v yq >/dev/null 2>&1 && [ -f "$CLAUDE_MD" ]; then
  CONFLICT_COUNT="$(yq e '.conflicts_with.plugins | length' "$PLUGIN_YAML" 2>/dev/null || printf '0')"
  i=0
  while [ "$i" -lt "$CONFLICT_COUNT" ]; do
    CONF_ID="$(yq e ".conflicts_with.plugins[$i]" "$PLUGIN_YAML")"
    if grep -q "<!-- $CONF_ID:begin" "$CLAUDE_MD" 2>/dev/null; then
      printf 'WARN: conflicting plugin installed: %s\n' "$CONF_ID"
    fi
    i=$((i + 1))
  done
fi

# ── Step 3: Copy skill directories ───────────────────────────────────────────

INSTALLED_SKILLS=""

if [ "$PLUGIN_TYPE" = "suite" ] || [ "$PLUGIN_TYPE" = "skill" ]; then
  SKILLS_SOURCE="$PLUGIN_DIR/skills"
  if [ -d "$SKILLS_SOURCE" ]; then
    if [ "$DRY_RUN" = "0" ]; then
      mkdir -p "$SKILL_INSTALL_PATH"
    fi
    for skill_dir in "$SKILLS_SOURCE"/*/; do
      skill_slug="$(basename "$skill_dir")"
      dest="$SKILL_INSTALL_PATH/$skill_slug"
      printf '    skill: %s -> %s\n' "$skill_slug" "$dest"
      if [ "$DRY_RUN" = "0" ]; then
        cp -r "$skill_dir" "$SKILL_INSTALL_PATH/"
      fi
      INSTALLED_SKILLS="$INSTALLED_SKILLS $skill_slug"
    done
  fi
fi

# ── Step 4: Copy references directory ────────────────────────────────────────

if [ -n "$REF_INSTALL_PATH" ] && [ -d "$PLUGIN_DIR/references" ]; then
  printf '    references -> %s\n' "$REF_INSTALL_PATH"
  if [ "$DRY_RUN" = "0" ]; then
    mkdir -p "$REF_INSTALL_PATH"
    cp -r "$PLUGIN_DIR/references/." "$REF_INSTALL_PATH/"
  fi
fi

# ── Step 5: Copy packs directory ─────────────────────────────────────────────

if [ -n "$PACKS_INSTALL_PATH" ] && [ -d "$PLUGIN_DIR/packs" ]; then
  printf '    packs -> %s\n' "$PACKS_INSTALL_PATH"
  if [ "$DRY_RUN" = "0" ]; then
    mkdir -p "$PACKS_INSTALL_PATH"
    cp -r "$PLUGIN_DIR/packs/." "$PACKS_INSTALL_PATH/"
  fi
fi

# ── Step 6: Inject CLAUDE.md block ───────────────────────────────────────────

if [ "$INJECT_CLAUDE_MD" = "true" ]; then
  BLOCK_FILE="$PLUGIN_DIR/CLAUDE.md.block"

  if [ ! -f "$BLOCK_FILE" ]; then
    printf 'WARN: claude_md.inject is true but CLAUDE.md.block not found; skipping injection.\n'
  else
    # Build the sentinel-wrapped block in a temp file
    TMPFILE="$(mktemp /tmp/plugin-block.XXXXXX)"
    printf '<!-- %s:begin v%s -->\n' "$PLUGIN_ID" "$PLUGIN_VERSION" > "$TMPFILE"
    cat "$BLOCK_FILE" >> "$TMPFILE"
    # Ensure block ends with a newline before closing sentinel
    printf '\n<!-- %s:end -->\n' "$PLUGIN_ID" >> "$TMPFILE"

    if [ "$DRY_RUN" = "0" ]; then
      # Create CLAUDE.md if it does not exist
      if [ ! -f "$CLAUDE_MD" ]; then
        mkdir -p "$(dirname "$CLAUDE_MD")"
        touch "$CLAUDE_MD"
      fi

      # Remove existing block if present
      if grep -q "<!-- $PLUGIN_ID:begin" "$CLAUDE_MD" 2>/dev/null; then
        # Use awk to excise the block and track insertion position
        TMPMD="$(mktemp /tmp/claude-md.XXXXXX)"
        awk -v pid="$PLUGIN_ID" '
          /^<!-- / && index($0, pid ":begin") {
            skip = 1
            next
          }
          /^<!-- / && index($0, pid ":end") && skip {
            skip = 0
            next
          }
          !skip { print }
        ' "$CLAUDE_MD" > "$TMPMD"
        cp "$TMPMD" "$CLAUDE_MD"
        rm -f "$TMPMD"
        printf '    CLAUDE.md: replaced existing block for %s\n' "$PLUGIN_ID"
      else
        printf '    CLAUDE.md: appending new block for %s\n' "$PLUGIN_ID"
      fi

      # Append the new block
      cat "$TMPFILE" >> "$CLAUDE_MD"
    else
      printf '    CLAUDE.md: would inject block for %s v%s\n' "$PLUGIN_ID" "$PLUGIN_VERSION"
    fi

    rm -f "$TMPFILE"
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────

printf '\n==> Done.\n'
printf '    Plugin: %s v%s\n' "$PLUGIN_ID" "$PLUGIN_VERSION"
if [ -n "$INSTALLED_SKILLS" ]; then
  printf '    Skills installed:%s\n' "$INSTALLED_SKILLS"
fi
if [ -n "$REF_INSTALL_PATH" ] && [ -d "$PLUGIN_DIR/references" ]; then
  printf '    References: %s\n' "$REF_INSTALL_PATH"
fi
if [ -n "$PACKS_INSTALL_PATH" ] && [ -d "$PLUGIN_DIR/packs" ]; then
  printf '    Packs: %s\n' "$PACKS_INSTALL_PATH"
fi
if [ "$INJECT_CLAUDE_MD" = "true" ]; then
  printf '    CLAUDE.md: %s\n' "$CLAUDE_MD"
fi
```

What `install.sh` does NOT do:
- It does not execute any skills or invoke Claude.
- It does not touch `.project-state/` in any project directory.
- It does not modify `~/.claude/settings.json` or any Claude Code configuration file other than `CLAUDE.md`.
- It does not auto-install dependencies. Unmet `depends_on` entries produce a warning; the user installs dependencies separately.
- It does not validate SKILL.md frontmatter content beyond confirming the file exists.
- It does not roll back on failure. If the script exits mid-way due to `set -e`, partially installed files remain. Authors should test on a clean environment before publishing.

---

## 6. Uninstall Procedure

### 6.1 Uninstall steps

The following is the reference `uninstall.sh`:

```sh
#!/bin/sh
# uninstall.sh — remove a project-state-suite plugin
# Usage: sh uninstall.sh [--dry-run]

set -e

SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
CLAUDE_MD="${CLAUDE_MD:-$HOME/.claude/CLAUDE.md}"
PLUGIN_DIR="${PLUGIN_DIR:-$(cd "$(dirname "$0")" && pwd)}"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) printf 'Unknown argument: %s\n' "$arg" >&2; exit 1 ;;
  esac
done

PLUGIN_YAML="$PLUGIN_DIR/plugin.yaml"

if command -v yq >/dev/null 2>&1; then
  PLUGIN_ID="$(yq e '.plugin.id' "$PLUGIN_YAML")"
  PLUGIN_TYPE="$(yq e '.plugin.type' "$PLUGIN_YAML")"
  SKILL_INSTALL_PATH="$(yq e '.skills.install_path // "~/.claude/skills"' "$PLUGIN_YAML" | sed "s|^~|$HOME|")"
  REF_INSTALL_PATH="$(yq e '.references.install_path // ""' "$PLUGIN_YAML" | sed "s|^~|$HOME|")"
  PACKS_INSTALL_PATH="$(yq e '.packs.install_path // ""' "$PLUGIN_YAML" | sed "s|^~|$HOME|")"
elif command -v python3 >/dev/null 2>&1; then
  # Same python3 fallback as install.sh (omitted for brevity)
  printf 'ERROR: python3 fallback not shown; use yq.\n' >&2; exit 1
else
  printf 'ERROR: yq or python3 required.\n' >&2; exit 1
fi

printf '==> Uninstalling plugin: %s\n' "$PLUGIN_ID"

# ── Step 1: Check for dependents ──────────────────────────────────────────────
# Warn if other installed plugins declare a dependency on this plugin.
# Does not block uninstall.

if [ -f "$CLAUDE_MD" ]; then
  # Heuristic: scan CLAUDE.md blocks for other plugins; cross-reference
  # their plugin.yaml depends_on. This is advisory only.
  printf 'WARN: check that no other installed plugins depend on %s before continuing.\n' "$PLUGIN_ID"
fi

# ── Step 2: Remove skill directories ─────────────────────────────────────────

if [ "$PLUGIN_TYPE" = "suite" ] || [ "$PLUGIN_TYPE" = "skill" ]; then
  SKILLS_SOURCE="$PLUGIN_DIR/skills"
  if [ -d "$SKILLS_SOURCE" ]; then
    for skill_dir in "$SKILLS_SOURCE"/*/; do
      skill_slug="$(basename "$skill_dir")"
      dest="$SKILL_INSTALL_PATH/$skill_slug"
      if [ -d "$dest" ]; then
        printf '    remove skill: %s\n' "$dest"
        if [ "$DRY_RUN" = "0" ]; then
          rm -rf "$dest"
        fi
      fi
    done
  fi
fi

# ── Step 3: Remove references directory ──────────────────────────────────────

if [ -n "$REF_INSTALL_PATH" ] && [ -d "$REF_INSTALL_PATH" ]; then
  printf '    remove references: %s\n' "$REF_INSTALL_PATH"
  if [ "$DRY_RUN" = "0" ]; then
    rm -rf "$REF_INSTALL_PATH"
  fi
fi

# ── Step 4: Remove packs directory ───────────────────────────────────────────

if [ -n "$PACKS_INSTALL_PATH" ] && [ -d "$PACKS_INSTALL_PATH" ]; then
  printf '    remove packs: %s\n' "$PACKS_INSTALL_PATH"
  if [ "$DRY_RUN" = "0" ]; then
    rm -rf "$PACKS_INSTALL_PATH"
  fi
fi

# ── Step 5: Strip CLAUDE.md block ────────────────────────────────────────────

if [ -f "$CLAUDE_MD" ] && grep -q "<!-- $PLUGIN_ID:begin" "$CLAUDE_MD" 2>/dev/null; then
  printf '    strip CLAUDE.md block for %s\n' "$PLUGIN_ID"
  if [ "$DRY_RUN" = "0" ]; then
    TMPMD="$(mktemp /tmp/claude-md.XXXXXX)"
    awk -v pid="$PLUGIN_ID" '
      /^<!-- / && index($0, pid ":begin") { skip = 1; next }
      /^<!-- / && index($0, pid ":end") && skip { skip = 0; next }
      !skip { print }
    ' "$CLAUDE_MD" > "$TMPMD"
    cp "$TMPMD" "$CLAUDE_MD"
    rm -f "$TMPMD"
  fi
else
  printf '    CLAUDE.md: no block found for %s (already clean)\n' "$PLUGIN_ID"
fi

printf '\n==> Uninstall complete: %s\n' "$PLUGIN_ID"
```

### 6.2 Handling dependent plugins

The uninstaller does not block on dependent plugins. It issues a warning before proceeding. The user is responsible for uninstalling dependents first or accepting the broken dependency state.

The correct uninstall order for a suite + pack:
1. Uninstall the pack plugin first: `sh ~/.claude/skills/project-state-suite-pic-pcais/uninstall.sh`
2. Uninstall the suite plugin: `sh ~/.claude/skills/project-state-suite/uninstall.sh`

Reversing this order leaves the pack plugin's `plugin.yaml` with an unresolvable dependency but does not corrupt any state files. Skills in `.project-state/` are not touched by either script.

---

## 7. Versioning Rules

### 7.1 Semver semantics for plugins

Plugins follow semver strictly. The version in `plugin.yaml` must be a valid semver string. Pre-release versions are permitted.

| Change type | Version bump | Examples |
|-------------|-------------|---------|
| **MAJOR** | `X.0.0` | Breaking SKILL.md behavior change, `.project-state/` schema change, slash command rename, skill removed from tier list, required frontmatter field renamed |
| **MINOR** | `X.Y.0` | New skill added to a tier, new optional frontmatter field added to SKILL.md, new subcommand added, new reference document added |
| **PATCH** | `X.Y.Z` | Description wording change in SKILL.md `description` field, typo fixes, documentation-only changes, no behavioral change |

### 7.2 What constitutes a breaking change

A change is **MAJOR** (breaking) if any of the following is true:

- A skill's `description` field in SKILL.md removes trigger phrases that were present in the prior version. Adding trigger phrases is MINOR.
- A slash command trigger changes (e.g., `/project-sc-meeting` renamed to `/project-review-meeting`).
- A skill is removed from the plugin entirely.
- The `.project-state/` schema (file names, key names, required fields) changes in a way that invalidates data written by the prior version.
- A `depends_on` constraint in a skill's SKILL.md frontmatter changes in a way that removes a previously optional dependency (now required).
- `skills.namespace` in `plugin.yaml` changes.

### 7.3 Version pinning in depends_on

`depends_on.plugins[*].version` uses comma-separated semver constraints. Each constraint is a comparison operator (`>=`, `>`, `<=`, `<`, `=`) followed by a version string. Multiple constraints are AND-ed.

| Expression | Meaning |
|-----------|---------|
| `">=2.0,<3.0"` | Any 2.x version at or above 2.0.0 |
| `">=2.1.0"` | Any version at or above 2.1.0, including 3.x |
| `"=2.0.1"` | Exactly 2.0.1 |
| `">=2.0.0,<2.1.0"` | Any 2.0.x patch release |

Best practice for pack plugins targeting a suite:

```yaml
depends_on:
  plugins:
    - id: "project-state-suite"
      version: ">=2.0,<3.0"
```

This allows the suite to receive MINOR and PATCH updates without requiring a new pack release.

### 7.4 Pre-release versions

Pre-release versions follow semver pre-release syntax: `2.1.0-beta.1`, `2.1.0-rc.2`.

- Pre-release versions must not be declared in `depends_on.plugins` constraints. Dependencies must reference release versions only.
- Pre-release versions are appropriate for: testing breaking changes before a MAJOR bump, validating new skills before GA, design partner distributions.
- A pre-release plugin is not considered to satisfy a range constraint that does not explicitly include the pre-release identifier. The installer treats `>=2.0,<3.0` as not matching `2.1.0-beta.1`.

---

## 8. Conflict Detection

### 8.1 conflicts_with evaluation

At install time, after parsing `plugin.yaml` and before writing any files, the installer reads `CLAUDE.md` and scans for sentinel blocks from plugins declared in `conflicts_with.plugins`. If any conflicting plugin's sentinel is found, the installer prints a warning and asks for confirmation before proceeding.

The warning format:

```
WARN: Conflicting plugin detected: legacy-project-skills
      This plugin is declared incompatible with project-state-suite.
      Both plugins register overlapping slash commands.
      Continuing will not remove the conflicting plugin.
      To resolve: run legacy-project-skills/uninstall.sh first.
Continue anyway? [y/N]
```

If `--dry-run` is passed, the check runs but the prompt is suppressed.

The installer does not block automatically. The user has final authority.

### 8.2 Namespace conflicts

Two plugins have a namespace conflict when they declare the same value for `skills.namespace` in their respective `plugin.yaml` files. Both will inject a `/project-*` dispatch block, and the second block (appended later in `CLAUDE.md`) takes precedence.

Detection: the installer checks whether `CLAUDE.md` already contains a dispatch line for the same namespace prefix from a different plugin id. If found, it warns.

Signals of a namespace conflict in `CLAUDE.md`:
- Two blocks exist for different plugin ids that both contain `invoke the Skill tool` lines referencing overlapping trigger patterns.
- The same slash command appears in two different sentinel blocks.

### 8.3 Resolution order

1. Claude reads `CLAUDE.md` top to bottom. The last matching instruction for a given slash command wins.
2. "Last installed" means the plugin whose block appears later in `CLAUDE.md`. This is typically the more recently installed plugin.
3. A user who needs to route to a specific plugin despite a conflict uses the namespaced form. In CLAUDE.md, they may add an explicit override line:

   ```
   When the user types `/project-state-suite:project-orchestrator`, invoke the Skill tool with skill: "project-state-suite:project-orchestrator" and pass any arguments as args.
   ```

4. The namespaced invocation form `plugin-id:skill-name` always resolves unambiguously, regardless of which blocks appear in `CLAUDE.md`, because it bypasses the slash command routing entirely and names the Skill tool argument directly.

---

## 9. Testing a Plugin

### 9.1 Pre-publish checklist

Before publishing any plugin version, the author must verify all items in the following checklist.

**plugin.yaml validation:**

- [ ] `plugin.id` contains only lowercase letters, digits, and hyphens
- [ ] `plugin.version` is a valid semver string
- [ ] `plugin.description` is 512 characters or fewer
- [ ] `plugin.type` is one of `suite`, `skill`, `pack`, `reference`
- [ ] All skill slugs in `skills.tiers` (for suite type) correspond to a `skills/<slug>/` directory
- [ ] `compatibility.claude_code` and `compatibility.claude_api` are populated
- [ ] `depends_on.plugins[*].version` uses valid semver range syntax
- [ ] `conflicts_with.plugins` lists any known incompatible plugins

**SKILL.md validation (for each skill):**

- [ ] Frontmatter parses as valid YAML
- [ ] `description` is 1024 characters or fewer
- [ ] `tier` is one of P0, P1, P2, P3
- [ ] `depends_on.skills` lists all skills this skill requires to run
- [ ] Trigger examples in `slash_command.examples` (if present) match the registered trigger

**CLAUDE.md.block validation:**

- [ ] Opening sentinel format is exactly `<!-- <plugin-id>:begin vX.Y.Z -->`
- [ ] Closing sentinel format is exactly `<!-- <plugin-id>:end -->`
- [ ] Plugin id in sentinels matches `plugin.id` in `plugin.yaml`
- [ ] Version in opening sentinel matches `plugin.version` in `plugin.yaml`
- [ ] Each skill bullet uses the exact format: `- **<slug>** — <desc>. Trigger: \`/<trigger>\``

**install.sh validation:**

- [ ] Script runs without error on a clean machine with no prior plugin installation
- [ ] Script is idempotent: running it twice produces identical output and no duplicate CLAUDE.md blocks
- [ ] `--dry-run` flag produces output but writes no files
- [ ] CLAUDE.md sentinel block is injected correctly and parses as valid markdown

**Post-install validation:**

- [ ] Slash commands appear in Claude Code's skill list after install
- [ ] Invoking a trigger (e.g., `/project-state`) routes to the correct skill
- [ ] References are readable from paths declared in SKILL.md instructions

### 9.2 Isolated testing

To test a plugin without modifying the production `~/.claude/` directory, set the environment variables before running `install.sh`:

```sh
# Create a temporary test environment
mkdir -p /tmp/test-claude/skills
touch /tmp/test-claude/CLAUDE.md

# Install into the test environment
CLAUDE_SKILLS_DIR=/tmp/test-claude/skills \
CLAUDE_MD=/tmp/test-claude/CLAUDE.md \
  sh ./install.sh

# Inspect results
cat /tmp/test-claude/CLAUDE.md
ls /tmp/test-claude/skills/

# Clean up
rm -rf /tmp/test-claude/
```

The environment variable `CLAUDE_SKILLS_DIR` is the canonical override for the skill install path. All path resolution in `install.sh` and `uninstall.sh` must respect this variable.

---

## 10. Registry (Future)

This section is a placeholder. No registry is implemented. Manual git/local install via `install.sh` is the current and only supported mechanism.

### 10.1 What a registry would provide

A plugin registry is a JSON index hosted at a stable URL that maps plugin ids to versions and download locations. A minimal registry entry:

```json
{
  "id": "project-state-suite",
  "name": "project-state-suite",
  "latest": "2.0.1",
  "versions": {
    "2.0.1": {
      "released": "2026-05-01",
      "download": "https://registry.example.com/plugins/project-state-suite/2.0.1.tar.gz",
      "sha256": "abc123...",
      "plugin_yaml": "https://registry.example.com/plugins/project-state-suite/2.0.1/plugin.yaml"
    }
  },
  "tags": ["suite", "project-management"],
  "homepage": "https://project-state.atomic47.co"
}
```

A registry index file lists all available plugins:

```json
{
  "registry_version": "1.0",
  "plugins": [
    { "id": "project-state-suite", "latest": "2.0.1" },
    { "id": "project-state-suite-pic-pcais", "latest": "1.0.0" }
  ]
}
```

### 10.2 Discovery and install UX (future)

The target install experience when a registry is operational:

```
/install project-state-suite
/install project-state-suite-pic-pcais
/install project-state-suite --version 2.0.0
```

These would be handled by a Claude Code harness-level command that fetches the plugin's `plugin.yaml`, resolves dependencies, downloads the archive, verifies the checksum, and runs `install.sh`. Until that harness support exists, users install by cloning the plugin's git repository and running `install.sh` directly.

### 10.3 Current installation method

```sh
# Clone and install
git clone https://github.com/atomic47/project-state-suite /tmp/project-state-suite
sh /tmp/project-state-suite/install.sh

# Install a pack plugin
git clone https://github.com/atomic47/project-state-suite-pic-pcais /tmp/pic-pcais-pack
sh /tmp/pic-pcais-pack/install.sh
```

There is no `/install` command in Claude Code at this time. The registry section of this spec will be updated when harness-level plugin management is implemented.
