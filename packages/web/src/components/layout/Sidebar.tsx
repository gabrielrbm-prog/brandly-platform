import { NavLink } from 'react-router-dom';
import {
  Home, Video, Users, DollarSign, User, Wand2,
  ShoppingBag, Share2, BookOpen, Trophy,
  ChevronLeft, ChevronRight, Moon, Sun,
  LayoutDashboard, Film, Brain, Shield, Building2, GitBranch,
  BarChart3, Sparkles, GraduationCap, Radio, Download, Package,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { logos } from '@/lib/logos';
import { adminApi } from '@/lib/api';

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

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Painel' },
  { to: '/admin/financial', icon: DollarSign, label: 'Financeiro' },
  { to: '/admin/brands', icon: Building2, label: 'Marcas' },
  { to: '/admin/creators', icon: Users, label: 'Creators' },
  { to: '/admin/network', icon: GitBranch, label: 'Rede' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/ai', icon: Sparkles, label: 'Monitor IA' },
  { to: '/admin/videos', icon: Film, label: 'Videos' },
  { to: '/admin/profiles', icon: Brain, label: 'Perfis' },
  { to: '/admin/courses', icon: GraduationCap, label: 'Formacao' },
  { to: '/admin/community', icon: Radio, label: 'Comunidade' },
  { to: '/admin/compradores', icon: Shield, label: 'Compradores' },
  { to: '/admin/envios', icon: Package, label: 'Envios' },
  { to: '/admin/export', icon: Download, label: 'Exportar' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    adminApi.financialOverview()
      .then((data) => setPendingWithdrawalsCount(data.pendingWithdrawalsCount ?? 0))
      .catch(() => { /* silently ignore — badge is non-critical */ });
  }, [isAdmin]);

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
        {(user as any)?.hasPurchased && (
          <NavLink
            to="/rastreamento"
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
            <Package className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Rastreamento</span>}
          </NavLink>
        )}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 pt-4 pb-1">
                <Shield className="w-3 h-3 text-brand-primary-light" />
                <span className="text-xs font-semibold text-brand-primary-light uppercase tracking-wider">Admin</span>
              </div>
            )}
            {collapsed && <div className="border-t themed-border my-2" />}
            {adminNavItems.map((item) => {
              const showBadge = item.to === '/admin/financial' && pendingWithdrawalsCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
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
                  <div className="relative shrink-0">
                    <item.icon className="w-5 h-5" />
                    {showBadge && collapsed && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {showBadge && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold leading-none">
                          {pendingWithdrawalsCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
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
