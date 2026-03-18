import { useEffect, useState, useCallback } from 'react';
import { Trophy, Medal, Video as VideoIcon, Radio, BookOpen } from 'lucide-react';
import { communityApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface RankingEntry { creatorId: string; name: string; total: number | string }
interface Live { id: string; title: string; scheduledAt: string; host: string; status: 'upcoming' | 'live' | 'ended' }
interface Case { id: string; creatorName: string; title: string; story: string; earnings: string }

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

type Tab = 'ranking' | 'lives' | 'cases';

export default function Community() {
  const [tab, setTab] = useState<Tab>('ranking');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [lives, setLives] = useState<Live[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [rankRes, liveRes, caseRes] = await Promise.all([
        communityApi.ranking() as Promise<{ ranking: RankingEntry[]; totalCreators: number }>,
        communityApi.lives() as Promise<{ upcoming: Live[]; past: Live[] }>,
        communityApi.cases() as Promise<{ cases: Case[]; total: number }>,
      ]);
      setRanking(rankRes.ranking ?? []);
      setLives([...(liveRes.upcoming ?? []), ...(liveRes.past ?? [])]);
      setCases(caseRes.cases ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageContainer title="Comunidade"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Comunidade">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 themed-surface-card rounded-xl p-1 themed-border">
          {[
            { key: 'ranking' as Tab, label: 'Ranking', icon: Trophy },
            { key: 'lives' as Tab, label: 'Lives', icon: Radio },
            { key: 'cases' as Tab, label: 'Cases', icon: BookOpen },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-primary/15 text-brand-primary-light' : 'themed-text-secondary hover:themed-text'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ranking' && (
          <div className="space-y-2">
            {ranking.length === 0 ? (
              <p className="text-center themed-text-muted py-8">Nenhum dado de ranking disponivel.</p>
            ) : (
              ranking.map((entry, index) => {
                const position = index + 1;
                return (
                  <div key={entry.creatorId} className="flex items-center gap-3 themed-surface rounded-xl themed-border p-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      position <= 3 ? '' : 'bg-gray-800'
                    }`} style={position <= 3 ? { backgroundColor: `${MEDAL_COLORS[position - 1]}20` } : {}}>
                      {position <= 3 ? (
                        <Medal className="w-5 h-5" style={{ color: MEDAL_COLORS[position - 1] }} />
                      ) : (
                        <span className="text-sm font-bold themed-text-muted">#{position}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium themed-text truncate">{entry.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold themed-text">{entry.total}</p>
                      <p className="text-xs themed-text-muted">videos</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'lives' && (
          <div className="space-y-3">
            {lives.length === 0 ? (
              <p className="text-center themed-text-muted py-8">Nenhuma live programada.</p>
            ) : (
              lives.map((live) => (
                <Card key={live.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold themed-text">{live.title}</h3>
                    <Badge variant={live.status === 'live' ? 'danger' : live.status === 'upcoming' ? 'info' : 'default'}>
                      {live.status === 'live' ? 'AO VIVO' : live.status === 'upcoming' ? 'Em breve' : 'Encerrada'}
                    </Badge>
                  </div>
                  <p className="text-xs themed-text-muted">Host: {live.host} | {new Date(live.scheduledAt).toLocaleDateString('pt-BR')}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'cases' && (
          <div className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-center themed-text-muted py-8">Nenhum case publicado ainda.</p>
            ) : (
              cases.map((c) => (
                <Card key={c.id}>
                  <p className="text-sm font-semibold themed-text mb-1">{c.title}</p>
                  <p className="text-xs themed-text-secondary mb-2">por {c.creatorName}</p>
                  <p className="text-sm text-gray-300">{c.story}</p>
                  {c.earnings && <p className="text-xs text-emerald-400 mt-1 font-semibold">R$ {c.earnings} ganhos</p>}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
