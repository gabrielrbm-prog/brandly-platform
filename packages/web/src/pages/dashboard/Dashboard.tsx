import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Sun,
  Calendar,
  BarChart2,
  Video,
  DollarSign,
  Star,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface DailyStats {
  approved: number;
  pending: number;
  rejected: number;
  earningsToday: number;
  remainingSlots: number;
}

interface MonthlyStats {
  totalVideos: number;
  approvalRate: number;
  totalEarnings: number;
  earningsBreakdown: { videos: number; commissions: number; bonuses: number };
}

interface Overview {
  daily: DailyStats;
  monthly: MonthlyStats;
  level: { name: string; progress: number };
  activeBrands: number;
}

const LEVEL_COLORS: Record<string, string> = {
  Seed: '#9CA3AF', Spark: '#FBBF24', Flow: '#34D399', Iconic: '#60A5FA',
  Vision: '#A78BFA', Empire: '#F472B6', Infinity: '#FBBF24',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = (await dashboardApi.overview()) as Overview;
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <PageContainer title="Inicio">
        <div className="space-y-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  const daily = data?.daily;
  const monthly = data?.monthly;
  const level = data?.level;
  const levelName = level?.name ?? 'Seed';
  const levelColor = LEVEL_COLORS[levelName] ?? '#7C3AED';
  const progressPct = Math.min((level?.progress ?? 0) * 100, 100);
  const used = 10 - (daily?.remainingSlots ?? 10);

  return (
    <PageContainer title="Inicio">
      <div className="space-y-6">
        {/* Hero greeting */}
        <div className="rounded-2xl border border-brand-primary/15 bg-gradient-to-r from-brand-primary/10 to-transparent p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold themed-text">
                Ola, {user?.name?.split(' ')[0] ?? 'Creator'} 👋
              </h2>
              <p className="text-sm themed-text-secondary mt-1">
                {used === 0 ? 'Pronto para dominar hoje?' : used < 5 ? `${used} videos feitos — keep going!` : used < 10 ? `${used}/10 — voce esta arrasando!` : 'Meta diaria concluida!'}
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{ color: levelColor, borderColor: levelColor }}
            >
              {levelName}
            </span>
          </div>
        </div>

        {/* Earnings hero */}
        <Card glowing className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 pointer-events-none rounded-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Ganhos Hoje</span>
              </div>
              <p className="text-sm themed-text-secondary">
                R${' '}
                <span className="text-4xl font-bold text-emerald-400">
                  {(daily?.earningsToday ?? 0).toFixed(2)}
                </span>
              </p>
              <p className="text-xs themed-text-muted mt-1">Meta: R$ 100,00/dia</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full border-[3px] border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-400">{used}</span>
                <span className="text-sm themed-text-muted">/10</span>
              </div>
              <span className="text-xs themed-text-muted mt-1">videos</span>
            </div>
          </div>
          <ProgressBar value={used} max={10} color="#10B981" className="mt-4" />
          <p className="text-xs themed-text-muted mt-1">{daily?.remainingSlots ?? 10} slots restantes hoje</p>
        </Card>

        {/* Daily stats grid */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-3.5 h-3.5 themed-text-muted" />
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Hoje</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard glowing icon={<CheckCircle className="w-4 h-4" />} label="Aprovados" value={String(daily?.approved ?? 0)} color="#10B981" />
            <StatCard glowing icon={<Clock className="w-4 h-4" />} label="Pendentes" value={String(daily?.pending ?? 0)} color="#F59E0B" />
            <StatCard glowing icon={<XCircle className="w-4 h-4" />} label="Rejeitados" value={String(daily?.rejected ?? 0)} color="#EF4444" />
            <StatCard glowing icon={<Zap className="w-4 h-4" />} label="Restantes" value={String(daily?.remainingSlots ?? 10)} color="#A78BFA" />
          </div>
        </div>

        {/* Monthly summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 themed-text-muted" />
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Este Mes</span>
          </div>
          <Card glowing>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 themed-text-secondary" />
              <span className="text-sm font-semibold themed-text-secondary">Resumo Mensal</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-800 text-center mb-4">
              <div>
                <Video className="w-4 h-4 themed-text-secondary mx-auto mb-1" />
                <p className="text-lg font-bold themed-text">{monthly?.totalVideos ?? 0}</p>
                <p className="text-xs themed-text-muted">Videos</p>
              </div>
              <div>
                <BarChart2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-400">
                  {((monthly?.approvalRate ?? 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs themed-text-muted">Aprovacao</p>
              </div>
              <div>
                <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-400">
                  R$ {(monthly?.totalEarnings ?? 0).toFixed(0)}
                </p>
                <p className="text-xs themed-text-muted">Total</p>
              </div>
            </div>
            {monthly?.earningsBreakdown && (
              <div className="themed-surface-light rounded-xl p-3 space-y-2">
                {[
                  { label: 'Videos', value: monthly.earningsBreakdown.videos, color: '#3B82F6' },
                  { label: 'Comissoes', value: monthly.earningsBreakdown.commissions, color: '#7C3AED' },
                  { label: 'Bonus', value: monthly.earningsBreakdown.bonuses, color: '#F59E0B' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm themed-text-secondary">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold themed-text">
                      R$ {(item.value ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Level */}
        <Card glowing accent={levelColor}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${levelColor}20` }}>
              <Star className="w-5 h-5" style={{ color: levelColor }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: levelColor }}>{levelName}</p>
              <p className="text-xs themed-text-muted">{progressPct.toFixed(0)}% para o proximo nivel</p>
            </div>
          </div>
          <ProgressBar value={progressPct} color={levelColor} />
        </Card>

        {/* Brands */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-brand-primary-light" />
              </div>
              <div>
                <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide">Marcas Conectadas</p>
                <p className="text-xl font-bold themed-text">{data?.activeBrands ?? 0}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 themed-text-muted" />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
