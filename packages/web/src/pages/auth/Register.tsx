import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Gift, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { logos } from '@/lib/logos';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos obrigatorios.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, referralCode.trim() || undefined);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen themed-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-52 h-52 rounded-full bg-brand-primary/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <img
            src={isDark ? logos.complete.dark : logos.complete.light}
            alt="Brandly"
            className="h-16 mx-auto"
          />
          <p className="text-sm font-semibold text-brand-accent uppercase tracking-[2px]">
            Profissao Creator
          </p>
          <p className="themed-text-secondary">Crie sua conta gratuitamente</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={<User className="w-[18px] h-[18px]" />}
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            icon={<Mail className="w-[18px] h-[18px]" />}
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            icon={<Lock className="w-[18px] h-[18px]" />}
            placeholder="Senha"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            icon={<Gift className="w-[18px] h-[18px]" />}
            placeholder="Codigo de indicacao (opcional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
          <Button
            type="submit"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full mt-2"
          >
            Criar conta
          </Button>
        </form>

        <p className="text-center text-xs themed-text-muted">
          Ao criar sua conta voce concorda com os{' '}
          <span className="text-brand-primary-light">Termos de Uso</span> e{' '}
          <span className="text-brand-primary-light">Politica de Privacidade</span>.
        </p>

        <p className="text-center text-sm themed-text-secondary">
          Ja tem conta?{' '}
          <Link to="/login" className="text-brand-primary-light font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
