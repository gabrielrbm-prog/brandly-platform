import type { ReactNode } from 'react';
import { MoreVertical, Plus, Clock } from 'lucide-react';
import { GlowingEffect } from './GlowingEffect';
import ProgressBar from './ProgressBar';

type CourseColor = 'purple' | 'amber' | 'emerald' | 'blue' | 'pink';

const COLOR_MAP: Record<CourseColor, { accent: string; bg: string; text: string; gradient: string }> = {
  purple: { accent: '#1D45D8', bg: 'bg-brand-primary/10', text: 'text-brand-primary dark:text-brand-primary-light', gradient: 'from-brand-primary/20 to-brand-primary/5' },
  amber: { accent: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
  emerald: { accent: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  blue: { accent: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/20 to-blue-500/5' },
  pink: { accent: '#EC4899', bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500/20 to-pink-500/5' },
};

interface CourseCardProps {
  title: string;
  description: string;
  progress: number;
  lessonsCount: number;
  completedLessons: number;
  color?: CourseColor;
  icon?: ReactNode;
  timeLeft?: string;
  onClick?: () => void;
}

export default function CourseCard({
  title,
  description,
  progress,
  lessonsCount,
  completedLessons,
  color = 'purple',
  icon,
  timeLeft,
  onClick,
}: CourseCardProps) {
  const c = COLOR_MAP[color];
  const isComplete = progress >= 100;

  return (
    <div className="relative rounded-[1.25rem] border-[0.75px] themed-border p-2 md:rounded-[1.5rem] md:p-2.5 group">
      <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />

      <button
        onClick={onClick}
        className={`
          relative w-full text-left overflow-hidden rounded-xl themed-surface
          border-[0.75px] themed-border p-4 md:p-5 shadow-sm
          transition-all duration-300 hover:scale-[1.01]
        `}
      >
        {/* Color accent gradient top */}
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.gradient}`} style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accent}40)` }} />

        {/* Header: date + menu */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs themed-text-muted font-medium">
            {completedLessons}/{lessonsCount} aulas
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4 themed-text-muted" />
          </div>
        </div>

        {/* Title + description */}
        <div className="mb-4">
          <h3 className="text-base md:text-lg font-bold themed-text tracking-tight mb-1">{title}</h3>
          <p className="text-sm themed-text-secondary line-clamp-2">{description}</p>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium themed-text-muted">Progresso</span>
            <span className={`text-xs font-bold ${c.text}`}>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} color={c.accent} />
        </div>

        {/* Footer: icon + time left */}
        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-1">
            {icon && (
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                {icon}
              </div>
            )}
            <div className="w-7 h-7 rounded-full themed-border border themed-surface-light flex items-center justify-center ml-2">
              <Plus className="w-3.5 h-3.5 themed-text-muted" />
            </div>
          </div>

          {timeLeft && (
            <span className={`
              inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
              ${isComplete ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : `${c.bg} ${c.text}`}
            `}>
              <Clock className="w-3 h-3" />
              {isComplete ? 'Completo' : timeLeft}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
