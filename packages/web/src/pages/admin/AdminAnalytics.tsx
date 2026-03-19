import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Video,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import {
  adminApi,
  type AdminAnalyticsOverview,
  type AdminAnalyticsGrowth,
  type AdminOnboardingFunnel,
  type AdminRejectionReasons,
  type AdminVideoSla,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    typeof value === 'string' ? parseFloat(value) : value,
  );
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

// ─── Overview Cards ────────────────────────────────────────────────────────────

function OverviewSection({
  data,
  loading,
}: {
  data: AdminAnalyticsOverview | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Creators */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-brand-primary-light" />
          <h3 className="text-sm font-semibold themed-text">Creators</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Total"
            value={data ? formatNumber(data.creators.total) : '—'}
            color="#7C3AED"
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="Ativos"
            value={data ? formatNumber(data.creators.active) : '—'}
            color="#10B981"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Novos este mes"
            value={data ? formatNumber(data.creators.newThisMonth) : '—'}
            color="#60A5FA"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Novos esta semana"
            value={data ? formatNumber(data.creators.newThisWeek) : '—'}
            color="#A78BFA"
          />
        </div>
      </Card>

      {/* Videos */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold themed-text">Videos</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={<Video className="w-4 h-4" />}
            label="Total"
            value={data ? formatNumber(data.videos.total) : '—'}
            color="#F59E0B"
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="Aprovados hoje"
            value={data ? String(data.videos.approvedToday) : '—'}
            color="#10B981"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Pendentes agora"
            value={data ? String(data.videos.pendingNow) : '—'}
            color="#F59E0B"
          />
          <StatCard
            icon={<XCircle className="w-4 h-4" />}
            label="Rejeitados hoje"
            value={data ? String(data.videos.rejectedToday) : '—'}
            color="#EF4444"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Taxa Aprovacao"
            value={data ? (typeof data.videos.approvalRate === 'string' ? data.videos.approvalRate : `${data.videos.approvalRate}%`) : '—'}
            color="#34D399"
          />
        </div>
      </Card>

      {/* Financial */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold themed-text">Financeiro</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Receita total"
            value={data ? formatCurrency(data.financial.totalRevenue) : '—'}
            color="#10B981"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Receita do mes"
            value={data ? formatCurrency(data.financial.revenueThisMonth) : '—'}
            color="#34D399"
          />
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Pago a creators (mes)"
            value={data ? formatCurrency(data.financial.paidToCreatorsThisMonth) : '—'}
            color="#60A5FA"
          />
        </div>
      </Card>

      {/* Engagement */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-semibold themed-text">Engajamento</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Media seguidores"
            value={data ? formatNumber(data.engagement.avgFollowers) : '—'}
            color="#F472B6"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Taxa engajamento"
            value={data ? (typeof data.engagement.avgEngagementRate === 'string' ? `${data.engagement.avgEngagementRate}%` : `${data.engagement.avgEngagementRate.toFixed(2)}%`) : '—'}
            color="#A78BFA"
          />
          <StatCard
            icon={<Share2 className="w-4 h-4" />}
            label="Contas sociais"
            value={data ? String(data.engagement.connectedSocialAccounts) : '—'}
            color="#60A5FA"
          />
        </div>
      </Card>
    </div>
  );
}

// ─── Growth Chart ──────────────────────────────────────────────────────────────

type GrowthPeriod = '30d' | '90d' | '12m';

const PERIOD_LABELS: Record<GrowthPeriod, string> = {
  '30d': '30 dias',
  '90d': '90 dias',
  '12m': '12 meses',
};

interface MiniBarChartProps {
  data: number[];
  labels: string[];
  color: string;
  title: string;
  formatValue?: (v: number) => string;
}

function MiniBarChart({ data, labels, color, title, formatValue }: MiniBarChartProps) {
  const max = Math.max(...data, 1);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-3">
        {title}
      </p>
      <div className="flex items-end gap-1 h-24">
        {data.map((value, i) => {
          const heightPct = Math.max((value / max) * 100, value > 0 ? 4 : 0);
          return (
            <div
              key={i}
              className="group relative flex-1 flex flex-col justify-end"
            >
              <div
                className="rounded-t-sm transition-all duration-300"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: color,
                  opacity: 0.75,
                }}
              />
              {/* Hover tooltip */}
              <div
                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none"
              >
                <div className="bg-black/80 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                  <span className="block text-center themed-text-muted">{labels[i]}</span>
                  <span className="block text-center font-semibold" style={{ color }}>
                    {formatValue ? formatValue(value) : value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div
                  className="w-1.5 h-1.5 rotate-45 bg-black/80"
                  style={{ marginTop: -3 }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] themed-text-muted">{labels[0]}</span>
        <span className="text-[9px] themed-text-muted">{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

function GrowthSection({
  period,
  data,
  loading,
  onPeriodChange,
}: {
  period: GrowthPeriod;
  data: AdminAnalyticsGrowth | null;
  loading: boolean;
  onPeriodChange: (p: GrowthPeriod) => void;
}) {
  const registrations = data?.data.map((d) => d.registrations) ?? [];
  const videos = data?.data.map((d) => d.videosSubmitted) ?? [];
  const revenue = data?.data.map((d) => d.revenue) ?? [];
  const labels = data?.data.map((d) => d.label) ?? [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-primary-light" />
          <h3 className="text-sm font-semibold themed-text">Crescimento</h3>
        </div>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as GrowthPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-brand-primary/20 text-brand-primary-light'
                  : 'themed-text-muted hover:themed-text hover:themed-surface-light'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      ) : !data?.data.length ? (
        <p className="text-sm themed-text-muted text-center py-8">Sem dados de crescimento disponíveis</p>
      ) : (
        <div className="flex gap-6">
          <MiniBarChart
            data={registrations}
            labels={labels}
            color="#7C3AED"
            title="Registros"
          />
          <MiniBarChart
            data={videos}
            labels={labels}
            color="#60A5FA"
            title="Videos Enviados"
          />
          <MiniBarChart
            data={revenue}
            labels={labels}
            color="#10B981"
            title="Receita"
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      )}
    </Card>
  );
}

// ─── Onboarding Funnel ─────────────────────────────────────────────────────────

const FUNNEL_STEPS = [
  { key: 'registered' as const, label: 'Registrado', color: '#7C3AED' },
  { key: 'startedOnboarding' as const, label: 'Onboarding', color: '#8B5CF6' },
  { key: 'completedBehavioral' as const, label: 'Perfil IA', color: '#A78BFA' },
  { key: 'submittedFirstVideo' as const, label: '1o Video', color: '#34D399' },
  { key: 'hitDailyTarget' as const, label: 'Meta Diaria', color: '#10B981' },
];

function OnboardingFunnelSection({
  data,
  loading,
}: {
  data: AdminOnboardingFunnel | null;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-primary-light" />
          <h3 className="text-sm font-semibold themed-text">Funil de Onboarding</h3>
        </div>
        {data && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs themed-text-muted">Conversao geral:</span>
            <span className="text-sm font-bold text-emerald-400">
              {data.conversionRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {!data ? (
        <p className="text-sm themed-text-muted text-center py-6">Sem dados do funil disponíveis</p>
      ) : (
        <div className="space-y-3">
          {FUNNEL_STEPS.map((step, index) => {
            const count = data[step.key];
            const base = data.registered;
            const pctFromTotal = base > 0 ? (count / base) * 100 : 0;
            const prev = index > 0 ? data[FUNNEL_STEPS[index - 1].key] : base;
            const pctFromPrev = prev > 0 ? (count / prev) * 100 : 0;
            // Funnel bar width shrinks at each step
            const barWidth = Math.max(pctFromTotal, 5);

            return (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: step.color }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm themed-text">{step.label}</span>
                    <span className="text-xs themed-text-muted">{count.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {index > 0 && (
                      <span className="text-xs themed-text-muted">
                        {pctFromPrev.toFixed(1)}% do anterior
                      </span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: step.color }}>
                      {pctFromTotal.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${step.color}cc, ${step.color})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Video Intelligence ────────────────────────────────────────────────────────

function RejectionReasonsCard({
  data,
  loading,
}: {
  data: AdminRejectionReasons | null;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold themed-text">Motivos de Rejeicao</h3>
        </div>
        {data && (
          <span className="text-xs themed-text-muted">
            {data.totalRejected} total rejeitados
          </span>
        )}
      </div>

      {!data?.reasons.length ? (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm themed-text-secondary">Nenhuma rejeicao registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reasons.map((item) => (
            <div key={item.reason}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm themed-text truncate pr-2">{item.reason}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs themed-text-muted">{item.count}x</span>
                  <span className="text-xs font-semibold text-red-400">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    background: 'linear-gradient(90deg, #EF444466, #EF4444)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ReviewSlaCard({
  data,
  loading,
}: {
  data: AdminVideoSla | null;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard />;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold themed-text">SLA de Revisao</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Tempo medio review"
          value={data ? `${data.avgReviewTimeHours.toFixed(1)}h` : '—'}
          color="#F59E0B"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Pendentes &gt;24h"
          value={data ? String(data.pendingOver24h) : '—'}
          color={data && data.pendingOver24h > 0 ? '#EF4444' : '#10B981'}
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Revisados hoje"
          value={data ? String(data.reviewedToday) : '—'}
          color="#10B981"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Pendentes agora"
          value={data ? String(data.pendingNow) : '—'}
          color="#F59E0B"
        />
      </div>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const toast = useToast();
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>('30d');

  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [growth, setGrowth] = useState<AdminAnalyticsGrowth | null>(null);
  const [funnel, setFunnel] = useState<AdminOnboardingFunnel | null>(null);
  const [rejections, setRejections] = useState<AdminRejectionReasons | null>(null);
  const [sla, setSla] = useState<AdminVideoSla | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingGrowth, setLoadingGrowth] = useState(true);
  const [loadingFunnel, setLoadingFunnel] = useState(true);
  const [loadingRejections, setLoadingRejections] = useState(true);
  const [loadingSla, setLoadingSla] = useState(true);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await adminApi.analyticsOverview();
      setOverview(res);
    } catch {
      toast.error('Erro ao carregar overview de analytics.');
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  const fetchGrowth = useCallback(async (period: GrowthPeriod) => {
    setLoadingGrowth(true);
    try {
      const res = await adminApi.analyticsGrowth(period);
      setGrowth(res);
    } catch {
      toast.error('Erro ao carregar dados de crescimento.');
    } finally {
      setLoadingGrowth(false);
    }
  }, [toast]);

  const fetchFunnel = useCallback(async () => {
    setLoadingFunnel(true);
    try {
      const res = await adminApi.onboardingFunnel();
      setFunnel(res);
    } catch {
      toast.error('Erro ao carregar funil de onboarding.');
    } finally {
      setLoadingFunnel(false);
    }
  }, [toast]);

  const fetchRejections = useCallback(async () => {
    setLoadingRejections(true);
    try {
      const res = await adminApi.rejectionReasons();
      setRejections(res);
    } catch {
      toast.error('Erro ao carregar motivos de rejeicao.');
    } finally {
      setLoadingRejections(false);
    }
  }, [toast]);

  const fetchSla = useCallback(async () => {
    setLoadingSla(true);
    try {
      const res = await adminApi.videoSla();
      setSla(res);
    } catch {
      toast.error('Erro ao carregar SLA de revisao.');
    } finally {
      setLoadingSla(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverview();
    fetchFunnel();
    fetchRejections();
    fetchSla();
  }, [fetchOverview, fetchFunnel, fetchRejections, fetchSla]);

  useEffect(() => {
    fetchGrowth(growthPeriod);
  }, [fetchGrowth, growthPeriod]);

  const handleRefresh = () => {
    fetchOverview();
    fetchGrowth(growthPeriod);
    fetchFunnel();
    fetchRejections();
    fetchSla();
  };

  return (
    <PageContainer title="Admin — Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-primary-light" />
            <h1 className="text-lg font-bold themed-text">Analytics da Plataforma</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs themed-text-muted hover:themed-text transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* Section 1 — Overview */}
        <OverviewSection data={overview} loading={loadingOverview} />

        {/* Section 2 — Growth Chart */}
        <GrowthSection
          period={growthPeriod}
          data={growth}
          loading={loadingGrowth}
          onPeriodChange={setGrowthPeriod}
        />

        {/* Section 3 — Onboarding Funnel */}
        <OnboardingFunnelSection data={funnel} loading={loadingFunnel} />

        {/* Section 4 — Video Intelligence */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Video className="w-4 h-4 text-brand-primary-light" />
            <h2 className="text-sm font-semibold themed-text">Inteligencia de Video</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RejectionReasonsCard data={rejections} loading={loadingRejections} />
            <ReviewSlaCard data={sla} loading={loadingSla} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
