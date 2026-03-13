import * as React from 'react';
import { motion, type Variants, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface GlowMenuItem {
  icon: LucideIcon | React.FC;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

interface GlowMenuProps {
  items: GlowMenuItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
  className?: string;
}

const itemVariants: Variants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
      scale: { duration: 0.5, type: 'spring' as const, stiffness: 300, damping: 25 },
    },
  },
};

const navGlowVariants: Variants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

const sharedTransition: Transition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export const GlowMenu = React.forwardRef<HTMLDivElement, GlowMenuProps>(
  ({ className, items, activeItem, onItemClick }, ref) => {
    return (
      <motion.nav
        ref={ref}
        className={cn(
          'p-2 rounded-2xl bg-gradient-to-b from-surface/80 to-surface/40 backdrop-blur-lg border border-gray-800/40 shadow-lg relative overflow-hidden',
          className,
        )}
        initial="initial"
        whileHover="hover"
      >
        <motion.div
          className="absolute -inset-2 rounded-3xl z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, transparent 0%, rgba(124,58,237,0.15) 30%, rgba(167,139,250,0.15) 60%, rgba(245,158,11,0.10) 90%, transparent 100%)',
          }}
          variants={navGlowVariants}
        />
        <ul className="flex items-center gap-2 relative z-10">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === activeItem;

            return (
              <motion.li key={item.label} className="relative">
                <button
                  onClick={() => onItemClick?.(item.label)}
                  className="block w-full"
                >
                  <motion.div
                    className="block rounded-xl overflow-visible group relative"
                    style={{ perspective: '600px' }}
                    whileHover="hover"
                    initial="initial"
                  >
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? 'hover' : 'initial'}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: '16px',
                      }}
                    />
                    <motion.div
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent transition-colors rounded-xl',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'center bottom',
                      }}
                    >
                      <span className={cn('transition-colors duration-300', isActive ? item.iconColor : 'text-white')}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                    <motion.div
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'center top',
                        rotateX: 90,
                      }}
                    >
                      <span className={cn('transition-colors duration-300', isActive ? item.iconColor : 'text-white')}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
    );
  },
);

GlowMenu.displayName = 'GlowMenu';
