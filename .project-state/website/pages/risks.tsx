import Layout from '../components/Layout';
import { getRisks, type Risk } from '../lib/state';

interface Props {
  risks: Risk[];
}

export async function getStaticProps() {
  const risks = getRisks();
  return { props: { risks } };
}

function scoreColor(score: number): string {
  if (score >= 9) return '#dc2626';
  if (score >= 6) return '#d97706';
  return '#059669';
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Critical';
  if (score >= 6) return 'High';
  return 'Medium';
}

export default function RisksPage({ risks }: Props) {
  const critical = risks.filter(r => (r.score || 0) >= 9);
  const high = risks.filter(r => (r.score || 0) >= 6 && (r.score || 0) < 9);
  const medium = risks.filter(r => (r.score || 0) < 6);

  return (
    <Layout title="Risk Register" description="Project risk register">
      <h1 style={{ margin: '0 0 8px 0' }}>Risk Register</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        {risks.length} risks tracked. Scored by likelihood x impact (1–9).
      </p>

      {/* Heat map summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Critical (9)', count: critical.length, color: '#dc2626', bg: '#fef2f2' },
          { label: 'High (6)', count: high.length, color: '#d97706', bg: '#fffbeb' },
          { label: 'Medium (4)', count: medium.length, color: '#059669', bg: '#ecfdf5' },
        ].map(tier => (
          <div key={tier.label} style={{
            flex: '1 1 140px',
            padding: '12px 16px',
            borderRadius: 8,
            background: tier.bg,
            border: `1px solid ${tier.color}20`,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: tier.color }}>{tier.count}</div>
            <div style={{ fontSize: 13, color: tier.color }}>{tier.label}</div>
          </div>
        ))}
      </div>

      {/* Risk cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {risks.map(risk => (
          <div key={risk.id} style={{
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            padding: '16px 20px',
            background: '#fff',
            borderLeft: `4px solid ${scoreColor(risk.score || 0)}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                <span style={{ color: '#888', fontWeight: 400 }}>{risk.id}</span>{' '}
                {risk.title}
              </h3>
              <span style={{
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: scoreColor(risk.score || 0),
                whiteSpace: 'nowrap',
                marginLeft: 12,
              }}>
                {scoreLabel(risk.score || 0)} ({risk.score})
              </span>
            </div>

            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
              Likelihood: {risk.likelihood} · Impact: {risk.impact} · Status: {risk.status}
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>Mitigation</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{risk.mitigation}</div>
            </div>

            {risk.contingency && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>Contingency</div>
                <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>{risk.contingency}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
