import Layout from '../components/Layout';
import PhaseBadge from '../components/PhaseBadge';
import {
  getManifest,
  getState,
  getPhases,
  getReportingMatrix,
  type Phase,
  type ReportingEntry,
} from '../lib/state';

interface Props {
  project: {
    name: string;
    long_name: string;
    one_liner: string;
    kind: string;
    start_date: string;
    packs_loaded: string[];
  };
  currentPhase: string;
  phases: Phase[];
  reportingEntries: ReportingEntry[];
}

export async function getStaticProps() {
  const manifest = getManifest();
  const state = getState();
  const phases = getPhases();
  const matrix = getReportingMatrix();

  return {
    props: {
      project: {
        name: manifest?.project?.name || 'project-state',
        long_name: manifest?.project?.long_name || '',
        one_liner: (manifest?.project?.one_liner || '').trim(),
        kind: manifest?.project?.kind || 'unknown',
        start_date: manifest?.project?.start_date || '',
        packs_loaded: manifest?.project?.packs_loaded || [],
      },
      currentPhase: state?.current_phase || manifest?.phases?.current_phase || '',
      phases,
      reportingEntries: matrix?.entries || [],
    },
  };
}

export default function AboutPage({ project, currentPhase, phases, reportingEntries }: Props) {
  return (
    <Layout title="About" description={`About ${project.name}`}>
      <h1 style={{ margin: '0 0 8px 0' }}>About</h1>

      {/* Project info */}
      <section style={{
        background: '#fafafa',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 32,
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20 }}>{project.name}</h2>
        {project.long_name && (
          <div style={{ color: '#555', fontSize: 15, marginBottom: 8 }}>{project.long_name}</div>
        )}
        {project.one_liner && (
          <p style={{ color: '#444', margin: '0 0 16px 0' }}>{project.one_liner}</p>
        )}
        <table style={{ border: 'none', margin: 0 }}>
          <tbody>
            {[
              ['Kind', project.kind.replace(/_/g, ' ')],
              ['Start date', project.start_date],
              ['Packs loaded', project.packs_loaded.join(', ') || 'none'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ border: 'none', fontWeight: 600, padding: '4px 16px 4px 0', fontSize: 14, color: '#555' }}>
                  {label}
                </td>
                <td style={{ border: 'none', padding: '4px 0', fontSize: 14 }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Phases */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Lifecycle phases</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {phases.sort((a, b) => a.id.localeCompare(b.id)).map(phase => (
            <div
              key={phase.id}
              style={{
                padding: '10px 16px',
                border: phase.id === currentPhase ? '2px solid #6e40c9' : '1px solid #e5e5e5',
                borderRadius: 8,
                background: phase.id === currentPhase ? '#f8f0ff' : '#fff',
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 12, color: '#888', fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
                {phase.id}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{phase.label}</div>
              <div style={{
                fontSize: 12,
                color: phase.status === 'active' ? '#0969da'
                  : phase.status === 'completed' ? '#1a7f37'
                  : '#888',
                marginTop: 4,
                textTransform: 'capitalize',
              }}>
                {phase.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reporting matrix */}
      {reportingEntries.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Reporting matrix</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Stakeholder</th>
                  <th>Cadence</th>
                  <th>Surface</th>
                  <th>Generator</th>
                </tr>
              </thead>
              <tbody>
                {reportingEntries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 500 }}>{entry.report}</td>
                    <td>{entry.stakeholder_group}</td>
                    <td style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 12 }}>
                      {entry.cadence?.kind || '--'}
                    </td>
                    <td>{entry.surface}</td>
                    <td style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: 12 }}>
                      {entry.generator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How the site updates */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>How this site works</h2>
        <div style={{ color: '#444', fontSize: 14, lineHeight: 1.7 }}>
          <p>
            This site is built from the <code>.project-state/</code> directory -- a typed filesystem
            of YAML, JSON, and NDJSON files that serves as the project's operational substrate.
          </p>
          <p>
            At build time, the Next.js static site generator reads milestones, decisions, people,
            activity logs, and configuration directly from the substrate. Blog and wiki content
            are fetched from the scsiwyg API.
          </p>
          <p>
            The site is deployed to Vercel and rebuilds automatically when the substrate changes.
            There is no database -- the filesystem is the source of truth.
          </p>
        </div>
      </section>
    </Layout>
  );
}
