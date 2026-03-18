import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { adminApi, type AdminUser, type AdminCreatorDiagnostic, type AdminDiagnostic } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ProfileEntry {
  user: AdminUser;
  creatorDiagnostic: AdminCreatorDiagnostic;
  adminDiagnostic?: AdminDiagnostic;
}

const RISK_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string; color: string }> = {
  low: { variant: 'success', label: 'Baixo', color: '#10B981' },
  medium: { variant: 'warning', label: 'Medio', color: '#F59E0B' },
  high: { variant: 'danger', label: 'Alto', color: '#EF4444' },
};

export default function AdminProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setLoadingProgress(0);
    try {
      // Fetch all users first
      const usersRes = await adminApi.users(1, 100);
      const users = usersRes.users ?? [];
      setLoadingProgress(20);

      // For each user with onboarding completed, try to fetch behavioral profile
      const completedUsers = users.filter((u) => u.onboardingCompleted);
      const results: ProfileEntry[] = [];

      for (let i = 0; i < completedUsers.length; i++) {
        const user = completedUsers[i];
        try {
          const behavRes = await adminApi.behavioralProfile(user.id);
          if (behavRes.creatorDiagnostic) {
            results.push({
              user,
              creatorDiagnostic: behavRes.creatorDiagnostic,
              adminDiagnostic: behavRes.adminDiagnostic,
            });
          }
        } catch {
          // User has no behavioral profile yet — skip
        }
        setLoadingProgress(20 + Math.round((i / completedUsers.length) * 80));
      }

      setProfiles(results);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <PageContainer title="Admin — Perfis">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 themed-text-secondary" />
            <h2 className="text-lg font-bold themed-text">Perfis Comportamentais</h2>
            <Badge variant="primary">{profiles.length}</Badge>
          </div>
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-brand-primary-light hover:text-brand-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-primary/8 border border-brand-primary/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-3.5 h-3.5 text-brand-primary-light animate-spin" />
                <span className="text-xs text-brand-primary-light">Carregando perfis... {loadingProgress}%</span>
              </div>
              <ProgressBar value={loadingProgress} max={100} color="#7C3AED" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <div className="text-center py-14">
              <Brain className="w-10 h-10 themed-text-muted mx-auto mb-3" />
              <p className="text-lg font-bold themed-text mb-1">Nenhum perfil disponivel</p>
              <p className="text-sm themed-text-secondary">
                Os creators precisam completar o onboarding comportamental
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profiles.map(({ user, creatorDiagnostic, adminDiagnostic }) => {
              const riskKey = adminDiagnostic?.retentionRisk ?? 'low';
              const riskCfg = RISK_CONFIG[riskKey] ?? RISK_CONFIG.low;
              const readiness = creatorDiagnostic.readinessScore;
              const readinessColor = readiness >= 7 ? '#10B981' : readiness >= 5 ? '#F59E0B' : '#EF4444';

              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/admin/creators/${user.id}`)}
                  className="rounded-2xl border themed-border themed-surface p-4 cursor-pointer hover:border-brand-primary/30 transition-all group"
                >
                  {/* Creator identity */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/15 flex items-center justify-center text-lg font-bold text-brand-primary-light shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold themed-text truncate">{user.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-lg">{creatorDiagnostic.archetypeEmoji}</span>
                        <span className="text-xs themed-text-muted truncate">{creatorDiagnostic.title}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 themed-text-muted group-hover:text-brand-primary-light transition-colors shrink-0" />
                  </div>

                  {/* Readiness score */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 themed-text-muted" />
                        <span className="text-xs themed-text-muted">Prontidao</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: readinessColor }}>
                        {readiness}/10
                      </span>
                    </div>
                    <ProgressBar value={readiness} max={10} color={readinessColor} />
                  </div>

                  {/* Tags */}
                  {adminDiagnostic?.tags?.length ? (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {adminDiagnostic.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary-light"
                        >
                          {tag}
                        </span>
                      ))}
                      {(adminDiagnostic.tags.length > 3) && (
                        <span className="px-2 py-0.5 rounded-full text-xs themed-surface-light themed-text-muted">
                          +{adminDiagnostic.tags.length - 3}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Footer: risk + archetype */}
                  <div className="flex items-center justify-between pt-3 border-t themed-border">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: riskCfg.color }} />
                      <span className="text-xs themed-text-muted">Churn:</span>
                      <Badge variant={riskCfg.variant} className="text-xs">{riskCfg.label}</Badge>
                    </div>
                    <span className="text-xs font-semibold text-brand-primary-light">
                      {creatorDiagnostic.archetype}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
