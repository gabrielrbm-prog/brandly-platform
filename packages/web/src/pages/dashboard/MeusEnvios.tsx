import { useState, useEffect } from 'react';
import { Package, Truck, PackageCheck, Clock, AlertCircle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { trackingApi } from '@/lib/api';
import type { Shipment } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'Cadastrado', color: 'text-slate-400', icon: Clock },
  posted: { label: 'Postado', color: 'text-blue-400', icon: Package },
  in_transit: { label: 'Em trânsito', color: 'text-amber-400', icon: Truck },
  out_for_delivery: { label: 'Saiu pra entrega', color: 'text-purple-400', icon: Truck },
  delivered: { label: 'Entregue', color: 'text-green-400', icon: PackageCheck },
  returned: { label: 'Devolvido', color: 'text-red-400', icon: AlertCircle },
  failed: { label: 'Problema', color: 'text-red-400', icon: AlertCircle },
};

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
      <PageContainer title="Meus Envios">
        <SkeletonCard /><SkeletonCard />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Meus Envios">
      {shipments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 themed-text-muted" />
          </div>
          <p className="text-lg font-semibold themed-text mb-1">Nenhum envio encontrado</p>
          <p className="text-sm themed-text-secondary">Quando seu kit for enviado, o rastreio aparecera aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map(s => {
            const config = statusConfig[s.status] ?? statusConfig.pending;
            const Icon = config.icon;
            return (
              <Card key={s.id}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-700/30 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold themed-text font-mono">{s.trackingCode}</span>
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    {s.recipientName && (
                      <p className="text-xs themed-text-secondary mt-0.5">Para: {s.recipientName}</p>
                    )}
                    {s.lastEvent && (
                      <p className="text-xs themed-text-muted mt-1">{s.lastEvent}</p>
                    )}
                  </div>
                  <a
                    href={`https://www.linkcorreios.com.br/?id=${s.trackingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-primary-light hover:underline shrink-0"
                  >
                    Ver nos Correios
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
