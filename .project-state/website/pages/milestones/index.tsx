import Layout from '../../components/Layout';
import MilestoneCard from '../../components/MilestoneCard';
import { getMilestones, type Milestone } from '../../lib/state';

interface Props {
  milestones: Milestone[];
}

export async function getStaticProps() {
  return {
    props: {
      milestones: getMilestones(),
    },
  };
}

export default function MilestonesPage({ milestones }: Props) {
  const completed = milestones.filter(m => m.status === 'complete').length;
  const inProgress = milestones.filter(m => m.status === 'in_progress').length;
  const planned = milestones.filter(m => m.status === 'planned').length;

  return (
    <Layout title="Milestones" description="Project milestones and deliverables">
      <h1 style={{ margin: '0 0 8px 0' }}>Milestones</h1>
      <p style={{ color: '#666', margin: '0 0 24px 0', fontSize: 14 }}>
        {milestones.length} milestones: {completed} complete, {inProgress} in progress, {planned} planned
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12,
      }}>
        {milestones.map(m => (
          <MilestoneCard key={m.id} milestone={m} />
        ))}
      </div>
    </Layout>
  );
}
