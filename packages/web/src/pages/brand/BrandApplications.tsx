import { useCallback, useEffect, useState } from 'react';
import { Check, X, Instagram, Music2, Mail, Sparkles, ExternalLink } from 'lucide-react';
import { brandApplicationsApi } from '@/lib/api';

interface Application {
  id: string;
  creatorId: string;
  fullName: string;
  age: number;
  email: string;
  gender: 'female' | 'male' | 'other';
  instagramHandle: string | null;
  tiktokHandle: string | null;
  matchScore: number | null;
  aiAnalysis: string | null;
  aiReasoning: Record<string, any> | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
}

type Tab = 'pending' | 'approved' | 'rejected';

function scoreColor(score: number | null) {
  if (score == null) return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (score >= 60) return 'bg-lime-500/10 text-lime-400 border-lime-500/30';
  if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  return 'bg-red-500/10 text-red-400 border-red-500/30';
}

function genderLabel(g: string) {
  return g === 'female' ? 'Feminino' : g === 'male' ? 'Masculino' : 'Outro';
}

export default function BrandApplications() {
  const [tab, setTab] = useState<Tab>('pending');
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await brandApplicationsApi.list(tab)) as { applications: Application[] };
      setItems(res.applications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleApprove(app: Application) {
    if (!confirm(`Aprovar ${app.fullName} como creator da marca?`)) return;
    setActingId(app.id);
    try {
      await brandApplicationsApi.approve(app.id);
      await fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao aprovar.');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setActingId(rejecting.id);
    try {
      await brandApplicationsApi.reject(rejecting.id, rejectReason.trim() || undefined);
      setRejecting(null);
      setRejectReason('');
      await fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao rejeitar.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold themed-text">Candidaturas</h1>
        <p className="text-sm themed-text-muted mt-1">
          Creators que pediram para trabalhar com sua marca. Nossa IA avalia automaticamente o
          perfil e gera um score de compatibilidade.
        </p>
      </div>

      <div className="flex gap-2 border-b themed-border">
        {(['pending', 'approved', 'rejected'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-brand-primary text-brand-primary-light'
                : 'border-transparent themed-text-muted hover:themed-text'
            }`}
          >
            {t === 'pending' ? 'Pendentes' : t === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="themed-text-muted text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="themed-surface-card themed-border rounded-xl p-8 text-center themed-text-muted text-sm">
          Nenhuma candidatura {tab === 'pending' ? 'pendente' : tab === 'approved' ? 'aprovada' : 'rejeitada'}.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="themed-surface-card themed-border rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold themed-text truncate">{app.fullName}</p>
                    <p className="text-xs themed-text-muted">
                      {app.age} anos · {genderLabel(app.gender)}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold border ${scoreColor(
                      app.matchScore,
                    )}`}
                    title="Match score calculado pela IA"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {app.matchScore != null ? `${app.matchScore}%` : '—'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 themed-text-muted">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{app.email}</span>
                  </div>
                  {app.instagramHandle && (
                    <a
                      href={`https://instagram.com/${app.instagramHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 themed-text-muted hover:text-pink-400"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span className="truncate">@{app.instagramHandle}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                  {app.tiktokHandle && (
                    <a
                      href={`https://tiktok.com/@${app.tiktokHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 themed-text-muted hover:text-sky-400"
                    >
                      <Music2 className="w-3.5 h-3.5" />
                      <span className="truncate">@{app.tiktokHandle}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  )}
                </div>

                {app.aiAnalysis && (
                  <div className="themed-surface rounded-lg p-3 space-y-2">
                    <p className="text-[10px] uppercase font-semibold tracking-wide text-brand-primary-light">
                      Análise IA
                    </p>
                    <p className="text-xs themed-text-secondary whitespace-pre-line">
                      {isExpanded || app.aiAnalysis.length < 200
                        ? app.aiAnalysis
                        : app.aiAnalysis.slice(0, 200) + '…'}
                    </p>
                    {app.aiAnalysis.length >= 200 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="text-xs text-brand-primary-light hover:underline"
                      >
                        {isExpanded ? 'Recolher' : 'Ver análise completa'}
                      </button>
                    )}
                  </div>
                )}

                {app.status === 'rejected' && app.rejectionReason && (
                  <p className="text-xs text-red-400 italic">
                    Motivo da rejeição: {app.rejectionReason}
                  </p>
                )}

                {app.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(app)}
                      disabled={actingId === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => setRejecting(app)}
                      disabled={actingId === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejecting && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setRejecting(null); setRejectReason(''); }}
        >
          <div
            className="themed-surface rounded-2xl themed-border w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold themed-text mb-1">Rejeitar {rejecting.fullName}?</h2>
            <p className="text-sm themed-text-muted mb-4">
              O creator poderá ver o motivo (opcional) e candidatar-se novamente.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={3}
              className="w-full themed-surface-light themed-border rounded-lg p-3 text-sm themed-text outline-none focus:border-brand-primary resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejecting(null); setRejectReason(''); }}
                className="flex-1 py-2 rounded-lg themed-surface-light themed-text-secondary text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actingId === rejecting.id}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                Confirmar rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
