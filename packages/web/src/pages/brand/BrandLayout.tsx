import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Film,
  Wallet,
  UserPlus,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { brandPortalApi } from '@/lib/api';
import { logos } from '@/lib/logos';

const navItems = [
  { to: '/marca', icon: LayoutDashboard, label: 'Painel', end: true },
  { to: '/marca/candidaturas', icon: UserPlus, label: 'Candidaturas' },
  { to: '/marca/creators', icon: Users, label: 'Creators' },
  { to: '/marca/videos', icon: Film, label: 'Videos' },
  { to: '/marca/pagamentos', icon: Wallet, label: 'Pagamentos' },
];

export default function BrandLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    brandPortalApi
      .me()
      .then((d) => setBrandName(d.brand.name))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen themed-bg flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 w-60 themed-surface-card border-r themed-border">
        <div className="flex items-center justify-center px-3 h-16 border-b themed-border">
          <img
            src={isDark ? logos.horizontal.dark : logos.horizontal.light}
            alt="Brandly"
            className="h-8 object-contain"
          />
        </div>

        <div className="px-4 py-4 border-b themed-border">
          <div className="text-[10px] uppercase tracking-wider themed-text-muted font-semibold">
            Portal da Marca
          </div>
          <div className="text-sm font-bold themed-text mt-1 truncate">
            {brandName || '...'}
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                 ${
                   isActive
                     ? 'bg-brand-primary/10 text-brand-primary-light'
                     : 'themed-text-muted hover:themed-text hover:themed-surface-hover'
                 }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t themed-border space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm themed-text-muted hover:themed-text"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm themed-text-muted hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden h-16 border-b themed-border themed-surface-card flex items-center justify-between px-4 sticky top-0 z-40">
          <div>
            <div className="text-[10px] uppercase tracking-wider themed-text-muted font-semibold">
              Portal
            </div>
            <div className="text-sm font-bold themed-text truncate max-w-[150px]">
              {brandName || '...'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 themed-text-muted">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={logout} className="p-2 themed-text-muted">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </div>

        {/* Mobile tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 themed-surface-card border-t themed-border">
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors
                   ${isActive ? 'text-brand-primary-light' : 'themed-text-muted'}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="hidden md:block text-center text-xs themed-text-muted pb-4">
          Logado como {user?.email}
        </div>
      </main>
    </div>
  );
}
