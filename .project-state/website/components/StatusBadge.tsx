const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  complete: { bg: '#dafbe1', color: '#1a7f37' },
  delivered: { bg: '#dafbe1', color: '#1a7f37' },
  in_progress: { bg: '#ddf4ff', color: '#0969da' },
  active: { bg: '#ddf4ff', color: '#0969da' },
  at_risk: { bg: '#fff8c5', color: '#9a6700' },
  blocked: { bg: '#ffebe9', color: '#cf222e' },
  planned: { bg: '#f0f0f0', color: '#656d76' },
  completed: { bg: '#dafbe1', color: '#1a7f37' },
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const normalized = (status || 'planned').toLowerCase().replace(/[\s-]/g, '_');
  const style = STATUS_COLORS[normalized] || STATUS_COLORS.planned;

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
