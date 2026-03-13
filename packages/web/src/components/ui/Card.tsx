import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: string;
  glow?: boolean;
}

export default function Card({ children, accent, glow, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-gray-800 bg-surface p-4
        ${glow ? 'glow-primary' : ''}
        ${className}
      `}
      style={{
        ...(accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
