# Slash Command Specification — project-state-suite

**Version:** 1.0
**Status:** Authoritative
**Audience:** Skill authors, plugin packagers, and developers extending the project-state-suite stack

---

## Purpose

This document is the authoritative specification for the Slash Command layer of the project-state-suite extensibility system. It defines the `/name [args]` invocation primitive — how commands are registered, named, parsed, scoped, and dispatched to skills.

Read alongside: `EXTENSIBILITY-SPEC.md` (the full primitive taxonomy) and `SKILLS-REFERENCE.md` (per-skill behavior).

---

## 1. What is a Slash Command

A slash command is an explicit `/name [args]` invocation pattern that Claude Code recognizes when the user types it in the chat input. Claude resolves the command against registered entries in `CLAUDE.md` and routes it to the corresponding skill via the `Skill` tool.

### 1.1 Relationship to trigger phrases

Skills expose two invocation paths:

| Path | Mechanism | Match type | Source |
|------|-----------|------------|--------|
| **Slash command** | `/project-orchestrator --dry-run` | Deterministic exact match | `CLAUDE.md` registration |
| **Trigger phrase** | "run the orchestrator in dry-run mode" | Fuzzy semantic match | `SKILL.md` `description` field |

Both paths activate the same skill and produce the same behavior. Slash commands are preferred when precision matters. Trigger phrases are preferred for conversational interaction.

Key distinctions:
- A slash command is deterministic. If `/project-orchestrator` is registered, typing it always routes to `project-orchestrator`. No inference is required.
- A trigger phrase is probabilistic. Claude matches the user's natural language against all loaded `SKILL.md` descriptions and picks the closest fit. Ambiguity is possible.
- Slash commands bypass trigger-phrase matching entirely. Once Claude sees a `/`-prefixed token that matches a CLAUDE.md entry, it dispatches without scoring alternatives.

### 1.2 Relationship to skills

One skill has one canonical slash command. The command name is derived from the skill's `name` field in `SKILL.md`. Multiple aliases are permitted but discouraged — they fragment discoverability and complicate conflict detection.

The mapping is:

```
SKILL.md name          →   slash command
project-orchestrator   →   /project-orchestrator
project-state          →   /project-state
project-status-reporter →  /project-status-reporter
```

### 1.3 Scope

Slash commands are registered in `CLAUDE.md` files. Two scopes exist:

| Scope | File location | Availability |
|-------|---------------|--------------|
| **User-level** | `~/.claude/CLAUDE.md` | All projects for this user |
| **Project-level** | `<project-root>/.claude/CLAUDE.md` | The single project only |

Plugin install targets user-level by default. A `--project` flag (planned) will target project-level.

---

## 2. CLAUDE.md Registration Format

### 2.1 Block structure

The CLAUDE.md registration for a plugin is a single contiguous block containing:
1. A sentinel open comment (includes plugin ID and version)
2. A section heading
3. A wildcard dispatch instruction
4. One trigger line per skill
5. A sentinel close comment

No content may appear between the sentinel open and the trigger lines except the section heading and dispatch instruction. No content may appear inside the sentinel block that belongs to another plugin.

### 2.2 Full example — project-state-suite registration block

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
- **project-harvester** — harvest external signals relevant to a specific project into `.project-state/documents/inbox/`. Trigger: `/project-harvester`
<!-- project-state-suite:end -->
```

### 2.3 The sentinel comment system

Sentinels wrap every plugin-managed block so the installer can surgically update or remove it without touching surrounding content.

**Sentinel format:**

```
<!-- <plugin-id>:begin v<version> -->
...block content...
<!-- <plugin-id>:end -->
```

Rules:
- `plugin-id` is the `plugin.yaml` `plugin.id` value — lowercase, dashes only.
- `version` on the open sentinel is the installed plugin version. The installer updates it on reinstall.
- The close sentinel has no version. The installer matches on the plugin-id alone.
- Sentinels are HTML comments. They do not render in markdown viewers and are invisible to Claude when it reads the file as context — they exist solely for the installer.

**Why sentinels matter:**

| Operation | Behavior without sentinels | Behavior with sentinels |
|-----------|---------------------------|------------------------|
| Reinstall | Duplicate block appended | Old block replaced in-place |
| Uninstall | Manual edit required | Installer deletes the sentinel range |
| Version upgrade | Installer cannot locate old block | Installer replaces sentinel range with new block |
| Diff | Entire file changes | Only the sentinel range changes |
| Two plugins coexist | Interleaved lines, ambiguous ownership | Each plugin owns its own sentinel range |

### 2.4 The `CLAUDE.md.block` file

The plugin ships a `CLAUDE.md.block` file containing exactly the sentinel-wrapped block (section 2.2). The installer reads this file and injects it into the user's `CLAUDE.md`. Skill authors do not edit `CLAUDE.md` directly — they edit `CLAUDE.md.block` and run the installer.

---

## 3. Trigger Line Format

### 3.1 Canonical format

Each skill in the CLAUDE.md block occupies exactly one line:

```
- **<skill-name>** — <one-line description>. Trigger: `/<command>`
```

| Field | Rule |
|-------|------|
| `skill-name` | The SKILL.md `name` field value, verbatim. No namespace prefix stripped, no added prefix. |
| `one-line description` | Plain prose, 100 characters maximum. No markdown inside (no bold, no backticks, no links). Must end with a period before `Trigger:`. |
| `Trigger:` | The literal word `Trigger:` followed by a space. Required. |
| `/<command>` | The slash command in backticks. Must exactly match the command that will activate this skill. |

### 3.2 Parsing contract

Claude parses each trigger line to build the command→skill mapping. The parser depends on:
- The `Trigger:` keyword being present and followed by a backtick-wrapped command.
- The backtick-wrapped value beginning with `/`.
- No additional content after the closing backtick on the same line.

Malformed lines are silently ignored by Claude — the skill will not be reachable via slash command.

### 3.3 Rules

- One line per skill. Do not wrap long descriptions across lines.
- No nested bullets. The trigger line is a flat list item.
- The `Trigger:` word is required. Lines without it are parsed as informational text only and do not register a command.
- The description in a trigger line must differ from the `SKILL.md` `description` frontmatter field. The trigger line is a summary (≤100 chars); the frontmatter description is the full dispatch text (≤1024 chars).
- Do not repeat the skill name in the description. The bold `**skill-name**` already identifies the skill.

### 3.4 Valid and invalid examples

**Valid:**
```
- **project-orchestrator** — calendar-aware conductor; reads reporting matrix, dispatches generators. Trigger: `/project-orchestrator`
```

**Invalid — description too long (>100 chars before Trigger:):**
```
- **project-orchestrator** — calendar-aware conductor that reads the reporting matrix and dispatches all report generators on schedule. Trigger: `/project-orchestrator`
```

**Invalid — no Trigger: keyword:**
```
- **project-orchestrator** — calendar-aware conductor. `/project-orchestrator`
```

**Invalid — markdown inside description:**
```
- **project-orchestrator** — runs the **reporting matrix**. Trigger: `/project-orchestrator`
```

**Invalid — nested bullet:**
```
- **project-orchestrator** — calendar-aware conductor. Trigger: `/project-orchestrator`
  - Also handles dry-run via --dry-run flag.
```

---

## 4. Slash Command Naming Conventions

### 4.1 Pattern

```
/<namespace>-<skill-leaf>
```

Examples:
- `/project-orchestrator` — namespace `project`, skill leaf `orchestrator`
- `/project-status-reporter` — namespace `project`, skill leaf `status-reporter`
- `/project-milestone-manager` — namespace `project`, skill leaf `milestone-manager`

The full slash command string is identical to the SKILL.md `name` field prepended with `/`.

### 4.2 Namespace

The namespace is the plugin's `skills.namespace` value in `plugin.yaml`. For project-state-suite:

```yaml
skills:
  namespace: "project"
```

All skills in this plugin use the `/project-` prefix. The namespace prevents collision with skills from other plugins that might use generic names like `status` or `archive`.

### 4.3 Skill directory slug

The skill directory slug (the directory name under `skills/`) is the full command name without the leading `/`:

```
skills/
├── project-state/
├── project-orchestrator/
├── project-status-reporter/
└── project-milestone-manager/
```

The directory slug, the SKILL.md `name` field, and the slash command (minus `/`) must all be identical.

### 4.4 Naming rules

| Rule | Rationale |
|------|-----------|
| Lowercase only | Command matching is case-sensitive; lowercase avoids ambiguity |
| Dashes as word separator | No underscores, no spaces |
| No special characters except `-` | `/`, `.`, `@`, `#` break parsing |
| Total length ≤40 characters including the leading `/` | Keeps commands typeable; Claude Code UI truncates long commands |
| Must begin with the namespace prefix | Enables wildcard dispatch (see section 6) |
| No trailing dash | `/project-orchestrator-` is invalid |

### 4.5 Forbidden forms

```
/Project-Orchestrator      # uppercase
/project_orchestrator      # underscore
/project orchestrator      # space
/project-orchestrator-     # trailing dash
/projectorchestrator       # no separator
/p-orchestrator            # abbreviated namespace
```

---

## 5. Argument Passing

### 5.1 Mechanism

Arguments are text appended after the slash command, separated by a space:

```
/project-status-reporter weekly
/project-milestone-manager update M03 percent_complete=75
/project-orchestrator --dry-run
```

Claude receives the full string typed by the user. Everything after the command name token is passed to the skill as the `args` parameter of the `Skill` tool call. There is no framework-level argument parsing — the skill's SKILL.md body defines how args are interpreted.

### 5.2 Subcommand conventions

Skills should follow these conventions for consistency across the suite:

| Convention | Form | Example |
|------------|------|---------|
| Subcommand (positional first arg) | bare word | `weekly`, `sc-pack`, `update` |
| Named flag | `--flag` | `--dry-run`, `--help`, `--verbose` |
| Entity ID | bare word after subcommand | `M03`, `R-05`, `CO-12` |
| Key=value | `key=value` (no spaces) | `percent_complete=75`, `status=at_risk` |
| Date (absolute) | ISO-8601 | `2026-05-01` |
| Date (relative) | lowercase keyword | `today`, `this-week`, `last-month` |
| Range | `from=<date> to=<date>` | `from=2026-04-01 to=2026-06-30` |

### 5.3 Argument parsing is the skill's responsibility

The suite does not provide a shared argument parser. Each skill reads the raw `args` string and parses it inline. Skills must document their accepted args in the `slash_command.subcommands[]` frontmatter array (see section 10).

Recommended parsing order within a skill:
1. Check for `--help` — if present, emit usage and stop.
2. Check for `--dry-run` — set preview mode.
3. Read the first bare word as the subcommand, or use the default subcommand if none.
4. Parse remaining tokens in order.

### 5.4 The `--help` convention

Every skill must handle `--help` as the first argument. See section 10 for the required output format.

### 5.5 The `--dry-run` convention

Every skill that writes state must handle `--dry-run`. When this flag is present:
- The skill reads state normally.
- The skill computes the full action plan.
- The skill outputs a human-readable preview of what would be written, created, or sent.
- The skill does not write any files, append to logs, or call external surfaces.
- The output must clearly indicate it is a preview and no changes were made.

Skills that only read state (e.g., `project-state` in query mode) are exempt from `--dry-run`.

### 5.6 Argument examples by skill

| Invocation | Subcommand | Flags | Entity |
|------------|------------|-------|--------|
| `/project-status-reporter weekly` | `weekly` | — | — |
| `/project-status-reporter sc-pack --date 2026-07-15` | `sc-pack` | `--date` | — |
| `/project-milestone-manager update M03 percent_complete=75` | `update` | — | `M03` |
| `/project-phase-gate advance --dry-run` | `advance` | `--dry-run` | — |
| `/project-orchestrator --only-step 2` | — | `--only-step` | `2` |
| `/project-harvester --since 2026-04-01` | — | `--since` | — |

---

## 6. Namespace Dispatch Pattern

### 6.1 Wildcard dispatch instruction

The CLAUDE.md block heading uses a wildcard to route all commands sharing a prefix to the skill system without enumerating each command individually:

```
When the user types any `/project-*` slash command, invoke the Skill tool
with the matching skill name and pass any arguments as args.
```

This single instruction covers all 19+ skills in the suite. Claude resolves the skill name as follows:

1. User types `/project-orchestrator --dry-run`
2. Claude reads the `When the user types any /project-* slash command` instruction
3. Claude strips the leading `/` to get `project-orchestrator`
4. Claude calls `Skill(skill="project-orchestrator", args="--dry-run")`

### 6.2 Skill name resolution

The Skill tool receives the full command string minus the `/` prefix as the `skill` parameter:

```
/project-orchestrator  →  skill="project-orchestrator"
/project-state         →  skill="project-state"
/project-status-reporter weekly  →  skill="project-status-reporter", args="weekly"
```

The tool then matches `skill` against the skill name declared in each installed `SKILL.md` frontmatter `name` field.

### 6.3 Namespaced invocation

When two installed plugins share the same command prefix, or when a skill name appears in multiple suites, the user may force disambiguation using the fully qualified form:

```
project-state-suite:project-orchestrator
```

Use the full namespace form in CLAUDE.md when registering a skill that the installer knows may conflict:

```
invoke the Skill tool with skill: "project-state-suite:project-orchestrator"
```

The short form (`project-orchestrator`) is preferred for normal use. The namespaced form is a disambiguation mechanism only.

### 6.4 Unknown command behavior

The wildcard `*` matches anything after the prefix. If the user types `/project-foo` and no skill named `project-foo` exists, Claude will attempt to invoke it. The `Skill` tool will return a "skill not found" error. Skills do not handle this case — it is a harness-level response. Skill authors should not add routing logic for unknown subskills.

### 6.5 Per-skill dispatch lines (alternative)

For single-skill plugins or plugins with only a few skills, a per-skill dispatch line may replace the wildcard:

```
When the user types `/project-orchestrator`, invoke the Skill tool with skill: "project-orchestrator" and pass any arguments as args.
```

This form is more explicit and avoids the wildcard, but does not scale to a suite of 19 skills. Use the wildcard form for suites.

---

## 7. Scope: User-Level vs. Project-Level Registration

### 7.1 User-level registration

File: `~/.claude/CLAUDE.md`

Skills registered here are available in every project the user opens in Claude Code. This is the default install target for suite plugins.

Use user-level for:
- Suite plugins used across multiple projects (`project-state-suite`)
- General-purpose utilities (`commit-ledger`, `graphify`)
- Skills that are not specific to any one codebase

### 7.2 Project-level registration

File: `<project-root>/.claude/CLAUDE.md`

Skills registered here are available only in that project. The file is typically committed to the repository and shared with the team.

Use project-level for:
- Project-specific command aliases
- Overriding a user-level command for a specific project
- Skills that only make sense in one codebase (e.g., a custom harvester for a specific Slack channel)
- Sharing a skill configuration with the whole team via version control

### 7.3 Precedence

Claude reads CLAUDE.md files in this order:
1. User-level (`~/.claude/CLAUDE.md`) — loaded first
2. Project-level (`<project-root>/.claude/CLAUDE.md`) — loaded after

When the same slash command is registered in both files, the project-level entry wins because it is read later. This allows project-level registrations to shadow user-level ones.

### 7.4 Plugin install target

The suite installer injects into the user-level CLAUDE.md by default. A future `--project` flag will allow project-level injection. Manual project-level registration is always possible by copying the `CLAUDE.md.block` content into `.claude/CLAUDE.md`.

### 7.5 Team sharing

When a project-level `.claude/CLAUDE.md` is committed to the repository, all team members who open the project in Claude Code will see the registered slash commands — provided they have the corresponding skills installed. Skills not installed locally will fail at invocation with a "skill not found" error, not at registration time.

---

## 8. Conflict Resolution

### 8.1 How conflicts occur

A conflict exists when two registered entries in CLAUDE.md match the same slash command. This can happen when:
- Two plugins register the same command (e.g., both `project-state-suite` and a custom plugin register `/project-orchestrator`)
- A user-level and project-level entry define the same command with different targets
- An alias in one plugin matches the canonical command of another

### 8.2 Last-entry wins

Claude reads CLAUDE.md top-to-bottom. When two entries match the same command, the later entry overrides the earlier one. CLAUDE.md sentinel block order is therefore significant.

Block ordering in `~/.claude/CLAUDE.md`:
```
<!-- plugin-a:begin v1.0 -->
...
<!-- plugin-a:end -->

<!-- plugin-b:begin v1.0 -->    ← plugin-b's entry wins on conflict with plugin-a
...
<!-- plugin-b:end -->
```

The installer appends new blocks at the end of the file. This means the most recently installed plugin wins on any conflict.

### 8.3 Installer conflict detection

Before injecting a new plugin block, the installer scans the existing CLAUDE.md for any command strings that the new plugin will register. If a conflict is found, the installer emits a warning and waits for user confirmation before proceeding:

```
WARNING: /project-orchestrator is already registered by plugin 'my-custom-plugin'.
Installing project-state-suite will override it. Continue? [y/N]
```

The installer does not abort — it warns. The user decides.

### 8.4 Resolution options

| Option | Mechanism |
|--------|-----------|
| Use the namespaced form | Type `project-state-suite:project-orchestrator` in chat instead of `/project-orchestrator` |
| Reorder sentinel blocks | Edit CLAUDE.md to move the preferred plugin's block after the other |
| Use `conflicts_with` in plugin.yaml | Declare the conflict at install time so the installer fails fast |
| Register an alias at project-level | Use `.claude/CLAUDE.md` to bind the preferred skill to the conflicting command name |

### 8.5 The `conflicts_with` field

Plugin authors who know their plugin collides with another may declare it in `plugin.yaml`:

```yaml
conflicts_with:
  plugins:
    - id: "my-custom-plugin"
      commands: ["/project-orchestrator"]
      resolution: "warn"   # warn | fail | override
```

| Resolution value | Behavior |
|------------------|----------|
| `warn` | Installer warns and asks for confirmation (default) |
| `fail` | Installer aborts; user must uninstall the conflicting plugin first |
| `override` | Installer proceeds silently; the new plugin's entry wins |

---

## 9. Implicit Invocation vs. Explicit Slash Commands

### 9.1 Implicit invocation (trigger phrases)

Skills can activate without a slash command when the user types natural language that matches the SKILL.md `description` field. This is the trigger-phrase path. Claude compares the user's input against all loaded descriptions and invokes the best match.

Example: "Can you run the project orchestrator in dry-run mode?" may match `project-orchestrator` via its description, even without the `/project-orchestrator` prefix.

### 9.2 Explicit slash commands

When the user types a registered `/name` command, Claude bypasses trigger-phrase scoring and dispatches directly to the mapped skill. No ambiguity is possible.

### 9.3 When to prefer explicit slash commands

Use explicit slash commands when:
- Scripting or automating a sequence of skill invocations
- The command is one of several skills with overlapping descriptions (e.g., multiple reporters)
- Passing flags or structured arguments that would be awkward to express naturally
- Deterministic behavior is required (tests, documentation examples, runbooks)
- A skill is invoked inside another skill's instructions (avoids re-triggering the outer skill)

### 9.4 When to prefer trigger phrases

Use trigger phrases when:
- Having a conversational interaction where the exact command name is unknown
- The skill should activate based on context inferred from a longer message
- A skill should activate in the middle of processing another skill's instructions (the outer skill's instructions may contain prose that triggers the inner skill naturally)
- Onboarding new users who have not memorized the command inventory

### 9.5 Hybrid invocation

Skills may be partially invoked by trigger phrase with args supplied by the user in natural language:
- "Run the status reporter for this week" — Claude may route to `project-status-reporter` via trigger phrase and infer `weekly` as the subcommand from context.

This behavior is non-deterministic. When the subcommand matters, use the explicit form `/project-status-reporter weekly`.

---

## 10. The `--help` Convention (Detailed)

### 10.1 Requirement

Every skill must implement `--help`. When invoked with this flag as the first argument, the skill must output a usage summary and stop. No state is read or written.

### 10.2 Output format

```
/<command>

<one-sentence purpose statement.>

Subcommands:
  <subcommand>      <description>
  <subcommand>      <description>

Examples:
  /<command> <example-1>
  /<command> <example-2>
  /<command> <example-3>
```

Full example for `project-status-reporter`:

```
/project-status-reporter

Generate status reports from project state.

Subcommands:
  weekly          Weekly tracker email (default)
  sc-pack         Steering committee meeting pack
  claim-draft     Quarterly claim draft
  dashboard       State snapshot for team dashboard

Examples:
  /project-status-reporter weekly
  /project-status-reporter sc-pack --date 2026-07-15
  /project-status-reporter claim-draft Q2-2026
  /project-status-reporter dashboard
```

### 10.3 Data source

The skill renders the `--help` output from its own SKILL.md frontmatter `slash_command` block:

```yaml
slash_command:
  trigger: "/project-status-reporter"
  subcommands:
    - name: "weekly"
      description: "Weekly tracker email (default)"
    - name: "sc-pack"
      description: "Steering committee meeting pack"
    - name: "claim-draft"
      description: "Quarterly claim draft"
    - name: "dashboard"
      description: "State snapshot for team dashboard"
  examples:
    - "/project-status-reporter weekly"
    - "/project-status-reporter sc-pack --date 2026-07-15"
    - "/project-status-reporter claim-draft Q2-2026"
    - "/project-status-reporter dashboard"
```

### 10.4 Formatting rules

| Field | Rule |
|-------|------|
| Command line | The slash command alone, on its own line, no trailing text |
| Purpose | One sentence, ending with a period |
| Subcommands section | Heading `Subcommands:`, then two-column format: name left-padded to 16 chars, description right |
| Examples section | Heading `Examples:`, then one example per line, indented two spaces |
| Minimum examples | 3 |
| Maximum examples | 5 |
| Flags in examples | Include at least one example with `--dry-run` if the skill supports it |

### 10.5 Skills with no subcommands

Skills that accept only flags and no subcommands omit the `Subcommands:` section:

```
/project-harvester

Harvest external signals into .project-state/documents/inbox/.

Examples:
  /project-harvester
  /project-harvester --since 2026-04-01
  /project-harvester --surface slack
  /project-harvester --dry-run
```

---

## 11. SKILL.md `slash_command` Frontmatter Block

The `slash_command` block in SKILL.md frontmatter is the source of truth for command metadata. It drives `--help` output, installer validation, and documentation generation.

### 11.1 Schema

```yaml
slash_command:
  trigger: "/project-<skill-leaf>"        # required; must match the CLAUDE.md trigger line
  aliases: []                             # optional; additional commands that route to this skill
  subcommands:                            # optional; omit if skill has no subcommands
    - name: "<subcommand>"
      description: "<≤80 char description>"
      default: true                       # optional; marks the default when no subcommand given
    - name: "--dry-run"
      description: "Preview actions without writing state"
    - name: "--help"
      description: "Show this usage summary"
  examples:                              # required; 3–5 entries
    - "/project-<skill-leaf>"
    - "/project-<skill-leaf> <subcommand>"
    - "/project-<skill-leaf> --dry-run"
```

### 11.2 Rules

- `trigger` must exactly match the backtick-wrapped command in the CLAUDE.md trigger line.
- `aliases` are discouraged. If declared, each alias must also appear in `CLAUDE.md.block` as a separate trigger line.
- `--help` and `--dry-run` should appear in `subcommands[]` for skills that support them, so they appear in the `--help` output.
- `examples` must be runnable — each example must produce meaningful output when typed exactly as written.

---

## 12. Testing Slash Commands

### 12.1 Pre-ship checklist

Before shipping a new skill or updating an existing one, verify each item:

| Check | How to verify |
|-------|---------------|
| Command appears in CLAUDE.md | `grep '/project-<skill>' ~/.claude/CLAUDE.md` returns the trigger line |
| Sentinel is well-formed | `grep -c 'project-state-suite:begin' ~/.claude/CLAUDE.md` returns 1; `grep -c 'project-state-suite:end' ~/.claude/CLAUDE.md` returns 1 |
| Trigger line format is valid | Line matches pattern `- \*\*<name>\*\* — <desc>. Trigger: \`/<cmd>\`` |
| Skill activates | Type the command in Claude Code; Claude invokes the skill without asking for clarification |
| `--help` output is valid | `/project-<skill> --help` returns formatted usage with 3–5 examples |
| `--dry-run` previews without writing | `/project-<skill> --dry-run` outputs a plan; no files modified; no log entries appended |
| Args are passed correctly | `/project-<skill> <subcommand>` routes to the correct branch of the skill body |
| No duplicate registration | `grep '/project-<skill>' ~/.claude/CLAUDE.md` returns exactly one trigger line |

### 12.2 Sentinel validation

```bash
# Verify exactly one begin and one end sentinel for the suite
BEGIN_COUNT=$(grep -c '<!-- project-state-suite:begin' ~/.claude/CLAUDE.md)
END_COUNT=$(grep -c '<!-- project-state-suite:end -->' ~/.claude/CLAUDE.md)
echo "begin=$BEGIN_COUNT end=$END_COUNT"
# Expected: begin=1 end=1
```

### 12.3 Trigger line count validation

```bash
# Count registered skills
grep -c 'Trigger: `/project-' ~/.claude/CLAUDE.md
# Expected: 19 (or the current suite skill count)
```

### 12.4 Command name consistency check

The following three must be identical for each skill:

```bash
# 1. Directory name
ls ~/.claude/skills/ | grep 'project-'

# 2. SKILL.md name field
grep '^name:' ~/.claude/skills/project-orchestrator/SKILL.md

# 3. Trigger in CLAUDE.md (strip leading / and backticks)
grep 'project-orchestrator' ~/.claude/CLAUDE.md | grep 'Trigger:'
```

All three must yield `project-orchestrator` (without the `/`).

---

## Appendix A — Skill-to-Command Reference Table

| Tier | Skill name | Slash command | Pack required | `--dry-run` |
|------|------------|---------------|---------------|-------------|
| P0 | `project-state` | `/project-state` | No | No (read-only primary mode) |
| P0 | `project-scaffolder` | `/project-scaffolder` | No | Yes |
| P1 | `project-phase-gate` | `/project-phase-gate` | Optional | Yes |
| P1 | `project-document-curator` | `/project-document-curator` | No | Yes |
| P1 | `project-milestone-manager` | `/project-milestone-manager` | No | Yes |
| P1 | `project-status-reporter` | `/project-status-reporter` | No | Yes |
| P2 | `project-orchestrator` | `/project-orchestrator` | No | Yes |
| P2 | `project-notifier` | `/project-notifier` | No | Yes |
| P2 | `project-review-meeting` | `/project-review-meeting` | Yes | Yes |
| P2 | `project-funder-reporting` | `/project-funder-reporting` | Yes | Yes |
| P2 | `project-change-register` | `/project-change-register` | No | Yes |
| P2 | `project-blog-publisher` | `/project-blog-publisher` | No | Yes |
| P2 | `project-website-publisher` | `/project-website-publisher` | No | Yes |
| P3 | `project-onboarder` | `/project-onboarder` | No | Yes |
| P3 | `project-ip-tracker` | `/project-ip-tracker` | Yes | Yes |
| P3 | `project-external-comms` | `/project-external-comms` | Yes | Yes |
| P3 | `project-lessons` | `/project-lessons` | No | Yes |
| P3 | `project-archive` | `/project-archive` | Yes | Yes |
| P2 | `project-harvester` | `/project-harvester` | No | Yes |

---

## Appendix B — Minimal `slash_command` Frontmatter Example

Complete frontmatter for a skill that supports one subcommand, dry-run, and help:

```yaml
---
name: project-milestone-manager
description: "CRUD operations for project milestones. Update percent_complete, technical_progress, status, and target dates. Reads and writes milestones/*.yaml files in the .project-state substrate."
plugin: "project-state-suite"
version: "2.0.1"
tier: P1
depends_on:
  skills: [project-state]
slash_command:
  trigger: "/project-milestone-manager"
  subcommands:
    - name: "list"
      description: "List all milestones with current status"
      default: true
    - name: "update"
      description: "Update a milestone field: update <id> <key>=<value>"
    - name: "add"
      description: "Add a new milestone from prompted fields"
    - name: "close"
      description: "Mark a milestone complete and log closure"
    - name: "--dry-run"
      description: "Preview changes without writing to state"
    - name: "--help"
      description: "Show this usage summary"
  examples:
    - "/project-milestone-manager list"
    - "/project-milestone-manager update M03 percent_complete=75"
    - "/project-milestone-manager update M03 status=at_risk"
    - "/project-milestone-manager close M04"
    - "/project-milestone-manager update M03 percent_complete=90 --dry-run"
---
```

---

## Appendix C — Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Skill does not activate on command | Trigger line missing `Trigger:` keyword or backticks | Correct the trigger line format |
| Two skills activate on same command | Duplicate trigger lines | Remove one; use namespaced form if both are needed |
| `--help` returns nothing | Skill body does not check for `--help` before running main logic | Add `--help` check at the top of skill instructions |
| Installer duplicates the block on reinstall | Sentinel open comment is malformed | Verify the sentinel exactly matches `<!-- project-state-suite:begin v<x.y.z> -->` |
| `--dry-run` still writes files | Skill does not check for `--dry-run` before state writes | Add dry-run gate before every file write in skill instructions |
| Args not reaching skill | User typed args with a newline instead of a space | Args must be on the same line as the command |
