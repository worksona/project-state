import PageHeader from "@/components/page-header";

export const metadata = { title: "This Site" };

export default function ThisSitePage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        kicker="About"
        title="This Site"
        description="A live, internal-only command center for the project consortium. Everything visible here is generated from the project's structured state — no manual page-editing required."
      />

      <section className="prose-doc">
        <h2>Who it's for</h2>
        <p>
          The consortium project teams, any funder contacts, and new team members who need to
          get up to speed quickly. The site runs behind a private URL and shared password —
          shareable internally, not crawled or indexed publicly.
        </p>

        <h2>What you'll find here</h2>
        <ul>
          <li>
            <strong>Dashboard</strong> — at-a-glance project state: current phase, RAG health
            across schedule / budget / scope / risk, key dates, active milestones, and critical risks.
          </li>
          <li>
            <strong>Milestones</strong> — every milestone with planned window, owner,
            percent-complete, and technical progress.
          </li>
          <li>
            <strong>Risks</strong> — the full risk register, ranked by severity, with
            mitigation and contingency for each item.
          </li>
          <li>
            <strong>Decisions</strong> — formally recorded project decisions (ADR-style log).
          </li>
          <li>
            <strong>Team</strong> — biography and management capacity for each consortium member.
          </li>
          <li>
            <strong>Reporting</strong> — baseline documents and workbooks, rendered inline.
            Weekly reports, claims, and review packs appear here as they are produced.
          </li>
          <li>
            <strong>Blog</strong> — project updates, weekly notes, and technical writeups.
          </li>
          <li>
            <strong>Wiki</strong> — long-lived reference material, organized in a tree.
          </li>
          <li>
            <strong>Context</strong> — background, collaboration model, and working agreements
            for team members.
          </li>
        </ul>

        <h2>How it's built</h2>
        <p>
          A Next.js application deployed to Vercel (or any Node.js host). It reads content
          from three sources:
        </p>
        <ol>
          <li>
            <code>.project-state/</code> in the repo — YAML files for milestones, risks,
            decisions, people, and a top-level <code>state.json</code> /{" "}
            <code>manifest.yaml</code>.
          </li>
          <li>
            <code>reports/</code> — the docx and xlsx files produced as project documents
            (baseline planning artifacts, weekly reports, etc.).
          </li>
          <li>
            <a href="https://www.scsiwyg.com" target="_blank" rel="noopener noreferrer">scsiwyg</a> —
            a headless blog and wiki backend, accessed via its public API. Set{" "}
            <code>NEXT_PUBLIC_SCSIWYG_SITE</code> in your environment to connect it.
          </li>
        </ol>
        <p>
          See <a href="/about/how-it-updates">How It Updates</a> for the
          authoring flow, and <a href="/about/agentic-state-system">Agentic State
          System</a> for the engine that drives it.
        </p>
      </section>
    </div>
  );
}
