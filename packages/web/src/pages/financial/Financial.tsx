import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Clock,
  ArrowDownCircle,
  TrendingUp,
  Video,
  Users,
  Award,
  Send,
  X,
  CreditCard,
} from 'lucide-react';
import { financialApi } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface Balance { available: string; pending: string; withdrawn: string; totalEarned: string }
interface ApiEarnings {
  period: string;
  breakdown: {
    videos: { total: string; count: number };
    commissions: { total: string; count: number };
    bonuses: { total: string; count: number };
  };
  grandTotal: string;
}
interface Transaction {
  id: string; type: string; description: string; amount: string; createdAt: string; status: string;
}

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

const TYPE_ICONS: Record<string, typeof DollarSign> = { video: Video, commission: Users, bonus: Award, withdrawal: ArrowDownCircle };

export default function Financial() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [earnings, setEarnings] = useState<ApiEarnings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, e, histRes] = await Promise.all([
        financialApi.balance() as Promise<Balance>,
        financialApi.earnings() as Promise<ApiEarnings>,
        financialApi.history() as Promise<{ payments: Transaction[] }>,
      ]);
      setBalance(b);
      setEarnings(e);
      setTransactions(histRes.payments ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleWithdraw() {
    if (!pixKey.trim() || !amount.trim()) return;
    setWithdrawing(true);
    try {
      await financialApi.withdraw({ pixKey: pixKey.trim(), amount: parseFloat(amount) });
      setShowWithdraw(false);
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Erro ao solicitar saque.');
    } finally { setWithdrawing(false); }
  }

  if (loading) return <PageContainer title="Financeiro"><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageContainer>;

  return (
    <PageContainer title="Financeiro">
      <div className="space-y-6">
        {/* Balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard glowing icon={<DollarSign className="w-4 h-4" />} label="Disponivel" value={`R$ ${balance?.available ?? '0.00'}`} color="#10B981" />
          <StatCard glowing icon={<Clock className="w-4 h-4" />} label="Pendente" value={`R$ ${balance?.pending ?? '0.00'}`} color="#F59E0B" />
          <StatCard glowing icon={<ArrowDownCircle className="w-4 h-4" />} label="Sacado" value={`R$ ${balance?.withdrawn ?? '0.00'}`} color="#3B82F6" />
          <StatCard glowing icon={<TrendingUp className="w-4 h-4" />} label="Total" value={`R$ ${balance?.totalEarned ?? '0.00'}`} color="#7C3AED" />
        </div>

        {/* Withdraw CTA */}
        <Button onClick={() => setShowWithdraw(true)} icon={<CreditCard className="w-5 h-5" />} className="w-full">
          Solicitar Saque PIX
        </Button>

        {/* Earnings breakdown */}
        {earnings && (
          <Card glowing>
            <h3 className="text-sm font-semibold themed-text-secondary mb-3">Ganhos do Mes</h3>
            <div className="space-y-3">
              {[
                { label: 'Videos', count: earnings.breakdown.videos.count, amount: earnings.breakdown.videos.total, color: '#3B82F6', icon: Video },
                { label: 'Comissoes', count: earnings.breakdown.commissions.count, amount: earnings.breakdown.commissions.total, color: '#7C3AED', icon: Users },
                { label: 'Bonus', count: earnings.breakdown.bonuses.count, amount: earnings.breakdown.bonuses.total, color: '#F59E0B', icon: Award },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between themed-surface-light rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-sm themed-text-secondary">{item.label}</span>
                    <Badge variant="default">{item.count}x</Badge>
                  </div>
                  <span className="text-sm font-bold themed-text">R$ {item.amount}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t themed-border">
                <span className="text-sm font-semibold themed-text-secondary">Total</span>
                <span className="text-lg font-bold text-emerald-400">R$ {earnings.grandTotal}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <div>
          <h3 className="text-lg font-bold themed-text mb-3">Historico</h3>
          {transactions.length === 0 ? (
            <p className="text-center themed-text-muted py-8">Nenhuma transacao ainda.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const Icon = TYPE_ICONS[tx.type] ?? DollarSign;
                const isWithdrawal = tx.type === 'withdrawal';
                return (
                  <div key={tx.id} className="flex items-center gap-3 themed-surface rounded-xl themed-border p-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isWithdrawal ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                      <Icon className="w-4 h-4" style={{ color: isWithdrawal ? '#EF4444' : '#10B981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium themed-text truncate">{tx.description}</p>
                      <p className="text-xs themed-text-muted">{fmtDate(tx.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-bold ${isWithdrawal ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isWithdrawal ? '-' : '+'}R$ {tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowWithdraw(false)} />
          <div className="relative w-full max-w-md themed-surface rounded-t-2xl sm:rounded-2xl themed-border p-6 mx-0 sm:mx-4">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 themed-text-muted hover:themed-text"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold themed-text mb-5">Saque PIX</h3>
            <div className="space-y-4">
              <Input label="Chave PIX" icon={<CreditCard className="w-4 h-4" />} placeholder="CPF, email, celular ou chave aleatoria" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
              <Input label="Valor" icon={<DollarSign className="w-4 h-4" />} placeholder="0.00" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs themed-text-muted">Disponivel: R$ {balance?.available ?? '0.00'}</p>
              <Button onClick={handleWithdraw} loading={withdrawing} icon={<Send className="w-4 h-4" />} className="w-full">Solicitar</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
