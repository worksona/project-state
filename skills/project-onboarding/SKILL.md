---
name: project-onboarding
description: "Guided onboarding experience for new project-state instances. Runs nine chapters — pack selection, project identity, document ingestion, stakeholder mapping, milestone capture, goals and examples, gap handling, substrate initialization, and orientation check — through interleaved prose and targeted questions. Extracts structure from uploaded documents when available. Offers research synthesis for gaps only after asking. Writes references/goals.md and references/examples/ as first-class substrate entities. Feeds all captured inputs to project-scaffolder. Use when starting a new project or re-orienting an existing one. Trigger on: 'set up project-state', 'onboard this project', 'initialize my project', 'I am new to project-state', 'configure this project', 'start the setup'."
---

# Project Onboarding

## Purpose

Orient a new project-state instance around a specific project with enough context that every skill in the suite produces grounded, authentic output rather than plausible-but-generic output.

This skill does two distinct things that `project-scaffolder` does not:

1. **Intake** — collect context through guided conversation, document analysis, and goals elicitation before any files are written
2. **Orient** — write that context into the substrate as first-class entities (`references/goals.md`, `references/examples/`, `references/context.md`) so every downstream skill can read it

`project-scaffolder` is the technical initializer. This skill is the user-facing experience that feeds it with content that makes the result worth having.

## Trigger phrases

- "set up project-state" / "onboard this project"
- "initialize my project" / "start the setup"
- "I'm new to project-state" / "configure this project"
- "start fresh" / "new project setup"
- Re-orientation: "re-orient project-state" / "update the project context"

## The nine chapters

Run in sequence. Each chapter begins with prose the user sees — explaining what is being collected and why — before asking anything. Collect inputs in the order below. Do not skip chapters; offer to return to any chapter if the user wants to add more later.

At the start of each chapter, display a progress marker:

```
── Chapter N of 9: [Chapter Name] ──────────────────────────────
```

---

### Chapter 0 — Welcome

**Prose to present:**

> Welcome to project-state setup. This process will orient the system around your specific project so that every report, claim draft, milestone update, and stakeholder communication it produces is grounded in your actual context — not generic placeholders.
>
> We'll work through nine short chapters. Some will take two minutes; some will take ten if you have a lot to share. You can go deep or stay shallow — the system will tell you where gaps remain.
>
> **The single most valuable thing you can do right now is share documents.** If you have a proposal, a Master Project Agreement, a Statement of Work, a milestone schedule, a previous report you liked, or anything that describes what this project is and what it should produce — share it before we begin. The system will extract what it can and skip questions you've already answered.
>
> Do you have any documents to share now?

**Collect:**
- Any files, paths, or pasted content the user provides
- Accept: proposals, SOWs, MPAs, milestone schedules, reports, org charts, example outputs, previous claims, anything
- If nothing is provided: acknowledge and continue — "No problem. We'll build context through conversation."

**Process documents immediately** (before Chapter 1):
- For each document, identify its type: `governing_document | proposal | milestone_schedule | stakeholder_list | example_output | previous_report | other`
- Extract whatever is findable: project name, dates, milestones, stakeholder names, funder details, budget figures, goals
- Documents tagged `example_output` or `previous_report` are staged for `references/examples/` — do not extract structure, preserve as-is
- Present a brief extraction summary: "From your documents I found: [list]. I'll ask about the gaps."
- Mark extracted fields as `source: document` in the working intake record

---

### Chapter 1 — Pack Selection

**Prose to present:**

> Project-state adapts its behavior through compliance packs. Each pack configures how the system handles a specific kind of relationship — a government funder, a paying customer, investors, or a regulatory obligation.
>
> Packs are additive. A project funded by a government grant that also has a client and files SR&ED would load three packs. The system handles all of them simultaneously.
>
> Let me ask a few questions to recommend the right combination.

**Ask the following questions in sequence.** Each question should be asked in natural prose — not as a numbered list. Wait for an answer before asking the next one.

**Q1.1 — Government funder:**
> Does this project receive funding from a government program, grant, or public research body?

- Yes → Q1.1a: Is it a Canadian federal program?
  - Yes → Q1.1b: Which funder program is it?
    - Determine which funder pack applies (e.g., `pic-pcais` for PIC/PCAIS, `sred-canada` for SR&ED) and add it. Present a one-line description of what that pack configures.
    - If no matching pack exists: note the program name and continue. Present: "I don't have a production pack for that program yet, but the core skills still work. You can configure the funder-reporting profile manually."
  - No → note the program; similar guidance.
- No → skip government funder packs.

**Q1.2 — Customer or client:**
> Does this project have a paying customer or client — someone outside your organization receiving deliverables and paying for them?

- Yes → add `client-services`. Present: "The Client Services pack will configure the suite for monthly invoicing, Quarterly Business Reviews, customer signoff gates, and customer-confidentiality review."
- No → skip.

**Q1.3 — Board or investors:**
> Does your organization report to a board of directors or investors on this project's progress?

- Yes → add `board-investor`. Present: "The Board/Investor pack will configure board meeting lifecycle, monthly investor updates with KPI snapshots, and board pack assembly."
- No → skip.

**Q1.4 — Agile delivery:**
> Does your team work in sprints or iterative cycles — Scrum, Kanban, or similar?

- Yes → add `agile-default`. Present: "The Agile pack will configure sprint cadence, retrospective lifecycle, and a sprint phase model."
- No → skip.

**Q1.5 — Open source:**
> Is this project an open-source or community-governed project?

- Yes → add `open-source-community`. Present: "The Open-Source pack will configure community RFC review, contributor recognition, and a maintenance phase model."
- No → skip.

**Q1.6 — SR&ED (Canada only):**
> Is your organization Canadian, and does this project involve work that might qualify as Scientific Research or Experimental Development — meaning technical work where the outcome was genuinely uncertain and required systematic investigation?

- Yes → add `sred-canada`. Present: "The SR&ED pack will extend the substrate with technological uncertainty, experiment, and advancement records and help you build a T661 narrative continuously — so your claim is built from contemporaneous records rather than reconstructed at year-end."
- No → skip.
- Unsure → Present: "SR&ED eligibility can be tricky. If any of your project's technical work involved genuine uncertainty — you couldn't look up the answer, had to experiment — it might qualify. You can add the sred-canada pack now and nothing forces you to file; it just starts capturing. Want to add it provisionally?"

**Confirmation:**
> Based on your answers, I recommend loading: [list]. Here's what each adds. Does this look right, or would you like to add or remove anything?

Present the full recommended combination with a one-line description of each pack's contribution. Confirm before proceeding.

Write the confirmed pack selection to the working intake record.

---

### Chapter 2 — Project Identity

**Prose to present:**

> Now let's establish the stable identity of this project — the facts that appear on every document the system generates.
>
> If your documents already answered some of these, I'll show you what I found and just ask you to confirm or correct.

**Collect the following, presenting extracted values first where available:**

| Field | What to ask | Notes |
|-------|-------------|-------|
| `project.short_name` | What's the short name or code for this project? | e.g., "Proj-001", "Project Volta" |
| `project.long_name` | What's the full formal title? | As it appears in the governing document |
| `project.one_liner` | In your own words — one or two sentences — what is this project? | Freeform. This is used in every public-facing document. Do not rewrite it. |
| `project.funder` / `project.customer` | Who is funding or commissioning this work? | Full organization name |
| `project.program` | What program or contract is this under? | e.g., "Consortium AI Program", "Federal Innovation Stream" |
| `governing_document` | What is the primary governing document? | MPA, SOW, Grant Agreement, etc. |
| `dates.project_start` | When does the project start (or when did it)? | YYYY-MM-DD |
| `dates.project_end` | When is the project expected to end? | YYYY-MM-DD |
| `budget.total_project_cad` | What is the total project budget, if you can share it? | Optional — leave blank if sensitive |

After collecting these: "Here's the project identity I've captured. Anything to change?"

Display a clean summary and wait for corrections.

---

### Chapter 3 — Document Drop (Second Invitation)

**Prose to present:**

> Before we go further, I want to make sure I've seen everything that's already written down about this project. Documents — even rough drafts — let me skip questions and give you better output.
>
> Specifically useful at this stage:
> - The governing document (MPA, SOW, grant agreement) — gives me milestones, stakeholders, budget, obligations
> - The original proposal or application — gives me the project rationale, technical approach, team
> - A milestone schedule or work plan — gives me the full milestone list with dates and owners
> - Any previous reports or claims — gives me format and tone reference
> - Any documents you'd like the system to produce outputs that look like — these go directly into references/examples/
>
> If you already shared everything, just say "nothing else" and we'll move on. No pressure — missing documents just means more questions.

**Collect:**
- Additional documents from the user
- Process new documents the same way as Chapter 0: extract structure, stage examples
- Update the extraction summary: "I've now seen: [complete list]. Remaining gaps: [list]."

**If no documents at all have been provided by this point:**
> That's completely fine. We'll build context through conversation. I'll offer to research any gaps at the end, and you can always add documents later — they'll update the substrate and improve output quality as you go.

---

### Chapter 4 — Stakeholder Mapping

**Prose to present:**

> The system routes reports and notifications to specific people in specific formats. To do that well, it needs to know who's involved — not just their names and roles, but enough about them to tailor communication.
>
> We'll map your key stakeholders. You don't need to be exhaustive — just the people who receive outputs from this project.

**For each stakeholder, collect:**

Ask conversationally — not as a form. Example opening: "Let's start with the people inside your organization. Who is the Project Lead — the person ultimately responsible for this project?"

Collect for each person:
- Name + organization
- Role in the project (not just title — what do they do in relation to this project)
- What they receive (which reports, at what cadence)
- Any communication preferences the user knows about ("she prefers bullet points", "he wants technical depth", "they only read the executive summary")
- Contact information (email, Slack handle) — optional

**Do not interrogate every possible field.** Ask for the most important people first:
1. Project Lead (internal)
2. Finance Representative
3. Funder/Customer contact (if applicable)
4. Any pack-specific required roles (e.g., funder PM for pic-pcais, SR&ED advisor for sred-canada)

After the main contacts: "Are there any other people or organizations who receive reports or need to be informed about this project?"

Write each stakeholder as a record in the working intake — they will become entries in `manifest.yaml:consortium.members` and `reporting-matrix.yaml` stakeholder entries.

---

### Chapter 5 — Milestone Capture

**Prose to present:**

> Milestones are the spine of the system. They drive claims, status reports, Steering Committee packs, and the project tracker. If you have a milestone schedule, this chapter is short. If not, we'll build one together.

**If milestones were extracted from documents:** Present the extracted list and ask for confirmation + corrections. "Here are the milestones I found. Do they look right? Any missing, renamed, or reordered?"

**If no milestones were extracted:** Ask conversationally:

> What are the main deliverables or phases of this project? Walk me through what needs to get done, roughly in order.

For each milestone mentioned, collect:
- `title` — as the user describes it
- `owner_org` — which organization owns this deliverable
- `planned_end` — target completion date
- `completion_criteria` — how will you know it's done? (accept prose, summarize if long)
- `description` — brief description of what it involves

After: "Here's the milestone list I've built. Does the sequence and ownership look right?"

**If pack is `sred-canada`:** After milestone confirmation, ask:
> For each of these milestones, does the work involved any genuine technical uncertainty — outcomes that weren't known in advance and required systematic investigation? These would be SR&ED-eligible.

Flag milestones with `sred_eligible: true` and note which ones to create TU records for in the tracker.

---

### Chapter 6 — Goals and Examples

**Prose to present:**

> This is the most important chapter for the quality of what the system produces.
>
> The system can generate technically correct reports from the data it holds. But "technically correct" and "actually useful" are different things. The gap is context — knowing what you care about, what your audience cares about, and what good output looks like for this specific project.
>
> I'm going to ask you three questions. Answer in whatever form feels natural — bullet points, paragraphs, a brain dump. The more you give, the better the output.

**Question 6.1 — Goals (freeform):**
> In your own words: what do you want project-state to do for you? What problem is it solving? What would success look like six months from now?

- Accept any length, any format
- Do not summarize, paraphrase, or restructure the answer
- Save exactly as written to `references/goals.md`

**Question 6.2 — Positive examples:**
> Do you have any examples of output you'd want to model? This could be a past report you thought was excellent, a claim document that worked well, a weekly update that people actually read, a presentation that landed — anything where you thought "that's what I want." Share it here, or describe it.

- If files are shared: save to `references/examples/good/` with a brief metadata header noting what it is
- If described in prose: save the description to `references/examples/good/described-examples.md`
- If nothing: "No problem. You can add examples at any time — the system will pick them up."

**Question 6.3 — Negative examples or anti-patterns:**
> Is there anything you want to avoid? A format that doesn't work for your audience, a tone that feels wrong, a type of output that's been criticized? Even "don't sound like a government form" is useful.

- Save any anti-patterns to `references/examples/avoid/anti-patterns.md`
- If nothing: skip.

**After collecting all three:** Do not attempt to extract structured fields from these answers. Save them as freeform markdown exactly as provided. They are orientation documents, not data.

---

### Chapter 7 — Gaps and Synthesis

**Prose to present:**

> Here's what I have so far, and here's what's still missing.

Present a structured gap report:

```
CAPTURED (from documents and conversation)
──────────────────────────────────────────
✓ Project identity: [fields captured]
✓ Packs: [confirmed list]
✓ Stakeholders: [N records]
✓ Milestones: [N records]
✓ Goals: [yes/no]
✓ Examples: [N examples]

GAPS (not yet captured)
──────────────────────────────────────────
○ [field or category] — needed for [which outputs it affects]
○ ...

SYNTHETIC CONTENT OFFERED
──────────────────────────────────────────
[List any gaps where synthesis could help, with a description of what would be generated]
```

**For each gap, offer one of three paths — ask before doing anything:**

**Path A — User provides now:** "Can you fill this in now?" [answer → capture]

**Path B — Leave as gap:** "We can leave this blank and fill it later. [Field] affects [specific outputs] — those will be incomplete until it's added." [confirm → mark as gap in manifest]

**Path C — Research and synthesize:** "I can research this and generate a synthetic starting point — it will be clearly labeled as synthetic, and you can correct it at any time. It's a starting point, not a source of truth. Want me to try?" 
  - If yes: research and generate, save with `synthetic: true` header and a note explaining what it's based on
  - If no: leave as gap

**Never synthesize without asking.** Never present synthetic content as equivalent to user-provided content.

**Synthesis quality note (present when offering synthesis):**
> A note on synthetic content: the system can generate plausible-sounding context based on what it knows about [project type / funder / industry]. But it won't know your organization's history, your team's preferences, your funder's quirks, or your project's specific rationale. Synthetic content is useful as a starting point to react to — it is not a substitute for real context.

---

### Chapter 8 — Initialize

**Prose to present:**

> We're ready to initialize. Here's a summary of what will be created.

Present a complete pre-flight summary:

```
WILL CREATE
──────────────────────────────────────────
manifest.yaml              — [N fields populated, N from documents, N from conversation, N synthetic]
reporting-matrix.yaml      — seeded from: [pack list]
milestones/                — [N milestone files]
stakeholders/              — [N stakeholder records] (written into manifest)
references/goals.md        — [present/absent]
references/examples/       — [N examples in good/, N in avoid/]
references/context.md      — [present if synthesis was accepted / absent]

PACKS LOADED
──────────────────────────────────────────
[confirmed pack list with one-line role each]

SYNTHETIC CONTENT (will be labeled)
──────────────────────────────────────────
[list any synthetic fields or documents]
```

Ask for explicit confirmation: "Ready to initialize? This will create the `.project-state/` directory structure. You can always add to it — nothing is permanent except the activity log."

**On confirmation:** Call `project-scaffolder` with all captured inputs, passing the working intake record as structured input. Do not re-ask questions that have already been answered.

Report on what was created: "Initialized. Here's what's in `.project-state/` now."

---

### Chapter 9 — Orientation Check

**Prose to present:**

> Let's do a quick check to confirm the system knows what it needs to know.

Run the following checks and present results:

**Check 1 — Identity:** Can the system answer "what is this project" from the manifest? Present the one-liner + funder + phase.

**Check 2 — Milestones:** Show the milestone list with statuses. "Are any of these wrong or missing?"

**Check 3 — Stakeholders:** Show the routing table: "who receives what." Verify at least one recipient per pack's primary report type.

**Check 4 — Orientation quality:** Rate the orientation on three dimensions:
- **Grounding** (0–3): 0 = no documents, 1 = some documents, 2 = governing document + proposal, 3 = full document set
- **Goals clarity** (0–3): 0 = no goals captured, 1 = brief description, 2 = detailed goals + anti-patterns, 3 = goals + positive + negative examples
- **Stakeholder depth** (0–3): 0 = no stakeholders, 1 = names only, 2 = names + roles, 3 = names + roles + preferences

Present as a simple card:
```
Orientation quality
───────────────────
Grounding:    ██░  2/3 — governing document seen; proposal not provided
Goals:        ███  3/3 — goals, positive examples, and anti-patterns captured
Stakeholders: █░░  1/3 — names captured; preferences not yet known

Overall: Good starting point. Outputs will improve as grounding increases.
```

**Check 5 — Suggested first actions:** Based on gaps, offer 2–3 concrete next steps:
- "Add your proposal document to improve milestone extraction"
- "Update M03 with percent_complete — it's currently at 0%"
- "Run `project-orchestrator` to see what's due this week"

**Closing:**
> Setup complete. The system is oriented and ready. You can always improve orientation by adding documents, updating goals, or adding examples — run `project-onboarding re-orient` to revisit any chapter without starting over.

---

## Re-orientation mode

When the user says "re-orient project-state" or runs `project-onboarding re-orient`:

1. Run Chapters 6 and 7 only (goals + examples + gap check)
2. Offer to revisit any other chapter by name
3. Do not re-run initialization unless the user explicitly asks

Re-orientation is appropriate when:
- The project has changed significantly
- New documents are available
- Output quality has degraded and the user wants to improve it
- A new pack is being added mid-project

---

## Working intake record

Throughout the onboarding, maintain a working intake record in memory. This is not written to disk until Chapter 8. It accumulates all captured inputs with source attribution:

```yaml
intake:
  session_date: "YYYY-MM-DD"
  operator: "user@email"

  packs_selected: []

  project:
    short_name: {value: "...", source: "document|conversation|synthetic"}
    long_name: {value: "...", source: "..."}
    one_liner: {value: "...", source: "..."}
    # ... all fields with sources

  stakeholders:
    - name: "..."
      source: "document|conversation"
      # ...

  milestones:
    - title: "..."
      source: "document|conversation"
      # ...

  documents_provided:
    - type: "governing_document"
      reference: "path or description"
      extraction_summary: "..."

  goals_captured: true|false
  examples_captured: true|false
  anti_patterns_captured: true|false

  gaps:
    - field: "..."
      resolution: "left_blank|synthetic|will_provide_later"
```

---

## Output to substrate

On initialization (Chapter 8), write:

| File | Contents |
|------|----------|
| `.project-state/manifest.yaml` | All project identity, dates, budget, consortium, phases, packs_loaded, surfaces — from intake record |
| `.project-state/reporting-matrix.yaml` | Seeded from packs via `project-scaffolder seed-matrix` |
| `.project-state/milestones/M<NN>-<slug>.yaml` | One file per captured milestone |
| `.project-state/references/goals.md` | Exact freeform text from Chapter 6 Q1 — not paraphrased |
| `.project-state/references/examples/good/` | Any positive example documents or descriptions |
| `.project-state/references/examples/avoid/anti-patterns.md` | Any negative examples or anti-patterns |
| `.project-state/references/context.md` | Synthetic context if generated (always labeled `synthetic: true` at top) |
| `.project-state/references/documents-index.md` | Index of all documents provided: type, reference, what was extracted, what was not |
| `.project-state/references/onboarding-intake.yaml` | The full working intake record — audit trail of how the substrate was built |
| `.project-state/state.json` | Initial health, counters, current phase |
| `.project-state/logs/activity.ndjson` | First entry: `onboarding.completed` with summary |

---

## Discipline rules

- **Never skip chapters.** Each chapter builds on the previous. Offer to accelerate ("I can move quickly through this if you want"), never silently omit.
- **Never auto-synthesize.** Always ask before generating synthetic content. Always label synthetic content when generated.
- **Never paraphrase goals or examples.** Chapter 6 content is saved exactly as provided. Its value is the user's voice, not a cleaned-up version of it.
- **Never invent milestone names or stakeholder contacts.** If the user says "there are five milestones but I can't remember the exact names," capture "five milestones, names TBD" rather than generating plausible names.
- **Never present orientation as complete when it isn't.** The orientation quality card in Chapter 9 must be honest. A 1/3 grounding score should say 1/3.
- **Documents take precedence over conversation, which takes precedence over synthesis.** When the same field has multiple sources, use the highest-fidelity one and note the others.
- **Preserve source attribution.** Every field in `manifest.yaml` that came from a document should have a comment noting it. Every synthetic field must be labeled.

## Integration

- **project-scaffolder** — called in Chapter 8 with the intake record as input; handles directory creation and manifest writing
- **project-state** — all substrate writes route through it; onboarding.completed logged to activity log
- **project-milestone-manager** — milestone records created from Chapter 5 intake
- **project-sred-tracker** — if sred-canada pack selected, milestone SR&ED flags from Chapter 5 are used to create initial TU stubs
- **project-orchestrator** — referenced in Chapter 9 suggested actions
- **project-doc-suite** — benefits directly from references/goals.md and references/examples/ in orientation quality

## Reference files written

- `references/goals.md` — the project's stated purpose and success criteria in the user's own words
- `references/examples/good/` — positive output examples and descriptions
- `references/examples/avoid/anti-patterns.md` — formats and patterns to avoid
- `references/context.md` — synthetic context (if generated)
- `references/documents-index.md` — what was provided and what was extracted
- `references/onboarding-intake.yaml` — full audit trail of the onboarding session
