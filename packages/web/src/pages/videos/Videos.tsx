import { useEffect, useState, useCallback } from 'react';
import {
  Video,
  Sun,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  PlusCircle,
  Link as LinkIcon,
  Send,
  Film,
  Calendar,
  Tag,
  X,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import { videosApi, brandsApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface DailySummary {
  submitted: number;
  approved: number;
  pending: number;
  rejected: number;
  paid: number;
  earnings: string;
  remaining: number;
  maxDaily: number;
}

interface VideoItem {
  id: string;
  brandName: string;
  externalUrl?: string;
  platform?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  payment: number;
}

interface Brand { id: string; name: string; logoUrl?: string }
type Platform = 'tiktok' | 'instagram' | 'youtube';

const STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Rejeitado', variant: 'danger' as const, icon: XCircle },
};

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editPlatform, setEditPlatform] = useState<Platform>('tiktok');
  const [editSaving, setEditSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [listRes, dailyRes] = await Promise.all([
        videosApi.list() as Promise<{ videos: VideoItem[]; today: { approved: number; pending: number; rejected: number; remaining: number } }>,
        videosApi.dailySummary() as Promise<DailySummary>,
      ]);
      setVideos(listRes.videos ?? []);
      // dailySummary response uses `remaining` instead of `maxDaily`; derive maxDaily = 10
      setSummary({ ...dailyRes, submitted: (dailyRes.approved ?? 0) + (dailyRes.pending ?? 0) + (dailyRes.rejected ?? 0), maxDaily: 10 });
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function openModal() {
    try {
      const res = (await brandsApi.my()) as { brands: Array<{ brand: Brand } | Brand> };
      const brands = (res.brands ?? []).map((b: any) => b.brand ?? b);
      if (!brands.length) { alert('Conecte-se a uma marca primeiro.'); return; }
      setMyBrands(brands);
      setSelectedBrand(brands[0]);
      setVideoUrl('');
      setPlatform('tiktok');
      setModalOpen(true);
    } catch { alert('Erro ao carregar marcas.'); }
  }

  async function handleSubmit() {
    if (!selectedBrand || !videoUrl.trim()) return;
    setSubmitting(true);
    try {
      await videosApi.submit({ brandId: selectedBrand.id, externalUrl: videoUrl.trim(), platform });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao enviar video.');
    } finally { setSubmitting(false); }
  }

  function openEdit(v: VideoItem) {
    setEditing(v);
    setEditUrl(v.externalUrl ?? '');
    setEditPlatform((v.platform as Platform) ?? 'tiktok');
  }

  async function handleEditSave() {
    if (!editing || !editUrl.trim()) return;
    setEditSaving(true);
    try {
      await videosApi.update(editing.id, { externalUrl: editUrl.trim(), platform: editPlatform });
      setEditing(null);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao atualizar video.');
    } finally { setEditSaving(false); }
  }

  async function handleDelete(v: VideoItem) {
    if (!confirm(`Remover este video enviado para ${v.brandName}?`)) return;
    try {
      await videosApi.remove(v.id);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao remover video.');
    }
  }

  const count = summary?.submitted ?? 0;
  const max = summary?.maxDaily ?? 10;
  const pct = Math.min((count / max) * 100, 100);
  const progressColor = pct >= 70 ? '#10B981' : '#7C3AED';

  if (loading) {
    return <PageContainer title="Videos"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;
  }

  return (
    <PageContainer title="Videos">
      <div className="space-y-6">
        {/* Daily hero */}
        <div className="rounded-2xl border border-brand-primary/15 bg-gradient-to-br from-[#1E1040] to-surface p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-brand-primary/10 blur-2xl" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold themed-text-secondary uppercase tracking-wide">Progresso Diario</span>
            <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-full px-3 py-1">
              <Sun className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Hoje</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <div className="w-24 h-24 rounded-full border-[3px] border-brand-primary/20 flex items-center justify-center bg-black/30">
              <div className="text-center">
                <span className="text-3xl font-extrabold" style={{ color: progressColor }}>{count}</span>
                <span className="text-xs themed-text-secondary">/ {max}</span>
                <p className="text-xs themed-text-muted">videos</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="font-bold themed-text">{summary?.approved ?? 0}</span><span className="text-xs themed-text-muted">aprovados</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><span className="font-bold themed-text">{summary?.pending ?? 0}</span><span className="text-xs themed-text-muted">pendentes</span></div>
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /><span className="font-bold themed-text">{summary?.rejected ?? 0}</span><span className="text-xs themed-text-muted">rejeitados</span></div>
            </div>
          </div>

          <ProgressBar value={pct} color={progressColor} />
          <div className="flex items-center gap-1.5 mt-3">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm themed-text-secondary">Ganhos hoje: </span>
            <span className="text-sm font-bold text-amber-400">R$ {(count * 10).toFixed(2)}</span>
          </div>
        </div>

        {/* Submit CTA */}
        <Button onClick={openModal} icon={<PlusCircle className="w-5 h-5" />} className="w-full">
          Enviar Video
        </Button>

        {/* Videos list */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold themed-text">Videos Enviados</h3>
            <Badge variant="primary">{videos.length}</Badge>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Film className="w-8 h-8 themed-text-muted" />
              </div>
              <p className="text-lg font-bold themed-text mb-1">Nenhum video ainda</p>
              <p className="text-sm themed-text-secondary mb-4">Envie seu primeiro video e comece a ganhar R$10 por aprovacao!</p>
              <Button variant="outline" onClick={openModal}>Enviar agora</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => {
                const st = STATUS_MAP[v.status];
                const canEdit = v.status !== 'approved';
                return (
                  <div
                    key={v.id}
                    className="rounded-xl themed-border themed-surface p-4"
                    style={{ borderLeftWidth: 3, borderLeftColor: st.variant === 'success' ? '#10B981' : st.variant === 'warning' ? '#F59E0B' : '#EF4444' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <st.icon className="w-4 h-4 shrink-0" style={{ color: st.variant === 'success' ? '#10B981' : st.variant === 'warning' ? '#F59E0B' : '#EF4444' }} />
                        <span className="font-semibold themed-text truncate">{v.brandName || 'Marca removida'}</span>
                      </div>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 themed-text-muted">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">{formatDate(v.createdAt)}</span>
                        {v.platform && (
                          <span className="text-xs themed-text-muted ml-2 capitalize">· {v.platform}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-emerald-400">R$ {(v.payment ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t themed-border">
                      {v.externalUrl && (
                        <a
                          href={v.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs themed-text-secondary hover:text-brand-primary-light transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir video
                        </a>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(v)}
                            className="flex items-center gap-1.5 text-xs themed-text-secondary hover:text-brand-primary-light transition-colors ml-auto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            className="flex items-center gap-1.5 text-xs themed-text-secondary hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md themed-surface rounded-t-2xl sm:rounded-2xl themed-border p-6 mx-0 sm:mx-4">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 themed-text-muted hover:themed-text">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-5">
              <Video className="w-5 h-5 text-brand-primary" />
              <h3 className="text-xl font-bold themed-text">Enviar Video</h3>
            </div>

            <label className="text-sm font-semibold themed-text-secondary flex items-center gap-1 mb-2">
              <Tag className="w-3 h-3" /> Marca
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {myBrands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors ${
                    selectedBrand?.id === b.id
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light font-semibold'
                      : 'themed-surface-light themed-border themed-text-secondary hover:border-gray-600'
                  }`}
                >
                  {b.logoUrl && (
                    <img src={b.logoUrl} alt={b.name} className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {b.name}
                </button>
              ))}
            </div>

            <Input
              label="URL do Video"
              icon={<LinkIcon className="w-4 h-4" />}
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <label className="text-sm font-semibold themed-text-secondary block mt-4 mb-2">Plataforma</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(['tiktok', 'instagram', 'youtube'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`py-2 rounded-xl text-sm border text-center transition-colors ${
                    platform === p
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light font-semibold'
                      : 'themed-surface-light themed-border themed-text-secondary'
                  }`}
                >
                  {p === 'tiktok' ? 'TikTok' : p === 'instagram' ? 'Instagram' : 'YouTube'}
                </button>
              ))}
            </div>

            <Button onClick={handleSubmit} loading={submitting} icon={<Send className="w-4 h-4" />} className="w-full">
              Enviar
            </Button>
            <button onClick={() => setModalOpen(false)} className="w-full py-3 text-center themed-text-secondary text-sm mt-2 hover:themed-text transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md themed-surface rounded-t-2xl sm:rounded-2xl themed-border p-6 mx-0 sm:mx-4">
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 themed-text-muted hover:themed-text">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-5">
              <Pencil className="w-5 h-5 text-brand-primary" />
              <h3 className="text-xl font-bold themed-text">Editar Video</h3>
            </div>

            <p className="text-sm themed-text-muted mb-4">
              Marca: <span className="font-semibold themed-text">{editing.brandName}</span>
              {editing.status === 'rejected' && (
                <span className="block mt-1 text-xs text-amber-400">
                  Video rejeitado — ao salvar, volta para pendente.
                </span>
              )}
            </p>

            <Input
              label="URL do Video"
              icon={<LinkIcon className="w-4 h-4" />}
              placeholder="https://..."
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
            />

            <label className="text-sm font-semibold themed-text-secondary block mt-4 mb-2">Plataforma</label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(['tiktok', 'instagram', 'youtube'] as Platform[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setEditPlatform(p)}
                  className={`py-2 rounded-xl text-sm border text-center transition-colors ${
                    editPlatform === p
                      ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light font-semibold'
                      : 'themed-surface-light themed-border themed-text-secondary'
                  }`}
                >
                  {p === 'tiktok' ? 'TikTok' : p === 'instagram' ? 'Instagram' : 'YouTube'}
                </button>
              ))}
            </div>

            <Button onClick={handleEditSave} loading={editSaving} icon={<Send className="w-4 h-4" />} className="w-full">
              Salvar
            </Button>
            <button onClick={() => setEditing(null)} className="w-full py-3 text-center themed-text-secondary text-sm mt-2 hover:themed-text transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
