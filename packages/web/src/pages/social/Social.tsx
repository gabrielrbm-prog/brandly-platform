import { useEffect, useState, useCallback } from 'react';
import {
  Share2, RefreshCw, Unlink, Instagram, Eye, Heart, TrendingUp,
  PlusCircle, Users, Link as LinkIcon, AlertCircle, Loader2,
  X, AtSign, Pencil, CheckCircle,
} from 'lucide-react';
import { socialApi, type SocialAccount } from '@/lib/api';
import { openPhylloConnect } from '@/lib/phyllo-connect';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

const PLATFORM_COLORS = { instagram: '#E1306C', tiktok: '#00F2EA' };

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Modal de Conexao Manual ──────────────────────────────────────────────────

interface ConnectModalProps {
  onClose: () => void;
  onConnected: () => void;
  defaultPlatform?: 'instagram' | 'tiktok';
}

function ConnectModal({ onClose, onConnected, defaultPlatform = 'instagram' }: ConnectModalProps) {
  const [tab, setTab] = useState<'instagram' | 'tiktok'>(defaultPlatform);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleConnect() {
    setError('');
    setSuccess('');
    const clean = username.replace(/^@/, '').trim();
    if (!clean) {
      setError('Digite seu @username.');
      return;
    }
    setLoading(true);
    try {
      await socialApi.connectManual({ platform: tab, username: clean });
      setSuccess(`@${clean} conectado com sucesso!`);
      setTimeout(() => {
        onConnected();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Painel */}
      <div className="relative w-full max-w-md rounded-2xl themed-surface border themed-border shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold themed-text">Conectar Rede Social</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg themed-text-muted hover:themed-text hover:themed-surface-light transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl themed-surface-light border themed-border">
          {(['instagram', 'tiktok'] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setTab(p); setError(''); setSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === p
                  ? 'themed-surface themed-text shadow-sm'
                  : 'themed-text-muted hover:themed-text'
              }`}
            >
              {p === 'instagram'
                ? <Instagram className="w-4 h-4" style={{ color: tab === p ? PLATFORM_COLORS.instagram : undefined }} />
                : <span className={`text-xs font-black ${tab === p ? '' : 'opacity-50'}`} style={{ color: tab === p ? PLATFORM_COLORS.tiktok : undefined }}>TT</span>
              }
              {p === 'instagram' ? 'Instagram' : 'TikTok'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="space-y-1">
          <Input
            label={tab === 'instagram' ? 'Seu @username do Instagram' : 'Seu @username do TikTok'}
            placeholder="@seuperfil"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleConnect()}
            icon={<AtSign className="w-4 h-4" />}
            error={error}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
          />
          <p className="text-xs themed-text-muted px-1">
            Tentamos buscar seus seguidores automaticamente. Se nao encontrar, voce pode preencher depois.
          </p>
        </div>

        {/* Feedback de sucesso */}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Botoes */}
        <div className="space-y-2">
          <Button
            onClick={handleConnect}
            loading={loading}
            className="w-full"
          >
            Conectar
          </Button>

          {/* Phyllo como opcao secundaria */}
          <div className="text-center">
            <button
              type="button"
              onClick={async () => {
                onClose();
                // re-trigger Phyllo from parent — not handled here
              }}
              className="text-xs themed-text-muted hover:text-brand-primary-light underline transition-colors"
            >
              Conectar via Phyllo (autenticacao real)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Editar Metricas ─────────────────────────────────────────────────

interface EditMetricsModalProps {
  account: SocialAccount;
  onClose: () => void;
  onSaved: () => void;
}

function EditMetricsModal({ account, onClose, onSaved }: EditMetricsModalProps) {
  const [followers, setFollowers] = useState(String(account.followers || ''));
  const [avgLikes, setAvgLikes] = useState(String(account.avgLikes || ''));
  const [avgViews, setAvgViews] = useState(String(account.avgViews || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setLoading(true);
    try {
      await socialApi.updateManual({
        platform: account.platform,
        followers: followers !== '' ? Number(followers) : undefined,
        avgLikes: avgLikes !== '' ? Number(avgLikes) : undefined,
        avgViews: avgViews !== '' ? Number(avgViews) : undefined,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const color = PLATFORM_COLORS[account.platform] ?? '#7C3AED';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl themed-surface border themed-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              {account.platform === 'instagram'
                ? <Instagram className="w-4 h-4" style={{ color }} />
                : <span className="text-xs font-black" style={{ color }}>TT</span>
              }
            </div>
            <div>
              <h2 className="text-sm font-bold themed-text">Editar Metricas</h2>
              <p className="text-xs themed-text-muted">{account.username ? `@${account.username}` : account.platform}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg themed-text-muted hover:themed-text hover:themed-surface-light transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            label="Seguidores"
            type="number"
            min="0"
            placeholder="ex: 15000"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            icon={<Users className="w-4 h-4" />}
          />
          <Input
            label="Media de curtidas por post"
            type="number"
            min="0"
            placeholder="ex: 500"
            value={avgLikes}
            onChange={(e) => setAvgLikes(e.target.value)}
            icon={<Heart className="w-4 h-4" />}
          />
          <Input
            label="Media de views por post"
            type="number"
            min="0"
            placeholder="ex: 3000"
            value={avgViews}
            onChange={(e) => setAvgViews(e.target.value)}
            icon={<Eye className="w-4 h-4" />}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={loading} className="flex-1">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina Principal ─────────────────────────────────────────────────────────

export default function Social() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [phylloConnecting, setPhylloConnecting] = useState(false);
  const [error, setError] = useState('');

  // Modais
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectDefaultPlatform, setConnectDefaultPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await socialApi.accounts();
      setAccounts(result.accounts);
    } catch {
      // Silencioso — exibe lista vazia
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openConnectModal(platform?: 'instagram' | 'tiktok') {
    if (platform) setConnectDefaultPlatform(platform);
    setShowConnectModal(true);
  }

  async function handlePhylloConnect() {
    setError('');
    setPhylloConnecting(true);
    try {
      const { sdkToken, userId, environment } = await socialApi.connect();
      await openPhylloConnect(sdkToken, userId, environment, {
        onAccountConnected: async (accountId, workPlatformId, phylloUserId) => {
          try {
            await socialApi.accountConnected({ accountId, workPlatformId, phylloUserId });
            fetchData();
          } catch {
            setError('Erro ao salvar conexao via Phyllo. Tente novamente.');
          }
        },
        onAccountDisconnected: (_accountId: string, _workPlatformId: string, _userId: string) => {
          fetchData();
        },
        onTokenExpired: (_userId: string) => {
          setError('Token expirado. Tente conectar novamente.');
        },
        onExit: (_reason: string, _userId: string) => {},
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao iniciar conexao via Phyllo.');
    } finally {
      setPhylloConnecting(false);
    }
  }

  async function handleSync(platform: 'instagram' | 'tiktok') {
    setSyncing(platform);
    try { await socialApi.sync(platform); fetchData(); } catch { /* silent */ }
    finally { setSyncing(null); }
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Desconectar ${platform}?`)) return;
    try { await socialApi.disconnect(platform); fetchData(); } catch { /* silent */ }
  }

  const connectedAccounts = accounts.filter(a => a.status === 'connected');
  const hasInstagram = connectedAccounts.some(a => a.platform === 'instagram');
  const hasTiktok = connectedAccounts.some(a => a.platform === 'tiktok');
  const canConnectMore = !hasInstagram || !hasTiktok;

  if (loading) {
    return (
      <PageContainer title="Redes Sociais">
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Redes Sociais">
      <div className="space-y-6">
        {/* Erro global */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">&times;</button>
          </div>
        )}

        {/* Botoes de conexao */}
        {canConnectMore && (
          <div className="space-y-2">
            {!hasInstagram && !hasTiktok ? (
              <Button
                onClick={() => openConnectModal('instagram')}
                icon={<PlusCircle className="w-5 h-5" />}
                className="w-full"
              >
                Conectar Rede Social
              </Button>
            ) : (
              <div className="flex gap-2">
                {!hasInstagram && (
                  <Button onClick={() => openConnectModal('instagram')} icon={<Instagram className="w-4 h-4" />} className="flex-1">
                    Conectar Instagram
                  </Button>
                )}
                {!hasTiktok && (
                  <Button onClick={() => openConnectModal('tiktok')} icon={<PlusCircle className="w-4 h-4" />} className="flex-1">
                    Conectar TikTok
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {connectedAccounts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 themed-text-muted" />
            </div>
            <p className="text-lg font-bold themed-text mb-1">Nenhuma conta conectada</p>
            <p className="text-sm themed-text-secondary mb-2">
              Conecte Instagram ou TikTok para acompanhar suas metricas de performance.
            </p>
            <p className="text-xs themed-text-muted">
              Acessamos apenas dados publicos (seguidores, curtidas, views). Nunca publicamos nada em seu nome.
            </p>
          </div>
        )}

        {/* Contas conectadas */}
        {connectedAccounts.map((acc) => {
          const color = PLATFORM_COLORS[acc.platform] ?? '#7C3AED';
          return (
            <Card glowing key={acc.id} accent={color}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    {acc.platform === 'instagram'
                      ? <Instagram className="w-5 h-5" style={{ color }} />
                      : <span style={{ color }} className="text-sm font-bold">TT</span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold themed-text">
                      {acc.username ? `@${acc.username}` : acc.platform}
                    </p>
                    <Badge variant={acc.status === 'connected' ? 'success' : 'warning'}>{acc.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Editar metricas */}
                  <button
                    onClick={() => setEditingAccount(acc)}
                    className="p-2 rounded-lg themed-text-secondary hover:text-brand-primary-light hover:bg-brand-primary/10 transition-colors"
                    title="Editar metricas"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Sync Phyllo */}
                  <button
                    onClick={() => handleSync(acc.platform)}
                    disabled={syncing === acc.platform}
                    className="p-2 rounded-lg themed-text-secondary hover:themed-text hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Atualizar via Phyllo"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === acc.platform ? 'animate-spin' : ''}`} />
                  </button>
                  {/* Desconectar */}
                  <button
                    onClick={() => handleDisconnect(acc.platform)}
                    className="p-2 rounded-lg themed-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Desconectar"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Seguidores', value: formatNumber(acc.followers), icon: Users, color: '#60A5FA' },
                  { label: 'Curtidas/Post', value: formatNumber(acc.avgLikes), icon: Heart, color: '#F472B6' },
                  { label: 'Views/Post', value: formatNumber(acc.avgViews), icon: Eye, color: '#A78BFA' },
                  { label: 'Engajamento', value: `${acc.engagementRate.toFixed(1)}%`, icon: TrendingUp, color: '#34D399' },
                ].map((stat) => (
                  <div key={stat.label} className="themed-surface-light rounded-lg p-3 text-center">
                    <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: stat.color }} />
                    <p className="text-sm font-bold themed-text">{stat.value}</p>
                    <p className="text-xs themed-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              {acc.lastSyncAt && (
                <p className="text-xs themed-text-muted mt-3">
                  Ultima atualizacao: {new Date(acc.lastSyncAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>
          );
        })}

        {/* Resumo geral */}
        {connectedAccounts.length > 0 && (
          <Card>
            <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">Resumo Geral</p>
            <div className="space-y-3">
              {[
                {
                  label: 'Total seguidores',
                  value: formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0)),
                  icon: Users,
                  color: '#60A5FA',
                },
                {
                  label: 'Engajamento medio',
                  value: `${(connectedAccounts.reduce((s, a) => s + a.engagementRate, 0) / connectedAccounts.length).toFixed(1)}%`,
                  icon: TrendingUp,
                  color: '#34D399',
                },
                {
                  label: 'Plataformas',
                  value: String(connectedAccounts.length),
                  icon: LinkIcon,
                  color: '#A78BFA',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-sm themed-text-secondary">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Link secundario para Phyllo */}
            <div className="mt-4 pt-4 border-t themed-border text-center">
              <button
                type="button"
                onClick={handlePhylloConnect}
                disabled={phylloConnecting}
                className="text-xs themed-text-muted hover:text-brand-primary-light underline transition-colors disabled:opacity-50"
              >
                {phylloConnecting ? 'Aguarde...' : 'Conectar via Phyllo (autenticacao real)'}
              </button>
            </div>
          </Card>
        )}

        {/* Modais */}
        {showConnectModal && (
          <ConnectModal
            defaultPlatform={connectDefaultPlatform}
            onClose={() => setShowConnectModal(false)}
            onConnected={fetchData}
          />
        )}

        {editingAccount && (
          <EditMetricsModal
            account={editingAccount}
            onClose={() => setEditingAccount(null)}
            onSaved={fetchData}
          />
        )}
      </div>
    </PageContainer>
  );
}
