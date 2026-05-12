---
name: project-orchestrator
description: "The conductor of the project-* skill suite. Decides what to do next based on current state + the calendar (day of week, proximity to quarterly claim deadlines, SC meeting cadence, phase gate status, overdue milestones, annual questionnaire). Use whenever the user says 'what should I do today', 'what should I do this week', 'run the project', 'what's pending', 'what needs attention', 'morning briefing for the project', 'are there any deadlines coming up', 'what's the orchestrator saying', 'run the weekly routine', 'run the daily routine', 'kickoff the day', or any request asking the project to tell itself what to do next. Invokes other project-* skills as needed and hands decisions back to the user for approval. Thin by design — this skill routes, it does not do the work itself."
---

# Project Orchestrator

## Purpose

Be the agent that notices what time it is, what state the project is in, and what the sensible next action is. The orchestrator reads; other skills act. On any given day, invoking `project-orchestrator` produces a prioritized list of "what you (or I) should do now" rooted in the state and calendar, not a fixed routine.

It is thin. It knows the *rhythm* of a grant project; the details live in the other skills.

## Trigger phrases

- "what should I do today / this week"
- "run the project" / "run the orchestrator"
- "morning briefing" / "daily briefing"
- "what's pending" / "what needs attention" / "what's on deck"
- "are there any deadlines coming up"
- "kickoff the day" / "kickoff the week"
- "run the weekly routine"

## The cadence model

Grant projects run on overlapping clocks:

| Clock        | Events                                                       |
| ------------ | ------------------------------------------------------------ |
| Daily        | (optional) standup, inbox check, at-risk milestone review    |
| Weekly       | Monday weekly report; at-risk escalation; mid-week milestone check-ins |
| Monthly      | Monthly technical brief (best practice per PIC PM Guide)     |
| Quarterly    | SC meeting; claim submission (20th of Apr/Jul/Oct/Jan); financial reporting |
| Annual       | PIC Annual Questionnaire; annual risk assessment; financial update |
| Phase        | Gate polling; transition readiness; kickoff/closeout rhythms |
| Event-driven | MPA signature; milestone completion; Change Order raised; IP disclosure; publication proposal; risk materialization |

The orchestrator knows roughly when each clock ticks and offers the right next action.

## The decision loop

On invocation:

1. **Load state.** Get current phase, health, recent activity, pointers (last_weekly_report, last_sc_meeting, last_claim_submitted, next_claim_due, next_sc_meeting).
2. **Compute windows.**
   - Days since last weekly report. If ≥7, flag "weekly due".
   - Days to next claim due date (Apr/Jul/Oct/Jan 20). If ≤14, flag "claim due soon". If ≤3, flag "claim due URGENT".
   - Days to next SC meeting. If ≤14, flag "SC pack prep". If ≤7, flag "SC pack due".
   - Days to annual questionnaire (if set).
3. **Check at-risk milestones.** Via `project-milestone-manager`. Any with `status in {at_risk, blocked}` or behind-schedule rules get flagged.
4. **Check gate.** Via `project-phase-gate`. If the current phase has unblocked items (e.g., MPA landed → planning.mpa_signed autoclose), surface the transition option.
5. **Check inbox.** If `documents/inbox/` is non-empty, flag "classify N new docs".
6. **Prioritize.** Order: URGENT deadlines → gate-blocking items → pending reports → at-risk milestones → routine work → opportunities.
7. **Return a ranked list** with, for each item: the reason, the skill that handles it, and what the user needs to do.

## Output format

```
# Orchestrator — YYYY-MM-DD

## 🔴 Urgent
- <items that cannot wait>

## 🟡 This week
- <items due in 7 days>

## 🟢 On deck
- <items on the weekly horizon>

## 💤 Quiet
- <nothing to flag here>

---
What would you like to do first?
```

Every line links to the skill that handles it, so the user can say "yes, do the weekly report" and the orchestrator delegates to `project-status-reporter`.

## Routines

The orchestrator understands named routines:

### `daily` (optional — only if the team wants a daily check)
1. **Run `project-harvester`** — pull fresh intel from Slack/Gmail/GDocs/scsiwyg into `documents/inbox/`. Run before anything else so the inbox is populated before curator recommendations are made.
2. **Run `project-document-curator`** — classify any new inbox docs; link to milestones/decisions where appropriate.
3. Tail activity log since yesterday
4. Check `at_risk` and `blocked` milestones
5. Flag any unclassified docs remaining in inbox
6. Report any Gmail drafts from yesterday not yet sent (if integrated)

### `weekly` (Monday)
1. Call `project-status-reporter` to draft the weekly report
2. Hand off to `project-notifier` to post to Slack after the user reviews
3. Check SC prep window (meeting in <14 days?) → start SC pack prep
4. Check claim window (claim in <14 days?) → start claim prep
5. Recompute `state.json:health`
6. Update `state.json:pointers.last_weekly_report`

### `monthly` (last working day of month)
- Monthly technical brief to consortium (`project-status-reporter` monthly mode)
- Review + refresh risk register
- Nudge IP disclosure review

### `quarter-close` (around the 15th of Apr/Jul/Oct/Jan)
- Call `project-funder-reporting` to assemble the quarterly claim
- Draft the PIC PM cover email via `project-notifier` (Gmail draft)
- Nudge Finance Rep for member claim packages
- Schedule the SC meeting if one is due

### `sc-prep` (10 business days before a SC meeting)
- Call `project-review-meeting` to build agenda + pack
- Invite check via `project-notifier`
- Circulate agenda 5+ business days prior

### `baseline` (on phase transition, milestone completion, or on demand)
- Call `project-doc-suite-generator` to produce the baseline report bundle
- Output: `.project-state/reports/baseline/Baseline-Reports-YYYY-MM-DD/` with styled `.docx` + `.xlsx`
- Copy to website `public/downloads/baseline/` for static serving
- Log `report.generated` event to activity log

### `phase-check` (weekly during planning and closeout, monthly during execution)
- Call `project-phase-gate` for gate status
- If ready-to-transition, surface the prompt; then trigger the `baseline` routine

## Scheduling

The orchestrator does not run itself. It is invoked:
- On user demand ("what should I do?")
- By the `schedule` skill (a scheduled task calls `project-orchestrator daily` each morning)

`.project-state/manifest.yaml` does not specify schedules; those are managed via the `schedule` skill and should be configured separately.

## Discipline

- **Don't do the work, delegate it.** This skill returns recommendations + invokes other skills; it doesn't draft reports, file claims, or send emails itself.
- **Don't surprise the user.** Even when a next step is obvious, offer it — don't execute. Especially for anything going to PIC.
- **Honor the quiet days.** If there's genuinely nothing to do, say so. A healthy project has quiet days.
- **Respect phase.** In planning, focus on gate items. In execution, focus on rhythm. In closeout, focus on final reports. The orchestrator's priorities shift by phase.

## Integration

Calls every other skill in the suite, including `project-doc-suite-generator` for baseline report bundles. Does not read or write state directly — goes through `project-state`. Its output is often consumed by the user verbally, but it may also write an orchestrator-run snapshot to `reports/adhoc/orchestrator-YYYY-MM-DD.md` for audit.
