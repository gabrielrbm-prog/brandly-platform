import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
  className?: string;
}

export default function StatCard({ icon, label, value, color = '#7C3AED', className = '' }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-800 bg-surface p-3 ${className}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
