import { useState, useEffect } from 'react';
import { Users, Package, PackageCheck, Truck, Clock, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

interface Comprador {
  data: string;
  cliente: string;
  celular: string;
  email: string;
  produto: string;
  oferta: string;
  cidade: string;
  estado: string;
  cep: string;
  temConta: boolean;
  userId: string | null;
  statusConta: string | null;
  cadastroPlataforma: string | null;
  onboardingCompleted: boolean;
  shipments: Array<{
    id: string;
    trackingCode: string;
    status: string;
    recipientName: string | null;
    destinationCity: string | null;
    destinationState: string | null;
    lastEvent: string | null;
    createdAt: string;
  }>;
}

// Fallback: se a API retornar formato antigo (do banco), adapta
interface CompradorLegacy {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  onboardingCompleted: boolean;
  shipments: Comprador['shipments'];
}

function normalizeComprador(raw: any): Comprador {
  if (raw.cliente) return raw as Comprador;
  // Legacy format
  return {
    data: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('pt-BR') : '',
    cliente: raw.name ?? '',
    celular: '',
    email: raw.email ?? '',
    produto: '',
    oferta: '',
    cidade: '',
    estado: '',
    cep: '',
    temConta: true,
    userId: raw.id ?? null,
    statusConta: raw.status ?? null,
    cadastroPlataforma: raw.createdAt ?? null,
    onboardingCompleted: raw.onboardingCompleted ?? false,
    shipments: raw.shipments ?? [],
  };
}

const shipmentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Cadastrado', color: 'text-slate-400' },
  posted: { label: 'Postado', color: 'text-blue-400' },
  in_transit: { label: 'Em transito', color: 'text-amber-400' },
  out_for_delivery: { label: 'Saiu pra entrega', color: 'text-purple-400' },
  delivered: { label: 'Entregue', color: 'text-green-400' },
  returned: { label: 'Devolvido', color: 'text-red-400' },
  failed: { label: 'Problema', color: 'text-red-400' },
};

function CompradorRow({ comprador }: { comprador: Comprador }) {
  const [expanded, setExpanded] = useState(false);
  const hasShipment = comprador.shipments.length > 0;
  const initials = (comprador.cliente || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="themed-surface-card border themed-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-700/10 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-brand-primary-light">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold themed-text">{comprador.cliente}</span>
            {comprador.temConta ? (
              <Badge variant="success">Cadastrado</Badge>
            ) : (
              <Badge variant="danger">Sem conta</Badge>
            )}
          </div>
          <p className="text-xs themed-text-muted">{comprador.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs themed-text-muted">{comprador.data}</span>
          {hasShipment ? (
            <Badge variant="success">Kit enviado</Badge>
          ) : (
            <Badge variant="warning">Sem envio</Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 themed-text-muted" /> : <ChevronDown className="w-4 h-4 themed-text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t themed-border px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="themed-text-muted">Celular</span>
              <p className="themed-text font-medium mt-0.5">{comprador.celular || '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Produto</span>
              <p className="themed-text font-medium mt-0.5">{comprador.produto || '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Oferta</span>
              <p className="themed-text font-medium mt-0.5">{comprador.oferta || '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Data compra</span>
              <p className="themed-text font-medium mt-0.5">{comprador.data || '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Cidade/UF</span>
              <p className="themed-text font-medium mt-0.5">{comprador.cidade ? `${comprador.cidade}/${comprador.estado}` : '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">CEP</span>
              <p className="themed-text font-medium mt-0.5">{comprador.cep || '-'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Conta na plataforma</span>
              <p className="themed-text font-medium mt-0.5">{comprador.temConta ? `Sim (${comprador.statusConta})` : 'Nao'}</p>
            </div>
            <div>
              <span className="themed-text-muted">Onboarding</span>
              <p className="themed-text font-medium mt-0.5">{comprador.temConta ? (comprador.onboardingCompleted ? 'Completo' : 'Pendente') : '-'}</p>
            </div>
          </div>

          {comprador.shipments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold themed-text-secondary uppercase">Envios ({comprador.shipments.length})</p>
              {comprador.shipments.map(s => {
                const sc = shipmentStatusConfig[s.status] ?? shipmentStatusConfig.pending;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">
                    <Package className="w-4 h-4 themed-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold themed-text">{s.trackingCode}</span>
                        <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                      </div>
                      {s.lastEvent && (
                        <p className="text-xs themed-text-muted mt-0.5">{s.lastEvent}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-900/10 border border-amber-800/30">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">Nenhum codigo de rastreio cadastrado para este comprador.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCompradores() {
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  function fetchCompradores() {
    setLoading(true);
    api.get<{ compradores: any[] }>('/api/shipments/compradores')
      .then(data => setCompradores((data?.compradores ?? []).map(normalizeComprador)))
      .catch(() => setCompradores([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCompradores(); }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const data = await api.post<{ message?: string; error?: string }>('/api/cron/sync-buyers');
      setSyncMsg(data?.message ?? data?.error ?? 'Sync concluido');
      fetchCompradores();
    } catch {
      setSyncMsg('Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  const totalCompradores = compradores.length;
  const comConta = compradores.filter(c => c.temConta).length;
  const comEnvio = compradores.filter(c => c.shipments.length > 0).length;
  const entregues = compradores.filter(c => c.shipments.some(s => s.status === 'delivered')).length;

  if (loading) {
    return (
      <PageContainer title="Compradores">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Compradores">
      {/* Sync */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm themed-text-secondary">Sincronizado com a planilha de vendas.</p>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-xs themed-text-muted">{syncMsg}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary/15 text-brand-primary-light text-sm font-medium hover:bg-brand-primary/25 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-primary-light" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Vendas</p>
              <p className="text-lg font-bold themed-text">{totalCompradores}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Com conta</p>
              <p className="text-lg font-bold text-green-400">{comConta}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Kit enviado</p>
              <p className="text-lg font-bold text-amber-400">{comEnvio}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Entregues</p>
              <p className="text-lg font-bold text-green-400">{entregues}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {compradores.map(c => (
          <CompradorRow key={c.email} comprador={c} />
        ))}
      </div>
    </PageContainer>
  );
}
