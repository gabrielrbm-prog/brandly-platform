import { type InputHTMLAttributes, type ReactNode, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export default function Input({ label, icon, error, className = '', ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium themed-text-secondary">{label}</label>
      )}
      <div
        className={`
          flex items-center gap-2 rounded-xl border px-4 h-[52px]
          themed-surface transition-all duration-200
          ${focused ? 'border-brand-primary bg-brand-primary/5 shadow-[0_0_12px_rgba(124,58,237,0.15)]' : 'themed-border'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        {icon && (
          <span className={`${focused ? 'text-brand-primary-light' : 'themed-text-muted'} transition-colors`}>
            {icon}
          </span>
        )}
        <input
          className={`flex-1 bg-transparent themed-text placeholder:themed-text-muted outline-none text-base ${className}`}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
