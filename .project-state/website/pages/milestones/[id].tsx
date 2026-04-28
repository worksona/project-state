import Link from 'next/link';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import ProgressBar from '../../components/ProgressBar';
import { getMilestones, getMilestone, type Milestone } from '../../lib/state';

interface Props {
  milestone: Milestone;
}

export async function getStaticPaths() {
  const milestones = getMilestones();
  return {
    paths: milestones.map(m => ({ params: { id: m.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const milestone = getMilestone(params.id);
  if (!milestone) return { notFound: true };
  return { props: { milestone } };
}

export default function MilestoneDetail({ milestone }: Props) {
  return (
    <Layout title={milestone.title} description={milestone.description}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/milestones/" style={{ fontSize: 14, color: '#666' }}>
          &larr; All milestones
        </Link>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
            fontSize: 13,
            color: '#888',
          }}>
            {milestone.id}
          </span>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 24 }}>{milestone.title}</h1>
        </div>
        <StatusBadge status={milestone.status} />
      </div>

      {/* Progress */}
      <div style={{
        background: '#fafafa',
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Progress</div>
        <ProgressBar percent={milestone.percent_complete} showLabel height={10} />
      </div>

      {/* Description */}
      {milestone.description && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Description</h2>
          <p style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{milestone.description.trim()}</p>
        </section>
      )}

      {/* Dates */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Schedule</h2>
        <table style={{ fontSize: 14 }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, paddingRight: 24 }}>Planned start</td>
              <td>{milestone.planned_start || '--'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, paddingRight: 24 }}>Planned end</td>
              <td>{milestone.planned_end || '--'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, paddingRight: 24 }}>Actual start</td>
              <td>{milestone.actual_start || '--'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, paddingRight: 24 }}>Actual end</td>
              <td>{milestone.actual_end || '--'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Technical progress */}
      {milestone.technical_progress && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Technical progress</h2>
          <p style={{ color: '#444' }}>{milestone.technical_progress}</p>
        </section>
      )}

      {/* At-risk reason */}
      {milestone.at_risk_reason && (
        <section style={{
          marginBottom: 24,
          background: '#fff8c5',
          border: '1px solid #d4a72c',
          borderRadius: 8,
          padding: '12px 16px',
        }}>
          <h2 style={{ fontSize: 14, margin: '0 0 4px 0', color: '#9a6700' }}>At-risk reason</h2>
          <p style={{ margin: 0, color: '#6b4c00' }}>{milestone.at_risk_reason}</p>
        </section>
      )}

      {/* Deliverables */}
      {milestone.deliverables && milestone.deliverables.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Deliverables</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestone.deliverables.map(d => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 6,
                  border: '1px solid #f0f0f0',
                }}
              >
                <div>
                  <span style={{
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                    fontSize: 12,
                    color: '#888',
                    marginRight: 8,
                  }}>
                    {d.id}
                  </span>
                  <span style={{ fontSize: 14 }}>{d.title}</span>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meta */}
      <section style={{ fontSize: 13, color: '#999', marginTop: 32 }}>
        <div>Owner: {milestone.owner_person} ({milestone.owner_org})</div>
        <div>Last modified: {milestone.last_modified}</div>
      </section>
    </Layout>
  );
}
