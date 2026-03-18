import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<
  ToastType,
  { icon: ReactNode; barColor: string; iconColor: string; bg: string; border: string }
> = {
  success: {
    icon: <CheckCircle className="w-4 h-4" />,
    iconColor: 'text-emerald-400',
    barColor: '#10B981',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/25',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    iconColor: 'text-red-400',
    barColor: '#EF4444',
    bg: 'bg-red-500/8',
    border: 'border-red-500/25',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: 'text-amber-400',
    barColor: '#F59E0B',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/25',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    iconColor: 'text-blue-400',
    barColor: '#3B82F6',
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/25',
  },
};

const AUTO_DISMISS_MS = 4000;

// ─── Individual Toast ─────────────────────────────────────────────────────────

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const cfg = TOAST_CONFIG[item.type];

  return (
    <div
      className={`
        relative flex items-start gap-3 rounded-xl border themed-surface p-3.5 pr-10 shadow-lg
        w-full max-w-sm overflow-hidden
        animate-[slideInRight_0.25s_ease-out]
        ${cfg.bg} ${cfg.border}
      `}
    >
      {/* Colored left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: cfg.barColor }}
      />

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>

      {/* Message */}
      <p className="text-sm themed-text leading-snug">{item.message}</p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(item.id)}
        className="absolute top-3 right-3 themed-text-muted hover:themed-text transition-colors"
        aria-label="Fechar notificacao"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Auto-dismiss progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
        style={{
          backgroundColor: cfg.barColor,
          animation: `toastProgress ${AUTO_DISMISS_MS}ms linear forwards`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    warning: (msg) => add('warning', msg),
    info: (msg) => add('info', msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container — top-right, above everything */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return ctx;
}
