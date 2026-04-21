import { useEffect, useState } from 'react';
import { Copy, Mail, Check } from 'lucide-react';
import { adminBrandInvitesApi, adminApi } from '@/lib/api';

interface Brand {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  brandName: string | null;
  brandId: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export default function AdminBrandInvites() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [brandId, setBrandId] = useState('');
  const [creating, setCreating] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [brandsRes, invitesRes] = await Promise.all([
        adminApi.brandsList(),
        adminBrandInvitesApi.list(),
      ]);
      setBrands((brandsRes as { brands: Brand[] }).brands ?? []);
      setInvites(invitesRes.invites);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !brandId) return;
    setCreating(true);
    try {
      const res = await adminBrandInvitesApi.create({ email, brandId });
      setLastInviteUrl(res.inviteUrl);
      setEmail('');
      setBrandId('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar convite');
    } finally {
      setCreating(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold themed-text mb-2">Convites de Marcas</h1>
      <p className="themed-text-muted mb-6">
        Gere convites para marcas parceiras acessarem o portal
      </p>

      <form
        onSubmit={handleCreate}
        className="themed-surface-card border themed-border rounded-xl p-6 mb-6"
      >
        <h2 className="font-bold themed-text mb-4">Novo convite</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">
              Email da marca
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contato@marca.com"
              className="w-full px-3 py-2 rounded-lg themed-bg border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium themed-text-muted mb-1">Marca</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg themed-bg border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
            >
              <option value="">Selecione...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={creating || !email || !brandId}
          className="px-5 py-2 rounded-lg bg-brand-primary text-white font-medium disabled:opacity-50"
        >
          {creating ? 'Gerando...' : 'Gerar convite'}
        </button>
      </form>

      {lastInviteUrl && (
        <div className="themed-surface-card border-2 border-green-500/50 rounded-xl p-5 mb-6">
          <div className="text-sm text-green-400 font-medium mb-2">Convite gerado!</div>
          <p className="themed-text-muted text-xs mb-3">
            Copie o link abaixo e envie para a marca (WhatsApp, email, etc):
          </p>
          <div className="flex gap-2">
            <input
              value={lastInviteUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg themed-bg border themed-border themed-text text-sm font-mono"
            />
            <button
              onClick={() => copyUrl(lastInviteUrl)}
              className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <div className="themed-surface-card border themed-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b themed-border">
          <h2 className="font-bold themed-text">Convites enviados</h2>
        </div>
        {loading ? (
          <div className="py-8 text-center themed-text-muted">Carregando...</div>
        ) : invites.length === 0 ? (
          <div className="py-8 text-center themed-text-muted text-sm">
            Nenhum convite gerado ainda
          </div>
        ) : (
          <div className="divide-y themed-border">
            {invites.map((invite) => {
              const isExpired = new Date(invite.expiresAt) < new Date();
              const isAccepted = !!invite.acceptedAt;
              return (
                <div key={invite.id} className="px-5 py-4 flex items-center gap-4">
                  <Mail className="w-5 h-5 themed-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium themed-text truncate">{invite.email}</div>
                    <div className="text-xs themed-text-muted mt-0.5">
                      {invite.brandName} · Enviado{' '}
                      {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    {isAccepted ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                        Aceito
                      </span>
                    ) : isExpired ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/30">
                        Expirado
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
