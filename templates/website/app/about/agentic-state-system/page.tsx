import PageHeader from "@/components/page-header";

export const metadata = { title: "Agentic State System" };

export default function AgenticStateSystemPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        kicker="About"
        title="Agentic Project State System"
        description="A purpose-built Claude-skills system that turns project compliance obligations and reporting requirements into an executable project operating system. Every artifact this site shows is produced by — or maintained through — this engine."
      />

      <section className="prose-doc">
        <h2>The shape of it</h2>
        <p>
          Under the hood, the project lives in a directory called{" "}
          <code>.project-state/</code> with a typed schema. Around that directory
          sits a constellation of Claude skills, each owning a specific lifecycle area:
        </p>
        <ul>
          <li>
            <code>project-state</code> — the foundation skill. CRUD over the
            state directory with validation against the schema. Every other
            skill routes through it.
          </li>
          <li>
            <code>project-scaffolder</code> — one-shot initializer for a brand
            new project facility.
          </li>
          <li>
            <code>project-orchestrator</code> — the conductor. Decides what to
            do next based on the calendar, proximity to deadlines, and last
            review meeting timing.
          </li>
          <li>
            <code>project-phase-gate</code> — manages lifecycle transitions and
            enforces entry/exit gates.
          </li>
          <li>
            <code>project-milestone-manager</code> — CRUD milestones, update
            percent complete, technical progress narrative, flag at-risk or
            blocked items.
          </li>
          <li>
            <code>project-status-reporter</code> — generates weekly reports, review
            decks, and quarterly status summaries from current state.
          </li>
          <li>
            <code>project-funder-reporting</code> — automates recurring claim
            packages to funders.
          </li>
          <li>
            <code>project-review-meeting</code> — full review-meeting lifecycle:
            scheduling, agenda, minutes, decision routing.
          </li>
          <li>
            <code>project-change-register</code> — classifies project changes
            (material vs. minor) and routes them appropriately.
          </li>
          <li>
            <code>project-external-comms</code> — tracks the review process for
            any external publication or presentation.
          </li>
          <li>
            <code>project-ip-tracker</code> — IP disclosures and ownership splits.
          </li>
          <li>
            <code>project-document-curator</code> — classifies and indexes every
            document.
          </li>
          <li>
            <code>project-blog-publisher</code> — bridges <code>.project-state/</code>
            to scsiwyg, drafting milestone-completion posts and briefs.
          </li>
          <li>
            <code>project-onboarding</code>, <code>project-notifier</code>,{" "}
            <code>project-archive</code>, <code>project-lessons</code> — onboarding
            briefs, Slack/Gmail/Calendar routing, closeout, lessons-learned.
          </li>
        </ul>

        <h2>Why it works</h2>
        <p>
          A funded project has dozens of recurring obligations. By encoding each
          one as a skill — with its inputs, outputs, validations, and where it
          writes back to <code>.project-state/</code> — the team can hand off
          routine work and trust the system to do the right thing.
        </p>

        <h2>Where the system surfaces in this site</h2>
        <ul>
          <li>
            <strong>Dashboard</strong> — reads <code>state.json</code> health
            fields, which the orchestrator and milestone-manager update.
          </li>
          <li>
            <strong>Milestones / Risks / Decisions</strong> — direct views of
            the YAML files maintained by the relevant skills.
          </li>
          <li>
            <strong>Reporting</strong> — surfaces outputs from{" "}
            <code>project-status-reporter</code> and <code>project-funder-reporting</code>.
          </li>
          <li>
            <strong>Blog</strong> — driven by <code>project-blog-publisher</code>.
          </li>
        </ul>

        <h2>Provenance</h2>
        <p>
          The project-state system is a generic substrate for multi-stakeholder projects.
          Skills are defined as markdown files (<code>SKILL.md</code>) that Claude reads
          and executes. The substrate is plain YAML, JSON, and NDJSON — no database
          required, runs on any shared drive or git repository.
        </p>
      </section>
    </div>
  );
}
