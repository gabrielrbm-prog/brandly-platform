import { NavLink } from 'react-router-dom';
import {
  Home,
  Video,
  Users,
  DollarSign,
  User,
  Wand2,
  ShoppingBag,
  Share2,
  BookOpen,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/videos', icon: Video, label: 'Videos' },
  { to: '/network', icon: Users, label: 'Rede' },
  { to: '/financial', icon: DollarSign, label: 'Financeiro' },
  { to: '/studio', icon: Wand2, label: 'Studio IA' },
  { to: '/brands', icon: ShoppingBag, label: 'Marcas' },
  { to: '/social', icon: Share2, label: 'Social' },
  { to: '/courses', icon: BookOpen, label: 'Formacao' },
  { to: '/community', icon: Trophy, label: 'Comunidade' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0
        bg-surface-card border-r border-gray-800
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xl font-extrabold text-white tracking-tight">Brandly</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-brand-primary/15 text-brand-primary-light'
                 : 'text-gray-400 hover:bg-white/5 hover:text-white'
               }
               ${collapsed ? 'justify-center' : ''}
              `
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-gray-800 text-gray-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
