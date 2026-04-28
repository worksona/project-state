interface Props {
  phase: string;
  label?: string;
}

export default function PhaseBadge({ phase, label }: Props) {
  const display = label || phase.replace(/^\d+-/, '').replace(/-/g, ' ');

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: 4,
      fontSize: 13,
      fontWeight: 600,
      background: '#f0e6ff',
      color: '#6e40c9',
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      textTransform: 'capitalize',
    }}>
      {display}
    </span>
  );
}
