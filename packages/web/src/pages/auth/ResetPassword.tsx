import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { logos } from '@/lib/logos';
import { api } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ResetPassword() {
  const { isDark } = useTheme();
  const [params] = useSearchParams();
  const token = params.get('token');

  // Se nao tem token, mostra formulario de forgot-password
  if (!token) {
    return <ForgotPassword />;
  }

  return <ResetForm token={token} />;
}

function ForgotPassword() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Preencha seu email.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao enviar.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <PageWrapper isDark={isDark}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold themed-text text-center mb-2">Email Enviado!</h2>
        <p className="text-sm themed-text-secondary text-center mb-6">
          Se o email estiver cadastrado, voce recebera instrucoes para redefinir sua senha.
        </p>
        <Link to="/login" className="block text-center text-brand-primary-light font-semibold text-sm hover:underline">
          Voltar ao login
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper isDark={isDark}>
      <h2 className="text-xl font-bold themed-text text-center mb-1">Esqueceu sua senha?</h2>
      <p className="text-sm themed-text-secondary text-center mb-6">
        Informe seu email para receber o link de recuperacao.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<Mail className="w-[18px] h-[18px]" />}
          placeholder="Seu email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" loading={loading} icon={<ArrowRight className="w-4 h-4" />} className="w-full">
          Enviar Link
        </Button>
      </form>

      <Link to="/login" className="block text-center text-sm themed-text-secondary mt-4 hover:underline">
        Voltar ao login
      </Link>
    </PageWrapper>
  );
}

function ResetForm({ token }: { token: string }) {
  const { isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Minimo 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas nao coincidem.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Token invalido ou expirado.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PageWrapper isDark={isDark}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold themed-text text-center mb-2">Senha Alterada!</h2>
        <p className="text-sm themed-text-secondary text-center mb-6">
          Sua senha foi redefinida com sucesso. Faca login com a nova senha.
        </p>
        <Link to="/login">
          <Button className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
            Ir para Login
          </Button>
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper isDark={isDark}>
      <h2 className="text-xl font-bold themed-text text-center mb-1">Nova Senha</h2>
      <p className="text-sm themed-text-secondary text-center mb-6">
        Digite sua nova senha abaixo.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<Lock className="w-[18px] h-[18px]" />}
          placeholder="Nova senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          icon={<Lock className="w-[18px] h-[18px]" />}
          placeholder="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" loading={loading} icon={<ArrowRight className="w-4 h-4" />} className="w-full">
          Redefinir Senha
        </Button>
      </form>
    </PageWrapper>
  );
}

function PageWrapper({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="min-h-screen themed-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center mb-4">
          <img
            src={isDark ? logos.complete.dark : logos.complete.light}
            alt="Brandly"
            className="h-14 mx-auto"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
