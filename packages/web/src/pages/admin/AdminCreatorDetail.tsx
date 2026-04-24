import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Link as LinkIcon,
  Brain,
  Zap,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Tag,
  Instagram,
  Video,
  DollarSign,
  GitBranch,
  ShoppingBag,
  Share2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  adminApi,
  type AdminUser,
  type AdminUserProfile,
  type AdminCreatorDiagnostic,
  type AdminDiagnostic,
  type AdminCreatorVideosResponse,
  type AdminCreatorFinancial,
  type AdminCreatorNetwork,
  type AdminCreatorBrandItem,
  type AdminCreatorSocialAccount,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
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

const ALL_LEVELS = ['Seed', 'Spark', 'Flow', 'Iconic', 'Vision', 'Empire', 'Infinity'];

const RISK_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  low: { variant: 'success', label: 'Baixo' },
  medium: { variant: 'warning', label: 'Medio' },
  high: { variant: 'danger', label: 'Alto' },
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  inactive: 'warning',
  suspended: 'danger',
};

const VIDEO_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
};

const VIDEO_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
};

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Saude',
  tech: 'Tecnologia',
  beauty: 'Beleza',
  fitness: 'Fitness',
  food: 'Alimentacao',
  fashion: 'Moda',
  education: 'Educacao',
  finance: 'Financas',
  entertainment: 'Entretenimento',
  lifestyle: 'Lifestyle',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  commission: 'Comissao',
  bonus: 'Bonus',
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  video: '#10B981',
  commission: '#7C3AED',
  bonus: '#F59E0B',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    typeof value === 'string' ? parseFloat(value) : value,
  );
}

function formatFollowers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DISCBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold themed-text-secondary">{label}</span>
        <span className="text-xs font-bold themed-text">{value}</span>
      </div>
      <ProgressBar value={value} max={100} color={color} />
    </div>
  );
}

type TabKey = 'info' | 'videos' | 'financial' | 'network' | 'brands' | 'social';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'info', label: 'Info', icon: User },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'financial', label: 'Financeiro', icon: DollarSign },
  { key: 'network', label: 'Rede', icon: GitBranch },
  { key: 'brands', label: 'Marcas', icon: ShoppingBag },
  { key: 'social', label: 'Social', icon: Share2 },
];

// ─── Tab: Info ────────────────────────────────────────────────────────────────

function InfoTab({
  user,
  profile,
  creatorDiagnostic,
  adminDiagnostic,
}: {
  user: AdminUser;
  profile: AdminUserProfile | null;
  creatorDiagnostic: AdminCreatorDiagnostic | null;
  adminDiagnostic: AdminDiagnostic | null;
}) {
  const riskCfg = RISK_CONFIG[adminDiagnostic?.retentionRisk ?? 'low'] ?? RISK_CONFIG.low;

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <Card>
        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">
          Informacoes Basicas
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 themed-text-muted shrink-0" />
            <span className="text-sm themed-text">{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 themed-text-muted shrink-0" />
            <span className="text-sm themed-text-secondary">
              Cadastrado em {formatDate(user.createdAt)}
            </span>
          </div>
          {user.referralCode && (
            <div className="flex items-center gap-3">
              <LinkIcon className="w-4 h-4 themed-text-muted shrink-0" />
              <span className="text-sm font-mono themed-text">{user.referralCode}</span>
              <Badge variant="default">Cod. indicacao</Badge>
            </div>
          )}
          {profile?.instagram && (
            <div className="flex items-center gap-3">
              <Instagram className="w-4 h-4 themed-text-muted shrink-0" />
              <span className="text-sm themed-text">@{profile.instagram}</span>
              <Badge variant="default">Instagram</Badge>
            </div>
          )}
          {profile?.tiktok && (
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4 themed-text-muted shrink-0" />
              <span className="text-sm themed-text">@{profile.tiktok}</span>
              <Badge variant="default">TikTok</Badge>
            </div>
          )}
          {profile?.niche && (
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 themed-text-muted shrink-0" />
              <span className="text-sm themed-text">{profile.niche}</span>
              <Badge variant="default">Nicho</Badge>
            </div>
          )}
          {profile?.bio && (
            <div className="mt-2 p-3 rounded-xl bg-brand-primary/5 border themed-border">
              <p className="text-xs font-semibold themed-text-muted mb-1">Bio</p>
              <p className="text-sm themed-text-secondary">{profile.bio}</p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t themed-border">
          <Badge variant={user.onboardingCompleted ? 'success' : 'warning'}>
            {user.onboardingCompleted ? (
              <><CheckCircle className="w-3 h-3 mr-1" />Onboarding completo</>
            ) : (
              <><AlertTriangle className="w-3 h-3 mr-1" />Onboarding pendente</>
            )}
          </Badge>
        </div>
      </Card>

      {/* Behavioral profile */}
      {creatorDiagnostic ? (
        <Card glowing accent="#7C3AED">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-sm font-semibold themed-text">Perfil Comportamental</h3>
          </div>

          <div className="rounded-xl bg-brand-primary/8 border border-brand-primary/20 p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{creatorDiagnostic.archetypeEmoji}</span>
              <div>
                <p className="text-lg font-bold themed-text">{creatorDiagnostic.title}</p>
                <p className="text-xs text-brand-primary-light font-semibold uppercase tracking-wider">
                  {creatorDiagnostic.archetype}
                </p>
              </div>
            </div>
            <p className="text-sm themed-text-secondary leading-relaxed">
              {creatorDiagnostic.shortDescription}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 themed-text-secondary" />
                <span className="text-sm font-semibold themed-text">Score de Prontidao</span>
              </div>
              <span className="text-lg font-bold text-brand-primary-light">
                {creatorDiagnostic.readinessScore}/10
              </span>
            </div>
            <ProgressBar
              value={creatorDiagnostic.readinessScore}
              max={10}
              color={
                creatorDiagnostic.readinessScore >= 7
                  ? '#10B981'
                  : creatorDiagnostic.readinessScore >= 5
                    ? '#F59E0B'
                    : '#EF4444'
              }
            />
          </div>

          {creatorDiagnostic.superpower && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3 mb-4 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-0.5 uppercase tracking-wider">
                  Superpoder
                </p>
                <p className="text-sm themed-text">{creatorDiagnostic.superpower}</p>
              </div>
            </div>
          )}

          {creatorDiagnostic.strengths?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-2">
                Pontos Fortes
              </p>
              <div className="space-y-1.5">
                {creatorDiagnostic.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-sm themed-text-secondary">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminDiagnostic && (
            <>
              <div className="border-t themed-border pt-4 mb-4">
                <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">
                  Analise Admin
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-4 h-4 themed-text-muted shrink-0" />
                  <span className="text-sm themed-text-secondary">Risco de churn:</span>
                  <Badge variant={riskCfg.variant}>{riskCfg.label}</Badge>
                </div>
                {adminDiagnostic.predictedOutput && (
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-4 h-4 themed-text-muted shrink-0" />
                    <span className="text-sm themed-text-secondary">Output previsto:</span>
                    <span className="text-sm font-semibold themed-text">
                      {adminDiagnostic.predictedOutput}
                    </span>
                  </div>
                )}
                {adminDiagnostic.discScores && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <DISCBar label="D — Dominancia" value={adminDiagnostic.discScores.D} color="#EF4444" />
                    <DISCBar label="I — Influencia" value={adminDiagnostic.discScores.I} color="#F59E0B" />
                    <DISCBar label="S — Estabilidade" value={adminDiagnostic.discScores.S} color="#10B981" />
                    <DISCBar label="C — Conformidade" value={adminDiagnostic.discScores.C} color="#3B82F6" />
                  </div>
                )}
              </div>

              {adminDiagnostic.tags?.length ? (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5 themed-text-muted" />
                    <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider">
                      Tags
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {adminDiagnostic.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs bg-brand-primary/10 text-brand-primary-light border border-brand-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {adminDiagnostic.recommendedActions?.length ? (
                <div>
                  <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-2">
                    Acoes Recomendadas
                  </p>
                  <div className="space-y-1.5">
                    {adminDiagnostic.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-brand-primary/20 text-brand-primary-light flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-sm themed-text-secondary">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      ) : (
        <Card>
          <div className="text-center py-6">
            <Brain className="w-8 h-8 themed-text-muted mx-auto mb-2" />
            <p className="text-sm themed-text-secondary">Perfil comportamental nao disponivel</p>
            <p className="text-xs themed-text-muted mt-1">
              Creator nao completou o onboarding comportamental
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Videos ──────────────────────────────────────────────────────────────

function VideosTab({ creatorId }: { creatorId: string }) {
  const toast = useToast();
  const [data, setData] = useState<AdminCreatorVideosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.creatorVideos(creatorId, statusFilter || undefined, page);
      setData(res);
    } catch {
      toast.error('Erro ao carregar videos.');
    } finally {
      setLoading(false);
    }
  }, [creatorId, statusFilter, page, toast]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'rejected', label: 'Rejeitados' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Video className="w-4 h-4" />}
            label="Total"
            value={String(data.stats.total)}
            color="#7C3AED"
          />
          <StatCard
            icon={<CheckCircle className="w-4 h-4" />}
            label="Aprovados"
            value={String(data.stats.approved)}
            color="#10B981"
          />
          <StatCard
            icon={<RefreshCw className="w-4 h-4" />}
            label="Pendentes"
            value={String(data.stats.pending)}
            color="#F59E0B"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Taxa aprov."
            value={`${Number(data.stats.approvalRate ?? 0).toFixed(0)}%`}
            color="#60A5FA"
          />
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === f.value
                ? 'bg-brand-primary/20 text-brand-primary-light border-brand-primary/40'
                : 'themed-border themed-text-muted hover:themed-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg themed-surface-light animate-pulse" />
            ))}
          </div>
        ) : !data?.videos.length ? (
          <div className="text-center py-10">
            <Video className="w-8 h-8 themed-text-muted mx-auto mb-2" />
            <p className="text-sm themed-text-secondary">Nenhum video encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b themed-border">
                  <th className="text-left py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Video
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Marca
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Plataforma
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right py-2 pr-4 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Pagamento
                  </th>
                  <th className="text-left py-2 text-xs font-semibold themed-text-muted uppercase tracking-wide">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y themed-border">
                {data.videos.map((v) => (
                  <tr key={v.id} className="hover:themed-surface-light transition-colors">
                    <td className="py-2.5 pr-4">
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-brand-primary-light hover:underline text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver video
                      </a>
                      {v.rejectionReason && (
                        <p className="text-xs text-red-400 mt-0.5 max-w-[180px] truncate">
                          {v.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs themed-text">{v.brandName ?? '—'}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs themed-text-secondary capitalize">{v.platform}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant={
                          VIDEO_STATUS_VARIANTS[v.status] ?? 'default'
                        }
                      >
                        {VIDEO_STATUS_LABELS[v.status] ?? v.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className="text-xs font-semibold themed-text">
                        {formatCurrency(v.payment)}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs themed-text-muted">{formatDate(v.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t themed-border">
            <span className="text-xs themed-text-muted">
              Pagina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-lg border themed-border themed-text-muted hover:themed-text disabled:opacity-40 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-lg border themed-border themed-text-muted hover:themed-text disabled:opacity-40 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Financial ───────────────────────────────────────────────────────────

function FinancialTab({ creatorId }: { creatorId: string }) {
  const toast = useToast();
  const [data, setData] = useState<AdminCreatorFinancial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .creatorFinancial(creatorId)
      .then(setData)
      .catch(() => toast.error('Erro ao carregar financeiro.'))
      .finally(() => setLoading(false));
  }, [creatorId, toast]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return null;

  const totalEarnings =
    parseFloat(data.videoEarnings) +
    parseFloat(data.commissionEarnings) +
    parseFloat(data.bonusEarnings);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Saldo"
          value={formatCurrency(data.balance)}
          color="#10B981"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Total Ganho"
          value={formatCurrency(data.totalEarnings)}
          color="#7C3AED"
        />
        <StatCard
          icon={<RefreshCw className="w-4 h-4" />}
          label="Saques Pendentes"
          value={formatCurrency(data.pendingWithdrawals)}
          color="#F59E0B"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Saques Concluidos"
          value={formatCurrency(data.completedWithdrawals)}
          color="#60A5FA"
        />
      </div>

      {/* Earnings breakdown */}
      <Card>
        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-4">
          Ganhos por Tipo
        </p>
        <div className="space-y-3">
          {[
            { key: 'video', label: 'Videos', value: data.videoEarnings, color: '#10B981' },
            { key: 'commission', label: 'Comissao', value: data.commissionEarnings, color: '#7C3AED' },
            { key: 'bonus', label: 'Bonus', value: data.bonusEarnings, color: '#F59E0B' },
          ].map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm themed-text">{item.label}</span>
                </div>
                <span className="text-sm font-semibold themed-text">
                  {formatCurrency(item.value)}
                </span>
              </div>
              <ProgressBar
                value={totalEarnings > 0 ? (parseFloat(String(item.value)) / totalEarnings) * 100 : 0}
                max={100}
                color={item.color}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Recent payments */}
      {data.recentPayments.length > 0 && (
        <Card>
          <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">
            Ultimos Pagamentos
          </p>
          <div className="space-y-2">
            {data.recentPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b themed-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PAYMENT_TYPE_COLORS[p.type] ?? '#7C3AED' }}
                  />
                  <div>
                    <p className="text-xs font-semibold themed-text">
                      {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                    </p>
                    <p className="text-xs themed-text-muted">{p.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold themed-text">{formatCurrency(p.amount)}</p>
                  <p className="text-xs themed-text-muted">{formatDate(p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Network ─────────────────────────────────────────────────────────────

function NetworkTab({ creatorId }: { creatorId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<AdminCreatorNetwork | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .creatorNetwork(creatorId)
      .then(setData)
      .catch(() => toast.error('Erro ao carregar rede.'))
      .finally(() => setLoading(false));
  }, [creatorId, toast]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Diretos"
          value={String(data.directCount)}
          color="#7C3AED"
        />
        <StatCard
          icon={<GitBranch className="w-4 h-4" />}
          label="Profundidade"
          value={String(data.networkDepth)}
          color="#60A5FA"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Total na Rede"
          value={String(data.totalInNetwork)}
          color="#10B981"
        />
      </div>

      {/* Sponsor */}
      <Card>
        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">
          Patrocinador
        </p>
        {data.sponsor ? (
          <div
            className="flex items-center gap-3 cursor-pointer hover:themed-surface-light rounded-xl p-2 -mx-2 transition-colors"
            onClick={() => navigate(`/admin/creators/${data.sponsor!.id}`)}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center text-lg font-bold text-brand-primary-light shrink-0">
              {data.sponsor.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold themed-text">{data.sponsor.name}</p>
              <p className="text-xs themed-text-muted">{data.sponsor.email}</p>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full border shrink-0"
              style={{
                color: LEVEL_COLORS[data.sponsor.level] ?? '#9CA3AF',
                borderColor: LEVEL_COLORS[data.sponsor.level] ?? '#9CA3AF',
              }}
            >
              {data.sponsor.level}
            </span>
          </div>
        ) : (
          <p className="text-sm themed-text-muted text-center py-4">Sem patrocinador</p>
        )}
      </Card>

      {/* Directs table */}
      <Card>
        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">
          Indicacoes Diretas ({data.directCount})
        </p>
        {!data.directs.length ? (
          <div className="text-center py-8">
            <GitBranch className="w-7 h-7 themed-text-muted mx-auto mb-2" />
            <p className="text-sm themed-text-secondary">Nenhuma indicacao direta</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b themed-border">
                  {['Nome', 'Nivel', 'Status', 'Videos/mes', 'Entrou em'].map((h) => (
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
                {data.directs.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:themed-surface-light cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/creators/${d.id}`)}
                  >
                    <td className="py-2.5 pr-4">
                      <p className="text-sm font-medium themed-text">{d.name}</p>
                      <p className="text-xs themed-text-muted">{d.email}</p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: LEVEL_COLORS[d.level] ?? '#9CA3AF',
                          borderColor: LEVEL_COLORS[d.level] ?? '#9CA3AF',
                        }}
                      >
                        {d.level}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={STATUS_VARIANTS[d.status] ?? 'default'}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-sm themed-text">{d.videosThisMonth}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs themed-text-muted">{formatDate(d.joinedAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Brands ──────────────────────────────────────────────────────────────

function BrandsTab({ creatorId }: { creatorId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [brands, setBrands] = useState<AdminCreatorBrandItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .creatorBrands(creatorId)
      .then((res) => setBrands(res.brands))
      .catch(() => toast.error('Erro ao carregar marcas.'))
      .finally(() => setLoading(false));
  }, [creatorId, toast]);

  if (loading) return <SkeletonCard />;

  if (!brands?.length) {
    return (
      <Card>
        <div className="text-center py-10">
          <ShoppingBag className="w-8 h-8 themed-text-muted mx-auto mb-2" />
          <p className="text-sm themed-text-secondary">Nenhuma marca conectada</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {brands.map((brand) => (
        <div
          key={brand.id}
          className="rounded-2xl border themed-border themed-surface p-4 cursor-pointer hover:border-brand-primary/40 transition-all"
          onClick={() => navigate(`/admin/brands/${brand.id}`)}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-brand-primary-light" />
            </div>
            <Badge variant="default">
              {CATEGORY_LABELS[brand.category] ?? brand.category}
            </Badge>
          </div>
          <p className="text-sm font-semibold themed-text mb-2">{brand.name}</p>
          <div className="flex items-center justify-between text-xs themed-text-muted">
            <span>{brand.videosCount} videos</span>
            <span className="font-semibold" style={{ color: Number(brand.approvalRate ?? 0) >= 70 ? '#10B981' : '#F59E0B' }}>
              {Number(brand.approvalRate ?? 0).toFixed(0)}% aprovacao
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Social ──────────────────────────────────────────────────────────────

function SocialTab({ creatorId }: { creatorId: string }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState<AdminCreatorSocialAccount[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .creatorSocial(creatorId)
      .then((res) => setAccounts(res.accounts))
      .catch(() => toast.error('Erro ao carregar social.'))
      .finally(() => setLoading(false));
  }, [creatorId, toast]);

  if (loading) return <SkeletonCard />;

  if (!accounts?.length) {
    return (
      <Card>
        <div className="text-center py-10">
          <Share2 className="w-8 h-8 themed-text-muted mx-auto mb-2" />
          <p className="text-sm themed-text-secondary">Nenhuma conta conectada</p>
        </div>
      </Card>
    );
  }

  const PLATFORM_COLORS: Record<string, string> = {
    instagram: '#E1306C',
    tiktok: '#69C9D0',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {accounts.map((acc) => (
        <Card key={acc.id}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${PLATFORM_COLORS[acc.platform] ?? '#7C3AED'}20` }}
            >
              {acc.platform === 'instagram' ? (
                <Instagram className="w-5 h-5" style={{ color: PLATFORM_COLORS.instagram }} />
              ) : (
                <Share2 className="w-5 h-5" style={{ color: PLATFORM_COLORS.tiktok }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold themed-text capitalize">{acc.platform}</p>
              {acc.username && (
                <p className="text-xs themed-text-muted">@{acc.username}</p>
              )}
            </div>
            <Badge
              variant={
                acc.status === 'connected'
                  ? 'success'
                  : acc.status === 'expired'
                    ? 'danger'
                    : 'warning'
              }
            >
              {acc.status === 'connected'
                ? 'Conectado'
                : acc.status === 'expired'
                  ? 'Expirado'
                  : 'Desconectado'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="themed-surface-light rounded-lg p-2">
              <p className="themed-text-muted">Seguidores</p>
              <p className="font-bold themed-text">{formatFollowers(acc.followers)}</p>
            </div>
            <div className="themed-surface-light rounded-lg p-2">
              <p className="themed-text-muted">Engajamento</p>
              <p className="font-bold themed-text">{Number(acc.engagementRate ?? 0).toFixed(2)}%</p>
            </div>
          </div>

          {acc.lastSyncAt && (
            <p className="text-xs themed-text-muted mt-2">
              Sync: {formatDate(acc.lastSyncAt)}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminCreatorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [creatorDiagnostic, setCreatorDiagnostic] = useState<AdminCreatorDiagnostic | null>(null);
  const [adminDiagnostic, setAdminDiagnostic] = useState<AdminDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [changingStatus, setChangingStatus] = useState(false);
  const [changingLevel, setChangingLevel] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const { can } = useAuth();
  const canChangeStatus = can('change_creator_status');
  const canChangeLevel = can('change_creator_level');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [userRes, behavioralRes] = await Promise.allSettled([
        adminApi.userDetail(id),
        adminApi.behavioralProfile(id),
      ]);

      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.user ?? null);
        setProfile(userRes.value.profile ?? null);
      } else {
        toast.error('Erro ao carregar dados do creator.');
      }

      if (behavioralRes.status === 'fulfilled') {
        setCreatorDiagnostic(behavioralRes.value.creatorDiagnostic ?? null);
        setAdminDiagnostic(behavioralRes.value.adminDiagnostic ?? null);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro inesperado ao carregar creator.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangeStatus = async (status: 'active' | 'inactive' | 'suspended') => {
    if (!id) return;
    setChangingStatus(true);
    setShowStatusMenu(false);
    try {
      const res = await adminApi.changeCreatorStatus(id, status);
      setUser((prev) => (prev ? { ...prev, ...res.user } : prev));
      toast.success(`Status alterado para "${STATUS_LABELS[status]}"`);
    } catch {
      toast.error('Erro ao alterar status.');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleChangeLevel = async (level: string) => {
    if (!id) return;
    setChangingLevel(true);
    setShowLevelMenu(false);
    try {
      const res = await adminApi.changeCreatorLevel(id, level);
      setUser((prev) => (prev ? { ...prev, ...res.user } : prev));
      toast.success(`Nivel alterado para "${level}"`);
    } catch {
      toast.error('Erro ao alterar nivel.');
    } finally {
      setChangingLevel(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Admin — Creator">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Admin — Creator">
        <Card>
          <div className="text-center py-12">
            <User className="w-10 h-10 themed-text-muted mx-auto mb-3" />
            <p className="themed-text-secondary">Creator nao encontrado</p>
            <Button variant="ghost" onClick={() => navigate('/admin/creators')} className="mt-4">
              Voltar
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const levelColor = LEVEL_COLORS[user.levelName ?? 'Seed'] ?? '#9CA3AF';
  const userStatus: string = user.status ?? 'active';

  return (
    <PageContainer title="Admin — Creator">
      <div className="space-y-5">
        {/* Back button */}
        <button
          onClick={() => navigate('/admin/creators')}
          className="flex items-center gap-2 text-sm themed-text-muted hover:themed-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para creators
        </button>

        {/* Header card */}
        <Card glowing>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center text-2xl font-bold text-brand-primary-light shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start flex-wrap gap-2 mb-1">
                <h2 className="text-xl font-bold themed-text">{user.name}</h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full border shrink-0"
                  style={{ color: levelColor, borderColor: levelColor }}
                >
                  {user.levelName ?? 'Seed'}
                </span>
                <Badge variant={STATUS_VARIANTS[userStatus] ?? 'default'}>
                  {STATUS_LABELS[userStatus] ?? userStatus}
                </Badge>
                {user.role === 'admin' && <Badge variant="danger">Admin</Badge>}
              </div>
              <p className="text-sm themed-text-muted">{user.email}</p>
            </div>
          </div>

          {/* Action buttons */}
          {(canChangeStatus || canChangeLevel) && (
          <div className="mt-4 pt-4 border-t themed-border flex flex-wrap gap-2">
            {canChangeStatus && (
            /* Change Status */
            <div className="relative">
              <Button
                variant="secondary"
                className="!py-2 !px-3 !text-xs"
                onClick={() => {
                  setShowStatusMenu((v) => !v);
                  setShowLevelMenu(false);
                }}
                disabled={changingStatus}
              >
                {changingStatus ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Alterar Status
              </Button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border themed-border themed-surface-card shadow-lg min-w-[140px] overflow-hidden">
                  {(['active', 'inactive', 'suspended'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChangeStatus(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:themed-surface-light transition-colors themed-text"
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            {canChangeLevel && (
            /* Change Level */
            <div className="relative">
              <Button
                variant="secondary"
                className="!py-2 !px-3 !text-xs"
                onClick={() => {
                  setShowLevelMenu((v) => !v);
                  setShowStatusMenu(false);
                }}
                disabled={changingLevel}
              >
                {changingLevel ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Alterar Nivel
              </Button>
              {showLevelMenu && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border themed-border themed-surface-card shadow-lg min-w-[140px] overflow-hidden">
                  {ALL_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleChangeLevel(lvl)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:themed-surface-light transition-colors flex items-center gap-2"
                      style={{ color: LEVEL_COLORS[lvl] ?? '#9CA3AF' }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          )}
        </Card>

        {/* Tabs navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-brand-primary/20 text-brand-primary-light border border-brand-primary/30'
                  : 'themed-text-muted hover:themed-text hover:themed-surface-light border border-transparent'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — lazy mounted, stays in DOM after first load */}
        <div>
          {activeTab === 'info' && (
            <InfoTab
              user={user}
              profile={profile}
              creatorDiagnostic={creatorDiagnostic}
              adminDiagnostic={adminDiagnostic}
            />
          )}
          {activeTab === 'videos' && id && <VideosTab creatorId={id} />}
          {activeTab === 'financial' && id && <FinancialTab creatorId={id} />}
          {activeTab === 'network' && id && <NetworkTab creatorId={id} />}
          {activeTab === 'brands' && id && <BrandsTab creatorId={id} />}
          {activeTab === 'social' && id && <SocialTab creatorId={id} />}
        </div>
      </div>
    </PageContainer>
  );
}
