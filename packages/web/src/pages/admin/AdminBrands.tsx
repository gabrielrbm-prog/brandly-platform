import { useEffect, useState, useCallback, useRef } from 'react';
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
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Check,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

// ─── Logo Editor ──────────────────────────────────────────────────────────────

interface LogoEditorProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function LogoEditor({ imageSrc, onSave, onCancel }: LogoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropShape, setCropShape] = useState<'circle' | 'square'>('square');

  const CONTAINER = 360;
  const CROP = 320;

  function handleImageLoad() {
    setLoaded(true);
    // Center image — fill the crop area
    const el = imgRef.current;
    if (!el) return;
    const fitZoom = CROP / Math.min(el.naturalWidth, el.naturalHeight);
    setZoom(fitZoom);
    setPos({
      x: (CONTAINER - el.naturalWidth * fitZoom) / 2,
      y: (CONTAINER - el.naturalHeight * fitZoom) / 2,
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.05, Math.min(10, z + delta)));
  }

  function handleZoomSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const newZoom = parseFloat(e.target.value);
    // Zoom toward center
    const el = imgRef.current;
    if (el) {
      const cx = CONTAINER / 2;
      const cy = CONTAINER / 2;
      setPos((p) => ({
        x: cx - ((cx - p.x) / zoom) * newZoom,
        y: cy - ((cy - p.y) / zoom) * newZoom,
      }));
    }
    setZoom(newZoom);
  }

  function handleSave() {
    const el = imgRef.current;
    if (!el) return;

    const output = document.createElement('canvas');
    const outputSize = 512;
    output.width = outputSize;
    output.height = outputSize;
    const ctx = output.getContext('2d');
    if (!ctx) return;

    const ratio = outputSize / CROP;
    // Offset from crop area top-left
    const cropLeft = (CONTAINER - CROP) / 2;
    const cropTop = (CONTAINER - CROP) / 2;
    const imgX = (pos.x - cropLeft) * ratio;
    const imgY = (pos.y - cropTop) * ratio;
    const imgW = el.naturalWidth * zoom * ratio;
    const imgH = el.naturalHeight * zoom * ratio;

    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(el, imgX, imgY, imgW, imgH);
    onSave(output.toDataURL('image/png', 0.92));
  }

  // Slider range: min zoom = fit small side in crop, max = 5x that
  const el = imgRef.current;
  const minZoom = el ? CROP / Math.max(el.naturalWidth, el.naturalHeight) * 0.3 : 0.05;
  const maxZoom = el ? (CROP / Math.min(el.naturalWidth, el.naturalHeight)) * 5 : 10;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onCancel}>
      <div className="themed-surface-card border themed-border rounded-2xl p-5 shadow-2xl w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <h4 className="text-base font-bold themed-text">Recortar Logo</h4>
          <p className="text-xs themed-text-muted mt-1">Arraste a imagem e use o slider para ajustar o enquadramento</p>
        </div>

        {/* Crop area */}
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-black/40 border themed-border"
            style={{
              width: CONTAINER,
              height: CONTAINER,
              borderRadius: cropShape === 'circle' ? '50%' : 16,
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* The image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                left: pos.x,
                top: pos.y,
                width: el ? el.naturalWidth * zoom : 'auto',
                height: el ? el.naturalHeight * zoom : 'auto',
                maxWidth: 'none',
                display: loaded ? 'block' : 'none',
              }}
            />

            {/* Grid overlay */}
            {dragging && (
              <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 'inherit' }}>
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* Shape toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCropShape('square')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cropShape === 'square' ? 'bg-brand-primary text-white' : 'bg-white/5 themed-text-muted hover:themed-text'}`}
          >
            Quadrado
          </button>
          <button
            type="button"
            onClick={() => setCropShape('circle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cropShape === 'circle' ? 'bg-brand-primary text-white' : 'bg-white/5 themed-text-muted hover:themed-text'}`}
          >
            Circular
          </button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-2">
          <ZoomOut className="w-4 h-4 themed-text-muted shrink-0" />
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.001}
            value={zoom}
            onChange={handleZoomSlider}
            className="flex-1 h-1.5 accent-brand-primary cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 themed-text-muted shrink-0" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-2.5 rounded-xl border themed-border text-sm themed-text-secondary hover:themed-text transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-3 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Recortar
          </button>
        </div>
      </div>
    </div>
  );
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
  logoUrl: string;
}

const EMPTY_FORM: BrandFormData = {
  name: '',
  category: 'health',
  description: '',
  website: '',
  contactEmail: '',
  minVideosPerMonth: '',
  maxCreators: '',
  logoUrl: '',
};

interface BrandModalProps {
  brand?: AdminBrand | null;
  onClose: () => void;
  onSaved: () => void;
}

function BrandModal({ brand, onClose, onSaved }: BrandModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          logoUrl: brand.logoUrl ?? '',
        }
      : EMPTY_FORM,
  );

  function handleChange(field: keyof BrandFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const [rawLogoForEditor, setRawLogoForEditor] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error('Imagem muito grande. Limite de 2MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRawLogoForEditor(dataUrl);
      setShowLogoEditor(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome da marca e obrigatorio.');
      return;
    }

    // Mapear categorias do frontend para as aceitas pela API
    const categoryMap: Record<string, string> = {
      health: 'supplements',
      fitness: 'supplements',
      education: 'tech',
      finance: 'tech',
      entertainment: 'tech',
      lifestyle: 'beauty',
    };
    const apiCategory = categoryMap[form.category] || form.category;

    const fullPayload = {
      name: form.name.trim(),
      category: apiCategory,
      description: form.description.trim() || undefined,
      website: form.website.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      minVideosPerMonth: form.minVideosPerMonth ? parseInt(form.minVideosPerMonth, 10) : undefined,
      maxCreators: form.maxCreators ? parseInt(form.maxCreators, 10) : undefined,
      logoUrl: form.logoUrl || null,
    };

    setSaving(true);
    try {
      if (brand) {
        // Só envia campos que mudaram para evitar conflito 409
        const updatePayload: Record<string, unknown> = {};
        if (form.name.trim() !== brand.name) updatePayload.name = form.name.trim();
        if (apiCategory !== brand.category) updatePayload.category = apiCategory;
        const desc = form.description.trim() || undefined;
        if (desc !== (brand.description ?? undefined)) updatePayload.description = desc;
        const web = form.website.trim() || undefined;
        if (web !== (brand.website ?? undefined)) updatePayload.website = web;
        const email = form.contactEmail.trim() || undefined;
        if (email !== (brand.contactEmail ?? undefined)) updatePayload.contactEmail = email;
        const minV = form.minVideosPerMonth ? parseInt(form.minVideosPerMonth, 10) : undefined;
        if (minV !== brand.minVideosPerMonth) updatePayload.minVideosPerMonth = minV;
        const maxC = form.maxCreators ? parseInt(form.maxCreators, 10) : undefined;
        if (maxC !== brand.maxCreators) updatePayload.maxCreators = maxC;
        const logo = form.logoUrl || null;
        if (logo !== (brand.logoUrl ?? null)) updatePayload.logoUrl = logo;

        if (Object.keys(updatePayload).length === 0) {
          toast.info('Nenhuma alteracao detectada.');
          setSaving(false);
          return;
        }

        await adminApi.updateBrand(brand.id, updatePayload);
        toast.success('Marca atualizada com sucesso.');
      } else {
        await adminApi.createBrand(fullPayload);
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

          {/* Logo section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium themed-text-secondary">Logo da Marca</label>

            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="shrink-0 relative group">
                {form.logoUrl ? (
                  <>
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-brand-primary/30"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRawLogoForEditor(form.logoUrl);
                        setShowLogoEditor(true);
                      }}
                      className="absolute inset-0 w-14 h-14 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Ajustar logo"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="w-14 h-14 rounded-full themed-surface border themed-border flex items-center justify-center">
                    <Building2 className="w-6 h-6 themed-text-muted" />
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="flex-1 space-y-2">
                {/* URL input */}
                <input
                  type="text"
                  value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="Cole a URL do logo ou faça upload abaixo"
                  className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 transition-colors"
                />

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed themed-border themed-surface px-3 py-2 text-sm themed-text-secondary hover:border-brand-primary/50 hover:themed-text transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {form.logoUrl.startsWith('data:') ? 'Imagem selecionada — trocar' : 'Ou fazer upload de imagem (max 2MB)'}
                </button>

                <div className="flex items-center gap-3">
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawLogoForEditor(form.logoUrl);
                        setShowLogoEditor(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-brand-primary-light hover:text-brand-primary transition-colors"
                    >
                      <ZoomIn className="w-3 h-3" />
                      Ajustar logo
                    </button>
                  )}
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Editor Modal */}
          {showLogoEditor && rawLogoForEditor && (
            <LogoEditor
              imageSrc={rawLogoForEditor}
              onSave={(croppedUrl) => {
                handleChange('logoUrl', croppedUrl);
                setShowLogoEditor(false);
              }}
              onCancel={() => setShowLogoEditor(false)}
            />
          )}

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
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={`${brand.name} logo`}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border themed-border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-12 h-12 rounded-xl items-center justify-center text-lg font-bold shrink-0"
          style={{
            backgroundColor: `${categoryColor}25`,
            border: `1px solid ${categoryColor}40`,
            color: categoryColor,
            display: brand.logoUrl ? 'none' : 'flex',
          }}
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
