import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  Plus,
  Minus,
  Star,
} from 'lucide-react';
import { brandsApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Brand {
  id: string; name: string; category: string; description: string;
  logoUrl?: string; isConnected?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [catalogRes, mineRes] = await Promise.all([
        brandsApi.list(category === 'all' ? undefined : category) as Promise<{ brands: Brand[] }>,
        brandsApi.my() as Promise<{ brands: Brand[] }>,
      ]);
      const catalog = catalogRes.brands ?? [];
      const mine = mineRes.brands ?? [];
      const myIds = new Set(mine.map((b) => b.id));
      setBrands(catalog.map((b) => ({ ...b, isConnected: myIds.has(b.id) })));
      setMyBrands(mine);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function toggleBrand(brand: Brand) {
    try {
      if (brand.isConnected) {
        await brandsApi.disconnect(brand.id);
      } else {
        await brandsApi.connect(brand.id);
      }
      fetchData();
    } catch (err: any) { alert(err.message ?? 'Erro.'); }
  }

  const filtered = brands.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <p className="text-xl font-bold themed-text">{myBrands.length}</p>
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
            return (
              <Card glowing key={brand.id}>
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
                  <button
                    onClick={() => toggleBrand(brand)}
                    className={`p-2 rounded-lg transition-colors ${
                      brand.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'themed-surface-light themed-text-secondary hover:themed-text'
                    }`}
                  >
                    {brand.isConnected ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs themed-text-muted line-clamp-2">{brand.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
