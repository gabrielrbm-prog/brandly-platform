import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { adminApi, type AdminUser, type AdminUserProfile, type AdminCreatorDiagnostic, type AdminDiagnostic } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

const LEVEL_COLORS: Record<string, string> = {
  Seed: '#9CA3AF',
  Spark: '#FBBF24',
  Flow: '#34D399',
  Iconic: '#60A5FA',
  Vision: '#A78BFA',
  Empire: '#F472B6',
  Infinity: '#FBBF24',
};

const RISK_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  low: { variant: 'success', label: 'Baixo' },
  medium: { variant: 'warning', label: 'Medio' },
  high: { variant: 'danger', label: 'Alto' },
};

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

export default function AdminCreatorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [creatorDiagnostic, setCreatorDiagnostic] = useState<AdminCreatorDiagnostic | null>(null);
  const [adminDiagnostic, setAdminDiagnostic] = useState<AdminDiagnostic | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Perfil comportamental ausente e esperado — sem toast de erro
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro inesperado ao carregar creator.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const levelColor = LEVEL_COLORS[user.level ?? 'Seed'] ?? '#9CA3AF';
  const riskCfg = RISK_CONFIG[adminDiagnostic?.retentionRisk ?? 'low'] ?? RISK_CONFIG.low;

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

        {/* Basic info card */}
        <Card glowing>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center text-2xl font-bold text-brand-primary-light shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold themed-text">{user.name}</h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full border shrink-0"
                  style={{ color: levelColor, borderColor: levelColor }}
                >
                  {user.level ?? 'Seed'}
                </span>
              </div>
              {user.role === 'admin' && (
                <Badge variant="danger" className="mt-1">Admin</Badge>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
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
          </div>

          <div className="mt-4 pt-4 border-t themed-border flex gap-2">
            <Badge variant={user.onboardingCompleted ? 'success' : 'warning'}>
              {user.onboardingCompleted ? (
                <><CheckCircle className="w-3 h-3 mr-1" />Onboarding completo</>
              ) : (
                <><AlertTriangle className="w-3 h-3 mr-1" />Onboarding pendente</>
              )}
            </Badge>
          </div>
        </Card>

        {/* Behavioral profile card */}
        {creatorDiagnostic ? (
          <Card glowing accent="#7C3AED">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-brand-primary-light" />
              <h3 className="text-sm font-semibold themed-text">Perfil Comportamental</h3>
            </div>

            {/* Archetype header */}
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

            {/* Readiness score */}
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
                color={creatorDiagnostic.readinessScore >= 7 ? '#10B981' : creatorDiagnostic.readinessScore >= 5 ? '#F59E0B' : '#EF4444'}
              />
            </div>

            {/* Superpower */}
            {creatorDiagnostic.superpower && (
              <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3 mb-4 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-0.5 uppercase tracking-wider">Superpoder</p>
                  <p className="text-sm themed-text">{creatorDiagnostic.superpower}</p>
                </div>
              </div>
            )}

            {/* Strengths */}
            {creatorDiagnostic.strengths?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-2">Pontos Fortes</p>
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

            {/* Admin diagnostic section */}
            {adminDiagnostic && (
              <>
                <div className="border-t themed-border pt-4 mb-4">
                  <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-3">Analise Admin</p>

                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-4 h-4 themed-text-muted shrink-0" />
                    <span className="text-sm themed-text-secondary">Risco de churn:</span>
                    <Badge variant={riskCfg.variant}>{riskCfg.label}</Badge>
                  </div>

                  {adminDiagnostic.predictedOutput && (
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-4 h-4 themed-text-muted shrink-0" />
                      <span className="text-sm themed-text-secondary">Output previsto:</span>
                      <span className="text-sm font-semibold themed-text">{adminDiagnostic.predictedOutput}</span>
                    </div>
                  )}

                  {/* DISC scores */}
                  {adminDiagnostic.discScores && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <DISCBar label="D — Dominancia" value={adminDiagnostic.discScores.D} color="#EF4444" />
                      <DISCBar label="I — Influencia" value={adminDiagnostic.discScores.I} color="#F59E0B" />
                      <DISCBar label="S — Estabilidade" value={adminDiagnostic.discScores.S} color="#10B981" />
                      <DISCBar label="C — Conformidade" value={adminDiagnostic.discScores.C} color="#3B82F6" />
                    </div>
                  )}
                </div>

                {/* Tags */}
                {adminDiagnostic.tags?.length ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-3.5 h-3.5 themed-text-muted" />
                      <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Tags</p>
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

                {/* Recommended actions */}
                {adminDiagnostic.recommendedActions?.length ? (
                  <div>
                    <p className="text-xs font-semibold themed-text-muted uppercase tracking-wider mb-2">Acoes Recomendadas</p>
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
            <div className="flex items-center gap-3 text-center py-6">
              <div className="w-full">
                <Brain className="w-8 h-8 themed-text-muted mx-auto mb-2" />
                <p className="text-sm themed-text-secondary">Perfil comportamental nao disponivel</p>
                <p className="text-xs themed-text-muted mt-1">Creator nao completou o onboarding comportamental</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
