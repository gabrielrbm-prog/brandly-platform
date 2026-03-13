import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-primary to-brand-primary-light text-white glow-primary hover:opacity-90',
  secondary:
    'themed-surface-light themed-text border themed-border hover:opacity-80',
  outline:
    'border border-brand-primary text-brand-primary-light bg-transparent hover:bg-brand-primary/10',
  ghost:
    'themed-text-muted bg-transparent hover:themed-surface-light hover:themed-text',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
};

export default function Button({
  variant = 'primary',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
        text-sm font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
