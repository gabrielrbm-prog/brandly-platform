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
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminApi, type AdminVideo, type AdminUser } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface DashboardStats {
  totalCreators: number;
  videosPendentes: number;
  videosAprovadosHoje: number;
  saquesP: number;
}

interface RejectModalProps {
  videoId: string;
  creatorName: string;
  onConfirm: (id: string, reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function RejectModal({ videoId, creatorName, onConfirm, onCancel, loading }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const isEmpty = reason.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-md themed-surface rounded-2xl border themed-border p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 themed-text-muted hover:themed-text transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold themed-text">Rejeitar Video</h3>
        </div>

        <p className="text-sm themed-text-secondary mb-4">
          Rejeitar video de <span className="font-semibold themed-text">{creatorName}</span>?
        </p>

        <Input
          label="Motivo da rejeicao (obrigatorio)"
          icon={<AlertCircle className="w-4 h-4" />}
          placeholder="Ex: Video fora do briefing, qualidade baixa..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {isEmpty && (
          <p className="text-xs text-red-400 mt-1">O motivo da rejeicao e obrigatorio.</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button
            variant="danger"
            onClick={() => onConfirm(videoId, reason.trim())}
            loading={loading}
            disabled={isEmpty || loading}
            icon={<XCircle className="w-4 h-4" />}
            className="flex-1"
          >
            Rejeitar
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
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
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingVideos, setPendingVideos] = useState<AdminVideo[]>([]);
  const [recentCreators, setRecentCreators] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringPool, setTriggeringPool] = useState(false);
  const [triggeringSync, setTriggeringSync] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; creatorName: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [queueRes, usersRes] = await Promise.all([
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
        saquesP: 0,
      });

      setPendingVideos(allVideos.filter((v: AdminVideo) => v.status === 'pending').slice(0, 5));
      setRecentCreators((usersRes.users ?? []).slice(0, 5));
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await adminApi.reviewVideo(id, { status: 'approved' });
      setPendingVideos((prev) => prev.filter((v) => v.id !== id));
      setStats((prev) =>
        prev
          ? {
              ...prev,
              videosPendentes: prev.videosPendentes - 1,
              videosAprovadosHoje: prev.videosAprovadosHoje + 1,
            }
          : prev,
      );
      toast.success('Video aprovado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao aprovar video.');
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRejectConfirm(id: string, reason: string) {
    setRejectingId(id);
    try {
      await adminApi.reviewVideo(id, { status: 'rejected', rejectionReason: reason });
      setPendingVideos((prev) => prev.filter((v) => v.id !== id));
      setStats((prev) =>
        prev ? { ...prev, videosPendentes: prev.videosPendentes - 1 } : prev,
      );
      setRejectModal(null);
      toast.success('Video rejeitado.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao rejeitar video.');
    } finally {
      setRejectingId(null);
    }
  }

  async function handleTriggerPool() {
    setTriggeringPool(true);
    try {
      await adminApi.triggerGlobalPool();
      toast.success('Pool global distribuido com sucesso!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao distribuir pool.');
    } finally {
      setTriggeringPool(false);
    }
  }

  async function handleTriggerSync() {
    setTriggeringSync(true);
    try {
      await adminApi.triggerSyncSocial();
      toast.success('Sincronizacao de redes sociais iniciada!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao sincronizar.');
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
            label="Total Creators"
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
            label="Saques Pendentes"
            value={String(stats?.saquesP ?? 0)}
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
                      onClick={() =>
                        setRejectModal({ id: video.id, creatorName: video.creatorName ?? 'Creator' })
                      }
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
                  {creator.levelName && (
                    <Badge variant="primary" className="text-xs">{creator.levelName}</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 themed-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <RejectModal
          videoId={rejectModal.id}
          creatorName={rejectModal.creatorName}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
          loading={rejectingId === rejectModal.id}
        />
      )}
    </PageContainer>
  );
}
