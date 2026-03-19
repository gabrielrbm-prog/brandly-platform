import { useState } from 'react';
import { Download, Users, DollarSign, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Marco' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

function buildYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2].map(String);
}

// ─── Export Card ──────────────────────────────────────────────────────────────

interface ExportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  children?: React.ReactNode;
  onDownload: () => Promise<void>;
}

function ExportCard({
  icon,
  title,
  description,
  accentColor,
  children,
  onDownload,
}: ExportCardProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<Date | null>(null);

  async function handleDownload() {
    setLoading(true);
    try {
      await onDownload();
      setLastDownloaded(new Date());
      toast.success(`${title} exportado com sucesso.`);
    } catch (err: any) {
      toast.error(err?.message ?? `Erro ao exportar ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border themed-border bg-white/5 backdrop-blur-sm p-6 hover:border-brand-primary/20 transition-all">
      {/* Icon + title */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        <div>
          <h3 className="font-bold themed-text">{title}</h3>
          <p className="text-sm themed-text-muted leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>

      {/* Optional controls (e.g. period selector) */}
      {children && <div className="mb-4">{children}</div>}

      {/* Footer: last downloaded + download button */}
      <div className="flex items-center justify-between">
        <div className="text-xs themed-text-muted">
          {lastDownloaded ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Exportado {lastDownloaded.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Nao exportado ainda
            </span>
          )}
        </div>
        <Button
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleDownload}
          loading={loading}
        >
          Baixar CSV
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminExport() {
  const currentDate = new Date();
  const [paymentMonth, setPaymentMonth] = useState(String(currentDate.getMonth() + 1));
  const [paymentYear, setPaymentYear] = useState(String(currentDate.getFullYear()));

  const yearOptions = buildYearOptions();

  return (
    <PageContainer title="Admin — Exportar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 themed-text-secondary" />
          <h2 className="text-lg font-bold themed-text">Exportar Dados</h2>
        </div>

        <p className="text-sm themed-text-muted -mt-1">
          Exporte dados da plataforma em formato CSV para analise externa, relatorios e auditorias.
        </p>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Creators */}
          <ExportCard
            icon={<Users className="w-5 h-5" />}
            title="Creators"
            description="Lista completa de creators com nivel de carreira, status da conta e redes sociais conectadas."
            accentColor="#7C3AED"
            onDownload={() => adminApi.exportCreators()}
          />

          {/* Pagamentos */}
          <ExportCard
            icon={<DollarSign className="w-5 h-5" />}
            title="Pagamentos"
            description="Historico de pagamentos do periodo selecionado, incluindo videos, comissoes e bonus."
            accentColor="#10B981"
            onDownload={() => adminApi.exportPayments(paymentMonth, paymentYear)}
          >
            {/* Period selector */}
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium themed-text-muted">Mes</label>
                <select
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="w-full rounded-xl border themed-border themed-surface px-3 py-2 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium themed-text-muted">Ano</label>
                <select
                  value={paymentYear}
                  onChange={(e) => setPaymentYear(e.target.value)}
                  className="w-full rounded-xl border themed-border themed-surface px-3 py-2 text-sm themed-text focus:outline-none focus:border-brand-primary/50 transition-colors"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </ExportCard>

          {/* Videos */}
          <ExportCard
            icon={<Video className="w-5 h-5" />}
            title="Videos"
            description="Todos os videos enviados com status de aprovacao, marca vinculada e valor pago ao creator."
            accentColor="#F59E0B"
            onDownload={() => adminApi.exportVideos()}
          />
        </div>

        {/* Info box */}
        <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/15">
          <p className="text-xs themed-text-muted leading-relaxed">
            <span className="font-semibold themed-text-secondary">Sobre os exportados:</span>{' '}
            Os arquivos CSV sao gerados em tempo real com os dados atuais da plataforma.
            O encoding e UTF-8 com BOM para compatibilidade com Excel.
            Dados sensiveis como senhas nao sao incluidos.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
