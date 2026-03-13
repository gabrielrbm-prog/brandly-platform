interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}

export default function ProgressBar({ value, max = 100, color = '#7C3AED', className = '' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className={`h-2 rounded-full themed-surface-light overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      />
    </div>
  );
}
