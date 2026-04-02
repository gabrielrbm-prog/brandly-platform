import { useEffect, useState, useCallback } from 'react';
import {
  Wand2,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Tag,
  FileText,
  Pencil,
  Save,
  X,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { brandsApi, scriptsApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Brand { id: string; name: string; category: string; description: string; logoUrl?: string }
interface Script {
  id: string; briefingId: string; hook: string; body: string; cta: string;
  fullScript: string; isUsed: boolean; createdAt: string;
}

type Tab = 'generate' | 'library';

export default function Studio() {
  const [tab, setTab] = useState<Tab>('generate');
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [library, setLibrary] = useState<Script[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ hook: '', body: '', cta: '' });
  const [saving, setSaving] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      const res = (await brandsApi.my()) as { brands: Array<{ brand: Brand } | Brand> };
      const brands = (res.brands ?? []).map((b: any) => b.brand ?? b);
      setMyBrands(brands);
      if (brands.length > 0) setSelectedBrand(brands[0]);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const fetchLibrary = useCallback(async () => {
    try {
      const res = (await scriptsApi.list()) as { scripts: Script[] };
      setLibrary(res.scripts ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchBrands(); fetchLibrary(); }, [fetchBrands, fetchLibrary]);

  async function handleGenerate() {
    if (!selectedBrand) return;
    setGenerating(true);
    setScripts([]);
    try {
      const brandDetail = (await brandsApi.detail(selectedBrand.id)) as { briefings: Array<{ id: string }> };
      const briefing = brandDetail.briefings?.[0];
      if (!briefing) {
        alert('Esta marca nao tem briefing ativo. Peca ao admin para criar um.');
        return;
      }
      const result = (await scriptsApi.generate({ briefingId: briefing.id })) as { scripts: Script[] };
      setScripts(result.scripts);
      // Atualizar biblioteca
      fetchLibrary();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao gerar roteiros.');
    } finally { setGenerating(false); }
  }

  function copyScript(script: Script) {
    navigator.clipboard.writeText(script.fullScript);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function startEditing(script: Script) {
    setEditingId(script.id);
    setEditForm({ hook: script.hook, body: script.body, cta: script.cta });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm({ hook: '', body: '', cta: '' });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const updated = (await scriptsApi.update(id, editForm)) as Script;
      // Atualizar nos scripts gerados
      setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      // Atualizar na biblioteca
      setLibrary((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message ?? 'Erro ao salvar.');
    } finally { setSaving(false); }
  }

  async function markUsed(id: string) {
    try {
      await scriptsApi.markUsed(id);
      setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, isUsed: true } : s)));
      setLibrary((prev) => prev.map((s) => (s.id === id ? { ...s, isUsed: true } : s)));
    } catch { /* silent */ }
  }

  function renderScriptCard(s: Script, i: number, showDate = false) {
    const isEditing = editingId === s.id;

    return (
      <Card glowing={!showDate} key={s.id}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {showDate ? (
              <>
                <FileText className="w-4 h-4 text-brand-primary-light" />
                <span className="text-xs themed-text-muted">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
              </>
            ) : (
              <Badge variant="primary">#{i + 1}</Badge>
            )}
            {s.isUsed && <Badge variant="success">Usado</Badge>}
          </div>
          <div className="flex gap-1">
            {!isEditing && (
              <>
                <button
                  onClick={() => startEditing(s)}
                  className="p-1.5 rounded-lg themed-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyScript(s)}
                  className="p-1.5 rounded-lg themed-text-secondary hover:themed-text hover:bg-white/5 transition-colors"
                  title="Copiar"
                >
                  {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                {!s.isUsed && (
                  <button
                    onClick={() => markUsed(s.id)}
                    className="p-1.5 rounded-lg themed-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Marcar como usado"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-amber-400 mb-1 block">Gancho</label>
              <textarea
                className="w-full bg-black/30 themed-border border rounded-lg px-3 py-2 text-sm themed-text resize-none focus:border-brand-primary outline-none"
                rows={2}
                value={editForm.hook}
                onChange={(e) => setEditForm((f) => ({ ...f, hook: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-brand-primary-light mb-1 block">Corpo</label>
              <textarea
                className="w-full bg-black/30 themed-border border rounded-lg px-3 py-2 text-sm themed-text resize-none focus:border-brand-primary outline-none"
                rows={3}
                value={editForm.body}
                onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-emerald-400 mb-1 block">CTA</label>
              <textarea
                className="w-full bg-black/30 themed-border border rounded-lg px-3 py-2 text-sm themed-text resize-none focus:border-brand-primary outline-none"
                rows={2}
                value={editForm.cta}
                onChange={(e) => setEditForm((f) => ({ ...f, cta: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveEdit(s.id)}
                loading={saving}
                icon={<Save className="w-4 h-4" />}
                className="flex-1"
              >
                Salvar
              </Button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 rounded-xl themed-border border themed-text-secondary text-sm hover:themed-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p><span className="text-amber-400 font-semibold">Gancho:</span> <span className="text-gray-300">{s.hook}</span></p>
            <p><span className="text-brand-primary-light font-semibold">Corpo:</span> <span className="text-gray-300">{s.body}</span></p>
            <p><span className="text-emerald-400 font-semibold">CTA:</span> <span className="text-gray-300">{s.cta}</span></p>
          </div>
        )}
      </Card>
    );
  }

  return (
    <PageContainer title="Studio IA">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 themed-surface-card rounded-xl p-1 themed-border">
          {[
            { key: 'generate' as Tab, label: 'Gerar Roteiros', icon: Sparkles },
            { key: 'library' as Tab, label: `Biblioteca${library.length ? ` (${library.length})` : ''}`, icon: BookOpen },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); if (t.key === 'library') fetchLibrary(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-brand-primary/15 text-brand-primary-light' : 'themed-text-secondary hover:themed-text'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'generate' ? (
          <div className="space-y-4">
            {/* Brand selector */}
            <Card>
              <label className="text-sm font-semibold themed-text-secondary flex items-center gap-1 mb-3">
                <Tag className="w-3 h-3" /> Selecione a Marca
              </label>
              {loading ? <SkeletonCard /> : myBrands.length === 0 ? (
                <p className="text-sm themed-text-muted">Conecte-se a uma marca primeiro.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {myBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBrand(b)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-colors ${
                        selectedBrand?.id === b.id
                          ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light font-semibold'
                          : 'themed-surface-light themed-border themed-text-secondary'
                      }`}
                    >
                      {b.logoUrl && (
                        <img src={b.logoUrl} alt={b.name} className="w-5 h-5 rounded-full object-cover" />
                      )}
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Button onClick={handleGenerate} loading={generating} icon={<Wand2 className="w-5 h-5" />} className="w-full" disabled={!selectedBrand}>
              Gerar 18 Roteiros
            </Button>

            {/* Generated scripts */}
            {scripts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold themed-text-secondary">Roteiros Gerados ({scripts.length})</h3>
                {scripts.map((s, i) => renderScriptCard(s, i))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {library.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 themed-text-muted" />
                </div>
                <p className="text-lg font-bold themed-text mb-1">Nenhum roteiro salvo</p>
                <p className="text-sm themed-text-secondary mb-4">Gere roteiros na aba anterior e eles aparecerao aqui.</p>
                <Button variant="outline" onClick={() => setTab('generate')}>Gerar Roteiros</Button>
              </div>
            ) : (
              library.map((s, i) => renderScriptCard(s, i, true))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
