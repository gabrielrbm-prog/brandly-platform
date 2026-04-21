import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ExternalLink, Play } from 'lucide-react';
import { brandPortalApi, type BrandVideo } from '@/lib/api';

export default function BrandVideos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'pending';
  const [videos, setVideos] = useState<BrandVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await brandPortalApi.videos(status);
      setVideos(res.videos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function approve(id: string) {
    setProcessingId(id);
    try {
      await brandPortalApi.approveVideo(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao aprovar');
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(id: string) {
    if (!reason.trim() || reason.trim().length < 3) {
      alert('Informe um motivo de rejeicao (min 3 caracteres)');
      return;
    }
    setProcessingId(id);
    try {
      await brandPortalApi.rejectVideo(id, reason.trim());
      setRejectingId(null);
      setReason('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao rejeitar');
    } finally {
      setProcessingId(null);
    }
  }

  const tabs = [
    { key: 'pending', label: 'Pendentes', icon: Clock },
    { key: 'approved', label: 'Aprovados', icon: CheckCircle2 },
    { key: 'rejected', label: 'Rejeitados', icon: XCircle },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold themed-text mb-2">Videos</h1>
      <p className="themed-text-muted mb-6">
        Aprove ou rejeite o conteudo enviado pelos creators
      </p>

      <div className="flex gap-2 mb-6 border-b themed-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearchParams({ status: tab.key })}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${status === tab.key
                ? 'border-brand-primary text-brand-primary-light'
                : 'border-transparent themed-text-muted hover:themed-text'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 themed-text-muted">Carregando...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 themed-text-muted">Nenhum video nesta categoria</div>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="themed-surface-card border themed-border rounded-xl p-4 md:p-5"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Player */}
                <div className="flex-shrink-0">
                  {video.externalUrl ? (
                    <a
                      href={video.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full md:w-32 h-32 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <Play className="w-8 h-8 text-white/80" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-center w-full md:w-32 h-32 rounded-lg bg-black/30 themed-text-muted text-xs">
                      Sem video
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold themed-text">{video.creatorName}</span>
                    {video.platform && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary-light uppercase">
                        {video.platform}
                      </span>
                    )}
                  </div>
                  {video.briefingTitle && (
                    <div className="text-xs themed-text-muted mb-2">
                      Briefing: {video.briefingTitle}
                    </div>
                  )}
                  <div className="text-xs themed-text-muted">
                    Enviado em {new Date(video.createdAt).toLocaleString('pt-BR')}
                  </div>
                  {video.externalUrl && (
                    <a
                      href={video.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-primary-light mt-2 hover:underline"
                    >
                      Abrir video <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {video.rejectionReason && (
                    <div className="mt-2 text-sm text-red-400">
                      Motivo: {video.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {status === 'pending' && (
                  <div className="flex md:flex-col gap-2 md:w-32">
                    <button
                      onClick={() => approve(video.id)}
                      disabled={processingId === video.id}
                      className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 text-sm font-medium disabled:opacity-50"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === video.id ? null : video.id)}
                      disabled={processingId === video.id}
                      className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-sm font-medium disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>

              {rejectingId === video.id && (
                <div className="mt-4 pt-4 border-t themed-border">
                  <label className="block text-xs font-medium themed-text-muted mb-2">
                    Motivo da rejeicao
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Logo da marca nao aparece no video..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg themed-bg border themed-border themed-text text-sm focus:outline-none focus:border-brand-primary"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => reject(video.id)}
                      disabled={processingId === video.id}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      Confirmar rejeicao
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setReason('');
                      }}
                      className="px-4 py-2 rounded-lg themed-surface-hover themed-text-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
