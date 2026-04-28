interface Props {
  percent: number;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ percent, height = 8, showLabel = false }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = clamped === 100 ? '#22863a' : clamped >= 50 ? '#0969da' : '#bf8700';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1,
        height,
        background: '#e8e8e8',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clamped}%`,
          height: '100%',
          background: color,
          borderRadius: height / 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 13, color: '#666', minWidth: 36, textAlign: 'right' }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
