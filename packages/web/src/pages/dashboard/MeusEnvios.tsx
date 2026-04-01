import { useState, useEffect } from 'react';
import { Package, Truck, PackageCheck, Clock, AlertCircle, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { trackingApi } from '@/lib/api';
import type { Shipment, TrackingEvent } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Package }> = {
  pending: { label: 'Cadastrado', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: Clock },
  posted: { label: 'Postado', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Package },
  in_transit: { label: 'Em transito', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Truck },
  out_for_delivery: { label: 'Saiu pra entrega', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Truck },
  delivered: { label: 'Entregue', color: 'text-green-400', bg: 'bg-green-500/20', icon: PackageCheck },
  returned: { label: 'Devolvido', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
  failed: { label: 'Problema', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
};

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const [expanded, setExpanded] = useState(true);
  const config = statusConfig[shipment.status] ?? statusConfig.pending;
  const Icon = config.icon;
  const events = shipment.events ?? [];
  const lastEvent = events[0];

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold themed-text font-mono">{shipment.trackingCode}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              {shipment.destinationCity && shipment.destinationState && (
                <span className="text-xs themed-text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shipment.destinationCity}/{shipment.destinationState}
                </span>
              )}
            </div>
          </div>
        </div>
        <a
          href={`https://www.linkcorreios.com.br/?id=${shipment.trackingCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-brand-primary-light hover:underline shrink-0"
        >
          Ver nos Correios <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Ultimo Status */}
      {lastEvent && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 mb-4">
          <p className="text-xs themed-text-muted mb-1">Ultimo Status</p>
          <p className="text-sm font-semibold themed-text">{lastEvent.status}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs themed-text-secondary">
            <span>Data: {lastEvent.date} | Hora: {lastEvent.time}</span>
            {lastEvent.location && <span>Local: {lastEvent.location}</span>}
            {lastEvent.description && lastEvent.description !== lastEvent.status && (
              <span>{lastEvent.description}</span>
            )}
          </div>
        </div>
      )}

      {/* Historico */}
      {events.length > 1 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-semibold themed-text-secondary hover:themed-text transition-colors mb-3"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Historico ({events.length} eventos)
          </button>

          {expanded && (
            <div className="relative pl-4 border-l-2 border-slate-700/50 space-y-4">
              {events.map((ev, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-brand-primary-light' : 'bg-slate-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${i === 0 ? 'themed-text' : 'themed-text-secondary'}`}>
                      {ev.status}
                    </p>
                    <p className="text-xs themed-text-muted mt-0.5">
                      {ev.date} {ev.time && `| ${ev.time}`}
                    </p>
                    {ev.location && (
                      <p className="text-xs themed-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {ev.location}
                      </p>
                    )}
                    {ev.description && ev.description !== ev.status && (
                      <p className="text-xs themed-text-muted mt-0.5">{ev.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {events.length === 0 && (
        <p className="text-xs themed-text-muted italic">Objeto ainda nao possui movimentacoes registradas nos Correios.</p>
      )}
    </Card>
  );
}

export default function MeusEnvios() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackingApi.list({ limit: 50 })
      .then(res => setShipments(res.shipments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer title="Rastreamento">
        <SkeletonCard /><SkeletonCard />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Rastreamento">
      {shipments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 themed-text-muted" />
          </div>
          <p className="text-lg font-semibold themed-text mb-1">Nenhum envio encontrado</p>
          <p className="text-sm themed-text-secondary">Quando seu kit for enviado, o rastreio aparecera aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map(s => (
            <ShipmentCard key={s.id} shipment={s} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
