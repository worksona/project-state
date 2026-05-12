# Skill Specification — project-state-suite

**Version:** 1.0
**Status:** Draft
**Audience:** Skill authors building new `project-*` skills; pack authors extending the suite; developers integrating the extensibility system
**Companion document:** `docs/EXTENSIBILITY-SPEC.md` (plugin, slash command, and installation layers)

---

## 1. What is a skill

A **skill** is a single `SKILL.md`-defined behavior unit. Claude reads the file at conversation start, uses its `description` frontmatter field to decide when to activate the skill, and follows the markdown body as behavioral instructions when activated.

### 1.1 Definition

A skill encodes one coherent job: what triggers it, what it reads, what it writes, and exactly how Claude should behave. It is not code. It does not execute in a runtime. It is a structured prompt artifact that Claude interprets.

Every skill lives in its own directory:

```
skills/<skill-slug>/
└── SKILL.md
```

The directory name is the skill slug. The `SKILL.md` is the only required file.

### 1.2 Relationship to plugins

Skills are the unit of behavior. Plugins are the unit of distribution. A plugin packages one or more skills, optional reference documents, and optional pack profiles into a versioned, installable bundle. A skill can also be installed independently as a skill plugin (a plugin of type `skill` that contains exactly one skill directory).

The plugin layer handles installation mechanics — copying skill directories, injecting CLAUDE.md trigger lines, resolving dependencies. The skill layer handles behavior. These concerns are separate.

### 1.3 Distinction from Claude's built-in tools

Claude's built-in tools (Read, Write, Bash, Grep, Agent, etc.) are code execution units: they take structured inputs, perform a defined operation, and return output. A skill is not a tool.

A skill is a **behavior pattern**: a complete set of instructions telling Claude when to activate and how to behave across a turn or multi-step interaction. A skill may call many tools during execution. Tools are primitives; skills are policies built on top of those primitives.

| Dimension | Built-in tool | Skill |
|-----------|--------------|-------|
| Defined as | JSON schema + runtime | SKILL.md markdown |
| Activation | Explicit tool call | Description match + slash command |
| Execution | Runtime process | Claude following instructions |
| State access | Direct file I/O | Routed through `project-state` |
| Versioned by | Claude Code release | Skill author (semver in frontmatter) |

### 1.4 The skill contract

A skill makes two promises:

1. **Dispatch contract** — the `description` field accurately describes the conditions under which this skill should be invoked. Claude uses this field as the primary matching signal. If the description is accurate, Claude will activate the skill for the right user requests and not activate it for the wrong ones.

2. **Behavior contract** — the SKILL.md body defines the complete behavior: what inputs are read, what outputs are produced, what steps are followed, and what Claude returns. When Claude follows these instructions faithfully, the user gets a consistent, predictable outcome.

A skill that violates either contract — by having an inaccurate description or an ambiguous body — degrades the entire suite's reliability.

---

## 2. SKILL.md frontmatter schema

Every SKILL.md begins with a YAML frontmatter block delimited by `---`. The block must be syntactically valid YAML. Fields not listed below are ignored by the installer and by Claude.

### 2.1 Full annotated schema

```yaml
---
name: project-orchestrator           # (required) matches parent directory slug
description: "..."                   # (required) ≤1024 chars; see §4
plugin: "project-state-suite"        # (optional) parent plugin id
version: "2.0.1"                     # (optional) semver; inherits from plugin.yaml if omitted
tier: P2                             # (optional) P0 | P1 | P2 | P3
depends_on:
  skills:                            # (optional) slugs that must be loaded first
    - project-state
    - project-milestone-manager
surfaces:                            # (optional) external surfaces this skill touches
  - slack
  - gmail-draft
slash_command:                       # (optional) see §8
  trigger: "/project-orchestrator"
  subcommands:
    - name: "--dry-run"
      description: "Preview the action plan without executing"
    - name: "--only-step <n>"
      description: "Run only the nth decision-loop step"
  examples:
    - "/project-orchestrator"
    - "/project-orchestrator --dry-run"
---
```

### 2.2 Field reference

| Field | Required | Type | Constraints | Purpose |
|-------|----------|------|-------------|---------|
| `name` | Yes | string | Lowercase, dashes only, no spaces, matches directory name | Primary identifier; used by installer for dependency resolution and CLAUDE.md injection |
| `description` | Yes | string | ≤1024 characters | Primary dispatch signal; see §4 |
| `plugin` | No | string | Lowercase, dashes only | Declares the parent plugin for traceability; omit for à-la-carte installs |
| `version` | No | semver string | e.g. `"2.0.1"` | Overrides plugin version for this skill; if omitted, skill inherits the plugin version |
| `tier` | No | enum | `P0`, `P1`, `P2`, or `P3` | Controls installation order within a suite plugin; see §6 |
| `depends_on.skills` | No | list of strings | Each string is a valid skill slug | Advisory dependency list; installer validates; runtime does not enforce |
| `surfaces` | No | list of enum | `slack`, `gmail-draft`, `calendar`, `scsiwyg`, `project-website` | Informational; no runtime enforcement; used in user-facing help |
| `slash_command` | No | object | See §8 | Metadata for CLAUDE.md injection and `--help` output |
| `slash_command.trigger` | Conditional | string | Must begin with `/`; must match `/<name>` | Required if `slash_command` block is present |
| `slash_command.subcommands` | No | list of objects | Each has `name` and `description` string fields | Documented subcommands and flags |
| `slash_command.examples` | No | list of strings | Full slash command invocations | Used in `--help` output and installer documentation |

### 2.3 Validation rules

- `name` must be identical to the parent directory name. Installer rejects skills where these differ.
- `name` must match `^[a-z][a-z0-9-]+$`. No underscores, no uppercase, no spaces.
- `description` must not exceed 1024 characters. The installer rejects skills that exceed this limit. The loader truncates at 1024 if the installer check is bypassed, which corrupts the dispatch signal.
- `tier` must be one of `P0`, `P1`, `P2`, `P3`. Unknown values are treated as `P3`.
- `depends_on.skills` entries must each resolve to an installed skill slug. The installer warns on unresolved entries; it does not block installation.
- `surfaces` entries must be drawn from the allowed set: `slack`, `gmail-draft`, `calendar`, `scsiwyg`, `project-website`. Unknown values are ignored.
- `version` must be a valid semver string if present: `MAJOR.MINOR.PATCH`.

---

## 3. SKILL.md body structure

The body is markdown that Claude reads as behavioral instructions. It follows the frontmatter block. Claude treats the body as an ordered specification: read it top to bottom, follow the steps in `## Behavior` literally, and return output in the format described in `## Output format`.

### 3.1 Required sections

The following sections are required in every SKILL.md, in this order:

```
## Purpose
## Trigger phrases
## Inputs
## Outputs
## Behavior
## Output format
## Error handling
```

Deviating from this order is permitted only if a compelling structural reason exists. The installer does not validate section presence or order, but Claude's behavior quality degrades when sections are missing.

### 3.2 Section specifications

**`## Purpose`**

One paragraph. States what this skill does and why it exists in terms of the problem it solves, not the steps it takes. Answers: "what would break or be worse if this skill didn't exist?"

Do not list steps or enumerate behavior here. Do not duplicate the `description` field. This section orients Claude to the skill's role in the suite before reading the detailed instructions.

---

**`## Trigger phrases`**

Bulleted list of natural-language phrases a user might say to activate this skill. These supplement the `description` field by giving Claude additional matching signal in a scannable format.

Requirements:
- Minimum 5 trigger phrases.
- Mix of imperative, interrogative, declarative, and system-event forms (see §5.5).
- Include the canonical slash command as a trigger phrase.
- Do not repeat phrases verbatim from `description`; include natural variants.

```markdown
## Trigger phrases

- "what should I do today / this week"
- "run the project" / "run the orchestrator"
- "morning briefing" / "daily briefing"
- "what's pending" / "what needs attention"
- "are there any deadlines coming up"
- `/project-orchestrator`
```

---

**`## Inputs`**

Lists everything this skill reads before or during execution:

- **Current working directory** — used to locate `.project-state/` by walking up.
- **`.project-state/` paths** — list specific files or directories consulted, e.g. `state.json`, `manifest.yaml`, `milestones/*.yaml`. Do not say "all files"; be specific.
- **User-provided arguments** — any args passed after the slash command, or extracted from the user's message.
- **Pack profiles** — if the skill requires a pack profile, name the profile file, e.g. `profiles/review-meeting.yaml` from the active pack.
- **Environment or context** — current date/time if calendar-aware; Claude's conversation history if relevant.

Format as a bulleted list or a small table.

---

**`## Outputs`**

Lists everything this skill produces:

- **Files created or updated** — with paths relative to the project root, e.g. `.project-state/milestones/M03-slug.yaml`.
- **Surfaces touched** — reference the `surfaces` frontmatter values and describe what is posted/drafted.
- **Artifacts produced** — reports, documents, or structured data returned to the user.
- **Activity log entries** — every write-capable skill must note that it appends to `logs/activity.ndjson` via `project-state`.

If the skill is read-only, state that explicitly.

---

**`## Behavior`**

The core of the SKILL.md. Step-by-step instructions Claude follows to execute the skill. Written as numbered steps when order matters; bulleted when steps are parallel or conditional.

Requirements:
- Each step is a discrete, verifiable action.
- Conditional logic is written as explicit if/else branches, not implied.
- All state I/O is described as calls to `project-state`, not as direct file operations.
- Decision points that require user input are clearly marked.
- The step sequence leads unambiguously to the `## Output format`.

```markdown
## Behavior

1. Locate `.project-state/` by walking up from cwd. If not found, go to ## Error handling / missing state.
2. Via `project-state`, read `state.json` for current phase, health, and pointers.
3. Via `project-state`, read `manifest.yaml` for project metadata.
4. Compute deadline windows from today's date.
5. ...
```

---

**`## Output format`**

Defines the exact structure of what Claude returns to the user at the end of execution. Must include a concrete example in a code block or formatted markdown block. Claude uses this section as a template — the output must conform to the format shown.

```markdown
## Output format

Return a prioritized action list in this exact format:

    # Orchestrator — YYYY-MM-DD

    ## Urgent
    - <item> → run `/project-<skill>`

    ## This week
    - <item> → run `/project-<skill>`

    ## On deck
    - <item>

    ---
    What would you like to do first?

If nothing requires attention, return:

    # Orchestrator — YYYY-MM-DD
    Nothing requires attention today. Next event: <description> on <date>.
```

---

**`## Error handling`**

Specifies what Claude does when preconditions are not met. Must cover at minimum:

1. **Missing state** — `.project-state/` not found or `manifest.yaml` missing.
2. **Missing pack profile** — for pack-required skills, what to return when no active pack is configured.
3. **Surface unavailable** — for each surface in `surfaces`, what to do if the surface call fails (e.g. Slack post fails, Gmail draft fails).
4. **Invalid or partial input** — missing required args, malformed args, ambiguous user intent.

Each case specifies: what Claude detects, what Claude says to the user, and whether execution continues or stops.

```markdown
## Error handling

**Missing state**: if no `.project-state/manifest.yaml` is found walking up from cwd, stop and return:
> No `.project-state/` found. Run `/project-scaffolder` to initialize one.

**Missing pack profile**: if this skill requires a pack profile and none is active, return a partial result with a warning:
> Warning: no active pack configured. Funder-specific deadlines are unavailable. Run `/project-scaffolder` with a pack to enable full functionality.

**Surface unavailable**: if a Slack post fails, log the failure to the activity log and inform the user. Do not retry automatically. Return the artifact as text so the user can post it manually.
```

### 3.3 Optional sections

Optional sections may appear after `## Error handling` in any order:

| Section | Use |
|---------|-----|
| `## Subcommands` | Detailed documentation for each subcommand/flag. Required if the skill has non-trivial subcommands not fully described in `## Behavior`. |
| `## Examples` | Full worked examples: user input, what Claude does, what Claude returns. |
| `## Context documents` | Reference documents Claude should read before executing. Use absolute paths or paths relative to the skill's install dir. |

### 3.4 Section ordering summary

```
[frontmatter]
# Skill Name                   ← H1 title (matches name)

## Purpose                     ← required
## Trigger phrases             ← required
## Inputs                      ← required
## Outputs                     ← required
## Behavior                    ← required
## Output format               ← required
## Error handling              ← required

## Subcommands                 ← optional
## Examples                    ← optional
## Context documents           ← optional
```

---

## 4. The description field

The `description` frontmatter field is the primary signal Claude uses to decide whether to invoke a skill when a user sends a message. It is the most operationally critical field in the entire SKILL.md.

### 4.1 The 1024-character hard limit

The field must not exceed 1024 characters. This is not a style guideline — it is a constraint imposed by the skill loading system. The installer validates and rejects skills that exceed this limit. If the installer check is bypassed, the runtime loader truncates the field at 1024 characters without warning, which silently corrupts the dispatch signal by removing the tail of the description.

The 1024-character limit exists because:
- The description is embedded in Claude's system context for every turn.
- Multiple skills are loaded simultaneously; each description contributes to context length.
- The suite has 19 skills; total description budget is ~19KB before other system context.
- Descriptions beyond this length show diminishing dispatch returns: the information that drives matching fits comfortably within 1024 characters when written well.

### 4.2 Anatomy of a good description

A well-formed description has four parts in this order:

**1. Job statement** — one sentence naming the skill's primary function. Tells Claude what this skill is for when scanning all loaded skills.

**2. Trigger phrases** — verbatim phrases a user would say. These are the most important part. Claude matches user messages against loaded descriptions; trigger phrases appear verbatim in user messages. Include at least 5 natural variants. Cover imperative, interrogative, and declarative forms.

**3. Key entities** — the primary state objects this skill reads or writes. Names like `manifest.yaml`, `milestones`, `state.json`, or surface names like `Slack` help Claude associate this skill with requests that mention those entities.

**4. Scope limiter** — one sentence that tells Claude when *not* to use this skill, reducing false-positive activations. Typically: "Do not use for X — use `project-other-skill` instead."

### 4.3 Reference: the `project-orchestrator` description

```
The conductor of the project-* skill suite. Decides what to do next based on current
state + the calendar (day of week, proximity to quarterly claim deadlines, SC meeting
cadence, phase gate status, overdue milestones, annual questionnaire). Use whenever the
user says 'what should I do today', 'what should I do this week', 'run the project',
'what's pending', 'what needs attention', 'morning briefing for the project', 'are there
any deadlines coming up', 'what's the orchestrator saying', 'run the weekly routine',
'run the daily routine', 'kickoff the day', or any request asking the project to tell
itself what to do next. Invokes other project-* skills as needed and hands decisions
back to the user for approval. Thin by design — this skill routes, it does not do the
work itself.
```

This description is 736 characters. It opens with a job statement, lists 10 trigger phrases verbatim in quotes, names the key calendar entities, and ends with scope-limiting language ("routes, it does not do the work itself").

### 4.4 Bad description patterns

| Pattern | Problem | Example of the failure |
|---------|---------|----------------------|
| Too short | No trigger phrases; Claude cannot match user messages | `"Runs the orchestrator for project-state."` (58 chars — no matching signal) |
| Too long | Truncation corrupts the dispatch contract | 1500-char description loses its scope limiter, causing false-positive activations |
| Too generic | Matches everything; activates on unrelated requests | `"Helps with project management tasks."` |
| Too specific | Misses natural variants; users can't activate without knowing the exact phrase | Listing only `/project-orchestrator` with no natural language triggers |
| No scope limiter | Bleeds into adjacent skills | Description for `project-status-reporter` that doesn't say "Do not use for state reads — use `project-state`" |
| Passive voice only | Claude cannot map imperative user commands | "Can be invoked to generate reports" vs. "Use when user says 'generate the weekly report'" |

### 4.5 Description template

```
<One sentence job statement.> Use when the user says '<trigger phrase 1>',
'<trigger phrase 2>', '<trigger phrase 3>', '<trigger phrase 4>', '<trigger phrase 5>',
or any request involving <key entities>. Do not use for <out-of-scope use case> —
use `<other-skill>` instead.
```

---

## 5. Trigger phrase model

### 5.1 How Claude activates a skill

When a user sends a message, Claude reads all loaded skill descriptions and selects the best-matching skill. The match is semantic, not exact-string: Claude looks for intent alignment between the user's message and the description content.

This means trigger phrases must be:
- **Verbatim** — written exactly as a user would speak them, not paraphrased into formal language.
- **Varied** — covering multiple ways a user might express the same intent.
- **Representative** — drawn from how actual users request the behavior, not from the skill author's internal terminology.

### 5.2 Explicit slash commands vs. implicit trigger phrases

Slash commands (`/project-orchestrator`) give precision: the user knows exactly which skill to invoke and invokes it directly. Trigger phrases give naturalness: the user describes what they want in plain language and Claude selects the right skill.

Both mechanisms coexist and are complementary:

| Mechanism | User experience | When it works best |
|-----------|----------------|-------------------|
| Slash command | Deterministic; no ambiguity | Power users; scripted workflows; subcommand dispatch |
| Trigger phrase | Conversational; discoverable | New users; exploratory requests; multi-skill delegation |

A skill that only registers a slash command fails new users who don't know the command exists. A skill that only relies on trigger phrases fails power users who want predictable dispatch. Both are required.

### 5.3 Registration of both mechanisms

The slash command is registered in CLAUDE.md via the installer (see `EXTENSIBILITY-SPEC.md §4`). Trigger phrases are embedded in the `description` field and optionally repeated in `## Trigger phrases` in the body.

Both the `description` field and the `## Trigger phrases` body section contribute to Claude's matching. The `description` is the primary signal (loaded at context start); the `## Trigger phrases` section reinforces matching once the skill body is read.

### 5.4 Minimum trigger phrase requirements

Every skill must have:
- The canonical slash command (e.g. `/project-orchestrator`)
- At least 5 natural-language trigger phrases
- At least one phrase in each of these forms (see §5.5)

The 5-phrase minimum is validated informally by the skill author; the installer does not count phrases.

### 5.5 Trigger phrase taxonomy

| Form | Pattern | Example |
|------|---------|---------|
| Imperative | Verb + object | "run the weekly report", "generate the status pack" |
| Interrogative | Question | "what should I do today", "what's pending", "is anything at risk" |
| Declarative | State announcement | "I just completed milestone M03", "the MPA has been signed" |
| System-event | Temporal or event trigger | "on every Monday morning", "when a claim is due" |
| Slash | Explicit command | `/project-orchestrator`, `/project-status-reporter weekly` |

A description and `## Trigger phrases` section should include phrases from at least three of these five forms.

---

## 6. Dependency model

### 6.1 Advisory vs. enforced

Dependencies declared in `depends_on.skills` are **advisory at runtime** and **enforced at install time**.

- The installer reads the dependency list, resolves each slug to an installed skill, and warns on any missing dependency. It does not block installation — it surfaces the gap for the user to resolve.
- At runtime (during a conversation), Claude does not check whether declared dependencies are loaded. If a skill invokes `project-state` but that skill's SKILL.md is not loaded, the call will fail or produce unexpected behavior.

This means the installer check is the only enforcement gate. Skills must not assume runtime enforcement.

### 6.2 The P0 → P1 → P2 → P3 DAG

The tier system encodes a directed acyclic graph of dependencies. Lower tiers have fewer or no dependencies; higher tiers depend on everything below them.

```
P0 — no dependencies
  project-state          (memory layer; all other skills route through this)
  project-scaffolder     (initializer; reads no pre-existing state)

P1 — depends on project-state
  project-phase-gate
  project-document-curator
  project-milestone-manager
  project-status-reporter   (also depends on project-milestone-manager)

P2 — depends on project-state + relevant P1 skills
  project-orchestrator      (depends on all P1 skills)
  project-notifier          (depends on project-state)
  project-review-meeting    (depends on project-state, project-notifier)
  project-funder-reporting  (depends on project-state, project-notifier; pack required)
  project-change-register   (depends on project-state, project-notifier)
  project-blog-publisher    (depends on project-state, project-notifier)
  project-website-publisher (depends on project-state)

P3 — depends on project-state + project-notifier
  project-onboarder
  project-ip-tracker        (pack required)
  project-external-comms    (pack required)
  project-lessons
  project-archive           (pack required)
```

P0 skills must declare no `depends_on.skills`. P1 skills must declare at minimum `[project-state]`. P2 and P3 skills must declare `project-state` and any P1 or P2 skills they invoke.

### 6.3 How a skill discovers its dependencies at runtime

Skills do not read `.project-state/` files directly. A skill that needs state calls `project-state` (via the Skill tool or by directing Claude to invoke that skill's behavior). `project-state` handles all file I/O.

This is the **single-route-through-state-layer rule**: all reads from and writes to `.project-state/` must go through the `project-state` skill. No other skill may use Read, Write, or Bash to access `.project-state/` files directly.

This rule exists to enforce:
- Schema validation on every write
- Lockfile acquisition on every mutation
- Activity log entries for every state change
- Optimistic concurrency (last_modified check)

A skill body that contains `Read .project-state/milestones/M03-slug.yaml` directly violates this rule. The correct instruction is: "Via `project-state`, get milestone M03."

### 6.4 Declaring dependencies correctly

```yaml
# Correct: project-status-reporter (P1)
depends_on:
  skills:
    - project-state
    - project-milestone-manager

# Correct: project-orchestrator (P2)
depends_on:
  skills:
    - project-state
    - project-phase-gate
    - project-document-curator
    - project-milestone-manager
    - project-status-reporter

# Incorrect: P1 skill with no depends_on
depends_on: {}   # Missing required project-state dependency
```

---

## 7. Surface declarations

### 7.1 Allowed surface values

| Value | Surface | Description |
|-------|---------|-------------|
| `slack` | Slack | Post messages or alerts to Slack channels |
| `gmail-draft` | Gmail | Create draft emails; never auto-send |
| `calendar` | Google Calendar | Create proposed holds and invites |
| `scsiwyg` | scsiwyg blog | Publish or update blog posts (publication-review-respecting) |
| `project-website` | Project website | Deploy or update the static project website |

### 7.2 What declaring a surface means

Declaring a surface in frontmatter is **informational**. It:
- Tells the installer which surfaces the skill touches, enabling the installer to surface this in help text.
- Tells the user (via `/project-<skill> --help`) what external systems will be contacted.
- Is used in documentation generation and the reporting matrix.

It does not:
- Grant Claude permission to use the surface.
- Restrict the skill from using undeclared surfaces.
- Trigger any runtime enforcement.

Skill authors should declare all surfaces the skill contacts, even if the contact is conditional (e.g., "posts to Slack only if a channel is configured in manifest.yaml"). Under-declaration misleads users; over-declaration has no negative effect.

### 7.3 Send semantics per surface

The following semantics apply across all skills. These are not surface-level choices — they are system-level policies. Skills must honor them in their `## Behavior` instructions.

| Surface | Semantics | Skill instruction pattern |
|---------|-----------|--------------------------|
| `slack` | Auto-post after user approval | "Show the Slack message to the user; post it only after they confirm" |
| `gmail-draft` | Always draft; never auto-send | "Create a Gmail draft. Do not send. Inform the user the draft is ready for review." |
| `calendar` | Proposed hold + invite; not confirmed | "Create a calendar hold. Mark it as proposed. Inform the user to confirm or adjust." |
| `scsiwyg` | Respect publication-review gate | "Check whether the document has completed publication review before publishing. If not, draft only." |
| `project-website` | Auto-deploy on `doc.published` | "Deploy when the document status is `published`. Do not deploy drafts." |

Skills that auto-send email, auto-publish without review, or auto-confirm calendar events violate the review-not-author design principle and must be corrected.

---

## 8. Slash command metadata block

### 8.1 Schema

```yaml
slash_command:
  trigger: "/project-orchestrator"      # (required if block present) canonical /slug form
  subcommands:                          # (optional) list of flag/subcommand objects
    - name: "--dry-run"
      description: "Preview the action plan without writing any state or sending to surfaces"
    - name: "--only-step <n>"
      description: "Execute only step n of the decision loop (1-indexed)"
    - name: "--help"
      description: "Return the skill's usage summary"
  examples:                             # (optional) full invocation examples
    - "/project-orchestrator"
    - "/project-orchestrator --dry-run"
    - "/project-orchestrator --only-step 3"
```

### 8.2 Field constraints

| Field | Type | Constraint |
|-------|------|-----------|
| `trigger` | string | Must begin with `/`; must be `/` + the skill `name`; no spaces |
| `subcommands[].name` | string | Convention: `--kebab-case` for flags; bare word for named subcommands |
| `subcommands[].description` | string | One sentence; ≤120 characters |
| `examples[]` | list of strings | Each string is a complete, valid invocation |

### 8.3 The `--help` subcommand

Every skill must support `--help` as an implicit subcommand even if not declared in frontmatter. When the user invokes `/project-<skill> --help`, Claude returns:

```
# /project-<skill>

<purpose paragraph from ## Purpose>

## Usage
/project-<skill> [subcommand]

## Subcommands
--dry-run       <description>
--only-step <n> <description>
--help          Show this message

## Examples
/project-<skill>
/project-<skill> --dry-run

## Surfaces
- slack
- gmail-draft
```

This output is constructed from the SKILL.md content; it is not a static string.

### 8.4 How this metadata is consumed

**By the installer**: the `trigger` value generates the CLAUDE.md trigger line. The installer extracts the trigger and the parent `name` field to produce:

```markdown
- **project-orchestrator** — <description excerpt>. Trigger: `/project-orchestrator`
```

**By Claude at runtime**: when the user invokes `--help` or asks what a skill does, Claude reads the `slash_command` block from the loaded SKILL.md to produce the help output.

**By documentation tools**: the `examples` list is used to generate API documentation, onboarding guides, and skill catalogs.

---

## 9. Skill lifecycle

### 9.1 Install

The installer places the skill directory at `SKILLS_DIR/<slug>/SKILL.md` where `SKILLS_DIR` defaults to `~/.claude/skills`. The installer:

1. Validates the frontmatter schema (name match, description length, tier, semver).
2. Resolves `depends_on.skills` entries against the set of skills being installed; warns on gaps.
3. Writes the skill directory to `SKILLS_DIR`.
4. Injects the trigger line into `~/.claude/CLAUDE.md` within the plugin's sentinel block.

### 9.2 Load

At the start of each conversation, Claude reads all SKILL.md files in `SKILLS_DIR`. Each file's `description` frontmatter field is indexed as a dispatch signal. The body is available for reading once the skill is activated.

Loading is passive — it does not execute any skill behavior. Skills do not run code at load time.

### 9.3 Dispatch

When a user sends a message, Claude evaluates all loaded skill descriptions against the message. The best-matching skill is activated. Activation means Claude commits to following that skill's SKILL.md body instructions for the current turn.

If no skill matches, Claude responds without skill guidance.

If the user sends an explicit slash command (e.g. `/project-orchestrator`), Claude activates the named skill directly without description matching. This is deterministic.

### 9.4 Execute

With the skill activated, Claude:

1. Reads the SKILL.md body sections in order.
2. Parses the user's message for any arguments, subcommands, or flags described in `## Inputs`.
3. Follows the step-by-step instructions in `## Behavior`.
4. Routes all state reads and writes through `project-state` per the single-route rule (§6.3).
5. Handles errors per `## Error handling` if preconditions fail.
6. Formats the result per `## Output format`.

Claude may call multiple tools (Read, Write, Bash, Agent, Skill) during execution. Tool calls are implementation details of following the SKILL.md instructions; they are not visible to the user unless the skill's output format includes tool call transcripts.

### 9.5 Return

Claude returns the output to the user in the format defined by `## Output format`. The format section defines the contract; the exact content varies per invocation.

If the skill produces artifacts (files, reports, surface posts), they are produced before the return message. The return message summarizes what was done and lists any artifacts produced.

### 9.6 State update

After any write operation, `project-state` appends an entry to `logs/activity.ndjson`. This is not the skill's responsibility to invoke explicitly — it is part of the `project-state` write protocol. Skills that instruct "write X" are implicitly also instructing "log the write event," because `project-state` handles both.

Skills must not write directly to `logs/activity.ndjson`. Activity log entries are produced exclusively by `project-state`.

---

## 10. Writing a new skill — checklist

Use this checklist before declaring a skill ready for installation.

### 10.1 Frontmatter

- [ ] `name` matches the parent directory name exactly (case-sensitive, character-for-character)
- [ ] `name` matches `^[a-z][a-z0-9-]+$` — lowercase, dashes, no underscores, no spaces
- [ ] `description` is ≤1024 characters (count before committing)
- [ ] `description` includes ≥5 natural-language trigger phrases in quotes
- [ ] `description` opens with a one-sentence job statement
- [ ] `description` ends with scope-limiting language ("Do not use for X")
- [ ] `tier` is declared (`P0`, `P1`, `P2`, or `P3`)
- [ ] `depends_on.skills` lists every upstream skill this skill invokes or relies on
- [ ] `surfaces` lists every external system this skill contacts, including conditional contacts
- [ ] `version` is a valid semver string or is omitted (inheriting from plugin)
- [ ] `slash_command.trigger` matches `/<name>`
- [ ] At least one `slash_command.examples` entry is present

### 10.2 Body sections

- [ ] `## Purpose` is present and is one paragraph (not a list, not steps)
- [ ] `## Trigger phrases` is present with ≥5 phrases covering ≥3 trigger forms (§5.5)
- [ ] `## Inputs` lists every file path, argument, and pack profile the skill reads
- [ ] `## Outputs` lists every file written, surface touched, and artifact produced
- [ ] `## Behavior` is step-by-step with no ambiguous branching
- [ ] Every state I/O in `## Behavior` is expressed as a call to `project-state`, not a direct file operation
- [ ] `## Output format` includes a concrete example in a code block
- [ ] `## Error handling` covers: missing state, missing pack profile (if applicable), surface unavailable (for each declared surface), invalid input

### 10.3 Design rules

- [ ] The skill does exactly one coherent job (not two jobs that could be separate skills)
- [ ] The skill does not route through `project-orchestrator` — it is invoked by `project-orchestrator`, not the reverse
- [ ] Every surface contact respects the send semantics in §7.3 (no auto-sends, no bypassing review gates)
- [ ] The skill routes all file I/O through `project-state` — no direct Read/Write calls to `.project-state/` paths
- [ ] If the skill requires a pack profile, it degrades gracefully without one (warning, not crash)

### 10.4 Validation

Run the following checks before submitting the skill:

```bash
# Check description length
python3 -c "
import re, sys
with open('skills/<slug>/SKILL.md') as f:
    content = f.read()
m = re.search(r'^description: [\"\'](.*?)[\"\']', content, re.MULTILINE | re.DOTALL)
if m:
    desc = m.group(1)
    print(f'Description: {len(desc)} chars')
    if len(desc) > 1024:
        print('FAIL: exceeds 1024 char limit')
        sys.exit(1)
    else:
        print('OK')
"

# Check name matches directory
python3 -c "
import re, sys, os
slug = os.path.basename(os.path.dirname(os.path.abspath('skills/<slug>/SKILL.md')))
with open('skills/<slug>/SKILL.md') as f:
    content = f.read()
m = re.search(r'^name: (.+)$', content, re.MULTILINE)
name = m.group(1).strip() if m else ''
if name != slug:
    print(f'FAIL: name \"{name}\" does not match directory \"{slug}\"')
    sys.exit(1)
print('OK: name matches directory')
"
```

---

## Appendix A — Minimal conforming SKILL.md

```yaml
---
name: project-example
description: "Example skill for the project-state suite. Demonstrates the minimum conforming SKILL.md structure. Use when the user says 'run the example', 'show me the example skill', 'test the example', 'invoke project-example', or '/project-example'. Reads manifest and returns a summary. Do not use for any real project operations — this is a reference implementation only."
plugin: "project-state-suite"
version: "1.0.0"
tier: P1
depends_on:
  skills:
    - project-state
surfaces: []
slash_command:
  trigger: "/project-example"
  subcommands:
    - name: "--help"
      description: "Show usage summary"
  examples:
    - "/project-example"
    - "/project-example --help"
---

# Project Example

## Purpose

Demonstrates the minimum conforming structure for a project-state-suite skill. This skill reads the project manifest and returns a one-line summary. It exists as a reference implementation and conformance check — not for production use.

## Trigger phrases

- "run the example"
- "show me the example skill"
- "test the example"
- "invoke project-example"
- `/project-example`

## Inputs

- `.project-state/manifest.yaml` — read via `project-state` to get project name and current phase.
- No user arguments required.
- No pack profile required.

## Outputs

- No files written.
- No surfaces touched.
- Returns a one-line summary to the user.

## Behavior

1. Locate `.project-state/` by walking up from cwd. If not found, go to Error handling.
2. Via `project-state`, read `manifest.yaml`.
3. Extract `project.name` and `state.current_phase`.
4. Return the output per Output format.

## Output format

    Project: <project.name>
    Phase: <state.current_phase>
    State: healthy

## Error handling

**Missing state**: if no `.project-state/manifest.yaml` is found, return:
> No `.project-state/` found. Run `/project-scaffolder` to initialize one.

**Invalid manifest**: if `manifest.yaml` cannot be parsed, return:
> `manifest.yaml` could not be parsed. Run `/project-state validate` to diagnose.
```

---

## Appendix B — Description field word budget guide

With a 1024-character budget, a well-structured description allocates approximately:

| Part | Characters | Words (approx.) |
|------|-----------|----------------|
| Job statement (1 sentence) | 80–120 | 12–18 |
| Trigger phrases (5–8 phrases) | 300–500 | 40–70 |
| Key entities (2–4 names) | 60–100 | 8–15 |
| Scope limiter (1 sentence) | 80–120 | 12–18 |
| **Total** | **520–840** | **72–121** |

This budget leaves 184–504 characters of headroom — enough to add 2–4 additional trigger phrases if needed, but not enough to add full paragraphs of explanation. Explanation belongs in `## Purpose`, not in `description`.

---

## Appendix C — Surface send semantics reference card

| Surface | Auto-send? | User approval required? | Draft survives session? |
|---------|-----------|------------------------|------------------------|
| `slack` | No | Yes — user must confirm before post | No — must be re-posted |
| `gmail-draft` | Never | N/A — always draft | Yes — stays in Gmail Drafts |
| `calendar` | No | Yes — user confirms or adjusts | Yes — holds persist until confirmed |
| `scsiwyg` | Conditional | Required if publication review gate is active | Yes — saved as draft |
| `project-website` | On `doc.published` | Implicit (user set status to published) | N/A — deploy is final |
