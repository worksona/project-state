import PageHeader from "@/components/page-header";

export const metadata = { title: "How It Updates" };

export default function HowItUpdatesPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        kicker="About"
        title="How It Updates"
        description="The site is live in two senses: structured project state refreshes within 5 minutes of any change to the repo, and authored content (blog, wiki) appears within 5 minutes of being published to scsiwyg. No redeploy is needed for either."
      />

      <section className="prose-doc">
        <h2>Update channels</h2>
        <table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Source</th>
              <th>How to author</th>
              <th>Live in</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dashboard, Milestones, Risks, Decisions, Team</td>
              <td><code>.project-state/</code> YAML</td>
              <td>Edit YAML directly or use the <code>project-state</code> skill; <code>git push</code></td>
              <td>≤5 min</td>
            </tr>
            <tr>
              <td>Reporting</td>
              <td><code>reports/</code> docx / xlsx</td>
              <td>Drop new files, push</td>
              <td>≤5 min</td>
            </tr>
            <tr>
              <td>Context</td>
              <td><code>.project-state/references/context.md</code></td>
              <td>Edit and push</td>
              <td>≤5 min</td>
            </tr>
            <tr>
              <td>Blog</td>
              <td>scsiwyg API</td>
              <td><code>scsiwyg__publish_post</code> or <code>project-blog-publisher</code> skill</td>
              <td>≤5 min</td>
            </tr>
            <tr>
              <td>Wiki</td>
              <td>scsiwyg API</td>
              <td><code>scsiwyg__publish_wiki_page</code></td>
              <td>≤5 min</td>
            </tr>
          </tbody>
        </table>

        <h2>Why two paths</h2>
        <p>
          Project state and authored content have very different rhythms.
          Structured state changes when something <em>happens</em> — a milestone
          progresses, a risk gets re-scored, a decision is recorded — and lives
          in version-controlled YAML where every edit shows up in{" "}
          <code>git log</code>. Blog and wiki posts are continuous narrative
          content, so we publish those through scsiwyg without needing a code deploy.
        </p>

        <h2>The 5-minute revalidation</h2>
        <p>
          Every page sets <code>revalidate = 300</code>. On the first request
          after that window expires, Next.js re-renders the page from the latest
          source data, then serves the fresh version to subsequent visitors.
          This means no manual deploys, no waiting, and no stale dashboards.
        </p>

        <h2>Who can author</h2>
        <ul>
          <li>
            <strong>Anyone with repo access</strong> can edit{" "}
            <code>.project-state/</code> and push.
          </li>
          <li>
            <strong>Anyone with the scsiwyg MCP connected</strong> can publish
            blog posts and wiki pages.
          </li>
          <li>
            <strong>The agentic state system</strong> (see{" "}
            <a href="/about/agentic-state-system">that page</a>) can do any of
            the above on behalf of a teammate, given a natural-language request.
          </li>
        </ul>

        <h2>Expected cadence</h2>
        <ul>
          <li>
            <strong>Weekly</strong> — a blog post per active workstream, plus refreshed
            milestone <code>percent_complete</code> and <code>technical_progress</code>.
          </li>
          <li>
            <strong>Per review meeting</strong> — meeting pack added to <code>reports/</code>,
            decisions logged, risks re-scored.
          </li>
          <li>
            <strong>Quarterly</strong> — claim package built and surfaced under Reporting.
          </li>
        </ul>
      </section>
    </div>
  );
}
