import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  Plus,
  Minus,
  Star,
  Clock,
  X,
} from 'lucide-react';
import { brandsApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Brand {
  id: string; name: string; category: string; description: string;
  logoUrl?: string; isConnected?: boolean;
  briefingTitle?: string; briefingDescription?: string; tone?: string;
  doList?: string[]; dontList?: string[];
  technicalRequirements?: string; exampleUrls?: string[];
}

interface Application {
  id: string;
  brandId: string;
  status: 'pending' | 'approved' | 'rejected';
  matchScore: number | null;
  rejectionReason: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  beauty: '#EC4899', supplements: '#10B981', home: '#F59E0B',
  tech: '#3B82F6', fashion: '#A78BFA', food: '#EF4444',
};

const CATEGORIES = ['all', 'beauty', 'supplements', 'home', 'tech', 'fashion', 'food'];
const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todas', beauty: 'Beleza', supplements: 'Suplementos', home: 'Casa',
  tech: 'Tech', fashion: 'Moda', food: 'Food',
};

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyingFor, setApplyingFor] = useState<Brand | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catalogRes, mineRes, appsRes] = await Promise.all([
        brandsApi.list(category === 'all' ? undefined : category) as Promise<{ brands: Brand[] }>,
        brandsApi.my() as Promise<{ brands: Brand[] }>,
        brandsApi.myApplications() as Promise<{ applications: Application[] }>,
      ]);
      const catalog = catalogRes.brands ?? [];
      const mineRaw = mineRes.brands ?? [];
      const mine = mineRaw.map((b: any) => b.brand ?? b);
      const myIds = new Set(mine.map((b: Brand) => b.id));
      setBrands(catalog.map((b) => ({ ...b, isConnected: myIds.has(b.id) })));
      setMyBrands(mine);
      setApplications(appsRes.applications ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function applicationFor(brandId: string): Application | undefined {
    return applications.find(
      (a) => a.brandId === brandId && (a.status === 'pending' || a.status === 'rejected'),
    );
  }

  async function disconnectBrand(brand: Brand) {
    if (!confirm(`Desvincular-se de ${brand.name}?`)) return;
    try {
      await brandsApi.disconnect(brand.id);
      fetchData();
    } catch (err: any) { alert(err.message ?? 'Erro.'); }
  }

  const filtered = brands.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueConnected = new Set(myBrands.map((b) => b.id)).size;

  if (loading) return <PageContainer title="Marcas"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Marcas">
      <div className="space-y-6">
        {/* Connected brands count */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-brand-primary-light" />
          </div>
          <div>
            <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide">Conectadas</p>
            <p className="text-xl font-bold themed-text">{uniqueConnected}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 themed-surface rounded-xl themed-border px-4 py-2.5">
          <Search className="w-4 h-4 themed-text-muted" />
          <input
            className="flex-1 bg-transparent themed-text placeholder-gray-500 outline-none text-sm"
            placeholder="Buscar marcas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setLoading(true); }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                category === c
                  ? 'bg-brand-primary/15 border-brand-primary text-brand-primary-light'
                  : 'themed-border themed-text-secondary hover:border-gray-600'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((brand) => {
            const catColor = CATEGORY_COLORS[brand.category] ?? '#7C3AED';
            const isExpanded = expandedId === brand.id;
            const app = applicationFor(brand.id);
            return (
              <Card glowing key={brand.id} className={isExpanded ? 'sm:col-span-2' : ''}>
                <div
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : brand.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: `${catColor}15` }}>
                        {brand.logoUrl ? (
                          <img
                            src={brand.logoUrl}
                            alt={`${brand.name} logo`}
                            className="w-10 h-10 object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const icon = img.nextElementSibling as HTMLElement | null;
                              if (icon) icon.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <Star
                          className="w-5 h-5"
                          style={{ color: catColor, display: brand.logoUrl ? 'none' : 'block' }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold themed-text">{brand.name}</p>
                        <Badge>{brand.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {brand.isConnected ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); disconnectBrand(brand); }}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Desvincular"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      ) : app?.status === 'pending' ? (
                        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Em análise
                        </div>
                      ) : app?.status === 'rejected' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setApplyingFor(brand); }}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20"
                          title="Candidatar novamente"
                        >
                          Recusada — tentar novamente
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setApplyingFor(brand); }}
                          className="p-2 rounded-lg themed-surface-light themed-text-secondary hover:themed-text transition-colors"
                          title="Candidatar-se"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs themed-text-muted line-clamp-2">{brand.description}</p>
                  {app?.status === 'rejected' && app.rejectionReason && (
                    <p className="text-xs text-red-400 mt-2 italic">
                      Motivo: {app.rejectionReason}
                    </p>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t themed-border space-y-3">
                    {brand.briefingDescription && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">Briefing</p>
                        <p className="text-sm themed-text-secondary">{brand.briefingDescription}</p>
                      </div>
                    )}
                    {brand.tone && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">Tom de voz</p>
                        <p className="text-sm themed-text-secondary">{brand.tone}</p>
                      </div>
                    )}
                    {brand.doList && brand.doList.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">O que fazer</p>
                        <ul className="text-sm themed-text-secondary space-y-1">
                          {brand.doList.map((item, i) => (
                            <li key={i} className="flex items-start gap-2"><CheckCircle className="w-3 h-3 text-emerald-400 mt-1 shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {brand.dontList && brand.dontList.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">O que nao fazer</p>
                        <ul className="text-sm themed-text-secondary space-y-1">
                          {brand.dontList.map((item, i) => (
                            <li key={i} className="flex items-start gap-2"><Minus className="w-3 h-3 text-red-400 mt-1 shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {brand.technicalRequirements && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">Requisitos tecnicos</p>
                        <p className="text-sm themed-text-secondary whitespace-pre-line">{brand.technicalRequirements}</p>
                      </div>
                    )}
                    {brand.exampleUrls && brand.exampleUrls.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1">Videos de referencia</p>
                        <div className="space-y-1">
                          {brand.exampleUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary-light hover:underline block truncate">
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {!brand.briefingDescription && !brand.tone && !brand.doList?.length && (
                      <p className="text-sm themed-text-muted italic">Nenhum briefing cadastrado para esta marca.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {applyingFor && (
        <ApplyModal
          brand={applyingFor}
          onClose={() => setApplyingFor(null)}
          onDone={() => { setApplyingFor(null); fetchData(); }}
        />
      )}
    </PageContainer>
  );
}

interface ApplyModalProps {
  brand: Brand;
  onClose: () => void;
  onDone: () => void;
}

function ApplyModal({ brand, onClose, onDone }: ApplyModalProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | ''>('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!fullName || !age || !email || !gender) {
      setError('Preencha nome, idade, email e sexo.');
      return;
    }
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 99) {
      setError('Idade inválida.');
      return;
    }
    if (!instagramHandle && !tiktokHandle) {
      setError('Informe pelo menos um @Instagram ou @TikTok.');
      return;
    }
    setSubmitting(true);
    try {
      await brandsApi.apply(brand.id, {
        fullName: fullName.trim(),
        age: ageNum,
        email: email.trim(),
        gender,
        instagramHandle: instagramHandle.trim() || undefined,
        tiktokHandle: tiktokHandle.trim() || undefined,
      });
      onDone();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao enviar candidatura.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="themed-surface rounded-2xl themed-border w-full max-w-md p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide">
              Candidatar-se para
            </p>
            <h2 className="text-lg font-bold themed-text">{brand.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg themed-text-muted hover:themed-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm themed-text-muted mb-5">
          A marca vai avaliar seu perfil com base nessas informações. Nossa IA também gera um
          score de compatibilidade pra acelerar a análise.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
              Nome completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
              placeholder="Seu nome"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
                Idade *
              </label>
              <input
                type="number"
                min={13}
                max={99}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
                placeholder="25"
              />
            </div>
            <div>
              <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
                Sexo *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
              >
                <option value="">Selecione…</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
              @ Instagram
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
              placeholder="seu.perfil"
            />
          </div>

          <div>
            <label className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-1 block">
              @ TikTok
            </label>
            <input
              type="text"
              value={tiktokHandle}
              onChange={(e) => setTiktokHandle(e.target.value)}
              className="w-full themed-surface-light themed-border rounded-lg px-3 py-2 text-sm themed-text outline-none focus:border-brand-primary"
              placeholder="seu.perfil"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Enviando…' : 'Enviar candidatura'}
          </button>
        </form>
      </div>
    </div>
  );
}
