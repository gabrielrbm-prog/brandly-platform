import { useState, useEffect } from 'react';
import { Package, Truck, PackageCheck, Clock, AlertCircle, Search, Copy, Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { trackingApi } from '@/lib/api';
import type { Shipment } from '@/lib/api';

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
  const [copied, setCopied] = useState(false);
  const config = statusConfig[shipment.status] ?? statusConfig.pending;

  function handleCopyAndOpen() {
    navigator.clipboard.writeText(shipment.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(`https://www.linkcorreios.com.br/?id=${shipment.trackingCode}`, '_blank');
  }

  function handleCopy() {
    navigator.clipboard.writeText(shipment.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      {/* Header com codigo e status */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-base font-bold themed-text font-mono">{shipment.trackingCode}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {shipment.recipientName && (
        <p className="text-sm themed-text-secondary mb-1">Destinatario: {shipment.recipientName}</p>
      )}

      <p className="text-xs themed-text-muted mb-4">
        Adicionado: {new Date(shipment.createdAt).toLocaleDateString('pt-BR')}, {new Date(shipment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {/* Botoes */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-sm themed-text-secondary hover:themed-text hover:border-slate-500 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado!' : 'Copiar codigo'}
        </button>
      </div>

      {/* CTA principal */}
      <div className="text-center">
        <p className="text-sm themed-text-secondary mb-1">
          Para ver as movimentacoes, consulte direto no site dos Correios.
        </p>
        <p className="text-xs themed-text-muted mb-4">
          O codigo sera copiado automaticamente.
        </p>

        <button
          onClick={handleCopyAndOpen}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Search className="w-4 h-4" />
          Abrir Correios e copiar codigo
        </button>

        <p className="text-xs themed-text-muted mt-3 font-mono">{shipment.trackingCode}</p>
      </div>
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
