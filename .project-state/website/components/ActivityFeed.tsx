import type { ActivityEvent } from '../lib/state';

interface Props {
  events: ActivityEvent[];
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return ts;
  }
}

function eventIcon(event: string): string {
  if (event.includes('milestone')) return 'M';
  if (event.includes('website')) return 'W';
  if (event.includes('decision')) return 'D';
  if (event.includes('scaffold')) return 'S';
  if (event.includes('deploy')) return 'V';
  return '*';
}

export default function ActivityFeed({ events }: Props) {
  if (!events.length) {
    return <p style={{ color: '#666' }}>No recent activity.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < events.length - 1 ? '1px solid #f0f0f0' : 'none',
            alignItems: 'flex-start',
          }}
        >
          <span style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#666',
            flexShrink: 0,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          }}>
            {eventIcon(ev.event)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14 }}>
              <code style={{ fontSize: 12, background: '#f4f4f4', padding: '1px 6px', borderRadius: 3 }}>
                {ev.event}
              </code>
              {ev.title && <span style={{ marginLeft: 8 }}>{ev.title}</span>}
            </div>
            {ev.detail && (
              <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>{ev.detail}</div>
            )}
            <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>{formatTime(ev.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
