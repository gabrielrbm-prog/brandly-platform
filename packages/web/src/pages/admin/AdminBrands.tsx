import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Users,
  Video,
  X,
  Globe,
  Mail,
} from 'lucide-react';
import { adminApi, type AdminBrand } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 20;

const CATEGORY_COLORS: Record<string, string> = {
  beauty: '#F472B6',
  supplements: '#10B981',
  home: '#F59E0B',
  tech: '#3B82F6',
  fashion: '#A78BFA',
  food: '#EF4444',
  fitness: '#F97316',
  health: '#14B8A6',
  wellness: '#06B6D4',
  education: '#8B5CF6',
  finance: '#6366F1',
  lifestyle: '#EC4899',
  pets: '#84CC16',
  kids: '#FB923C',
  automotive: '#64748B',
  travel: '#0EA5E9',
  other: '#7C3AED',
  default: '#7C3AED',
};

const CATEGORY_LABELS: Record<string, string> = {
  beauty: 'Beleza',
  supplements: 'Suplementos',
  home: 'Casa',
  tech: 'Tecnologia',
  fashion: 'Moda',
  food: 'Alimentacao',
  fitness: 'Fitness',
  health: 'Saude',
  wellness: 'Bem-estar',
  education: 'Educacao',
  finance: 'Financas',
  lifestyle: 'Lifestyle',
  pets: 'Pets',
  kids: 'Infantil',
  automotive: 'Automotivo',
  travel: 'Viagens',
  other: 'Outro',
};

const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'energetic', label: 'Energetico' },
  { value: 'educational', label: 'Educativo' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

// ─── Brand Modal ──────────────────────────────────────────────────────────────

interface BrandFormData {
  name: string;
  category: string;
  description: string;
  website: string;
  contactEmail: string;
  minVideosPerMonth: string;
  maxCreators: string;
}

const EMPTY_FORM: BrandFormData = {
  name: '',
  category: 'beauty',
  description: '',
  website: '',
  contactEmail: '',
  minVideosPerMonth: '',
  maxCreators: '',
};

interface BrandModalProps {
  brand?: AdminBrand | null;
  onClose: () => void;
  onSaved: () => void;
}

function BrandModal({ brand, onClose, onSaved }: BrandModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandFormData>(() =>
    brand
      ? {
          name: brand.name,
          category: brand.category,
          description: brand.description ?? '',
          website: brand.website ?? '',
          contactEmail: brand.contactEmail ?? '',
          minVideosPerMonth: brand.minVideosPerMonth?.toString() ?? '',
          maxCreators: brand.maxCreators?.toString() ?? '',
        }
      : EMPTY_FORM,
  );

  function handleChange(field: keyof BrandFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome da marca e obrigatorio.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      website: form.website.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      minVideosPerMonth: form.minVideosPerMonth ? parseInt(form.minVideosPerMonth, 10) : undefined,
      maxCreators: form.maxCreators ? parseInt(form.maxCreators, 10) : undefined,
    };

    setSaving(true);
    try {
      if (brand) {
        await adminApi.updateBrand(brand.id, payload);
        toast.success('Marca atualizada com sucesso.');
      } else {
        await adminApi.createBrand(payload);
        toast.success('Marca criada com sucesso.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar marca.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {brand ? 'Editar Marca' : 'Nova Marca'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="themed-text-muted hover:themed-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Nome da Marca"
            placeholder="Ex: Yav Health"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva brevemente a marca e o tipo de conteudo esperado..."
              rows={3}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Website"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              icon={<Globe className="w-4 h-4" />}
            />
            <Input
              label="Email de Contato"
              placeholder="contato@marca.com"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Videos minimos/mes"
              placeholder="Ex: 10"
              value={form.minVideosPerMonth}
              onChange={(e) => handleChange('minVideosPerMonth', e.target.value)}
              type="number"
            />
            <Input
              label="Max creators"
              placeholder="Ex: 50"
              value={form.maxCreators}
              onChange={(e) => handleChange('maxCreators', e.target.value)}
              type="number"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {brand ? 'Salvar Alteracoes' : 'Criar Marca'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

interface BrandCardProps {
  brand: AdminBrand;
  onToggleStatus: (brand: AdminBrand) => void;
  onEdit: (brand: AdminBrand) => void;
  onClick: (brand: AdminBrand) => void;
}

function BrandCard({ brand, onToggleStatus, onEdit, onClick }: BrandCardProps) {
  const categoryColor = getCategoryColor(brand.category);
  const categoryLabel = getCategoryLabel(brand.category);
  const initial = brand.name.charAt(0).toUpperCase();
  const isActive = brand.isActive ?? brand.status === 'active';

  return (
    <div
      className="relative rounded-2xl border themed-border bg-white/5 backdrop-blur-sm p-5 cursor-pointer hover:border-brand-primary/30 transition-all hover:bg-white/8 group"
      onClick={() => onClick(brand)}
    >
      {/* Status indicator */}
      <div
        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`}
        title={isActive ? 'Ativa' : 'Inativa'}
      />

      {/* Brand header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
          style={{ backgroundColor: `${categoryColor}25`, border: `1px solid ${categoryColor}40`, color: categoryColor }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold themed-text truncate">{brand.name}</h3>
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
          >
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      {brand.description && (
        <p className="text-xs themed-text-muted mb-4 line-clamp-2 leading-relaxed">
          {brand.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 themed-text-muted" />
          <span className="text-xs themed-text-secondary">
            <span className="font-bold themed-text">{brand.activeCreators ?? brand.activeCreatorsCount ?? 0}</span> creators
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 themed-text-muted" />
          <span className="text-xs themed-text-secondary">
            <span className="font-bold themed-text">{brand.videosThisMonth ?? 0}</span> videos/mes
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleStatus(brand)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isActive
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title={isActive ? 'Desativar marca' : 'Ativar marca'}
        >
          {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {isActive ? 'Desativar' : 'Ativar'}
        </button>
        <button
          onClick={() => onEdit(brand)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text transition-colors"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type StatusFilter = '' | 'active' | 'inactive';

export default function AdminBrands() {
  const navigate = useNavigate();
  const toast = useToast();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrand | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.brandsList(
        page,
        search || undefined,
        statusFilter || undefined,
      );
      setBrands(res.brands ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar marcas.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  async function handleToggleStatus(brand: AdminBrand) {
    try {
      await adminApi.toggleBrandStatus(brand.id);
      toast.success(
        (brand.isActive ?? brand.status === 'active') ? 'Marca desativada.' : 'Marca ativada.',
      );
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status da marca.');
    }
  }

  function handleOpenCreate() {
    setEditingBrand(null);
    setShowModal(true);
  }

  function handleOpenEdit(brand: AdminBrand) {
    setEditingBrand(brand);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingBrand(null);
  }

  function handleModalSaved() {
    setShowModal(false);
    setEditingBrand(null);
    fetchBrands();
  }

  const totalPages = Math.ceil(total / LIMIT);

  const STATUS_PILLS: { label: string; value: StatusFilter }[] = [
    { label: 'Todas', value: '' },
    { label: 'Ativas', value: 'active' },
    { label: 'Inativas', value: 'inactive' },
  ];

  return (
    <PageContainer title="Admin — Marcas">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 themed-text-secondary" />
            <h2 className="text-lg font-bold themed-text">Marcas Parceiras</h2>
            <Badge variant="primary">{total}</Badge>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Nova Marca
          </Button>
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Buscar por nome..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              Buscar
            </Button>
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2">
            {STATUS_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => handleStatusFilter(pill.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  statusFilter === pill.value
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                    : 'bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : brands.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 themed-text-muted mx-auto mb-3" />
              <p className="themed-text-secondary">Nenhuma marca encontrada</p>
              {search && (
                <p className="text-xs themed-text-muted mt-1">
                  Tente uma busca diferente ou remova os filtros
                </p>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onToggleStatus={handleToggleStatus}
                onEdit={handleOpenEdit}
                onClick={(b) => navigate(`/admin/brands/${b.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
            <span className="text-sm themed-text-secondary">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Proxima
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <BrandModal
          brand={editingBrand}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}
    </PageContainer>
  );
}
