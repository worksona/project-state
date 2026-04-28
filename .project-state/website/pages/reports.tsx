import Layout from '../components/Layout';
import { getBaselineReports, getBaselineBundles, type BaselineReport, type BaselineBundle } from '../lib/state';

interface Props {
  reports: BaselineReport[];
  bundles: BaselineBundle[];
}

export async function getStaticProps() {
  const reports = getBaselineReports();
  const bundles = getBaselineBundles();
  return { props: { reports, bundles } };
}

const formatIcon: Record<string, string> = {
  docx: 'W',
  xlsx: 'X',
};

const formatColor: Record<string, string> = {
  docx: '#2B579A',
  xlsx: '#217346',
};

export default function ReportsPage({ reports, bundles }: Props) {
  return (
    <Layout title="Baseline Reports" description="Project baseline report bundles — styled .docx and .xlsx files generated from project state">
      <h1 style={{ margin: '0 0 8px 0' }}>Baseline Reports</h1>
      <p style={{ color: '#666', margin: '0 0 32px 0', fontSize: 14, maxWidth: 640 }}>
        Styled .docx and .xlsx report bundles generated from <code>.project-state/</code> by the{' '}
        <strong>project-doc-suite-generator</strong> skill. Each bundle is a dated snapshot — regenerated
        at phase transitions, milestone completions, or on demand.
      </p>

      {/* Docx/Xlsx bundles */}
      {bundles.map(bundle => (
        <section key={bundle.dirName} style={{
          marginBottom: 32,
          border: '1px solid #e5e5e5',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            background: '#1B2A4A',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{bundle.dirName}</h2>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{bundle.files.length} files</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {bundle.files.map(file => (
              <a
                key={file.name}
                href={`/downloads/baseline/${file.name}`}
                download
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  textDecoration: 'none',
                  color: '#333',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: formatColor[file.format] || '#666',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {formatIcon[file.format] || '?'}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                  {file.name}
                </span>
                <span style={{ fontSize: 12, color: '#999' }}>{file.sizeKB} KB</span>
              </a>
            ))}
          </div>
        </section>
      ))}

      {bundles.length === 0 && reports.length === 0 && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#888',
          background: '#fafafa',
          borderRadius: 8,
        }}>
          <p style={{ fontSize: 16, margin: 0 }}>No baseline reports yet.</p>
        </div>
      )}

      {/* Legacy markdown reports */}
      {reports.length > 0 && (
        <>
          <h2 style={{ margin: '40px 0 16px 0', fontSize: 18 }}>Markdown snapshots</h2>
          {reports.map(report => (
            <section key={report.slug} style={{
              marginBottom: 24,
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 20px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e5e5e5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{report.title}</h3>
                <span style={{ fontSize: 13, color: '#888' }}>{report.date}</span>
              </div>
              <div style={{
                padding: '16px 20px',
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                overflow: 'auto',
                maxHeight: 400,
              }}>
                {report.content}
              </div>
            </section>
          ))}
        </>
      )}

      {/* Generation info */}
      <div style={{
        marginTop: 32,
        padding: '16px 20px',
        background: '#f8f9fa',
        borderRadius: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 1.6,
      }}>
        <strong>How these are generated:</strong> The <code>project-doc-suite-generator</code> skill reads
        milestones, risks, phases, and decisions from <code>.project-state/</code> and renders styled
        Office documents using <code>python-docx</code> and <code>openpyxl</code>.
        Run <code>python3 scripts/generate-baseline-reports.py</code> to regenerate.
      </div>
    </Layout>
  );
}
