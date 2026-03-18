import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Video,
  CheckCircle,
  DollarSign,
  Clock,
  RefreshCw,
  Zap,
  ExternalLink,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { adminApi, dashboardApi, type AdminVideo, type AdminUser } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface DashboardStats {
  totalCreators: number;
  videosPendentes: number;
  videosAprovadosHoje: number;
  poolMensal: string;
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVideos, setPendingVideos] = useState<AdminVideo[]>([]);
  const [recentCreators, setRecentCreators] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringPool, setTriggeringPool] = useState(false);
  const [triggeringSync, setTriggeringSync] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, queueRes, usersRes] = await Promise.all([
        dashboardApi.overview() as Promise<any>,
        adminApi.reviewQueue(),
        adminApi.users(1, 5),
      ]);

      const allVideos = queueRes.videos ?? [];
      const todayStr = new Date().toDateString();
      const approvedToday = allVideos.filter(
        (v: AdminVideo) => v.status === 'approved' && new Date(v.createdAt).toDateString() === todayStr,
      ).length;

      setStats({
        totalCreators: usersRes.total ?? 0,
        videosPendentes: allVideos.filter((v: AdminVideo) => v.status === 'pending').length,
        videosAprovadosHoje: approvedToday,
        poolMensal: dashRes?.month?.totalEarnings ?? '0.00',
      });

      setPendingVideos(allVideos.filter((v: AdminVideo) => v.status === 'pending').slice(0, 5));
      setRecentCreators((usersRes.users ?? []).slice(0, 5));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await adminApi.reviewVideo(id, { status: 'approved' });
      setPendingVideos((prev) => prev.filter((v) => v.id !== id));
      setStats((prev) => prev ? { ...prev, videosPendentes: prev.videosPendentes - 1, videosAprovadosHoje: prev.videosAprovadosHoje + 1 } : prev);
    } catch {
      // silent
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt('Motivo da rejeicao (opcional):');
    if (reason === null) return;
    setRejectingId(id);
    try {
      await adminApi.reviewVideo(id, { status: 'rejected', rejectionReason: reason || undefined });
      setPendingVideos((prev) => prev.filter((v) => v.id !== id));
      setStats((prev) => prev ? { ...prev, videosPendentes: prev.videosPendentes - 1 } : prev);
    } catch {
      // silent
    } finally {
      setRejectingId(null);
    }
  }

  async function handleTriggerPool() {
    setTriggeringPool(true);
    try {
      await adminApi.triggerGlobalPool();
      alert('Pool global distribuido com sucesso!');
    } catch (err: any) {
      alert(err.message ?? 'Erro ao distribuir pool.');
    } finally {
      setTriggeringPool(false);
    }
  }

  async function handleTriggerSync() {
    setTriggeringSync(true);
    try {
      await adminApi.triggerSyncSocial();
      alert('Sincronizacao de redes sociais iniciada!');
    } catch (err: any) {
      alert(err.message ?? 'Erro ao sincronizar.');
    } finally {
      setTriggeringSync(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="Admin — Painel">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Admin — Painel">
      <div className="space-y-6">
        {/* Header banner */}
        <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 to-transparent p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold themed-text">Painel Administrativo</h2>
              <p className="text-sm themed-text-secondary mt-1">Visao geral da plataforma Brandly</p>
            </div>
            <Badge variant="primary">Admin</Badge>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            glowing
            icon={<Users className="w-4 h-4" />}
            label="Creators"
            value={String(stats?.totalCreators ?? 0)}
            color="#7C3AED"
          />
          <StatCard
            glowing
            icon={<Clock className="w-4 h-4" />}
            label="Videos Pendentes"
            value={String(stats?.videosPendentes ?? 0)}
            color="#F59E0B"
          />
          <StatCard
            glowing
            icon={<CheckCircle className="w-4 h-4" />}
            label="Aprovados Hoje"
            value={String(stats?.videosAprovadosHoje ?? 0)}
            color="#10B981"
          />
          <StatCard
            glowing
            icon={<DollarSign className="w-4 h-4" />}
            label="Pool Mensal"
            value={`R$ ${stats?.poolMensal ?? '0.00'}`}
            color="#F472B6"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleTriggerPool}
            loading={triggeringPool}
            icon={<DollarSign className="w-4 h-4" />}
            variant="outline"
            className="w-full"
          >
            Distribuir Pool Global
          </Button>
          <Button
            onClick={handleTriggerSync}
            loading={triggeringSync}
            icon={<RefreshCw className="w-4 h-4" />}
            variant="secondary"
            className="w-full"
          >
            Sincronizar Redes Sociais
          </Button>
        </div>

        {/* Pending videos queue */}
        <Card glowing>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold themed-text">Fila de Aprovacao</h3>
              <Badge variant="warning">{stats?.videosPendentes ?? 0}</Badge>
            </div>
            <button
              onClick={() => navigate('/admin/videos')}
              className="flex items-center gap-1 text-xs text-brand-primary-light hover:text-brand-primary transition-colors"
            >
              Ver todos
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {pendingVideos.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm themed-text-secondary">Nenhum video pendente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 rounded-xl themed-surface-light p-3 border themed-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium themed-text truncate">
                        {video.creatorName ?? 'Creator'}
                      </span>
                      <Badge variant="default" className="shrink-0">
                        {PLATFORM_LABELS[video.platform] ?? video.platform}
                      </Badge>
                    </div>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand-primary-light hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{video.url}</span>
                    </a>
                    <p className="text-xs themed-text-muted mt-0.5">{formatDate(video.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(video.id)}
                      disabled={approvingId === video.id || rejectingId === video.id}
                      className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Aprovar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(video.id)}
                      disabled={approvingId === video.id || rejectingId === video.id}
                      className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Rejeitar"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent creators */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 themed-text-secondary" />
              <h3 className="text-sm font-semibold themed-text">Ultimos Creators</h3>
            </div>
            <button
              onClick={() => navigate('/admin/creators')}
              className="flex items-center gap-1 text-xs text-brand-primary-light hover:text-brand-primary transition-colors"
            >
              Ver todos
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y themed-border">
            {recentCreators.map((creator) => (
              <div
                key={creator.id}
                onClick={() => navigate(`/admin/creators/${creator.id}`)}
                className="flex items-center gap-3 py-3 cursor-pointer hover:themed-surface-light rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-sm font-bold text-brand-primary-light shrink-0">
                  {creator.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium themed-text truncate">{creator.name}</p>
                  <p className="text-xs themed-text-muted truncate">{creator.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {creator.level && (
                    <Badge variant="primary" className="text-xs">{creator.level}</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 themed-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
