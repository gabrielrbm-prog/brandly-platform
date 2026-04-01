import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  PackageCheck,
  PackageOpen,
  Truck,
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { trackingApi } from '@/lib/api';
import type { Shipment, ShipmentSummary, TrackingEvent } from '@/lib/api';

// ============================================
// HELPERS DE STATUS
// ============================================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Package }
> = {
  pending: {
    label: 'Cadastrado',
    color: '#6B7280',
    bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    icon: Package,
  },
  posted: {
    label: 'Postado',
    color: '#3B82F6',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Package,
  },
  in_transit: {
    label: 'Em Transito',
    color: '#A78BFA',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Truck,
  },
  out_for_delivery: {
    label: 'Saiu para Entrega',
    color: '#F97316',
    bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    icon: MapPin,
  },
  delivered: {
    label: 'Entregue',
    color: '#10B981',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: PackageCheck,
  },
  returned: {
    label: 'Devolvido',
    color: '#EF4444',
    bg: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: PackageOpen,
  },
  failed: {
    label: 'Falha na Entrega',
    color: '#EF4444',
    bg: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ============================================
// COMPONENTE: LINHA DO TEMPO DE EVENTOS
// ============================================

function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm themed-text-muted text-center py-4">
        Nenhuma movimentacao registrada ainda.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === events.length - 1;
        return (
          <div key={index} className="flex gap-3">
            {/* Indicador visual da linha do tempo */}
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  isFirst ? 'bg-brand-primary-light' : 'bg-gray-500'
                }`}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-gray-700 my-1" />
              )}
            </div>

            {/* Conteudo do evento */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className={`text-sm font-medium ${isFirst ? 'themed-text' : 'themed-text-secondary'}`}>
                {event.description || event.status}
              </p>
              {event.location && (
                <p className="text-xs themed-text-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              )}
              <p className="text-xs themed-text-muted mt-0.5">
                {event.date} {event.time}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// COMPONENTE: CARD DE ENVIO
// ============================================

interface ShipmentCardProps {
  shipment: Shipment;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ShipmentCard({ shipment, onRefresh, onDelete }: ShipmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const toast = useToast();

  const statusConfig = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.pending;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh(shipment.id);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover o envio ${shipment.trackingCode}?`)) return;
    setDeleting(true);
    try {
      await onDelete(shipment.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card accent={statusConfig.color}>
      {/* Cabecalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold themed-text">
              {shipment.trackingCode}
            </span>
            <StatusBadge status={shipment.status} />
          </div>

          {shipment.recipientName && (
            <p className="text-xs themed-text-muted mt-1">
              Destinatario: {shipment.recipientName}
              {shipment.destinationCity && (
                <span> — {shipment.destinationCity}{shipment.destinationState ? `/${shipment.destinationState}` : ''}</span>
              )}
            </p>
          )}

          <p className="text-xs themed-text-muted mt-1">
            Adicionado: {formatDate(shipment.createdAt)}
          </p>
        </div>

        {/* Acoes */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg themed-text-muted hover:themed-text hover:themed-surface-light transition-all"
            title="Atualizar rastreamento"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Remover envio"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg themed-text-muted hover:themed-text hover:themed-surface-light transition-all"
            title={expanded ? 'Recolher' : 'Ver historico'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Area expandida */}
      {expanded && (
        <div className="mt-4 pt-4 border-t themed-border space-y-4">

          {/* Acoes rapidas */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(shipment.trackingCode);
                toast.success('Codigo copiado!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg themed-surface-light themed-text-secondary hover:themed-text transition-colors"
            >
              Copiar codigo
            </button>
            <select
              value={shipment.status}
              disabled={updatingStatus}
              onChange={async (e) => {
                setUpdatingStatus(true);
                try {
                  await trackingApi.update(shipment.id, { status: e.target.value });
                  toast.success('Status atualizado!');
                  await onRefresh(shipment.id);
                } catch {
                  toast.error('Erro ao atualizar status');
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              className="px-2 py-1.5 text-xs rounded-lg bg-transparent themed-border themed-text-secondary cursor-pointer"
            >
              <option value="pending">Cadastrado</option>
              <option value="posted">Postado</option>
              <option value="in_transit">Em Transito</option>
              <option value="out_for_delivery">Saiu para Entrega</option>
              <option value="delivered">Entregue</option>
              <option value="returned">Devolvido</option>
              <option value="failed">Falha na Entrega</option>
            </select>
          </div>

          {/* Consultar nos Correios */}
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm themed-text-secondary text-center">
              Para ver as movimentacoes, consulte direto no site dos Correios.
              <br />
              O codigo sera copiado automaticamente.
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shipment.trackingCode);
                toast.success('Codigo copiado! Cole no site dos Correios.');
                window.open('https://rastreamento.correios.com.br/app/index.php', '_blank');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Search className="w-4 h-4" />
              Abrir Correios e copiar codigo
            </button>
            <p className="text-xs themed-text-muted font-mono">
              {shipment.trackingCode}
            </p>
          </div>

        </div>
      )}
    </Card>
  );
}

// ============================================
// FORMULARIO DE ADICIONAR RASTREAMENTO
// ============================================

interface AddTrackingFormProps {
  onAdd: (data: { trackingCode: string; recipientName?: string; userId?: string }) => Promise<void>;
}

function AddTrackingForm({ onAdd, users }: AddTrackingFormProps & { users: Array<{ id: string; name: string; email: string }> }) {
  const [trackingCode, setTrackingCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = trackingCode.toUpperCase().trim();

    if (!code) {
      setError('Informe o codigo de rastreamento');
      return;
    }

    // Validacao basica do formato Correios no frontend
    if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(code)) {
      setError('Formato invalido. Exemplo correto: SS987654321BR');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onAdd({
        trackingCode: code,
        recipientName: recipientName.trim() || undefined,
        userId: selectedUserId || undefined,
      });
      setTrackingCode('');
      setRecipientName('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 themed-text-muted" />
        <span className="text-sm font-semibold themed-text-secondary">Rastrear novo envio</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Codigo de rastreamento"
          placeholder="SS987654321BR"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
          error={error}
          maxLength={13}
        />
        {users.length > 0 && (
          <div>
            <label className="block text-xs font-medium themed-text-secondary mb-1">Comprador</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                const user = users.find(u => u.id === e.target.value);
                if (user && !recipientName) setRecipientName(user.name);
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm themed-text"
            >
              <option value="">Selecione o comprador...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
        )}
        <Input
          label="Destinatario"
          placeholder="Nome do cliente"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
        <Button
          type="submit"
          loading={loading}
          icon={<Plus className="w-4 h-4" />}
          className="w-full"
        >
          Rastrear
        </Button>
      </form>
    </Card>
  );
}

// ============================================
// PAGINA PRINCIPAL
// ============================================

export default function Tracking() {
  const toast = useToast();
  const [shipmentsList, setShipmentsList] = useState<Shipment[]>([]);
  const [summary, setSummary] = useState<ShipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [purchasedUsers, setPurchasedUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      const [listResult, summaryResult, buyersResult] = await Promise.all([
        trackingApi.list({ page, limit: LIMIT }),
        trackingApi.summary(),
        trackingApi.buyers().catch(() => ({ buyers: [] })),
      ]);
      setShipmentsList(listResult.shipments);
      setTotal(listResult.total);
      setSummary(summaryResult.summary);
      setPurchasedUsers(buyersResult.buyers);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar rastreamentos.');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAdd(data: { trackingCode: string; recipientName?: string }) {
    try {
      const result = await trackingApi.create(data);
      toast.success('Envio cadastrado com sucesso!');
      if ((result as any).warning) {
        toast.error(`Aviso: ${(result as any).warning}`);
      }
      setPage(1);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao cadastrar envio.');
      throw err;
    }
  }

  async function handleRefresh(id: string) {
    try {
      const result = await trackingApi.refresh(id);
      toast.success('Rastreamento atualizado!');
      if ((result as any).warning) {
        toast.error(`Aviso: ${(result as any).warning}`);
      }
      setShipmentsList((prev) =>
        prev.map((s) => (s.id === id ? (result as any).shipment : s)),
      );
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao atualizar rastreamento.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await trackingApi.remove(id);
      toast.success('Envio removido.');
      setShipmentsList((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao remover envio.');
    }
  }

  if (loading) {
    return (
      <PageContainer title="Rastreamento de Envios">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageContainer>
    );
  }

  const totalActive = summary
    ? (summary.pending ?? 0) +
      (summary.posted ?? 0) +
      (summary.in_transit ?? 0) +
      (summary.out_for_delivery ?? 0)
    : 0;

  return (
    <PageContainer title="Rastreamento de Envios">
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            glowing
            icon={<Clock className="w-4 h-4" />}
            label="Cadastrados"
            value={String((summary?.pending ?? 0) + (summary?.posted ?? 0))}
            color="#F59E0B"
          />
          <StatCard
            glowing
            icon={<Truck className="w-4 h-4" />}
            label="Em Transito"
            value={String((summary?.in_transit ?? 0) + (summary?.out_for_delivery ?? 0))}
            color="#A78BFA"
          />
          <StatCard
            glowing
            icon={<PackageCheck className="w-4 h-4" />}
            label="Entregues"
            value={String(summary?.delivered ?? 0)}
            color="#10B981"
          />
          <StatCard
            glowing
            icon={<AlertCircle className="w-4 h-4" />}
            label="Com Problemas"
            value={String((summary?.returned ?? 0) + (summary?.failed ?? 0))}
            color="#EF4444"
          />
        </div>

        {/* Formulario de adicionar */}
        <AddTrackingForm onAdd={handleAdd} users={purchasedUsers} />

        {/* Lista de envios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 themed-text-muted" />
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">
                Envios ({total})
              </span>
            </div>
            {totalActive > 0 && (
              <span className="text-xs themed-text-muted">
                {totalActive} em andamento
              </span>
            )}
          </div>

          {shipmentsList.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Package className="w-10 h-10 themed-text-muted mx-auto mb-3" />
                <p className="text-sm themed-text-muted">
                  Nenhum envio cadastrado ainda.
                </p>
                <p className="text-xs themed-text-muted mt-1">
                  Adicione um codigo de rastreamento acima para comecar.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {shipmentsList.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onRefresh={handleRefresh}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Paginacao */}
        {total > LIMIT && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm themed-text-muted">
              {page} / {Math.ceil(total / LIMIT)}
            </span>
            <Button
              variant="secondary"
              disabled={page >= Math.ceil(total / LIMIT)}
              onClick={() => setPage((p) => p + 1)}
            >
              Proximo
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
