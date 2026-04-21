import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, brandPortalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { logos } from '@/lib/logos';
import { useTheme } from '@/contexts/ThemeContext';

export default function AcceptBrandInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{ email: string; brandName: string } | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de convite nao informado');
      setLoading(false);
      return;
    }
    brandPortalApi
      .acceptInviteInfo(token)
      .then((data) => setInviteInfo(data))
      .catch((err) => setError(err.message ?? 'Convite invalido'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Senhas nao coincidem');
      return;
    }
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await brandPortalApi.acceptInvite({ token, name, password });
      api.setToken(res.token);
      // Força reload pra AuthContext pegar o novo user
      window.location.href = '/marca';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen themed-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full themed-surface-card border themed-border rounded-xl p-8 text-center">
          <h1 className="text-xl font-bold themed-text mb-3">Convite invalido</h1>
          <p className="themed-text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-lg bg-brand-primary text-white font-medium"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen themed-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full themed-surface-card border themed-border rounded-xl p-8">
        <img
          src={isDark ? logos.horizontal.dark : logos.horizontal.light}
          alt="Brandly"
          className="h-10 object-contain mx-auto mb-6"
        />
        <h1 className="text-2xl font-bold themed-text text-center mb-2">
          Bem-vindo(a) a Brandly
        </h1>
        <p className="text-center themed-text-muted mb-6">
          Voce foi convidado como marca <strong className="themed-text">{inviteInfo?.brandName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">Email</label>
            <input
              type="email"
              value={inviteInfo?.email ?? ''}
              disabled
              className="w-full px-3 py-2 rounded-lg themed-bg border themed-border themed-text-muted text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg themed-surface-card border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 caracteres"
              className="w-full px-3 py-2 rounded-lg themed-surface-card border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg themed-surface-card border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-primary-light disabled:opacity-50"
          >
            {submitting ? 'Criando conta...' : 'Criar conta e acessar'}
          </button>
        </form>
      </div>
    </div>
  );
}
