import { useEffect, useState, useCallback } from 'react';
import {
  Wand2,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Tag,
  FileText,
} from 'lucide-react';
import { brandsApi, scriptsApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Brand { id: string; name: string; category: string; description: string }
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
      // Buscar briefing ativo da marca
      const brandDetail = (await brandsApi.detail(selectedBrand.id)) as { briefings: Array<{ id: string }> };
      const briefing = brandDetail.briefings?.[0];
      if (!briefing) {
        alert('Esta marca nao tem briefing ativo. Peca ao admin para criar um.');
        return;
      }
      const result = (await scriptsApi.generate({ briefingId: briefing.id })) as { scripts: Script[] };
      setScripts(result.scripts);
    } catch (err: any) {
      alert(err.message ?? 'Erro ao gerar roteiros.');
    } finally { setGenerating(false); }
  }

  function copyScript(script: Script) {
    navigator.clipboard.writeText(script.fullScript);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function markUsed(id: string) {
    try { await scriptsApi.markUsed(id); fetchLibrary(); } catch { /* silent */ }
  }

  return (
    <PageContainer title="Studio IA">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 themed-surface-card rounded-xl p-1 themed-border">
          {[
            { key: 'generate' as Tab, label: 'Gerar Roteiros', icon: Sparkles },
            { key: 'library' as Tab, label: 'Biblioteca', icon: BookOpen },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
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
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                        selectedBrand?.id === b.id
                          ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light font-semibold'
                          : 'themed-surface-light themed-border themed-text-secondary'
                      }`}
                    >
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
                {scripts.map((s, i) => (
                  <Card glowing key={s.id}>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="primary">#{i + 1}</Badge>
                      <button onClick={() => copyScript(s)} className="themed-text-secondary hover:themed-text transition-colors">
                        {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-amber-400 font-semibold">Gancho:</span> <span className="text-gray-300">{s.hook}</span></p>
                      <p><span className="text-brand-primary-light font-semibold">Corpo:</span> <span className="text-gray-300">{s.body}</span></p>
                      <p><span className="text-emerald-400 font-semibold">CTA:</span> <span className="text-gray-300">{s.cta}</span></p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {library.length === 0 ? (
              <p className="text-center themed-text-muted py-8">Nenhum roteiro salvo ainda. Gere roteiros primeiro.</p>
            ) : (
              library.map((s) => (
                <Card key={s.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-primary-light" />
                      <span className="text-xs themed-text-muted">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</span>
                      {s.isUsed && <Badge variant="success">Usado</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyScript(s)} className="p-1.5 rounded-lg themed-text-secondary hover:themed-text hover:bg-white/5">
                        {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {!s.isUsed && (
                        <button onClick={() => markUsed(s.id)} className="p-1.5 rounded-lg themed-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{s.hook}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
