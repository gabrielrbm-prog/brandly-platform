import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { adminApi, type AdminVideo, type AdminBrand } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#FF0050',
  instagram: '#E1306C',
  youtube: '#FF0000',
};

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

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminVideos() {
  const navigate = useNavigate();
  const toast = useToast();
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; creatorName: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [brandsList, setBrandsList] = useState<AdminBrand[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.reviewQueue({
        status: statusFilter,
        brandId: brandFilter || undefined,
        limit: 200,
      });
      setVideos(res.videos ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar videos.');
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, brandFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    adminApi.brandsList(1)
      .then((res) => setBrandsList(res.brands ?? []))
      .catch(() => setBrandsList([]));
  }, []);

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      await adminApi.reviewVideo(id, { status: 'approved' });
      toast.success('Video aprovado com sucesso!');
      await fetchVideos();
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
      setRejectModal(null);
      toast.success('Video rejeitado.');
      await fetchVideos();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao rejeitar video.');
    } finally {
      setRejectingId(null);
    }
  }

  const titleByStatus: Record<StatusFilter, string> = {
    pending: 'Fila de Revisao',
    approved: 'Videos Aprovados',
    rejected: 'Videos Rejeitados',
    all: 'Todos os Videos',
  };

  return (
    <PageContainer title="Admin — Videos">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 themed-text-secondary" />
            <h2 className="text-lg font-bold themed-text">{titleByStatus[statusFilter]}</h2>
            <Badge variant={statusFilter === 'pending' ? 'warning' : 'primary'}>{videos.length}</Badge>
          </div>
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-brand-primary-light hover:text-brand-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl themed-surface border themed-border p-1">
            {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-primary/20 text-brand-primary-light'
                    : 'themed-text-muted hover:themed-text'
                }`}
              >
                {s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovados' : s === 'rejected' ? 'Rejeitados' : 'Todos'}
              </button>
            ))}
          </div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 rounded-lg themed-bg border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
          >
            <option value="">Todas as marcas</option>
            {brandsList.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-lg font-bold themed-text mb-1">
                {statusFilter === 'pending' ? 'Fila limpa' : 'Nenhum video encontrado'}
              </p>
              <p className="text-sm themed-text-secondary">
                {statusFilter === 'pending' ? 'Todos os videos foram revisados' : 'Ajuste os filtros acima'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-2">
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Video / Creator</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Marca</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Plataforma</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Data</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Acoes</span>
            </div>

            {videos.map((video) => {
              const isPending = video.status === 'pending';
              const isActing = approvingId === video.id || rejectingId === video.id;
              const platformColor = PLATFORM_COLORS[video.platform] ?? '#7C3AED';
              const statusColor = isPending ? '#F59E0B' : video.status === 'approved' ? '#10B981' : '#EF4444';
              const videoUrl = video.externalUrl ?? video.url ?? '';

              const statusBadge = (
                <Badge variant={isPending ? 'warning' : video.status === 'approved' ? 'success' : 'danger'}>
                  {isPending ? <Clock className="w-3 h-3 mr-1" /> : video.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {isPending ? 'Pendente' : video.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </Badge>
              );

              return (
                <div
                  key={video.id}
                  className="rounded-2xl border themed-border themed-surface p-4 transition-all"
                  style={{ borderLeftColor: statusColor, borderLeftWidth: 3 }}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => navigate(`/admin/creators/${video.creatorId}`)}
                            className="text-sm font-semibold text-brand-primary-light hover:underline truncate"
                          >
                            {video.creatorName ?? 'Creator'}
                          </button>
                          {statusBadge}
                        </div>
                        {video.brandName && (
                          <p className="text-xs themed-text-muted">{video.brandName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: platformColor, backgroundColor: `${platformColor}15` }}
                          >
                            {PLATFORM_LABELS[video.platform] ?? video.platform}
                          </span>
                          <span className="text-xs themed-text-muted">{formatDate(video.createdAt)}</span>
                        </div>
                        {videoUrl && (
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-primary-light hover:underline mt-1.5 truncate"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{videoUrl}</span>
                          </a>
                        )}
                        {video.status === 'rejected' && video.rejectionReason && (
                          <p className="text-xs text-red-400 mt-1.5">Motivo: {video.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleApprove(video.id)}
                          disabled={isActing}
                          loading={approvingId === video.id}
                          icon={<CheckCircle className="w-4 h-4" />}
                          className="flex-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setRejectModal({ id: video.id, creatorName: video.creatorName ?? 'Creator' })}
                          disabled={isActing}
                          icon={<XCircle className="w-4 h-4" />}
                          className="flex-1"
                        >
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <button
                          onClick={() => navigate(`/admin/creators/${video.creatorId}`)}
                          className="text-sm font-semibold text-brand-primary-light hover:underline"
                        >
                          {video.creatorName ?? 'Creator'}
                        </button>
                        {statusBadge}
                      </div>
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-brand-primary-light/70 hover:text-brand-primary-light truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{videoUrl}</span>
                        </a>
                      )}
                      {video.status === 'rejected' && video.rejectionReason && (
                        <p className="text-xs text-red-400 mt-0.5 truncate" title={video.rejectionReason}>
                          Motivo: {video.rejectionReason}
                        </p>
                      )}
                    </div>
                    <span className="text-sm themed-text-secondary truncate">{video.brandName ?? '—'}</span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ color: platformColor, backgroundColor: `${platformColor}15` }}
                    >
                      {PLATFORM_LABELS[video.platform] ?? video.platform}
                    </span>
                    <span className="text-sm themed-text-muted">{formatDate(video.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      {videoUrl && (
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary-light hover:bg-brand-primary/20 flex items-center justify-center transition-colors"
                          title="Abrir video"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(video.id)}
                            disabled={isActing}
                            className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Aprovar"
                          >
                            {approvingId === video.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: video.id, creatorName: video.creatorName ?? 'Creator' })}
                            disabled={isActing}
                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Rejeitar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
