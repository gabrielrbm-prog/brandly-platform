import type { ReactNode, HTMLAttributes } from 'react';
import { GlowingEffect } from './GlowingEffect';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  accent?: string;
  glow?: boolean;
  glowing?: boolean;
  icon?: ReactNode;
  title?: string;
  description?: string;
}

export default function Card({
  children,
  accent,
  glow,
  glowing,
  icon,
  title,
  description,
  className = '',
  style,
  ...props
}: CardProps) {
  const inner = (
    <>
      {(icon || title) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && (
            <div className="w-fit rounded-lg border themed-border themed-surface-light p-2">
              {icon}
            </div>
          )}
          {(title || description) && (
            <div className="flex-1 min-w-0">
              {title && <h3 className="text-base font-semibold themed-text tracking-tight">{title}</h3>}
              {description && <p className="text-sm themed-text-muted mt-0.5">{description}</p>}
            </div>
          )}
        </div>
      )}
      {children}
    </>
  );

  if (glowing) {
    return (
      <div className="relative rounded-[1.25rem] border-[0.75px] themed-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div
          className={`relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] themed-border themed-surface p-4 shadow-sm md:p-5 ${className}`}
          style={{
            ...(accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}),
            ...style,
          }}
          {...props}
        >
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border themed-border themed-surface p-4 ${glow ? 'glow-primary' : ''} ${className}`}
      style={{
        ...(accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : {}),
        ...style,
      }}
      {...props}
    >
      {inner}
    </div>
  );
}
