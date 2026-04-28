import Layout from '../components/Layout';
import { getDecisions, type Decision } from '../lib/state';

interface Props {
  decisions: Decision[];
}

export async function getStaticProps() {
  return { props: { decisions: getDecisions() } };
}

export default function DecisionsPage({ decisions }: Props) {
  return (
    <Layout title="Decisions" description="Project decision log">
      <h1 style={{ margin: '0 0 8px 0' }}>Decision log</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} recorded
      </p>

      {decisions.length === 0 ? (
        <p style={{ color: '#888' }}>No decisions recorded yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Decision</th>
                <th>Rationale</th>
                <th>Material</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map(d => (
                <tr key={d.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{d.date}</td>
                  <td style={{ fontWeight: 500 }}>{d.title}</td>
                  <td>{d.decision}</td>
                  <td style={{ color: '#555' }}>{d.rationale}</td>
                  <td style={{ textAlign: 'center' }}>
                    {d.material_change ? (
                      <span style={{
                        background: '#fff8c5',
                        color: '#9a6700',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        Yes
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: 12 }}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
