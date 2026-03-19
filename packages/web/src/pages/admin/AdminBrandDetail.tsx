import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  Package,
  BarChart3,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  adminApi,
  type AdminBrand,
  type AdminBrandCreator,
  type AdminBriefing,
  type AdminProduct,
  type AdminBrandStats,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  health: '#10B981',
  tech: '#3B82F6',
  beauty: '#F472B6',
  fitness: '#F59E0B',
  food: '#EF4444',
  fashion: '#A78BFA',
  default: '#7C3AED',
};

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Saude',
  tech: 'Tecnologia',
  beauty: 'Beleza',
  fitness: 'Fitness',
  food: 'Alimentacao',
  fashion: 'Moda',
  education: 'Educacao',
  finance: 'Financas',
  entertainment: 'Entretenimento',
  lifestyle: 'Lifestyle',
};

const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Profissional' },
  { value: 'energetic', label: 'Energetico' },
  { value: 'educational', label: 'Educativo' },
];

type TabId = 'creators' | 'briefings' | 'products' | 'stats';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── Edit Brand Modal ─────────────────────────────────────────────────────────

interface BrandFormData {
  name: string;
  category: string;
  description: string;
  website: string;
  contactEmail: string;
  minVideosPerMonth: string;
  maxCreators: string;
}

interface EditBrandModalProps {
  brand: AdminBrand;
  onClose: () => void;
  onSaved: (updated: AdminBrand) => void;
}

function EditBrandModal({ brand, onClose, onSaved }: EditBrandModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandFormData>({
    name: brand.name,
    category: brand.category,
    description: brand.description ?? '',
    website: brand.website ?? '',
    contactEmail: brand.contactEmail ?? '',
    minVideosPerMonth: brand.minVideosPerMonth?.toString() ?? '',
    maxCreators: brand.maxCreators?.toString() ?? '',
  });

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
      const res = await adminApi.updateBrand(brand.id, payload);
      toast.success('Marca atualizada.');
      onSaved(res.brand);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao atualizar marca.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">Editar Marca</h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Nome da Marca"
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
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
            />
            <Input
              label="Email de Contato"
              value={form.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Videos minimos/mes"
              value={form.minVideosPerMonth}
              onChange={(e) => handleChange('minVideosPerMonth', e.target.value)}
              type="number"
            />
            <Input
              label="Max creators"
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
              Salvar Alteracoes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Briefing Modal ───────────────────────────────────────────────────────────

interface BriefingFormData {
  title: string;
  description: string;
  doList: string;
  dontList: string;
  technicalRequirements: string;
  tone: string;
}

const EMPTY_BRIEFING: BriefingFormData = {
  title: '',
  description: '',
  doList: '',
  dontList: '',
  technicalRequirements: '',
  tone: 'casual',
};

interface BriefingModalProps {
  brandId: string;
  briefing?: AdminBriefing | null;
  onClose: () => void;
  onSaved: () => void;
}

function BriefingModal({ brandId, briefing, onClose, onSaved }: BriefingModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BriefingFormData>(() =>
    briefing
      ? {
          title: briefing.title,
          description: briefing.description,
          doList: (briefing.doList ?? []).join(', '),
          dontList: (briefing.dontList ?? []).join(', '),
          technicalRequirements: briefing.technicalRequirements ?? '',
          tone: briefing.tone ?? 'casual',
        }
      : EMPTY_BRIEFING,
  );

  function handleChange(field: keyof BriefingFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Titulo do briefing e obrigatorio.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      doList: form.doList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      dontList: form.dontList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      technicalRequirements: form.technicalRequirements.trim() || undefined,
      tone: form.tone,
    };
    setSaving(true);
    try {
      if (briefing) {
        await adminApi.updateBriefing(briefing.id, payload);
        toast.success('Briefing atualizado.');
      } else {
        await adminApi.createBriefing(brandId, payload);
        toast.success('Briefing criado.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar briefing.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {briefing ? 'Editar Briefing' : 'Novo Briefing'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Titulo"
            placeholder="Ex: Briefing Videos UGC — Produto X"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o que o creator precisa mostrar no video..."
              rows={3}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">
              Do List{' '}
              <span className="text-xs themed-text-muted font-normal">(separar por virgula)</span>
            </label>
            <textarea
              value={form.doList}
              onChange={(e) => handleChange('doList', e.target.value)}
              placeholder="Ex: Mostrar produto em uso, Falar dos beneficios, CTA no final"
              rows={2}
              className="w-full rounded-xl border themed-border bg-emerald-500/5 border-emerald-500/20 px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-emerald-500/40 transition-colors resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">
              Dont List{' '}
              <span className="text-xs themed-text-muted font-normal">(separar por virgula)</span>
            </label>
            <textarea
              value={form.dontList}
              onChange={(e) => handleChange('dontList', e.target.value)}
              placeholder="Ex: Mencionar concorrentes, Usar musica com direitos, Conteudo enganoso"
              rows={2}
              className="w-full rounded-xl border themed-border bg-red-500/5 border-red-500/20 px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-red-500/40 transition-colors resize-none"
            />
          </div>
          <Input
            label="Requisitos Tecnicos"
            placeholder="Ex: Video vertical 9:16, minimo 30s, sem filtros"
            value={form.technicalRequirements}
            onChange={(e) => handleChange('technicalRequirements', e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Tom do Conteudo</label>
            <select
              value={form.tone}
              onChange={(e) => handleChange('tone', e.target.value)}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {briefing ? 'Salvar' : 'Criar Briefing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

interface ProductFormData {
  name: string;
  description: string;
  type: 'digital' | 'physical';
  price: string;
  commissionPercent: string;
}

const EMPTY_PRODUCT: ProductFormData = {
  name: '',
  description: '',
  type: 'physical',
  price: '',
  commissionPercent: '',
};

interface ProductModalProps {
  brandId: string;
  product?: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ brandId, product, onClose, onSaved }: ProductModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormData>(() =>
    product
      ? {
          name: product.name,
          description: product.description ?? '',
          type: product.type,
          price: product.price.toString(),
          commissionPercent: product.commissionPercent.toString(),
        }
      : EMPTY_PRODUCT,
  );

  function handleChange(field: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome do produto e obrigatorio.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      price: parseFloat(form.price) || 0,
      commissionPercent: parseFloat(form.commissionPercent) || 0,
    };
    setSaving(true);
    try {
      if (product) {
        await adminApi.updateProduct(product.id, payload);
        toast.success('Produto atualizado.');
      } else {
        await adminApi.createProduct(brandId, payload);
        toast.success('Produto criado.');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="themed-surface-card border themed-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b themed-border">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-primary-light" />
            <h3 className="text-base font-bold themed-text">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h3>
          </div>
          <button onClick={onClose} className="themed-text-muted hover:themed-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Nome do Produto"
            placeholder="Ex: Suplemento Whey Gold"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descricao breve do produto..."
              rows={2}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Type radio */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium themed-text-secondary">Tipo</label>
            <div className="flex gap-3">
              {(['physical', 'digital'] as const).map((t) => (
                <label
                  key={t}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                    form.type === t
                      ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary-light'
                      : 'themed-border themed-surface themed-text-secondary hover:themed-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => handleChange('type', t)}
                    className="sr-only"
                  />
                  {t === 'physical' ? 'Fisico' : 'Digital'}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preco (R$)"
              placeholder="Ex: 97.90"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              type="number"
            />
            <Input
              label="Comissao (%)"
              placeholder="Ex: 20"
              value={form.commissionPercent}
              onChange={(e) => handleChange('commissionPercent', e.target.value)}
              type="number"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={saving} className="flex-1">
              {product ? 'Salvar' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Creators Tab ─────────────────────────────────────────────────────────────

function CreatorsTab({ creators }: { creators: AdminBrandCreator[] }) {
  const navigate = useNavigate();

  if (creators.length === 0) {
    return (
      <Card>
        <div className="text-center py-10">
          <Users className="w-9 h-9 themed-text-muted mx-auto mb-3" />
          <p className="themed-text-secondary text-sm">Nenhum creator conectado a esta marca</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table header — desktop only */}
      <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-2">
        <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Creator</span>
        <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Email</span>
        <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Videos</span>
        <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Taxa Aprov.</span>
        <span />
      </div>
      {creators.map((c) => (
        <div
          key={c.id}
          onClick={() => navigate(`/admin/creators/${c.id}`)}
          className="rounded-2xl border themed-border themed-surface p-4 cursor-pointer hover:border-brand-primary/30 transition-all"
        >
          {/* Mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-9 h-9 rounded-full bg-brand-primary/15 flex items-center justify-center text-sm font-bold text-brand-primary-light shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold themed-text truncate">{c.name}</p>
              <p className="text-xs themed-text-muted">{c.videosCount} videos &bull; {c.approvalRate}% aprov.</p>
            </div>
            <ChevronRight className="w-4 h-4 themed-text-muted" />
          </div>
          {/* Desktop */}
          <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-sm font-bold text-brand-primary-light shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium themed-text truncate">{c.name}</span>
            </div>
            <span className="text-sm themed-text-secondary truncate">{c.email}</span>
            <span className="text-sm font-semibold themed-text">{c.videosCount}</span>
            <div>
              <span
                className={`text-sm font-semibold ${
                  c.approvalRate >= 80
                    ? 'text-emerald-400'
                    : c.approvalRate >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {c.approvalRate}%
              </span>
            </div>
            <ChevronRight className="w-4 h-4 themed-text-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Briefings Tab ────────────────────────────────────────────────────────────

interface BriefingsTabProps {
  brandId: string;
  briefings: AdminBriefing[];
  onRefresh: () => void;
}

function BriefingsTab({ brandId, briefings, onRefresh }: BriefingsTabProps) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<AdminBriefing | null>(null);

  async function handleToggleBriefing(b: AdminBriefing) {
    try {
      await adminApi.updateBriefing(b.id, { isActive: !b.isActive });
      toast.success(b.isActive ? 'Briefing desativado.' : 'Briefing ativado.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status do briefing.');
    }
  }

  const TONE_LABELS: Record<string, string> = {
    casual: 'Casual',
    professional: 'Profissional',
    energetic: 'Energetico',
    educational: 'Educativo',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingBriefing(null); setShowModal(true); }}
        >
          Novo Briefing
        </Button>
      </div>

      {briefings.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <FileText className="w-9 h-9 themed-text-muted mx-auto mb-3" />
            <p className="themed-text-secondary text-sm">Nenhum briefing cadastrado</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border themed-border bg-white/5 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold themed-text text-sm leading-snug">{b.title}</h4>
                <Badge variant={b.isActive ? 'success' : 'default'}>
                  {b.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <p className="text-xs themed-text-muted line-clamp-2 leading-relaxed">
                {b.description}
              </p>

              {b.tone && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs themed-text-muted">Tom:</span>
                  <span className="text-xs font-medium text-brand-primary-light">
                    {TONE_LABELS[b.tone] ?? b.tone}
                  </span>
                </div>
              )}

              {b.doList && b.doList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Do
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.doList.slice(0, 3).map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        {item}
                      </span>
                    ))}
                    {b.doList.length > 3 && (
                      <span className="text-xs themed-text-muted">+{b.doList.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              {b.dontList && b.dontList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                    Dont
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.dontList.slice(0, 3).map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                      >
                        {item}
                      </span>
                    ))}
                    {b.dontList.length > 3 && (
                      <span className="text-xs themed-text-muted">+{b.dontList.length - 3}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleBriefing(b)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    b.isActive
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {b.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {b.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => { setEditingBriefing(b); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BriefingModal
          brandId={brandId}
          briefing={editingBriefing}
          onClose={() => { setShowModal(false); setEditingBriefing(null); }}
          onSaved={() => { setShowModal(false); setEditingBriefing(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

interface ProductsTabProps {
  brandId: string;
  products: AdminProduct[];
  onRefresh: () => void;
}

function ProductsTab({ brandId, products, onRefresh }: ProductsTabProps) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  async function handleToggleProduct(p: AdminProduct) {
    try {
      await adminApi.updateProduct(p.id, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Produto desativado.' : 'Produto ativado.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status do produto.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
        >
          Novo Produto
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Package className="w-9 h-9 themed-text-muted mx-auto mb-3" />
            <p className="themed-text-secondary text-sm">Nenhum produto cadastrado</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2">
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Nome</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Tipo</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Preco</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Comissao</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Status</span>
            <span />
          </div>

          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border themed-border themed-surface p-4"
            >
              {/* Mobile */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-brand-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold themed-text truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={p.type === 'digital' ? 'primary' : 'default'}>
                      {p.type === 'digital' ? 'Digital' : 'Fisico'}
                    </Badge>
                    <span className="text-xs themed-text-muted">{formatCurrency(p.price)} &bull; {p.commissionPercent}%</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProduct(p)}
                  className={p.isActive ? 'text-emerald-400' : 'text-gray-500'}
                >
                  {p.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </button>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                <span className="font-medium themed-text truncate">{p.name}</span>
                <div>
                  <Badge variant={p.type === 'digital' ? 'primary' : 'default'}>
                    {p.type === 'digital' ? 'Digital' : 'Fisico'}
                  </Badge>
                </div>
                <span className="text-sm themed-text">{formatCurrency(p.price)}</span>
                <span className="text-sm font-semibold text-brand-primary-light">{p.commissionPercent}%</span>
                <div>
                  <Badge variant={p.isActive ? 'success' : 'default'}>
                    {p.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleProduct(p)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      p.isActive
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                    title={p.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingProduct(p); setShowModal(true); }}
                    className="p-1.5 rounded-lg themed-text-muted hover:themed-text hover:bg-white/5 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal
          brandId={brandId}
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSaved={() => { setShowModal(false); setEditingProduct(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: AdminBrandStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Videos"
        value={String(stats.totalVideos)}
        icon={<BarChart3 className="w-5 h-5" />}
      />
      <StatCard
        label="Aprovados"
        value={String(stats.approvedVideos)}
        icon={<CheckCircle className="w-5 h-5" />}
        color="#10B981"
      />
      <StatCard
        label="Rejeitados"
        value={String(stats.rejectedVideos)}
        icon={<XCircle className="w-5 h-5" />}
        color="#EF4444"
      />
      <StatCard
        label="Taxa Aprovacao"
        value={`${stats.approvalRate}%`}
        icon={<Clock className="w-5 h-5" />}
        color={stats.approvalRate >= 80 ? '#10B981' : stats.approvalRate >= 50 ? '#F59E0B' : '#EF4444'}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBrandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [brand, setBrand] = useState<AdminBrand | null>(null);
  const [creators, setCreators] = useState<AdminBrandCreator[]>([]);
  const [briefings, setBriefings] = useState<AdminBriefing[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [stats, setStats] = useState<AdminBrandStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabId>('creators');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await adminApi.brandDetail(id);
      setBrand(res.brand ?? null);
      setCreators(res.creators ?? []);
      setBriefings(res.briefings ?? []);
      setProducts(res.products ?? []);
      setStats(res.stats ?? null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar dados da marca.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleToggleStatus() {
    if (!brand) return;
    try {
      const res = await adminApi.toggleBrandStatus(brand.id);
      setBrand(res.brand);
      toast.success((brand.isActive ?? brand.status === 'active') ? 'Marca desativada.' : 'Marca ativada.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao alterar status.');
    }
  }

  if (loading) {
    return (
      <PageContainer title="Admin — Marca">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  if (!brand) {
    return (
      <PageContainer title="Admin — Marca">
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 themed-text-muted mx-auto mb-3" />
            <p className="themed-text-secondary">Marca nao encontrada</p>
            <Button variant="ghost" onClick={() => navigate('/admin/brands')} className="mt-4">
              Voltar
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const categoryColor = getCategoryColor(brand.category);
  const categoryLabel = getCategoryLabel(brand.category);
  const brandIsActive = brand.isActive ?? brand.status === 'active';

  const TABS: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'creators', label: 'Creators', icon: <Users className="w-4 h-4" />, count: creators.length },
    { id: 'briefings', label: 'Briefings', icon: <FileText className="w-4 h-4" />, count: briefings.length },
    { id: 'products', label: 'Produtos', icon: <Package className="w-4 h-4" />, count: products.length },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <PageContainer title="Admin — Marca">
      <div className="space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/brands')}
          className="flex items-center gap-2 text-sm themed-text-muted hover:themed-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para marcas
        </button>

        {/* Brand header card */}
        <Card glowing>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                backgroundColor: `${categoryColor}20`,
                border: `1px solid ${categoryColor}35`,
                color: categoryColor,
              }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start flex-wrap gap-2">
                <h2 className="text-xl font-bold themed-text">{brand.name}</h2>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  {categoryLabel}
                </span>
                <Badge variant={brandIsActive ? 'success' : 'default'}>
                  {brandIsActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {brand.description && (
                <p className="text-sm themed-text-muted mt-2 leading-relaxed">{brand.description}</p>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap gap-4">
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs themed-text-muted hover:text-brand-primary-light transition-colors"
              >
                {brand.website}
              </a>
            )}
            {brand.contactEmail && (
              <span className="text-xs themed-text-muted">{brand.contactEmail}</span>
            )}
            {brand.minVideosPerMonth && (
              <span className="text-xs themed-text-muted">
                Min {brand.minVideosPerMonth} videos/mes
              </span>
            )}
            {brand.maxCreators && (
              <span className="text-xs themed-text-muted">
                Max {brand.maxCreators} creators
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t themed-border flex gap-2">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                brandIsActive
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              {brandIsActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {brandIsActive ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 themed-text-secondary hover:bg-white/10 hover:themed-text transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Marca
            </button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b themed-border overflow-x-auto pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary-light'
                  : 'border-transparent themed-text-muted hover:themed-text'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-brand-primary/20 text-brand-primary-light'
                      : 'bg-white/10 themed-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'creators' && <CreatorsTab creators={creators} />}
          {activeTab === 'briefings' && (
            <BriefingsTab
              brandId={brand.id}
              briefings={briefings}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab
              brandId={brand.id}
              products={products}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'stats' && stats && <StatsTab stats={stats} />}
        </div>
      </div>

      {/* Edit brand modal */}
      {showEditModal && (
        <EditBrandModal
          brand={brand}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setBrand(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </PageContainer>
  );
}
