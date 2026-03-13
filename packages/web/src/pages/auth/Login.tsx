import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow orb */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center shadow-lg shadow-brand-primary/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-extrabold text-white tracking-tight">Brandly</span>
          </div>
          <p className="text-sm font-semibold text-brand-primary-light uppercase tracking-[2px]">
            Profissao Creator
          </p>
          <p className="text-gray-400">Entre na sua conta</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full mt-2"
          >
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Nao tem conta?{' '}
          <Link to="/register" className="text-brand-primary-light font-semibold hover:underline">
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </div>
  );
}
