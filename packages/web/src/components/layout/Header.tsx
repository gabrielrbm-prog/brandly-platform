import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-800 bg-surface-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <h1 className="text-lg font-bold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <span className="hidden sm:block text-sm text-gray-300 font-medium max-w-[120px] truncate">
            {user?.name?.split(' ')[0]}
          </span>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
