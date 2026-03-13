import type { ReactNode } from 'react';
import { GlowingEffect } from './GlowingEffect';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  color?: string;
  glowing?: boolean;
  className?: string;
}

export default function StatCard({ icon, label, value, color = '#7C3AED', glowing, className = '' }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-medium themed-text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold themed-text">{value}</p>
    </>
  );

  if (glowing) {
    return (
      <div className={`relative rounded-[1rem] border-[0.75px] themed-border p-1.5 md:p-2 ${className}`}>
        <GlowingEffect spread={30} glow disabled={false} proximity={48} inactiveZone={0.01} borderWidth={2} />
        <div
          className="relative overflow-hidden rounded-[0.625rem] border-[0.75px] themed-border themed-surface p-3 shadow-sm"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border themed-border themed-surface p-3 ${className}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      {inner}
    </div>
  );
}
