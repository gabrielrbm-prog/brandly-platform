import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Copy,
  Check,
  LogOut,
  Wand2,
  ShoppingBag,
  Share2,
  BookOpen,
  Trophy,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const MENU_ITEMS = [
  { to: '/studio', icon: Wand2, label: 'Studio IA', color: '#7C3AED' },
  { to: '/brands', icon: ShoppingBag, label: 'Marcas', color: '#F59E0B' },
  { to: '/social', icon: Share2, label: 'Redes Sociais', color: '#EC4899' },
  { to: '/courses', icon: BookOpen, label: 'Formacao', color: '#3B82F6' },
  { to: '/community', icon: Trophy, label: 'Comunidade', color: '#10B981' },
  { to: '/onboarding', icon: Brain, label: 'Perfil Creator', color: '#06B6D4' },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (user?.referralCode) {
      navigator.clipboard.writeText(String(user.referralCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <PageContainer title="Perfil">
      <div className="space-y-6">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </div>
            {user?.referralCode && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">{String(user.referralCode)}</Badge>
                <button onClick={copyCode} className="text-gray-500 hover:text-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu links */}
        <div className="space-y-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center gap-3 bg-surface rounded-xl border border-gray-800 p-3 hover:bg-surface-light transition-colors"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <span className="flex-1 text-sm font-medium text-white text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl py-3 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </PageContainer>
  );
}
