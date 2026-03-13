import { useEffect, useState, useCallback } from 'react';
import { Trophy, Medal, Video as VideoIcon, Radio, BookOpen } from 'lucide-react';
import { communityApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface RankingEntry { position: number; name: string; level: string; score: number }
interface Live { id: string; title: string; date: string; host: string; status: 'upcoming' | 'live' | 'ended' }
interface Case { id: string; name: string; title: string; description: string }

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
      const [r, l, c] = await Promise.all([
        communityApi.ranking() as Promise<RankingEntry[]>,
        communityApi.lives() as Promise<Live[]>,
        communityApi.cases() as Promise<Case[]>,
      ]);
      setRanking(r); setLives(l); setCases(c);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageContainer title="Comunidade"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Comunidade">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-surface-card rounded-xl p-1 border border-gray-800">
          {[
            { key: 'ranking' as Tab, label: 'Ranking', icon: Trophy },
            { key: 'lives' as Tab, label: 'Lives', icon: Radio },
            { key: 'cases' as Tab, label: 'Cases', icon: BookOpen },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-primary/15 text-brand-primary-light' : 'text-gray-400 hover:text-white'
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
              <p className="text-center text-gray-500 py-8">Nenhum dado de ranking disponivel.</p>
            ) : (
              ranking.map((entry) => (
                <div key={entry.position} className="flex items-center gap-3 bg-surface rounded-xl border border-gray-800 p-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    entry.position <= 3 ? '' : 'bg-gray-800'
                  }`} style={entry.position <= 3 ? { backgroundColor: `${MEDAL_COLORS[entry.position - 1]}20` } : {}}>
                    {entry.position <= 3 ? (
                      <Medal className="w-5 h-5" style={{ color: MEDAL_COLORS[entry.position - 1] }} />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">#{entry.position}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                    <Badge variant="primary">{entry.level}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{entry.score}</p>
                    <p className="text-xs text-gray-500">pontos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'lives' && (
          <div className="space-y-3">
            {lives.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma live programada.</p>
            ) : (
              lives.map((live) => (
                <Card key={live.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">{live.title}</h3>
                    <Badge variant={live.status === 'live' ? 'danger' : live.status === 'upcoming' ? 'info' : 'default'}>
                      {live.status === 'live' ? 'AO VIVO' : live.status === 'upcoming' ? 'Em breve' : 'Encerrada'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Host: {live.host} | {new Date(live.date).toLocaleDateString('pt-BR')}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'cases' && (
          <div className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum case publicado ainda.</p>
            ) : (
              cases.map((c) => (
                <Card key={c.id}>
                  <p className="text-sm font-semibold text-white mb-1">{c.title}</p>
                  <p className="text-xs text-gray-400 mb-2">por {c.name}</p>
                  <p className="text-sm text-gray-300">{c.description}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
