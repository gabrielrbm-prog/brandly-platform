import { NavLink } from 'react-router-dom';
import {
  Home, Video, Users, DollarSign, User, Wand2,
  ShoppingBag, Share2, BookOpen, Trophy, Zap,
  ChevronLeft, ChevronRight, Moon, Sun,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { logos } from '@/lib/logos';

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
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0
        themed-surface-card border-r themed-border
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      <div className="flex items-center justify-center px-3 h-16 border-b themed-border overflow-hidden">
        {collapsed ? (
          <img
            src={isDark ? logos.symbol.dark : logos.symbol.light}
            alt="Brandly"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <img
            src={isDark ? logos.horizontal.dark : logos.horizontal.light}
            alt="Brandly"
            className="h-8 object-contain"
          />
        )}
      </div>

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
                 : 'themed-text-muted hover:themed-surface-light hover:themed-text'
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

      <div className="border-t themed-border flex">
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center h-12 themed-text-muted hover:themed-text transition-colors ${collapsed ? 'flex-1' : 'flex-1'}`}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 themed-text-muted hover:themed-text transition-colors flex-1 border-l themed-border"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
