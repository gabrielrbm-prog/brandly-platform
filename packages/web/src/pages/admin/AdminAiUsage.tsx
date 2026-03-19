import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Hash,
  FileText,
  Video,
  Brain,
  MessageSquare,
  Cpu,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  adminApi,
  type AdminAiUsage,
  type AdminAiGenerationByType,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_TYPE_META: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  caption: {
    label: 'Caption',
    color: '#7C3AED',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  hashtags: {
    label: 'Hashtags',
    color: '#60A5FA',
    icon: <Hash className="w-3.5 h-3.5" />,
  },
  'video-analysis': {
    label: 'Analise de Video',
    color: '#F59E0B',
    icon: <Video className="w-3.5 h-3.5" />,
  },
  scripts: {
    label: 'Roteiros',
    color: '#10B981',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  behavioral: {
    label: 'Perfil Comportamental',
    color: '#F472B6',
    icon: <Brain className="w-3.5 h-3.5" />,
  },
};

function getTypeMeta(type: string) {
  return (
    AI_TYPE_META[type] ?? {
      label: type,
      color: '#9CA3AF',
      icon: <Cpu className="w-3.5 h-3.5" />,
    }
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString('pt-BR');
}

function formatCurrency(value: string | number) {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ─── Period Selector ──────────────────────────────────────────────────────────

type UsagePeriod = '30d' | '90d';
const PERIOD_LABELS: Record<UsagePeriod, string> = { '30d': '30 dias', '90d': '90 dias' };

// ─── Usage By Type Chart ───────────────────────────────────────────────────────

function UsageByTypeSection({ data }: { data: AdminAiGenerationByType[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-brand-primary-light" />
        <h3 className="text-sm font-semibold themed-text">Uso por Tipo</h3>
      </div>

      {!data.length ? (
        <p className="text-sm themed-text-muted text-center py-6">Sem dados de uso de IA disponiveis</p>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const meta = getTypeMeta(item.type);
            const pct = (item.count / maxCount) * 100;

            return (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-lg"
                      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.icon}
                    </span>
                    <span className="text-sm themed-text">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs themed-text-muted">
                      ~{Math.round(item.avgTokens).toLocaleString('pt-BR')} tokens/geracao
                    </span>
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>
                      {item.count.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})`,
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

// ─── Recent Generations Table ──────────────────────────────────────────────────

function RecentGenerationsSection({
  data,
}: {
  data: AdminAiUsage['recentGenerations'];
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-brand-primary-light" />
        <h3 className="text-sm font-semibold themed-text">Ultimas Geracoes</h3>
      </div>

      {!data.length ? (
        <div className="text-center py-10">
          <Sparkles className="w-8 h-8 themed-text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm themed-text-secondary font-medium">
            Sem dados de uso de IA disponiveis
          </p>
          <p className="text-xs themed-text-muted mt-1">
            As geracoes aparecao aqui conforme forem sendo feitas
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b themed-border">
                {['Tipo', 'Tokens', 'Data'].map((h) => (
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
              {data.map((gen) => {
                const meta = getTypeMeta(gen.type);
                return (
                  <tr key={gen.id} className="hover:themed-surface-light transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-md"
                          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                        >
                          {meta.icon}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {meta.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-sm themed-text font-medium">
                        {gen.tokensUsed.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs themed-text-muted">{formatDate(gen.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminAiUsage() {
  const toast = useToast();
  const [period, setPeriod] = useState<UsagePeriod>('30d');
  const [data, setData] = useState<AdminAiUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(
    async (p: UsagePeriod) => {
      setLoading(true);
      try {
        const res = await adminApi.aiUsage(p);
        setData(res);
      } catch {
        toast.error('Erro ao carregar dados de uso de IA.');
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const avgTokensPerGeneration =
    data && data.totalGenerations > 0
      ? Math.round(data.totalTokensUsed / data.totalGenerations)
      : 0;

  return (
    <PageContainer title="Admin — Monitor IA">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary-light" />
            <h1 className="text-lg font-bold themed-text">Monitor de IA</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="flex gap-1">
              {(Object.keys(PERIOD_LABELS) as UsagePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
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
            <button
              onClick={() => fetchData(period)}
              className="flex items-center gap-1.5 text-xs themed-text-muted hover:themed-text transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Section 1 — Overview Cards */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              glowing
              icon={<Sparkles className="w-4 h-4" />}
              label="Total Geracoes"
              value={data ? formatNumber(data.totalGenerations) : '—'}
              color="#7C3AED"
            />
            <StatCard
              glowing
              icon={<Cpu className="w-4 h-4" />}
              label="Tokens Usados"
              value={data ? formatNumber(data.totalTokensUsed) : '—'}
              color="#60A5FA"
            />
            <StatCard
              glowing
              icon={<DollarSign className="w-4 h-4" />}
              label="Custo Estimado"
              value={data ? formatCurrency(data.estimatedCost) : '—'}
              color="#10B981"
            />
            <StatCard
              glowing
              icon={<TrendingUp className="w-4 h-4" />}
              label="Media Tokens/Geracao"
              value={data ? formatNumber(avgTokensPerGeneration) : '—'}
              color="#F59E0B"
            />
          </div>
        )}

        {/* Section 2 — Usage by Type */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <UsageByTypeSection data={data?.byType ?? []} />
        )}

        {/* Section 3 — Recent Generations */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <RecentGenerationsSection data={data?.recentGenerations ?? []} />
        )}
      </div>
    </PageContainer>
  );
}
