import { NavLink } from 'react-router-dom';
import { Home, Video, Users, DollarSign, User } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/videos', icon: Video, label: 'Videos' },
  { to: '/network', icon: Users, label: 'Rede' },
  { to: '/financial', icon: DollarSign, label: 'Financeiro' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 themed-surface-card backdrop-blur-lg border-t themed-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors
               ${isActive ? 'text-brand-primary-light' : 'themed-text-muted'}
              `
            }
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
