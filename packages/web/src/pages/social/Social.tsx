import { useEffect, useState, useCallback } from 'react';
import { Share2, RefreshCw, Unlink, Instagram, Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { socialApi, type SocialAccount } from '@/lib/api';
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

  const fetchData = useCallback(async () => {
    try {
      const result = await socialApi.accounts();
      setAccounts(result.accounts);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSync(platform: 'instagram' | 'tiktok') {
    setSyncing(platform);
    try { await socialApi.sync(platform); fetchData(); } catch { /* silent */ }
    finally { setSyncing(null); }
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Desconectar ${platform}?`)) return;
    try { await socialApi.disconnect(platform); fetchData(); } catch { /* silent */ }
  }

  if (loading) return <PageContainer title="Redes Sociais"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Redes Sociais">
      <div className="space-y-6">
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-lg font-bold text-white mb-1">Nenhuma conta conectada</p>
            <p className="text-sm text-gray-400">Conecte Instagram ou TikTok para acompanhar suas metricas.</p>
          </div>
        ) : (
          accounts.map((acc) => {
            const color = PLATFORM_COLORS[acc.platform] ?? '#7C3AED';
            return (
              <Card key={acc.id} accent={color}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      {acc.platform === 'instagram' ? <Instagram className="w-5 h-5" style={{ color }} /> : <span style={{ color }} className="text-sm font-bold">TT</span>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{acc.username ?? acc.platform}</p>
                      <Badge variant={acc.status === 'connected' ? 'success' : 'warning'}>{acc.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSync(acc.platform)}
                      disabled={syncing === acc.platform}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing === acc.platform ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDisconnect(acc.platform)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Seguidores', value: formatNumber(acc.followers), icon: Eye },
                    { label: 'Curtidas', value: formatNumber(acc.avgLikes), icon: Heart },
                    { label: 'Views', value: formatNumber(acc.avgViews), icon: Eye },
                    { label: 'Engajamento', value: `${(acc.engagementRate * 100).toFixed(1)}%`, icon: TrendingUp },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-surface-light rounded-lg p-3 text-center">
                      <stat.icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {acc.lastSyncAt && (
                  <p className="text-xs text-gray-500 mt-3">
                    Ultima sync: {new Date(acc.lastSyncAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </Card>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
