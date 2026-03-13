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
import { GlowMenu, type GlowMenuItem } from '@/components/ui/GlowMenu';

const GLOW_ITEMS: GlowMenuItem[] = [
  {
    icon: Wand2,
    label: 'Studio',
    href: '/studio',
    gradient: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(91,33,182,0.06) 50%, rgba(91,33,182,0) 100%)',
    iconColor: 'text-purple-500',
  },
  {
    icon: ShoppingBag,
    label: 'Marcas',
    href: '/brands',
    gradient: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.06) 50%, rgba(180,83,9,0) 100%)',
    iconColor: 'text-amber-500',
  },
  {
    icon: Share2,
    label: 'Social',
    href: '/social',
    gradient: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)',
    iconColor: 'text-pink-500',
  },
  {
    icon: BookOpen,
    label: 'Formacao',
    href: '/courses',
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)',
    iconColor: 'text-blue-500',
  },
  {
    icon: Trophy,
    label: 'Comunidade',
    href: '/community',
    gradient: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.06) 50%, rgba(4,120,87,0) 100%)',
    iconColor: 'text-emerald-500',
  },
];

const LIST_ITEMS = [
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

  function handleGlowClick(label: string) {
    const item = GLOW_ITEMS.find((i) => i.label === label);
    if (item) navigate(item.href);
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
            <h2 className="text-xl font-bold themed-text">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-sm themed-text-secondary">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </div>
            {user?.referralCode && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">{String(user.referralCode)}</Badge>
                <button onClick={copyCode} className="themed-text-muted hover:themed-text transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Glow Menu — navegacao rapida */}
        <div>
          <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">Acesso Rapido</p>
          <div className="overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
            <GlowMenu
              items={GLOW_ITEMS}
              onItemClick={handleGlowClick}
              className="inline-flex"
            />
          </div>
        </div>

        {/* Menu links — lista completa */}
        <div>
          <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">Menu</p>
          <div className="space-y-2">
            {LIST_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 themed-surface rounded-xl themed-border p-3 hover:themed-surface-light transition-colors"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="flex-1 text-sm font-medium themed-text text-left">{item.label}</span>
                <ChevronRight className="w-4 h-4 themed-text-muted" />
              </button>
            ))}
          </div>
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
