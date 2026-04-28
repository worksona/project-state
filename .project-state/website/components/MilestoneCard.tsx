import Link from 'next/link';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
import type { Milestone } from '../lib/state';

interface Props {
  milestone: Milestone;
  compact?: boolean;
}

export default function MilestoneCard({ milestone, compact = false }: Props) {
  return (
    <Link
      href={`/milestones/${milestone.id}/`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: compact ? '12px 16px' : '16px 20px',
        background: '#fff',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#b0b0b0';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 8,
        }}>
          <div>
            <span style={{
              fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
              fontSize: 12,
              color: '#888',
            }}>
              {milestone.id}
            </span>
            <h3 style={{
              margin: '2px 0 0 0',
              fontSize: compact ? 14 : 16,
              fontWeight: 600,
            }}>
              {milestone.title}
            </h3>
          </div>
          <StatusBadge status={milestone.status} />
        </div>
        <ProgressBar percent={milestone.percent_complete} showLabel height={6} />
        {!compact && milestone.planned_end && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            Target: {milestone.planned_end}
          </div>
        )}
      </div>
    </Link>
  );
}
