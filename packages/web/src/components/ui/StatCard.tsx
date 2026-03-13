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
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </>
  );

  if (glowing) {
    return (
      <div className={`relative rounded-[1rem] border-[0.75px] border-gray-800 p-1.5 md:p-2 ${className}`}>
        <GlowingEffect
          spread={30}
          glow
          disabled={false}
          proximity={48}
          inactiveZone={0.01}
          borderWidth={2}
        />
        <div
          className="relative overflow-hidden rounded-[0.625rem] border-[0.75px] border-gray-800 bg-surface p-3 shadow-sm shadow-[0px_0px_20px_0px_rgba(45,45,45,0.2)]"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-800 bg-surface p-3 ${className}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      {inner}
    </div>
  );
}
