import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Award,
  Copy,
  Check,
  ChevronRight,
  Star,
  Activity,
} from 'lucide-react';
import { networkApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface NetworkStats {
  period: string;
  level: {
    current: string;
    rank: number;
    nextLevel: string | null;
    requirements: {
      qv: { current: number; required: number };
      directs: { current: number; required: number };
      pml: { current: number; required: number };
    };
  };
  network: { totalMembers: number; activeMembers: number; directsActive: number; totalVolume: string };
  bonuses: { direct: string; infinite: string; matching: string; global: string; total: string };
}

interface DirectMember { id: string; name: string; level: string; status: string; createdAt: string }

const LEVEL_COLORS: Record<string, string> = {
  Seed: '#9CA3AF', Spark: '#FBBF24', Flow: '#34D399', Iconic: '#60A5FA',
  Vision: '#A78BFA', Empire: '#F472B6', Infinity: '#FBBF24',
};

export default function Network() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [members, setMembers] = useState<DirectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, r, t] = await Promise.all([
        networkApi.stats() as Promise<NetworkStats>,
        networkApi.referralLink() as Promise<{ link: string }>,
        networkApi.tree() as Promise<{ directs: DirectMember[] }>,
      ]);
      setStats(s);
      setReferralLink(r.link);
      setMembers(t.directs ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <PageContainer title="Rede"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  const level = stats?.level;
  const reqs = level?.requirements;
  const levelColor = LEVEL_COLORS[level?.current ?? 'Seed'] ?? '#7C3AED';

  return (
    <PageContainer title="Rede">
      <div className="space-y-6">
        {/* Level card */}
        <Card glowing accent={levelColor}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${levelColor}20` }}>
              <Star className="w-5 h-5" style={{ color: levelColor }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: levelColor }}>{level?.current ?? 'Seed'}</p>
              {level?.nextLevel && <p className="text-xs themed-text-muted">Proximo: {level.nextLevel}</p>}
            </div>
          </div>
          {reqs && (
            <div className="space-y-3">
              {[
                { label: 'QV (Volume)', current: reqs.qv.current, required: reqs.qv.required },
                { label: 'Diretos Ativos', current: reqs.directs.current, required: reqs.directs.required },
                { label: 'PML (Ponto Max Linha)', current: reqs.pml.current, required: reqs.pml.required },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="themed-text-secondary">{r.label}</span>
                    <span className="themed-text-secondary font-medium">{r.current}/{r.required}</span>
                  </div>
                  <ProgressBar value={r.current} max={r.required} color={levelColor} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Network stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard glowing icon={<Users className="w-4 h-4" />} label="Total Membros" value={String(stats?.network.totalMembers ?? 0)} color="#7C3AED" />
          <StatCard glowing icon={<Activity className="w-4 h-4" />} label="Ativos" value={String(stats?.network.activeMembers ?? 0)} color="#10B981" />
          <StatCard glowing icon={<UserPlus className="w-4 h-4" />} label="Diretos" value={String(stats?.network.directsActive ?? 0)} color="#3B82F6" />
          <StatCard glowing icon={<TrendingUp className="w-4 h-4" />} label="Volume" value={`R$ ${stats?.network.totalVolume ?? '0'}`} color="#F59E0B" />
        </div>

        {/* Bonuses */}
        {stats?.bonuses && (
          <Card glowing>
            <h3 className="text-sm font-semibold themed-text-secondary mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Bonus do Periodo
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Direto', value: stats.bonuses.direct },
                { label: 'Infinito', value: stats.bonuses.infinite },
                { label: 'Equiparacao', value: stats.bonuses.matching },
                { label: 'Global', value: stats.bonuses.global },
              ].map((b) => (
                <div key={b.label} className="flex justify-between items-center themed-surface-light rounded-lg px-3 py-2">
                  <span className="text-sm themed-text-secondary">{b.label}</span>
                  <span className="text-sm font-bold themed-text">R$ {b.value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t themed-border">
                <span className="text-sm font-semibold themed-text-secondary">Total</span>
                <span className="text-lg font-bold text-emerald-400">R$ {stats.bonuses.total}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Referral link */}
        <Card>
          <h3 className="text-sm font-semibold themed-text-secondary mb-3">Link de Indicacao</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 themed-surface-light rounded-xl px-4 py-3 text-sm themed-text-secondary truncate themed-border">
              {referralLink || 'Carregando...'}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 p-3 rounded-xl bg-brand-primary/15 text-brand-primary-light hover:bg-brand-primary/25 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </Card>

        {/* Direct members */}
        <div>
          <h3 className="text-lg font-bold themed-text mb-3">Membros Diretos</h3>
          {members.length === 0 ? (
            <p className="text-center themed-text-muted py-8">Nenhum membro direto ainda.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 themed-surface rounded-xl themed-border p-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-xs font-bold text-white">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium themed-text truncate">{m.name}</p>
                    <Badge variant={m.status === 'active' ? 'success' : 'default'}>{m.level}</Badge>
                  </div>
                  <ChevronRight className="w-4 h-4 themed-text-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
