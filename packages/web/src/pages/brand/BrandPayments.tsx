import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Users, FileText } from 'lucide-react';
import {
  brandPortalApi,
  type BrandPayout,
  type BrandPayoutPreviewRow,
} from '@/lib/api';

function formatBRL(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando pagamento', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  received: { label: 'Recebido pela Brandly', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  paid: { label: 'Pago ao creator', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  cancelled: { label: 'Cancelado', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
};

export default function BrandPayments() {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [period, setPeriod] = useState(currentPeriod);
  const [preview, setPreview] = useState<BrandPayoutPreviewRow[]>([]);
  const [totals, setTotals] = useState({
    videoCount: 0,
    amountTotal: 0,
    amountCreator: 0,
    amountFee: 0,
  });
  const [history, setHistory] = useState<BrandPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [previewRes, historyRes] = await Promise.all([
        brandPortalApi.payoutsPreview(period),
        brandPortalApi.payouts(),
      ]);
      setPreview(previewRes.preview);
      setTotals(previewRes.totals);
      setHistory(historyRes.payouts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function handleGenerate() {
    if (preview.length === 0) {
      alert('Nenhum video aprovado neste periodo');
      return;
    }
    const confirmed = confirm(
      `Confirma geracao de ${preview.length} ordem(ns) de pagamento para ${period}?\n\n` +
        `Total a pagar: ${formatBRL(totals.amountTotal)}\n` +
        `(${formatBRL(totals.amountCreator)} pros creators + ${formatBRL(totals.amountFee)} taxa Brandly)`,
    );
    if (!confirmed) return;

    setGenerating(true);
    try {
      const res = await brandPortalApi.generatePayouts(period);
      alert(res.message);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao gerar');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold themed-text mb-2">Pagamentos</h1>
      <p className="themed-text-muted mb-6">Gere e acompanhe os pagamentos aos creators</p>

      {/* Period selector */}
      <div className="themed-surface-card border themed-border rounded-xl p-4 mb-6 flex items-center gap-3">
        <label className="text-sm themed-text-muted">Periodo:</label>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1.5 rounded-lg themed-bg border themed-border themed-text text-sm"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="themed-surface-card border themed-border rounded-xl p-4">
          <Users className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold themed-text">{preview.length}</div>
          <div className="text-xs themed-text-muted">Creators a pagar</div>
        </div>
        <div className="themed-surface-card border themed-border rounded-xl p-4">
          <FileText className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-2xl font-bold themed-text">{totals.videoCount}</div>
          <div className="text-xs themed-text-muted">Videos aprovados</div>
        </div>
        <div className="themed-surface-card border themed-border rounded-xl p-4">
          <Wallet className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-xl font-bold themed-text">{formatBRL(totals.amountTotal)}</div>
          <div className="text-xs themed-text-muted">Total a pagar</div>
        </div>
        <div className="themed-surface-card border themed-border rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-xl font-bold themed-text">{formatBRL(totals.amountFee)}</div>
          <div className="text-xs themed-text-muted">Taxa Brandly</div>
        </div>
      </div>

      {/* Preview breakdown */}
      {loading ? (
        <div className="text-center py-12 themed-text-muted">Carregando...</div>
      ) : preview.length > 0 && (
        <div className="themed-surface-card border themed-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b themed-border flex items-center justify-between">
            <div>
              <h2 className="font-bold themed-text">Previa do pagamento — {period}</h2>
              <p className="text-xs themed-text-muted mt-0.5">
                Valores agrupados por creator
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || preview.length === 0}
              className="px-5 py-2 rounded-lg bg-brand-primary text-white font-medium text-sm hover:bg-brand-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Gerando...' : 'Gerar ordens'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/20">
                <tr>
                  <th className="text-left px-5 py-3 themed-text-muted font-medium">Creator</th>
                  <th className="text-right px-3 py-3 themed-text-muted font-medium">Videos</th>
                  <th className="text-right px-3 py-3 themed-text-muted font-medium">Creator</th>
                  <th className="text-right px-3 py-3 themed-text-muted font-medium">Taxa</th>
                  <th className="text-right px-5 py-3 themed-text-muted font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.creatorId} className="border-t themed-border">
                    <td className="px-5 py-3 themed-text font-medium">{row.creatorName}</td>
                    <td className="px-3 py-3 text-right themed-text">{row.videoCount}</td>
                    <td className="px-3 py-3 text-right themed-text-secondary">{formatBRL(row.amountCreator)}</td>
                    <td className="px-3 py-3 text-right themed-text-muted">{formatBRL(row.amountFee)}</td>
                    <td className="px-5 py-3 text-right font-semibold themed-text">{formatBRL(row.amountTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-black/10">
                <tr>
                  <td className="px-5 py-3 font-bold themed-text">Total</td>
                  <td className="px-3 py-3 text-right font-bold themed-text">{totals.videoCount}</td>
                  <td className="px-3 py-3 text-right font-bold themed-text">{formatBRL(totals.amountCreator)}</td>
                  <td className="px-3 py-3 text-right font-bold themed-text">{formatBRL(totals.amountFee)}</td>
                  <td className="px-5 py-3 text-right font-bold text-brand-primary-light">{formatBRL(totals.amountTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {preview.length === 0 && !loading && (
        <div className="themed-surface-card border themed-border rounded-xl p-8 text-center themed-text-muted mb-6">
          Nenhum video aprovado pendente de pagamento neste periodo
        </div>
      )}

      {/* History */}
      <div className="themed-surface-card border themed-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b themed-border">
          <h2 className="font-bold themed-text">Historico de pagamentos</h2>
          <p className="text-xs themed-text-muted mt-0.5">Todas as ordens geradas</p>
        </div>
        {history.length === 0 ? (
          <div className="py-8 text-center themed-text-muted text-sm">
            Nenhuma ordem de pagamento gerada ainda
          </div>
        ) : (
          <div className="divide-y themed-border">
            {history.map((p) => {
              const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.pending;
              return (
                <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold themed-text">{p.creatorName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs themed-text-muted mt-1">
                      {p.period} · {p.videoCount} video{p.videoCount !== 1 ? 's' : ''} · criado{' '}
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold themed-text">{formatBRL(p.amountTotal)}</div>
                    <div className="text-xs themed-text-muted">
                      {formatBRL(p.amountCreator)} + {formatBRL(p.amountFee)} taxa
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
