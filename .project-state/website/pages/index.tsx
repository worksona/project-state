import Link from 'next/link';
import Layout from '../components/Layout';
import { getMilestones, getRisks, getState, type Milestone } from '../lib/state';

interface Props {
  totalMilestones: number;
  completedMilestones: number;
  totalRisks: number;
  overallPercent: number;
}

export async function getStaticProps() {
  const milestones = getMilestones();
  const risks = getRisks();
  const completed = milestones.filter(m => m.status === 'complete').length;
  const overallPercent = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.percent_complete, 0) / milestones.length)
    : 0;

  return {
    props: {
      totalMilestones: milestones.length,
      completedMilestones: completed,
      totalRisks: risks.length,
      overallPercent,
    },
  };
}

const skills = [
  { name: 'project-state', desc: 'Memory layer — read/write/validate every entity' },
  { name: 'project-scaffolder', desc: 'One-shot init + reporting matrix seeding' },
  { name: 'project-phase-gate', desc: 'User-defined lifecycle phases via presets' },
  { name: 'project-document-curator', desc: 'Classify, index, and promote documents' },
  { name: 'project-milestone-manager', desc: 'CRUD milestones, % complete, progress narrative' },
  { name: 'project-status-reporter', desc: 'Weekly, SC pack, claim draft, ad-hoc reports' },
  { name: 'project-orchestrator', desc: 'Calendar-aware conductor — reads matrix, dispatches' },
  { name: 'project-notifier', desc: 'Route artifacts to Slack, Gmail (drafts), Calendar' },
  { name: 'project-review-meeting', desc: 'Generic meeting lifecycle (SC, board, QBR, retro)' },
  { name: 'project-funder-reporting', desc: 'Stakeholder-bound recurring reports from profiles' },
  { name: 'project-change-register', desc: 'Material vs. non-material change classification' },
  { name: 'project-blog-publisher', desc: 'Bridge to scsiwyg blog with publication review' },
  { name: 'project-website-publisher', desc: 'Static project website with stable URLs' },
  { name: 'project-onboarder', desc: 'Personalized onboarding briefs for new teammates' },
  { name: 'project-ip-tracker', desc: 'IP disclosures with configurable recipient' },
  { name: 'project-external-comms', desc: 'External communication review pipeline' },
  { name: 'project-lessons', desc: 'Continuous lessons learned + closeout summary' },
  { name: 'project-archive', desc: 'Project closeout and archival' },
  { name: 'project-doc-suite-generator', desc: 'Styled .docx + .xlsx baseline report bundles' },
];

const packs = [
  { name: 'pic-pcais', maturity: 'production', desc: 'PIC-funded PCAIS consortium projects' },
  { name: 'client-services', maturity: 'starter', desc: 'Consulting/client engagements' },
  { name: 'board-investor', maturity: 'starter', desc: 'PE/VC-backed startups with board cadence' },
  { name: 'agile-default', maturity: 'starter', desc: 'Engineering teams running Scrum/Kanban' },
  { name: 'open-source-community', maturity: 'starter', desc: 'Community-governed OSS projects' },
];

export default function Home({ totalMilestones, completedMilestones, totalRisks, overallPercent }: Props) {
  return (
    <Layout title="project-state — operational substrate for multi-stakeholder projects">
      {/* Hero */}
      <section style={{ padding: '48px 0 40px', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8, fontFamily: 'monospace' }}>v2.0</div>
        <h1 style={{ margin: '0 0 16px 0', fontSize: 32, lineHeight: 1.2 }}>
          Routine reporting as a byproduct of normal work
        </h1>
        <p style={{ fontSize: 18, color: '#555', lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: 640 }}>
          <strong>project-state</strong> is an operational substrate for multi-stakeholder projects.
          19 skills and 5 compliance packs turn any project — grant-funded, client-facing, board-reported,
          or open-source — into a system where status reports, meeting packs, and funder claims
          write themselves from the state you already maintain.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="/downloads/project-state.zip"
            style={{
              padding: '10px 24px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Download v2.0 (160KB)
          </a>
          <Link
            href="/docs/"
            style={{
              padding: '10px 24px',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              fontSize: 15,
              color: '#333',
              textDecoration: 'none',
            }}
          >
            Read the docs
          </Link>
          <a
            href="https://www.scsiwyg.com/project-state"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 24px',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              fontSize: 15,
              color: '#333',
              textDecoration: 'none',
            }}
          >
            Blog
          </a>
        </div>
      </section>

      {/* The problem */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 22 }}>The problem</h2>
        <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, margin: '0 0 12px 0', maxWidth: 640 }}>
          Every multi-stakeholder project has the same reporting overhead: weekly status emails,
          quarterly claims, steering committee packs, board updates, funder reports.
          The Project Lead writes them by hand, pulling from scattered spreadsheets, email threads,
          and half-remembered conversations. It takes hours per week and the reports are always slightly stale.
        </p>
        <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, margin: 0, maxWidth: 640 }}>
          project-state eliminates this by making the state the source of truth. Update a milestone,
          log a decision, flag a risk — the reports generate themselves from what you already captured.
        </p>
      </section>

      {/* How it works */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 22 }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            {
              title: 'Substrate',
              body: 'A typed filesystem (.project-state/) on any shared drive. Plain YAML, JSON, NDJSON, and markdown. No database, no API, no vendor lock-in. File-per-entity with append-only activity logs.',
            },
            {
              title: 'Skills',
              body: '19 project-* skills that read and write the substrate. Each skill is one coherent job — milestones, reports, meetings, notifications. You talk to Claude; the skills do the work.',
            },
            {
              title: 'Reporting Matrix',
              body: 'A single YAML that encodes "for each stakeholder, what report at what cadence in what format on which surface." The orchestrator reads it and dispatches generators automatically.',
            },
            {
              title: 'Compliance Packs',
              body: 'Pack-specific behavior lives in YAML profiles, not code. The pic-pcais pack knows PIC rules; the board-investor pack knows board cadence. Load one or many.',
            },
            {
              title: 'Surfaces',
              body: 'Reports land where your stakeholders live: Slack (auto-post), Gmail (always draft — never auto-send), Google Calendar, scsiwyg blog, or a static project website.',
            },
            {
              title: 'Phase Presets',
              body: 'Five lifecycle models out of the box: grant, agile, waterfall, client-engagement, open-source. Define your own with custom gates and transitions.',
            },
          ].map(card => (
            <div key={card.title} style={{
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              padding: '16px 20px',
              background: '#fafafa',
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{card.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.6 }}>{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture diagram */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 22 }}>Architecture</h2>
        <pre style={{
          background: '#1a1a1a',
          color: '#e0e0e0',
          padding: '20px 24px',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.5,
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}>
{`SURFACES ──── Slack · Gmail (drafts) · Calendar · Blog · Website
    ▲
SKILLS ────── 19 project-* skills (12 unchanged + 6 profile-driven)
    │              │
    │         reads profiles from
    │              ▼
PACKS ─────── pic-pcais · client-services · board-investor
               agile-default · open-source-community
    │              │
    │         seeds entries into
    │              ▼
MATRIX ────── reporting-matrix.yaml
               "who needs what, when, where"
    │
SUBSTRATE ─── .project-state/ on shared drive
               YAML · JSON · NDJSON · Markdown`}
        </pre>
      </section>

      {/* 18 Skills */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>19 skills</h2>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px 0' }}>
          Each skill is a markdown-defined agent behavior. Install once, use across all your projects.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 8,
        }}>
          {skills.map(s => (
            <div key={s.name} style={{
              padding: '10px 14px',
              border: '1px solid #eee',
              borderRadius: 6,
              background: '#fff',
            }}>
              <span style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 13,
                fontWeight: 600,
                color: '#1a1a1a',
              }}>
                {s.name}
              </span>
              <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Packs */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>5 compliance packs</h2>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px 0' }}>
          Packs configure skill behavior for specific project types. Multiple packs can coexist on one project.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {packs.map(p => (
            <div key={p.name} style={{
              padding: '12px 16px',
              border: '1px solid #e5e5e5',
              borderRadius: 6,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 600,
                minWidth: 180,
              }}>
                {p.name}
              </span>
              <span style={{
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                background: p.maturity === 'production' ? '#dcfce7' : '#f0f0f0',
                color: p.maturity === 'production' ? '#166534' : '#666',
              }}>
                {p.maturity}
              </span>
              <span style={{ fontSize: 14, color: '#555' }}>{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick start */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 22 }}>Quick start</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            {
              step: '1',
              title: 'Download and unzip',
              code: `cd /path/to/your-project\nunzip project-state.zip`,
            },
            {
              step: '2',
              title: 'Symlink the 19 skills',
              code: `cd ~/.claude/skills\nfor s in /path/to/project-state/skills/project-*; do\n  ln -s "$s" .\ndone`,
            },
            {
              step: '3',
              title: 'Bootstrap your project',
              code: `ask claude: "scaffold a new v2 project"`,
            },
            {
              step: '4',
              title: 'Verify',
              code: `ask claude: "what phase are we in?"\nask claude: "show the reporting matrix"`,
            },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1a1a1a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 2,
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 15 }}>{item.title}</h3>
                <pre style={{
                  background: '#f6f8fa',
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  overflow: 'auto',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                }}>
                  {item.code}
                </pre>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <Link href="/docs/install/" style={{ fontSize: 14 }}>
            Full install guide with Cowork setup and verification checklists →
          </Link>
        </div>
      </section>

      {/* Use cases */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>What you can ask</h2>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px 0' }}>
          Once installed, these natural-language requests trigger the right skill automatically.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 8,
        }}>
          {[
            { ask: '"What should I do this week?"', skill: 'project-orchestrator' },
            { ask: '"Draft the quarterly claim"', skill: 'project-funder-reporting' },
            { ask: '"Update M03 to 40% — pilot batches 5-10 complete"', skill: 'project-milestone-manager' },
            { ask: '"Schedule the next SC meeting"', skill: 'project-review-meeting' },
            { ask: '"Log a change — we\'re swapping vendor"', skill: 'project-change-register' },
            { ask: '"Onboard Jane from CDI"', skill: 'project-onboarder' },
            { ask: '"Capture a lesson learned"', skill: 'project-lessons' },
            { ask: '"Publish to the project website"', skill: 'project-website-publisher' },
          ].map(item => (
            <div key={item.ask} style={{
              padding: '10px 14px',
              border: '1px solid #eee',
              borderRadius: 6,
              background: '#fff',
            }}>
              <div style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 13,
                color: '#1a1a1a',
                marginBottom: 4,
              }}>
                {item.ask}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>→ {item.skill}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Project status (compact) */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid #e5e5e5' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 22 }}>This project runs on itself</h2>
        <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px 0' }}>
          project-state uses its own substrate to track its roadmap, risks, and reports.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Milestones', value: `${completedMilestones}/${totalMilestones}`, href: '/milestones/' },
            { label: 'Risks', value: `${totalRisks}`, href: '/risks/' },
            { label: 'Progress', value: `${overallPercent}%`, href: '/milestones/' },
          ].map(stat => (
            <Link key={stat.label} href={stat.href} style={{
              flex: '1 1 120px',
              padding: '12px 16px',
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              background: '#fafafa',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{stat.label}</div>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/milestones/" style={{ fontSize: 14 }}>Roadmap →</Link>
          <span style={{ color: '#ccc' }}>·</span>
          <Link href="/risks/" style={{ fontSize: 14 }}>Risk register →</Link>
          <span style={{ color: '#ccc' }}>·</span>
          <Link href="/reports/" style={{ fontSize: 14 }}>Baseline reports →</Link>
          <span style={{ color: '#ccc' }}>·</span>
          <Link href="/blog/" style={{ fontSize: 14 }}>Blog →</Link>
        </div>
      </section>

      {/* Download CTA */}
      <section style={{ padding: '40px 0' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 22 }}>Get started</h2>
        <p style={{ fontSize: 15, color: '#555', margin: '0 0 20px 0', maxWidth: 540 }}>
          Download the zip, symlink the skills, scaffold your project.
          The substrate is plain files — if you stop using the skills, your data stays readable forever.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="/downloads/project-state.zip"
            style={{
              padding: '10px 24px',
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Download v2.0 (160KB)
          </a>
          <Link
            href="/docs/install/"
            style={{
              padding: '10px 24px',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              fontSize: 15,
              color: '#333',
              textDecoration: 'none',
            }}
          >
            Install guide
          </Link>
          <Link
            href="/docs/pack-authoring/"
            style={{
              padding: '10px 24px',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              fontSize: 15,
              color: '#333',
              textDecoration: 'none',
            }}
          >
            Author a pack
          </Link>
        </div>
      </section>
    </Layout>
  );
}
