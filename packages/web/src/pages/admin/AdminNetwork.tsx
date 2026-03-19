import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  adminApi,
  type AdminNetworkLevelDistribution,
  type AdminNetworkRecruiter,
  type AdminNetworkBonusSummary,
  type AdminAtRiskCreator,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  Seed: '#9CA3AF',
  Spark: '#FBBF24',
  Flow: '#34D399',
  Iconic: '#60A5FA',
  Vision: '#A78BFA',
  Empire: '#F472B6',
  Infinity: '#FBBF24',
};

const RETENTION_RISK_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

const RETENTION_RISK_LABELS: Record<string, string> = {
  low: 'Baixo',
  medium: 'Medio',
  high: 'Alto',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getCurrentPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function buildPeriodOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function LevelDistributionSection({
  data,
  loading,
}: {
  data: AdminNetworkLevelDistribution | null;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-primary-light" />
          <h3 className="text-sm font-semibold themed-text">Distribuicao por Nivel</h3>
        </div>
        {data && (
          <span className="text-xs themed-text-muted">
            {data.total} creators total
          </span>
        )}
      </div>

      {!data?.distribution.length ? (
        <p className="text-sm themed-text-muted text-center py-6">Sem dados disponíveis</p>
      ) : (
        <div className="space-y-3">
          {data.distribution.map((item) => {
            const color = LEVEL_COLORS[item.level] ?? '#9CA3AF';
            return (
              <div key={item.level}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full border"
                      style={{ color, borderColor: color }}
                    >
                      {item.level}
                    </span>
                    <span className="text-xs themed-text-muted">{item.count} creators</span>
                  </div>
                  <span className="text-xs font-semibold themed-text">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: color,
                      opacity: 0.85,
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

function BonusSummarySection({
  data,
  loading,
  period,
  onPeriodChange,
}: {
  data: AdminNetworkBonusSummary | null;
  loading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const periodOptions = buildPeriodOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-brand-primary-light" />
          <h3 className="text-sm font-semibold themed-text">Resumo de Bonus</h3>
        </div>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="text-xs themed-surface-card border themed-border themed-text rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-primary/50"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Bonus Direto"
              value={data ? formatCurrency(data.directBonuses) : '—'}
              color="#10B981"
            />
            <StatCard
              icon={<GitBranch className="w-4 h-4" />}
              label="Bonus Infinito"
              value={data ? formatCurrency(data.infiniteBonuses) : '—'}
              color="#7C3AED"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Equiparacao"
              value={data ? formatCurrency(data.matchingBonuses) : '—'}
              color="#60A5FA"
            />
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Pool Global"
              value={data ? formatCurrency(data.globalPool) : '—'}
              color="#F472B6"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Total Distribuido"
              value={data ? formatCurrency(data.totalDistributed) : '—'}
              color="#FBBF24"
            />
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Receberam Bonus"
              value={data ? String(data.creatorsWithBonuses) : '—'}
              color="#34D399"
            />
          </div>
        </>
      )}
    </div>
  );
}

function TopRecruitersSection({
  data,
  loading,
}: {
  data: AdminNetworkRecruiter[] | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) return <SkeletonCard />;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-brand-primary-light" />
        <h3 className="text-sm font-semibold themed-text">Top Recrutadores</h3>
      </div>

      {!data?.length ? (
        <p className="text-sm themed-text-muted text-center py-6">Sem dados disponíveis</p>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b themed-border">
                {['#', 'Creator', 'Nivel', 'Diretos Ativos', 'Total na Rede'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y themed-border">
              {data.map((r, index) => (
                <tr
                  key={r.id}
                  className="hover:themed-surface-light cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/creators/${r.id}`)}
                >
                  <td className="py-2.5 pr-4">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : index === 1
                            ? 'bg-gray-400/20 text-gray-400'
                            : index === 2
                              ? 'bg-orange-600/20 text-orange-500'
                              : 'themed-text-muted'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="text-sm font-medium themed-text">{r.name}</p>
                    <p className="text-xs themed-text-muted">{r.email}</p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: LEVEL_COLORS[r.level] ?? '#9CA3AF',
                        borderColor: LEVEL_COLORS[r.level] ?? '#9CA3AF',
                      }}
                    >
                      {r.level}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-sm themed-text">{r.activeDirects}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-sm font-semibold themed-text">{r.totalNetwork}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AtRiskSection({
  data,
  loading,
}: {
  data: AdminAtRiskCreator[] | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading) return <SkeletonCard />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold themed-text">Creators em Risco</h3>
      </div>

      {!data?.length ? (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm themed-text-secondary font-semibold">
              Nenhum creator em risco
            </p>
            <p className="text-xs themed-text-muted mt-1">
              Todos os creators estao ativos e produzindo
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.map((creator) => (
            <div
              key={creator.id}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 cursor-pointer hover:border-red-500/40 transition-all"
              onClick={() => navigate(`/admin/creators/${creator.id}`)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                    {creator.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold themed-text truncate">{creator.name}</p>
                    <p className="text-xs themed-text-muted truncate">{creator.email}</p>
                  </div>
                </div>
                <Badge
                  variant={RETENTION_RISK_VARIANTS[creator.retentionRisk] ?? 'warning'}
                >
                  {RETENTION_RISK_LABELS[creator.retentionRisk] ?? creator.retentionRisk}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="themed-surface-light rounded-lg p-2">
                  <p className="themed-text-muted">Nivel</p>
                  <p
                    className="font-bold"
                    style={{ color: LEVEL_COLORS[creator.level] ?? '#9CA3AF' }}
                  >
                    {creator.level}
                  </p>
                </div>
                <div className="themed-surface-light rounded-lg p-2">
                  <p className="themed-text-muted">Dias sem video</p>
                  <p className="font-bold text-red-400">{creator.daysSinceLastVideo}</p>
                </div>
                <div className="themed-surface-light rounded-lg p-2">
                  <p className="themed-text-muted">Videos/mes</p>
                  <p className="font-bold themed-text">{creator.videosThisMonth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminNetwork() {
  const toast = useToast();
  const [loadingDistribution, setLoadingDistribution] = useState(true);
  const [loadingRecruiters, setLoadingRecruiters] = useState(true);
  const [loadingBonus, setLoadingBonus] = useState(true);
  const [loadingAtRisk, setLoadingAtRisk] = useState(true);

  const [distribution, setDistribution] = useState<AdminNetworkLevelDistribution | null>(null);
  const [recruiters, setRecruiters] = useState<AdminNetworkRecruiter[] | null>(null);
  const [bonusSummary, setBonusSummary] = useState<AdminNetworkBonusSummary | null>(null);
  const [atRisk, setAtRisk] = useState<AdminAtRiskCreator[] | null>(null);
  const [bonusPeriod, setBonusPeriod] = useState(getCurrentPeriod);

  const fetchDistribution = useCallback(async () => {
    setLoadingDistribution(true);
    try {
      const res = await adminApi.networkLevelDistribution();
      setDistribution(res);
    } catch {
      toast.error('Erro ao carregar distribuicao de niveis.');
    } finally {
      setLoadingDistribution(false);
    }
  }, [toast]);

  const fetchRecruiters = useCallback(async () => {
    setLoadingRecruiters(true);
    try {
      const res = await adminApi.networkTopRecruiters(10);
      setRecruiters(res.recruiters);
    } catch {
      toast.error('Erro ao carregar top recrutadores.');
    } finally {
      setLoadingRecruiters(false);
    }
  }, [toast]);

  const fetchBonus = useCallback(async (period: string) => {
    setLoadingBonus(true);
    try {
      const res = await adminApi.networkBonusSummary(period);
      setBonusSummary(res);
    } catch {
      toast.error('Erro ao carregar resumo de bonus.');
    } finally {
      setLoadingBonus(false);
    }
  }, [toast]);

  const fetchAtRisk = useCallback(async () => {
    setLoadingAtRisk(true);
    try {
      const res = await adminApi.networkAtRisk();
      setAtRisk(res.creators);
    } catch {
      toast.error('Erro ao carregar creators em risco.');
    } finally {
      setLoadingAtRisk(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDistribution();
    fetchRecruiters();
    fetchAtRisk();
  }, [fetchDistribution, fetchRecruiters, fetchAtRisk]);

  useEffect(() => {
    fetchBonus(bonusPeriod);
  }, [fetchBonus, bonusPeriod]);

  const handleRefresh = () => {
    fetchDistribution();
    fetchRecruiters();
    fetchBonus(bonusPeriod);
    fetchAtRisk();
  };

  return (
    <PageContainer title="Admin — Rede">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-brand-primary-light" />
            <h1 className="text-lg font-bold themed-text">Analise de Rede</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs themed-text-muted hover:themed-text transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* Level distribution */}
        <LevelDistributionSection data={distribution} loading={loadingDistribution} />

        {/* Bonus summary */}
        <BonusSummarySection
          data={bonusSummary}
          loading={loadingBonus}
          period={bonusPeriod}
          onPeriodChange={setBonusPeriod}
        />

        {/* Top recruiters */}
        <TopRecruitersSection data={recruiters} loading={loadingRecruiters} />

        {/* At-risk creators */}
        <AtRiskSection data={atRisk} loading={loadingAtRisk} />
      </div>
    </PageContainer>
  );
}
