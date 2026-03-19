import { useEffect, useState, useCallback } from 'react';
import {
  Radio,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  Calendar,
  ExternalLink,
  Users,
} from 'lucide-react';
import { adminApi, type AdminLive, type AdminCase } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(d: string) {
  const date = new Date(d);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toDatetimeLocalValue(iso: string) {
  // Convert ISO string to value for <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Live status helpers ───────────────────────────────────────────────────────

function getLiveStatusStyle(status: AdminLive['status']) {
  switch (status) {
    case 'ao-vivo':
      return {
        badge: 'bg-red-500/15 text-red-400',
        dot: 'bg-red-400 animate-pulse',
        label: 'Ao Vivo',
      };
    case 'agendada':
      return {
        badge: 'bg-blue-500/15 text-blue-400',
        dot: 'bg-blue-400',
        label: 'Agendada',
      };
    case 'encerrada':
    default:
      return {
        badge: 'bg-white/8 themed-text-muted',
        dot: 'bg-gray-500',
        label: 'Encerrada',
      };
  }
}

// ─── Live Modal ────────────────────────────────────────────────────────────────

interface LiveFormData {
  title: string;
  scheduledAt: string;
  instructorName: string;
  meetingUrl: string;
}

const EMPTY_LIVE: LiveFormData = {
  title: '',
  scheduledAt: '',
  instructorName: '',
  meetingUrl: '',
};

interface LiveModalProps {
  live?: AdminLive | null;
  onClose: () => void;
  onSaved: () => void;
}

function LiveModal({ live, onClose, onSaved }: LiveModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LiveFormData>(() =>
    live
      ? {
          title: live.title,
          scheduledAt: toDatetimeLocalValue(live.scheduledAt),
          instructorName: live.instructorName,
          meetingUrl: live.meetingUrl ?? '',
        }
      : EMPTY_LIVE,
  );

  function handleChange(field: keyof LiveFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt || !form.instructorName.trim()) {
      toast.error('Titulo, data/hora e instrutor sao obrigatorios.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      instructorName: form.instructorName.trim(),
      meetingUrl: form.meetingUrl.trim() || undefined,
    };
    setSaving(true);
    try {
      if (live) {
        await adminApi.updateLive(live.id, payload);
        toast.success('Live atualizada.');
      } else {
        await adminApi.createLive(payload);
        toast.success('Live criada com sucesso.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar live.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {live ? 'Editar Live' : 'Nova Live'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Titulo"
            placeholder="Ex: Masterclass Producao de Videos UGC"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Data e Hora</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => handleChange('scheduledAt', e.target.value)}
              required
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>
          <Input
            label="Instrutor / Apresentador"
            placeholder="Ex: Raquel Guerreiro"
            value={form.instructorName}
            onChange={(e) => handleChange('instructorName', e.target.value)}
            required
          />
          <Input
            label="URL da Reuniao"
            placeholder="https://..."
            value={form.meetingUrl}
            onChange={(e) => handleChange('meetingUrl', e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {live ? 'Salvar' : 'Criar Live'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteLiveModalProps {
  live: AdminLive;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteLiveModal({ live, onConfirm, onCancel }: DeleteLiveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-base font-bold themed-text mb-2">Excluir Live</h3>
        <p className="text-sm themed-text-secondary mb-6">
          Tem certeza que deseja excluir a live{' '}
          <span className="font-semibold themed-text">"{live.title}"</span>?
          Esta acao nao pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            className="flex-1 !bg-red-500/90 hover:!bg-red-500 text-white"
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Case Modal ────────────────────────────────────────────────────────────────

interface CaseFormData {
  creatorName: string;
  title: string;
  story: string;
  isPublished: boolean;
}

const EMPTY_CASE: CaseFormData = {
  creatorName: '',
  title: '',
  story: '',
  isPublished: false,
};

interface CaseModalProps {
  adminCase?: AdminCase | null;
  onClose: () => void;
  onSaved: () => void;
}

function CaseModal({ adminCase, onClose, onSaved }: CaseModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CaseFormData>(() =>
    adminCase
      ? {
          creatorName: adminCase.creatorName ?? '',
          title: adminCase.title,
          story: adminCase.story,
          isPublished: adminCase.isPublished,
        }
      : EMPTY_CASE,
  );

  function handleChange(field: keyof CaseFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.story.trim()) {
      toast.error('Titulo e historia sao obrigatorios.');
      return;
    }
    const payload = {
      creatorName: form.creatorName.trim() || undefined,
      title: form.title.trim(),
      story: form.story.trim(),
      isPublished: form.isPublished,
    };
    setSaving(true);
    try {
      if (adminCase) {
        await adminApi.updateCase(adminCase.id, payload);
        toast.success('Case atualizado.');
      } else {
        await adminApi.createCase(payload);
        toast.success('Case criado com sucesso.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar case.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {adminCase ? 'Editar Case' : 'Novo Case de Sucesso'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nome do Creator"
              placeholder="Ex: Carolina Silva"
              value={form.creatorName}
              onChange={(e) => handleChange('creatorName', e.target.value)}
            />
            <Input
              label="Titulo"
              placeholder="Ex: De 0 a R$5k/mes em 60 dias"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Historia</label>
            <textarea
              value={form.story}
              onChange={(e) => handleChange('story', e.target.value)}
              placeholder="Historia de sucesso do creator..."
              rows={3}
              required
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>
          {/* Published toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border themed-border">
            <div>
              <p className="text-sm font-medium themed-text">Publicar imediatamente</p>
              <p className="text-xs themed-text-muted">Visivelmente para os creators</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isPublished', !form.isPublished)}
              className={`w-10 h-5.5 rounded-full transition-all relative ${
                form.isPublished ? 'bg-brand-primary' : 'bg-white/20'
              }`}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${
                  form.isPublished ? 'left-[calc(100%-20px)]' : 'left-0.5'
                }`}
                style={{ width: '18px', height: '18px' }}
              />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {adminCase ? 'Salvar' : 'Criar Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Case Card ─────────────────────────────────────────────────────────────────

interface CaseCardProps {
  adminCase: AdminCase;
  onToggle: (c: AdminCase) => void;
  onEdit: (c: AdminCase) => void;
}

function CaseCard({ adminCase, onToggle, onEdit }: CaseCardProps) {
  return (
    <div className="rounded-2xl border themed-border bg-white/5 backdrop-blur-sm overflow-hidden hover:border-brand-primary/20 transition-all">
      <div className="h-16 bg-gradient-to-br from-brand-primary/10 to-violet-600/5 flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-brand-primary/30" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs themed-text-muted">{adminCase.creatorName ?? '—'}</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              adminCase.isPublished
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/8 themed-text-muted'
            }`}
          >
            {adminCase.isPublished ? 'Publicado' : 'Rascunho'}
          </span>
        </div>

        <h3 className="font-bold themed-text text-sm mb-2 line-clamp-1">{adminCase.title}</h3>
        <p className="text-xs themed-text-muted line-clamp-2 leading-relaxed mb-4">
          {adminCase.story}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(adminCase)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              adminCase.isPublished
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {adminCase.isPublished ? (
              <><EyeOff className="w-3.5 h-3.5" /> Despublicar</>
            ) : (
              <><Eye className="w-3.5 h-3.5" /> Publicar</>
            )}
          </button>
          <button
            onClick={() => onEdit(adminCase)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lives Tab ─────────────────────────────────────────────────────────────────

interface LivesTabProps {
  lives: AdminLive[];
  loading: boolean;
  onRefresh: () => void;
}

function LivesTab({ lives, loading, onRefresh }: LivesTabProps) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingLive, setEditingLive] = useState<AdminLive | null>(null);
  const [deletingLive, setDeletingLive] = useState<AdminLive | null>(null);

  async function handleDelete(live: AdminLive) {
    try {
      await adminApi.deleteLive(live.id);
      toast.success('Live excluida.');
      setDeletingLive(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao excluir live.');
    }
  }

  function handleSaved() {
    setShowModal(false);
    setEditingLive(null);
    onRefresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm themed-text-secondary">{lives.length} lives</span>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingLive(null); setShowModal(true); }}
        >
          Nova Live
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : lives.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Radio className="w-8 h-8 themed-text-muted mx-auto mb-2" />
            <p className="themed-text-secondary text-sm">Nenhuma live agendada</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b themed-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                    Titulo
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                    Instrutor
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold themed-text-muted uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y themed-border">
                {lives.map((live) => {
                  const style = getLiveStatusStyle(live.status);
                  return (
                    <tr key={live.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium themed-text">{live.title}</p>
                          {live.meetingUrl && (
                            <a
                              href={live.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="themed-text-muted hover:text-brand-primary-light transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 themed-text-secondary">
                          <Calendar className="w-3.5 h-3.5 themed-text-muted shrink-0" />
                          <span className="text-xs">{formatDateTime(live.scheduledAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 themed-text-secondary text-xs">{live.instructorName}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingLive(live); setShowModal(true); }}
                            className="p-1.5 rounded-lg themed-text-muted hover:themed-text hover:bg-white/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingLive(live)}
                            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <LiveModal
          live={editingLive}
          onClose={() => { setShowModal(false); setEditingLive(null); }}
          onSaved={handleSaved}
        />
      )}
      {deletingLive && (
        <DeleteLiveModal
          live={deletingLive}
          onConfirm={() => handleDelete(deletingLive)}
          onCancel={() => setDeletingLive(null)}
        />
      )}
    </>
  );
}

// ─── Cases Tab ─────────────────────────────────────────────────────────────────

interface CasesTabProps {
  cases: AdminCase[];
  loading: boolean;
  onRefresh: () => void;
}

function CasesTab({ cases, loading, onRefresh }: CasesTabProps) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingCase, setEditingCase] = useState<AdminCase | null>(null);

  async function handleToggle(adminCase: AdminCase) {
    try {
      await adminApi.toggleCasePublish(adminCase.id);
      toast.success(adminCase.isPublished ? 'Case despublicado.' : 'Case publicado.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status do case.');
    }
  }

  function handleSaved() {
    setShowModal(false);
    setEditingCase(null);
    onRefresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm themed-text-secondary">{cases.length} cases</span>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingCase(null); setShowModal(true); }}
        >
          Novo Case
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Users className="w-8 h-8 themed-text-muted mx-auto mb-2" />
            <p className="themed-text-secondary text-sm">Nenhum case de sucesso cadastrado</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <CaseCard
              key={c.id}
              adminCase={c}
              onToggle={handleToggle}
              onEdit={(c) => { setEditingCase(c); setShowModal(true); }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CaseModal
          adminCase={editingCase}
          onClose={() => { setShowModal(false); setEditingCase(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = 'lives' | 'cases';

export default function AdminCommunity() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('lives');
  const [lives, setLives] = useState<AdminLive[]>([]);
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loadingLives, setLoadingLives] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);

  const fetchLives = useCallback(async () => {
    setLoadingLives(true);
    try {
      const res = await adminApi.livesList();
      setLives(res.lives ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar lives.');
    } finally {
      setLoadingLives(false);
    }
  }, [toast]);

  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const res = await adminApi.casesList();
      setCases(res.cases ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar cases.');
    } finally {
      setLoadingCases(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLives();
  }, [fetchLives]);

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchCases();
    }
  }, [activeTab, fetchCases]);

  const TABS: { id: ActiveTab; label: string; count: number }[] = [
    { id: 'lives', label: 'Lives', count: lives.length },
    { id: 'cases', label: 'Cases de Sucesso', count: cases.length },
  ];

  return (
    <PageContainer title="Admin — Comunidade">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 themed-text-secondary" />
          <h2 className="text-lg font-bold themed-text">Comunidade</h2>
          <Badge variant="primary">{lives.length + cases.length}</Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'themed-text-muted hover:themed-text'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 themed-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'lives' && (
          <LivesTab lives={lives} loading={loadingLives} onRefresh={fetchLives} />
        )}
        {activeTab === 'cases' && (
          <CasesTab cases={cases} loading={loadingCases} onRefresh={fetchCases} />
        )}
      </div>
    </PageContainer>
  );
}
