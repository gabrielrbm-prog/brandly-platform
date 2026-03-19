import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ReceiptText,
} from 'lucide-react';
import {
  adminApi,
  type FinancialOverview,
  type AdminWithdrawal,
  type AdminSale,
  type AdminPayment,
} from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    typeof value === 'string' ? parseFloat(value) : value,
  );
}

const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  requested: 'Pendente',
  processing: 'Em processamento',
  completed: 'Concluido',
  failed: 'Recusado',
};

const WITHDRAWAL_STATUS_VARIANTS: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
  requested: 'warning',
  processing: 'primary',
  completed: 'success',
  failed: 'danger',
};

const SALE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  commission: 'Comissao',
  bonus: 'Bonus',
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  video: '#10B981',
  commission: '#7C3AED',
  bonus: '#F59E0B',
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmApproveModalProps {
  withdrawal: AdminWithdrawal;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmApproveModal({ withdrawal, onConfirm, onCancel, loading }: ConfirmApproveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-md themed-surface rounded-2xl border themed-border p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 themed-text-muted hover:themed-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold themed-text">Aprovar Saque</h3>
        </div>

        <p className="text-sm themed-text-secondary mb-2">
          Confirmar aprovacao do saque de{' '}
          <span className="font-semibold themed-text">{withdrawal.creatorName}</span>?
        </p>
        <p className="text-2xl font-bold text-emerald-400 mb-1">
          {formatCurrency(withdrawal.amount)}
        </p>
        <p className="text-xs themed-text-muted mb-5">
          Chave PIX: <span className="font-mono themed-text">{withdrawal.pixKey}</span>
        </p>

        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            icon={<CheckCircle className="w-4 h-4" />}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
          >
            Confirmar Aprovacao
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

interface RejectWithdrawalModalProps {
  withdrawal: AdminWithdrawal;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function RejectWithdrawalModal({ withdrawal, onConfirm, onCancel, loading }: RejectWithdrawalModalProps) {
  const [reason, setReason] = useState('');
  const isEmpty = reason.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-md themed-surface rounded-2xl border themed-border p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 themed-text-muted hover:themed-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold themed-text">Recusar Saque</h3>
        </div>

        <p className="text-sm themed-text-secondary mb-1">
          Recusar saque de{' '}
          <span className="font-semibold themed-text">{withdrawal.creatorName}</span>{' '}
          no valor de{' '}
          <span className="font-semibold text-red-400">{formatCurrency(withdrawal.amount)}</span>?
        </p>
        <p className="text-xs themed-text-muted mb-4">
          Chave PIX: <span className="font-mono themed-text">{withdrawal.pixKey}</span>
        </p>

        <Input
          label="Motivo da recusa (obrigatorio)"
          icon={<AlertCircle className="w-4 h-4" />}
          placeholder="Ex: Chave PIX invalida, dados inconsistentes..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {isEmpty && (
          <p className="text-xs text-red-400 mt-1">O motivo e obrigatorio.</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button
            variant="danger"
            onClick={() => onConfirm(reason.trim())}
            loading={loading}
            disabled={isEmpty || loading}
            icon={<XCircle className="w-4 h-4" />}
            className="flex-1"
          >
            Recusar Saque
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-brand-primary/20 text-brand-primary-light border border-brand-primary/30'
          : 'themed-text-muted hover:themed-surface-light hover:themed-text border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
        active
          ? 'bg-brand-primary/15 text-brand-primary-light'
          : 'themed-text-muted hover:themed-surface-light hover:themed-text'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t themed-border">
      <span className="text-xs themed-text-muted">
        Pagina {page} de {totalPages} &mdash; {total} registros
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg themed-surface-light themed-text-muted hover:themed-text flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg themed-surface-light themed-text-muted hover:themed-text flex items-center justify-center disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────

const WITHDRAWAL_FILTERS = [
  { label: 'Pendentes', value: 'requested' },
  { label: 'Em processamento', value: 'processing' },
  { label: 'Concluidos', value: 'completed' },
  { label: 'Recusados', value: 'failed' },
];

function WithdrawalsTab() {
  const toast = useToast();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('requested');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [approveModal, setApproveModal] = useState<AdminWithdrawal | null>(null);
  const [rejectModal, setRejectModal] = useState<AdminWithdrawal | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await adminApi.withdrawals(statusFilter, page);
      setWithdrawals(res.withdrawals ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar saques.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === withdrawals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withdrawals.map((w) => w.id)));
    }
  }

  async function handleApprove(withdrawal: AdminWithdrawal) {
    setApprovingId(withdrawal.id);
    setApproveModal(null);
    try {
      await adminApi.approveWithdrawal(withdrawal.id);
      toast.success(`Saque de ${withdrawal.creatorName} aprovado!`);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao aprovar saque.');
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(withdrawal: AdminWithdrawal, reason: string) {
    setRejectingId(withdrawal.id);
    setRejectModal(null);
    try {
      await adminApi.rejectWithdrawal(withdrawal.id, reason);
      toast.success(`Saque de ${withdrawal.creatorName} recusado.`);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao recusar saque.');
    } finally {
      setRejectingId(null);
    }
  }

  async function handleBatchApprove() {
    setBatchApproving(true);
    try {
      await adminApi.batchApproveWithdrawals(Array.from(selectedIds));
      toast.success(`${selectedIds.size} saque(s) aprovado(s)!`);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao aprovar saques em lote.');
    } finally {
      setBatchApproving(false);
    }
  }

  const isPending = statusFilter === 'requested';

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {WITHDRAWAL_FILTERS.map((f) => (
            <FilterPill
              key={f.value}
              active={statusFilter === f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
            >
              {f.label}
            </FilterPill>
          ))}
          <button
            onClick={fetchWithdrawals}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-sm text-brand-primary-light hover:text-brand-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Batch action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-brand-primary/10 border border-brand-primary/20 px-4 py-2.5">
            <span className="text-sm font-medium text-brand-primary-light">
              {selectedIds.size} saque(s) selecionado(s)
            </span>
            <Button
              onClick={handleBatchApprove}
              loading={batchApproving}
              disabled={batchApproving}
              icon={<CheckCircle className="w-4 h-4" />}
              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-xs py-1.5"
            >
              Aprovar Selecionados
            </Button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-lg font-bold themed-text mb-1">Nenhum registro</p>
            <p className="text-sm themed-text-secondary">
              Nao ha saques com status &quot;{WITHDRAWAL_STATUS_LABELS[statusFilter]}&quot;
            </p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2">
              {isPending && (
                <input
                  type="checkbox"
                  checked={selectedIds.size === withdrawals.length && withdrawals.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-brand-primary cursor-pointer"
                />
              )}
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Creator</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Chave PIX</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Valor</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Data</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Status</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Acoes</span>
            </div>

            <div className="space-y-2">
              {withdrawals.map((w) => {
                const isActing = approvingId === w.id || rejectingId === w.id;
                const statusVariant = WITHDRAWAL_STATUS_VARIANTS[w.status] ?? 'default';

                return (
                  <div
                    key={w.id}
                    className={`rounded-2xl border themed-border themed-surface p-4 transition-all ${
                      selectedIds.has(w.id) ? 'border-brand-primary/40 bg-brand-primary/5' : ''
                    }`}
                    style={
                      w.status === 'requested'
                        ? { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }
                        : w.status === 'completed'
                        ? { borderLeftColor: '#10B981', borderLeftWidth: 3 }
                        : w.status === 'failed'
                        ? { borderLeftColor: '#EF4444', borderLeftWidth: 3 }
                        : {}
                    }
                  >
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isPending && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(w.id)}
                                onChange={() => toggleSelect(w.id)}
                                className="w-4 h-4 accent-brand-primary cursor-pointer shrink-0"
                              />
                            )}
                            <span className="text-sm font-semibold themed-text truncate">{w.creatorName}</span>
                            <Badge variant={statusVariant}>
                              {WITHDRAWAL_STATUS_LABELS[w.status] ?? w.status}
                            </Badge>
                          </div>
                          <p className="text-xs themed-text-muted font-mono truncate">{w.pixKey}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-base font-bold text-emerald-400">{formatCurrency(w.amount)}</span>
                            <span className="text-xs themed-text-muted">{formatDate(w.createdAt)}</span>
                          </div>
                          {w.reason && (
                            <p className="text-xs text-red-400 mt-1">Motivo: {w.reason}</p>
                          )}
                        </div>
                      </div>
                      {isPending && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setApproveModal(w)}
                            disabled={isActing}
                            loading={approvingId === w.id}
                            icon={<CheckCircle className="w-4 h-4" />}
                            className="flex-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          >
                            Aprovar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setRejectModal(w)}
                            disabled={isActing}
                            icon={<XCircle className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Recusar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Desktop layout */}
                    <div
                      className={`hidden md:grid gap-4 items-center ${
                        isPending
                          ? 'md:grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto]'
                          : 'md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr]'
                      }`}
                    >
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(w.id)}
                          onChange={() => toggleSelect(w.id)}
                          className="w-4 h-4 accent-brand-primary cursor-pointer"
                        />
                      )}
                      <span className="text-sm font-medium themed-text truncate">{w.creatorName}</span>
                      <span className="text-xs font-mono themed-text-muted truncate">{w.pixKey}</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(w.amount)}</span>
                      <span className="text-sm themed-text-muted">{formatDate(w.createdAt)}</span>
                      <Badge variant={statusVariant}>
                        {WITHDRAWAL_STATUS_LABELS[w.status] ?? w.status}
                      </Badge>
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setApproveModal(w)}
                            disabled={isActing}
                            className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Aprovar"
                          >
                            {approvingId === w.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setRejectModal(w)}
                            disabled={isActing}
                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Recusar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
          </>
        )}
      </div>

      {approveModal && (
        <ConfirmApproveModal
          withdrawal={approveModal}
          onConfirm={() => handleApprove(approveModal)}
          onCancel={() => setApproveModal(null)}
          loading={approvingId === approveModal.id}
        />
      )}

      {rejectModal && (
        <RejectWithdrawalModal
          withdrawal={rejectModal}
          onConfirm={(reason) => handleReject(rejectModal, reason)}
          onCancel={() => setRejectModal(null)}
          loading={rejectingId === rejectModal.id}
        />
      )}
    </>
  );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────

const SALE_FILTERS = [
  { label: 'Pendentes', value: 'pending' },
  { label: 'Confirmadas', value: 'confirmed' },
];

function SalesTab() {
  const toast = useToast();
  const [sales, setSales] = useState<AdminSale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.salesList(statusFilter, page);
      setSales(res.sales ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar vendas.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  async function handleConfirmSale(id: string) {
    setConfirmingId(id);
    try {
      await adminApi.confirmSale(id);
      toast.success('Venda confirmada e bonus processados!');
      fetchSales();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao confirmar venda.');
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {SALE_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            active={statusFilter === f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
          >
            {f.label}
          </FilterPill>
        ))}
        <button
          onClick={fetchSales}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-sm text-brand-primary-light hover:text-brand-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-brand-primary-light" />
          </div>
          <p className="text-lg font-bold themed-text mb-1">Nenhuma venda</p>
          <p className="text-sm themed-text-secondary">
            Nao ha vendas com status &quot;{SALE_STATUS_LABELS[statusFilter]}&quot;
          </p>
        </div>
      ) : (
        <>
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2">
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Produto</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Creator</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Marca</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Valor</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Tipo</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Data</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Acao</span>
          </div>

          <div className="space-y-2">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="rounded-2xl border themed-border themed-surface p-4"
                style={
                  sale.status === 'pending'
                    ? { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }
                    : { borderLeftColor: '#10B981', borderLeftWidth: 3 }
                }
              >
                {/* Mobile layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold themed-text truncate">{sale.productName}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: sale.type === 'digital' ? '#7C3AED' : '#10B981',
                            backgroundColor: sale.type === 'digital' ? '#7C3AED20' : '#10B98120',
                          }}
                        >
                          {sale.type === 'digital' ? 'Digital' : 'Fisico'}
                        </span>
                      </div>
                      <p className="text-xs themed-text-muted">{sale.creatorName} &middot; {sale.brandName}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-base font-bold themed-text">{formatCurrency(sale.amount)}</span>
                        <span className="text-xs themed-text-muted">{formatDate(sale.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {sale.status === 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => handleConfirmSale(sale.id)}
                      disabled={confirmingId === sale.id}
                      loading={confirmingId === sale.id}
                      icon={<CheckCircle className="w-4 h-4" />}
                      className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Confirmar Venda
                    </Button>
                  )}
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
                  <span className="text-sm font-medium themed-text truncate">{sale.productName}</span>
                  <span className="text-sm themed-text-secondary truncate">{sale.creatorName}</span>
                  <span className="text-sm themed-text-secondary truncate">{sale.brandName}</span>
                  <span className="text-sm font-bold themed-text">{formatCurrency(sale.amount)}</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                    style={{
                      color: sale.type === 'digital' ? '#7C3AED' : '#10B981',
                      backgroundColor: sale.type === 'digital' ? '#7C3AED20' : '#10B98120',
                    }}
                  >
                    {sale.type === 'digital' ? 'Digital' : 'Fisico'}
                  </span>
                  <span className="text-sm themed-text-muted">{formatDate(sale.createdAt)}</span>
                  {sale.status === 'pending' ? (
                    <button
                      onClick={() => handleConfirmSale(sale.id)}
                      disabled={confirmingId === sale.id}
                      className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Confirmar venda"
                    >
                      {confirmingId === sale.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

const PAYMENT_TYPE_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Video', value: 'video' },
  { label: 'Comissao', value: 'commission' },
  { label: 'Bonus', value: 'bonus' },
];

function PaymentsTab() {
  const toast = useToast();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.paymentsLedger(page, typeFilter || undefined);
      setPayments(res.payments ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar pagamentos.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {PAYMENT_TYPE_FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            active={typeFilter === f.value}
            onClick={() => { setTypeFilter(f.value); setPage(1); }}
          >
            {f.label}
          </FilterPill>
        ))}
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-sm text-brand-primary-light hover:text-brand-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
            <ReceiptText className="w-8 h-8 text-brand-primary-light" />
          </div>
          <p className="text-lg font-bold themed-text mb-1">Nenhum pagamento</p>
          <p className="text-sm themed-text-secondary">Nenhum registro encontrado para este filtro.</p>
        </div>
      ) : (
        <>
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-4 px-4 py-2">
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Creator</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Tipo</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Valor</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Descricao</span>
            <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Data</span>
          </div>

          <div className="space-y-2">
            {payments.map((p) => {
              const typeColor = PAYMENT_TYPE_COLORS[p.type] ?? '#7C3AED';

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border themed-border themed-surface p-4"
                  style={{ borderLeftColor: typeColor, borderLeftWidth: 3 }}
                >
                  {/* Mobile */}
                  <div className="md:hidden flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold themed-text truncate">{p.creatorName}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: typeColor, backgroundColor: `${typeColor}20` }}
                        >
                          {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                        </span>
                      </div>
                      <p className="text-xs themed-text-muted truncate">{p.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-base font-bold themed-text">{formatCurrency(p.amount)}</span>
                        <span className="text-xs themed-text-muted">{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-4 items-center">
                    <span className="text-sm font-medium themed-text truncate">{p.creatorName}</span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                      style={{ color: typeColor, backgroundColor: `${typeColor}20` }}
                    >
                      {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                    </span>
                    <span className="text-sm font-bold themed-text">{formatCurrency(p.amount)}</span>
                    <span className="text-sm themed-text-secondary truncate">{p.description}</span>
                    <span className="text-sm themed-text-muted">{formatDate(p.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = 'withdrawals' | 'sales' | 'payments';

export default function AdminFinancial() {
  const toast = useToast();
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('withdrawals');

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await adminApi.financialOverview();
      setOverview(data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar visao geral financeira.');
    } finally {
      setOverviewLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <PageContainer title="Admin — Financeiro">
      <div className="space-y-6">
        {/* Header banner */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold themed-text">Financeiro</h2>
              <p className="text-sm themed-text-secondary mt-1">
                Saques, vendas e pagamentos da plataforma
              </p>
            </div>
            <Badge variant="success">Admin</Badge>
          </div>
        </div>

        {/* Overview stat cards */}
        {overviewLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                glowing
                icon={<TrendingUp className="w-4 h-4" />}
                label="Receita Total"
                value={formatCurrency(overview?.totalRevenue ?? '0')}
                color="#10B981"
              />
              <StatCard
                glowing
                icon={<DollarSign className="w-4 h-4" />}
                label="Margem Brandly"
                value={formatCurrency(overview?.brandlyMargin ?? '0')}
                color="#7C3AED"
              />
              <StatCard
                glowing
                icon={<Users className="w-4 h-4" />}
                label="Pago a Creators"
                value={formatCurrency(overview?.totalPaidToCreators ?? '0')}
                color="#3B82F6"
              />
              <StatCard
                glowing
                icon={<Clock className="w-4 h-4" />}
                label="Saques Pendentes"
                value={formatCurrency(overview?.pendingWithdrawals ?? '0')}
                color="#F59E0B"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs themed-text-muted">Vendas Pendentes</p>
                    <p className="text-xl font-bold themed-text">{overview?.pendingSalesCount ?? 0}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ReceiptText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs themed-text-muted">Total Pagamentos</p>
                    <p className="text-xl font-bold themed-text">
                      {formatCurrency(
                        parseFloat(overview?.totalPaidToCreators ?? '0') +
                          parseFloat(overview?.brandlyMargin ?? '0'),
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <TabButton active={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')}>
            Saques
            {(overview?.pendingWithdrawalsCount ?? 0) > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {overview!.pendingWithdrawalsCount}
              </span>
            )}
          </TabButton>
          <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
            Vendas
            {(overview?.pendingSalesCount ?? 0) > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {overview!.pendingSalesCount}
              </span>
            )}
          </TabButton>
          <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')}>
            Pagamentos
          </TabButton>
        </div>

        {/* Tab content */}
        <Card>
          {activeTab === 'withdrawals' && <WithdrawalsTab />}
          {activeTab === 'sales' && <SalesTab />}
          {activeTab === 'payments' && <PaymentsTab />}
        </Card>
      </div>
    </PageContainer>
  );
}
