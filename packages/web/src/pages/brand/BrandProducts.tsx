import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, X, Package } from 'lucide-react';
import { brandSelfApi } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  type: 'physical' | 'digital';
  price: string;
  commissionPercent: string;
  trackingType: 'link' | 'cupom';
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
}

interface FormState {
  name: string;
  type: 'physical' | 'digital';
  price: string;
  commissionPercent: string;
  trackingType: 'link' | 'cupom';
}

const EMPTY: FormState = {
  name: '',
  type: 'physical',
  price: '',
  commissionPercent: '',
  trackingType: 'link',
};

const STATUS_LABEL: Record<Product['status'], string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  draft: 'Rascunho',
};

const STATUS_COLOR: Record<Product['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  inactive: 'bg-gray-500/10 text-gray-400',
  draft: 'bg-amber-500/10 text-amber-400',
};

export default function BrandProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await brandSelfApi.listProducts()) as { products: Product[] };
      setItems(res.products ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggle(p: Product) {
    await brandSelfApi.toggleProduct(p.id);
    fetchData();
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir produto "${p.name}"?`)) return;
    await brandSelfApi.deleteProduct(p.id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold themed-text">Produtos</h1>
          <p className="text-sm themed-text-muted mt-1">
            Cadastre os produtos que os creators podem promover, com comissão por venda.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90"
        >
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      {loading ? (
        <div className="themed-text-muted text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="themed-surface-card themed-border rounded-xl p-10 text-center">
          <Package className="w-10 h-10 themed-text-muted mx-auto mb-3" />
          <p className="themed-text-muted">Nenhum produto cadastrado.</p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 text-sm text-brand-primary-light hover:underline"
          >
            Cadastrar o primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map((p) => (
            <div key={p.id} className="themed-surface-card themed-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold themed-text">{p.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary-light">
                      {p.type === 'physical' ? 'Físico' : 'Digital'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-xs themed-text-muted">Preço</p>
                      <p className="themed-text font-semibold">
                        R$ {Number(p.price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs themed-text-muted">Comissão</p>
                      <p className="themed-text font-semibold">
                        {Number(p.commissionPercent).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs themed-text-muted mt-2">
                    Tracking: {p.trackingType === 'link' ? 'Link único' : 'Cupom'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton title="Editar" onClick={() => setEditing(p)}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton title="Ativar/Desativar" onClick={() => toggle(p)}>
                    {p.status === 'active' ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </IconButton>
                  <IconButton title="Excluir" danger onClick={() => remove(p)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ProductModal
          product={editing}
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

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    product
      ? {
          name: product.name,
          type: product.type,
          price: product.price,
          commissionPercent: product.commissionPercent,
          trackingType: product.trackingType,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!form.name.trim() || !form.price || !form.commissionPercent) {
      setError('Preencha nome, preço e comissão.');
      return;
    }
    const price = parseFloat(form.price);
    const commission = parseFloat(form.commissionPercent);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Preço inválido.');
      return;
    }
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      setError('Comissão deve estar entre 0 e 100.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (product) {
        await brandSelfApi.updateProduct(product.id, {
          name: form.name.trim(),
          type: form.type,
          price,
          commissionPercent: commission,
          trackingType: form.trackingType,
        });
      } else {
        await brandSelfApi.createProduct({
          name: form.name.trim(),
          type: form.type,
          price,
          commissionPercent: commission,
          trackingType: form.trackingType,
          status: 'draft',
        });
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
        className="themed-surface rounded-2xl themed-border w-full max-w-md p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold themed-text">
            {product ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onClose} className="p-1 themed-text-muted hover:themed-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Nome *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            />
          </Field>

          <Field label="Tipo">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            >
              <option value="physical">Físico</option>
              <option value="digital">Digital (infoproduto)</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço (R$) *">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
              />
            </Field>

            <Field label="Comissão (%) *">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                placeholder="20"
                className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
              />
            </Field>
          </div>

          <Field label="Tipo de tracking">
            <select
              value={form.trackingType}
              onChange={(e) => setForm({ ...form, trackingType: e.target.value as any })}
              className="w-full rounded-xl border themed-border themed-surface-light px-3 py-2.5 text-sm themed-text focus:outline-none focus:border-brand-primary/50"
            >
              <option value="link">Link único por creator</option>
              <option value="cupom">Cupom de desconto</option>
            </select>
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
