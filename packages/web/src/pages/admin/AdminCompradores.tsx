import { useState, useEffect } from 'react';
import { Users, Package, PackageCheck, Truck, Clock, AlertCircle, Mail, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { trackingApi } from '@/lib/api';

interface Comprador {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  onboardingCompleted: boolean;
  shipments: Array<{
    id: string;
    trackingCode: string;
    status: string;
    recipientName: string | null;
    destinationCity: string | null;
    destinationState: string | null;
    carrier: string;
    createdAt: string;
    lastEvent: string | null;
  }>;
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
  const initials = comprador.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

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
            <span className="text-sm font-semibold themed-text">{comprador.name}</span>
            {comprador.role === 'admin' && <Badge variant="purple">Admin</Badge>}
          </div>
          <p className="text-xs themed-text-muted">{comprador.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
              <span className="themed-text-muted">Email</span>
              <p className="themed-text font-medium mt-0.5">{comprador.email}</p>
            </div>
            <div>
              <span className="themed-text-muted">Status conta</span>
              <p className="themed-text font-medium mt-0.5 capitalize">{comprador.status}</p>
            </div>
            <div>
              <span className="themed-text-muted">Cadastro</span>
              <p className="themed-text font-medium mt-0.5">{new Date(comprador.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <span className="themed-text-muted">Onboarding</span>
              <p className="themed-text font-medium mt-0.5">{comprador.onboardingCompleted ? 'Completo' : 'Pendente'}</p>
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
                      {s.destinationCity && (
                        <p className="text-xs themed-text-muted mt-0.5">{s.destinationCity}/{s.destinationState}</p>
                      )}
                      {s.lastEvent && (
                        <p className="text-xs themed-text-muted mt-0.5">{s.lastEvent}</p>
                      )}
                    </div>
                    <span className="text-xs themed-text-muted shrink-0">
                      {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                    </span>
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

  useEffect(() => {
    fetch('/api/shipments/compradores', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('brandly_auth_token')}`,
      },
    })
      .then(r => r.json())
      .then(data => setCompradores(data.compradores ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCompradores = compradores.length;
  const comEnvio = compradores.filter(c => c.shipments.length > 0).length;
  const semEnvio = totalCompradores - comEnvio;
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
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-primary-light" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Total</p>
              <p className="text-lg font-bold themed-text">{totalCompradores}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Truck className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Kit enviado</p>
              <p className="text-lg font-bold text-green-400">{comEnvio}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs themed-text-muted">Sem envio</p>
              <p className="text-lg font-bold text-amber-400">{semEnvio}</p>
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
          <CompradorRow key={c.id} comprador={c} />
        ))}
      </div>
    </PageContainer>
  );
}
