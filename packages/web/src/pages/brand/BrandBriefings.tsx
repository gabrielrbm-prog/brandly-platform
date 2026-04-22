import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, X, FileText } from 'lucide-react';
import { brandSelfApi } from '@/lib/api';

interface Briefing {
  id: string;
  title: string;
  description: string;
  doList: string[] | null;
  dontList: string[] | null;
  exampleUrls: string[] | null;
  technicalRequirements: string | null;
  tone: string | null;
  isActive: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  doList: '',
  dontList: '',
  technicalRequirements: '',
  tone: 'casual',
  exampleUrls: '',
};

interface FormState {
  title: string;
  description: string;
  doList: string;
  dontList: string;
  technicalRequirements: string;
  tone: string;
  exampleUrls: string;
}

export default function BrandBriefings() {
  const [items, setItems] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Briefing | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await brandSelfApi.listBriefings()) as { briefings: Briefing[] };
      setItems(res.briefings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggle(b: Briefing) {
    await brandSelfApi.toggleBriefing(b.id);
    fetchData();
  }

  async function remove(b: Briefing) {
    if (!confirm(`Excluir briefing "${b.title}"?`)) return;
    await brandSelfApi.deleteBriefing(b.id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold themed-text">Briefings</h1>
          <p className="text-sm themed-text-muted mt-1">
            Defina o que os creators devem (e não devem) fazer ao produzir conteúdo pra sua marca.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90"
        >
          <Plus className="w-4 h-4" />
          Novo briefing
        </button>
      </div>

      {loading ? (
        <div className="themed-text-muted text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="themed-surface-card themed-border rounded-xl p-10 text-center">
          <FileText className="w-10 h-10 themed-text-muted mx-auto mb-3" />
          <p className="themed-text-muted">Nenhum briefing cadastrado ainda.</p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 text-sm text-brand-primary-light hover:underline"
          >
            Criar o primeiro briefing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="themed-surface-card themed-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold themed-text">{b.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        b.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {b.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {b.tone && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary-light">
                        {b.tone}
                      </span>
                    )}
                  </div>
                  <p className="text-sm themed-text-muted mt-2 line-clamp-2">{b.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs themed-text-muted">
                    <div>✓ {b.doList?.length ?? 0} dos</div>
                    <div>✗ {b.dontList?.length ?? 0} don'ts</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton title="Editar" onClick={() => setEditing(b)}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton title={b.isActive ? 'Desativar' : 'Ativar'} onClick={() => toggle(b)}>
                    {b.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </IconButton>
                  <IconButton title="Excluir" danger onClick={() => remove(b)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BriefingModal
          briefing={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  children,
  title,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg themed-text-muted transition-colors ${
        danger
          ? 'hover:bg-red-500/10 hover:text-red-400'
          : 'hover:bg-brand-primary/10 hover:text-brand-primary-light'
      }`}
    >
      {children}
    </button>
  );
}

interface BriefingModalProps {
  briefing: Briefing | null;
  onClose: () => void;
  onSaved: () => void;
}

function BriefingModal({ briefing, onClose, onSaved }: BriefingModalProps) {
  const [form, setForm] = useState<FormState>(
    briefing
      ? {
          title: briefing.title,
          description: briefing.description,
          doList: (briefing.doList ?? []).join('\n'),
          dontList: (briefing.dontList ?? []).join('\n'),
          technicalRequirements: briefing.technicalRequirements ?? '',
          tone: briefing.tone ?? 'casual',
          exampleUrls: (briefing.exampleUrls ?? []).join('\n'),
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Título e descrição são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      doList: form.doList.split('\n').map((s) => s.trim()).filter(Boolean),
      dontList: form.dontList.split('\n').map((s) => s.trim()).filter(Boolean),
      technicalRequirements: form.technicalRequirements.trim() || undefined,
      tone: form.tone.trim() || undefined,
      exampleUrls: form.exampleUrls.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (briefing) {
        await brandSelfApi.updateBriefing(briefing.id, payload);
      } else {
        await brandSelfApi.createBriefing(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="themed-surface rounded-2xl themed-border w-full max-w-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold themed-text">
            {briefing ? 'Editar briefing' : 'Novo briefing'}
          </h2>
          <button onClick={onClose} className="p-1 themed-text-muted hover:themed-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Título *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Vídeo sobre rotina matinal"
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            />
          </Field>

          <Field label="Descrição *">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Contexto geral do que o vídeo deve comunicar"
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 resize-none"
            />
          </Field>

          <Field label="Tom de voz">
            <select
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            >
              <option value="casual">Casual</option>
              <option value="profissional">Profissional</option>
              <option value="divertido">Divertido</option>
              <option value="educativo">Educativo</option>
              <option value="inspirador">Inspirador</option>
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="O que fazer (um item por linha)">
              <textarea
                value={form.doList}
                onChange={(e) => setForm({ ...form, doList: e.target.value })}
                rows={5}
                placeholder={'Mostrar o produto em uso\nFalar o nome da marca\nLegendas grandes'}
                className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 resize-none"
              />
            </Field>

            <Field label="O que NÃO fazer (um item por linha)">
              <textarea
                value={form.dontList}
                onChange={(e) => setForm({ ...form, dontList: e.target.value })}
                rows={5}
                placeholder={'Mencionar concorrentes\nPalavrão\nAlegações médicas'}
                className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 resize-none"
              />
            </Field>
          </div>

          <Field label="Requisitos técnicos">
            <textarea
              value={form.technicalRequirements}
              onChange={(e) => setForm({ ...form, technicalRequirements: e.target.value })}
              rows={2}
              placeholder="Ex: 60s, formato vertical 9:16, áudio original"
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 resize-none"
            />
          </Field>

          <Field label="URLs de referência (uma por linha)">
            <textarea
              value={form.exampleUrls}
              onChange={(e) => setForm({ ...form, exampleUrls: e.target.value })}
              rows={3}
              placeholder="https://instagram.com/..."
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 resize-none"
            />
          </Field>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg themed-surface-light themed-text-secondary text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium themed-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
