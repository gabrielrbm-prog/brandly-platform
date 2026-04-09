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
  Lock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { GlowMenu, type GlowMenuItem } from '@/components/ui/GlowMenu';
import { authApi } from '@/lib/api';

const GLOW_ITEMS: GlowMenuItem[] = [
  {
    icon: Wand2,
    label: 'Studio',
    href: '/studio',
    gradient: 'radial-gradient(circle, rgba(29,69,216,0.15) 0%, rgba(29,69,216,0.06) 50%, rgba(29,69,216,0) 100%)',
    iconColor: 'text-blue-600',
  },
  {
    icon: ShoppingBag,
    label: 'Marcas',
    href: '/brands',
    gradient: 'radial-gradient(circle, rgba(0,223,255,0.15) 0%, rgba(0,223,255,0.06) 50%, rgba(0,223,255,0) 100%)',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Share2,
    label: 'Social',
    href: '/social',
    gradient: 'radial-gradient(circle, rgba(0,223,255,0.15) 0%, rgba(0,180,220,0.06) 50%, rgba(0,180,220,0) 100%)',
    iconColor: 'text-cyan-500',
  },
  {
    icon: BookOpen,
    label: 'Formacao',
    href: '/courses',
    gradient: 'radial-gradient(circle, rgba(29,69,216,0.15) 0%, rgba(75,111,232,0.06) 50%, rgba(29,69,216,0) 100%)',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Trophy,
    label: 'Comunidade',
    href: '/community',
    gradient: 'radial-gradient(circle, rgba(0,223,255,0.15) 0%, rgba(0,223,255,0.06) 50%, rgba(0,223,255,0) 100%)',
    iconColor: 'text-brand-accent',
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

        {/* Alterar Senha */}
        <ChangePasswordSection />

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

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Nova senha deve ter no minimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setSuccess(false); setOpen(false); }, 2000);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 themed-surface rounded-xl themed-border p-3 hover:themed-surface-light transition-colors"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-primary/10">
          <Lock className="w-4 h-4 text-brand-primary" />
        </div>
        <span className="flex-1 text-sm font-medium themed-text text-left">Alterar Senha</span>
        <ChevronRight className="w-4 h-4 themed-text-muted" />
      </button>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-semibold themed-text">Alterar Senha</h3>
        </div>
        <button onClick={() => setOpen(false)} className="text-xs themed-text-muted hover:themed-text">
          Cancelar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          Senha alterada com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          icon={<Lock className="w-[18px] h-[18px]" />}
          placeholder="Senha atual"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          icon={<Lock className="w-[18px] h-[18px]" />}
          placeholder="Nova senha"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          icon={<Lock className="w-[18px] h-[18px]" />}
          placeholder="Confirmar nova senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          Salvar Nova Senha
        </Button>
      </form>
    </Card>
  );
}
