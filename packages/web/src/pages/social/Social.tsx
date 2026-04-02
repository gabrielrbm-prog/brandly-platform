import { useEffect, useState, useCallback } from 'react';
import {
  Share2, RefreshCw, Unlink, Instagram, Eye, Heart, TrendingUp,
  PlusCircle, Users, Link as LinkIcon, AlertCircle, Loader2,
} from 'lucide-react';
import { socialApi, type SocialAccount } from '@/lib/api';
import { openPhylloConnect } from '@/lib/phyllo-connect';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

const PLATFORM_COLORS = { instagram: '#E1306C', tiktok: '#00F2EA' };

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function Social() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const result = await socialApi.accounts();
      setAccounts(result.accounts);
    } catch {
      // Silencioso — se não conseguir carregar contas, mostra lista vazia
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleConnect() {
    setError('');
    setConnecting(true);
    try {
      // 1. Obter SDK token do backend
      const { sdkToken, userId, environment } = await socialApi.connect();

      // 2. Abrir Phyllo Connect widget
      await openPhylloConnect(sdkToken, userId, environment, {
        onAccountConnected: async (accountId, workPlatformId, phylloUserId) => {
          try {
            // 3. Notificar backend sobre a conta conectada
            await socialApi.accountConnected({ accountId, workPlatformId, phylloUserId });
            // 4. Recarregar contas
            fetchData();
          } catch {
            setError('Erro ao salvar conexao. Tente novamente.');
          }
        },
        onAccountDisconnected: () => {
          fetchData();
        },
        onTokenExpired: () => {
          setError('Token expirado. Tente conectar novamente.');
        },
        onExit: () => {
          // Widget fechado pelo usuario
        },
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao iniciar conexao.');
    } finally {
      setConnecting(false);
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

  if (loading) return <PageContainer title="Redes Sociais"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Redes Sociais">
      <div className="space-y-6">
        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">&times;</button>
          </div>
        )}

        {/* Botao conectar */}
        {canConnectMore && (
          <Button
            onClick={handleConnect}
            loading={connecting}
            icon={connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            className="w-full"
          >
            Conectar {!hasInstagram && !hasTiktok ? 'Rede Social' : !hasInstagram ? 'Instagram' : 'TikTok'}
          </Button>
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
                    {acc.platform === 'instagram' ? <Instagram className="w-5 h-5" style={{ color }} /> : <span style={{ color }} className="text-sm font-bold">TT</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold themed-text">
                      {acc.username ? `@${acc.username}` : acc.platform}
                    </p>
                    <Badge variant={acc.status === 'connected' ? 'success' : 'warning'}>{acc.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSync(acc.platform)}
                    disabled={syncing === acc.platform}
                    className="p-2 rounded-lg themed-text-secondary hover:themed-text hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Atualizar metricas"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === acc.platform ? 'animate-spin' : ''}`} />
                  </button>
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
                  Ultima sync: {new Date(acc.lastSyncAt).toLocaleDateString('pt-BR')}
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
                { label: 'Total seguidores', value: formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0)), icon: Users, color: '#60A5FA' },
                { label: 'Engajamento medio', value: `${(connectedAccounts.reduce((s, a) => s + a.engagementRate, 0) / connectedAccounts.length).toFixed(1)}%`, icon: TrendingUp, color: '#34D399' },
                { label: 'Plataformas', value: String(connectedAccounts.length), icon: LinkIcon, color: '#A78BFA' },
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
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
