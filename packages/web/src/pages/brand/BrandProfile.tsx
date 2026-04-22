import { useEffect, useRef, useState } from 'react';
import { Building2, Upload, Trash2 } from 'lucide-react';
import { brandSelfApi } from '@/lib/api';

interface BrandProfileData {
  id: string;
  name: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  minVideosPerMonth: number | null;
  maxCreators: number | null;
  videoPriceBrand: string;
  videoPriceCreator: string;
}

export default function BrandProfile() {
  const [data, setData] = useState<BrandProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    minVideosPerMonth: '',
    maxCreators: '',
    logoUrl: '',
  });

  useEffect(() => {
    brandSelfApi
      .getProfile()
      .then((res) => {
        const b = (res as { brand: BrandProfileData }).brand;
        setData(b);
        setForm({
          name: b.name,
          description: b.description ?? '',
          website: b.websiteUrl ?? '',
          contactEmail: b.contactEmail ?? '',
          minVideosPerMonth: b.minVideosPerMonth?.toString() ?? '',
          maxCreators: b.maxCreators?.toString() ?? '',
          logoUrl: b.logoUrl ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: 'err', text: 'Imagem muito grande (limite 2MB).' });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!form.name.trim()) {
      setMsg({ type: 'err', text: 'Nome é obrigatório.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await brandSelfApi.updateProfile({
        name: form.name.trim(),
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        minVideosPerMonth: form.minVideosPerMonth
          ? parseInt(form.minVideosPerMonth, 10)
          : null,
        maxCreators: form.maxCreators ? parseInt(form.maxCreators, 10) : null,
        logoUrl: form.logoUrl || null,
      });
      setMsg({ type: 'ok', text: 'Perfil atualizado.' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message ?? 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="themed-text-muted text-sm">Carregando…</div>;
  if (!data) return <div className="themed-text-muted text-sm">Marca não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold themed-text">Meu Perfil</h1>
        <p className="text-sm themed-text-muted mt-1">
          Edite as informações públicas da sua marca. Preço por vídeo e status ficam sob controle
          da Brandly.
        </p>
      </div>

      <div className="themed-surface-card themed-border rounded-xl p-6 space-y-5">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium themed-text-secondary mb-2">Logo</label>
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-cover border themed-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl themed-surface border themed-border flex items-center justify-center">
                  <Building2 className="w-7 h-7 themed-text-muted" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="URL do logo ou faça upload"
                className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border border-dashed themed-border themed-surface px-3 py-2 text-sm themed-text-secondary hover:border-brand-primary/50 hover:themed-text transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {form.logoUrl.startsWith('data:')
                  ? 'Imagem selecionada — trocar'
                  : 'Fazer upload (max 2MB)'}
              </button>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: '' })}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campos */}
        <LabeledField label="Nome da marca *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50"
          />
        </LabeledField>

        <LabeledField label="Descrição">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Conte sobre sua marca, proposta de valor, diferenciais..."
            className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 resize-none"
          />
        </LabeledField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabeledField label="Website">
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50"
            />
          </LabeledField>
          <LabeledField label="Email de contato">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50"
            />
          </LabeledField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabeledField label="Mínimo de vídeos/mês">
            <input
              type="number"
              min={0}
              value={form.minVideosPerMonth}
              onChange={(e) => setForm({ ...form, minVideosPerMonth: e.target.value })}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            />
          </LabeledField>
          <LabeledField label="Máximo de creators">
            <input
              type="number"
              min={0}
              value={form.maxCreators}
              onChange={(e) => setForm({ ...form, maxCreators: e.target.value })}
              className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            />
          </LabeledField>
        </div>

        {/* Read-only: preços */}
        <div className="pt-4 border-t themed-border">
          <p className="text-xs font-semibold themed-text-muted uppercase tracking-wide mb-3">
            Preços (gerenciado pela Brandly)
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="themed-text-muted">Sua marca paga: </span>
              <span className="themed-text font-semibold">R$ {data.videoPriceBrand} /vídeo</span>
            </div>
            <div>
              <span className="themed-text-muted">Creator recebe: </span>
              <span className="themed-text font-semibold">R$ {data.videoPriceCreator} /vídeo</span>
            </div>
          </div>
        </div>

        {msg && (
          <div
            className={`text-sm rounded-lg px-3 py-2 ${
              msg.type === 'ok'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t themed-border">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium themed-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
