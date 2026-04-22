import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { brandSelfApi } from '@/lib/api';

interface BrandProfile {
  id: string;
  name: string;
  targetAgeMin: number | null;
  targetAgeMax: number | null;
  targetGender: string | null;
  minInstagramFollowers: number | null;
  minTiktokFollowers: number | null;
  aiCriteria: string | null;
}

export default function BrandMatch() {
  const [form, setForm] = useState({
    targetAgeMin: '',
    targetAgeMax: '',
    targetGender: 'any',
    minInstagramFollowers: '',
    minTiktokFollowers: '',
    aiCriteria: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    brandSelfApi
      .getProfile()
      .then((res) => {
        const brand = (res as { brand: BrandProfile }).brand;
        setForm({
          targetAgeMin: brand.targetAgeMin?.toString() ?? '',
          targetAgeMax: brand.targetAgeMax?.toString() ?? '',
          targetGender: brand.targetGender ?? 'any',
          minInstagramFollowers: brand.minInstagramFollowers?.toString() ?? '',
          minTiktokFollowers: brand.minTiktokFollowers?.toString() ?? '',
          aiCriteria: brand.aiCriteria ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await brandSelfApi.updateMatchCriteria({
        targetAgeMin: form.targetAgeMin ? parseInt(form.targetAgeMin, 10) : null,
        targetAgeMax: form.targetAgeMax ? parseInt(form.targetAgeMax, 10) : null,
        targetGender: form.targetGender === 'any' ? null : form.targetGender,
        minInstagramFollowers: form.minInstagramFollowers
          ? parseInt(form.minInstagramFollowers, 10)
          : null,
        minTiktokFollowers: form.minTiktokFollowers ? parseInt(form.minTiktokFollowers, 10) : null,
        aiCriteria: form.aiCriteria.trim() || null,
      });
      setMsg({ type: 'ok', text: 'Critérios salvos.' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message ?? 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="themed-text-muted text-sm">Carregando…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold themed-text">Critérios de Match (IA)</h1>
        <p className="text-sm themed-text-muted mt-1">
          Quando um creator se candidata, a IA avalia idade, gênero, redes sociais e os critérios
          que você define aqui para gerar um score de compatibilidade de 0 a 100%.
        </p>
      </div>

      <div className="themed-surface-card themed-border rounded-xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-brand-primary-light" />
          </div>
          <div>
            <h3 className="text-base font-bold themed-text">Perfil ideal de creator</h3>
            <p className="text-xs themed-text-muted mt-1">
              Preencha o que fizer sentido pra sua marca. Campos em branco = sem restrição.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabeledInput
            label="Idade mínima"
            type="number"
            value={form.targetAgeMin}
            onChange={(v) => setForm({ ...form, targetAgeMin: v })}
            placeholder="18"
          />
          <LabeledInput
            label="Idade máxima"
            type="number"
            value={form.targetAgeMax}
            onChange={(v) => setForm({ ...form, targetAgeMax: v })}
            placeholder="35"
          />
        </div>

        <div>
          <label className="block text-sm font-medium themed-text-secondary mb-1.5">
            Gênero alvo
          </label>
          <select
            value={form.targetGender}
            onChange={(e) => setForm({ ...form, targetGender: e.target.value })}
            className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
          >
            <option value="any">Qualquer</option>
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabeledInput
            label="Mínimo seguidores Instagram"
            type="number"
            value={form.minInstagramFollowers}
            onChange={(v) => setForm({ ...form, minInstagramFollowers: v })}
            placeholder="1000"
          />
          <LabeledInput
            label="Mínimo seguidores TikTok"
            type="number"
            value={form.minTiktokFollowers}
            onChange={(v) => setForm({ ...form, minTiktokFollowers: v })}
            placeholder="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium themed-text-secondary mb-1.5">
            Descrição do creator ideal (texto livre)
          </label>
          <textarea
            value={form.aiCriteria}
            onChange={(e) => setForm({ ...form, aiCriteria: e.target.value })}
            rows={6}
            placeholder="Ex: Buscamos creators que falam sobre saúde, bem-estar e rotina fitness. Evitamos perfis que promovem dietas restritivas ou linguagem vulgar. Valorizamos quem já menciona suplementos ou marcas do nicho."
            className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50 resize-none"
          />
          <p className="text-xs themed-text-muted mt-1.5">
            A IA lê esse texto e compara com a bio e perfil público do candidato nas redes sociais.
          </p>
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
            {saving ? 'Salvando…' : 'Salvar critérios'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function LabeledInput({ label, value, onChange, placeholder, type = 'text' }: LabeledInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium themed-text-secondary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border themed-border themed-surface px-3 py-2.5 text-sm themed-text placeholder:themed-text-muted focus:outline-none focus:border-brand-primary/50"
      />
    </div>
  );
}
