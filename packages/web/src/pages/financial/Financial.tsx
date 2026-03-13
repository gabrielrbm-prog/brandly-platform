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

interface Balance { available: number; pending: number; withdrawn: number; total: number }
interface Earnings {
  videos: { amount: number; count: number };
  commissions: { amount: number; count: number };
  bonuses: { amount: number; count: number };
  total: number;
}
interface Transaction {
  id: string; type: string; description: string; amount: number; date: string; status: string;
}

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

const TYPE_ICONS: Record<string, typeof DollarSign> = { video: Video, commission: Users, bonus: Award, withdrawal: ArrowDownCircle };

export default function Financial() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, e, h] = await Promise.all([
        financialApi.balance() as Promise<Balance>,
        financialApi.earnings() as Promise<Earnings>,
        financialApi.history() as Promise<Transaction[]>,
      ]);
      setBalance(b); setEarnings(e); setTransactions(h);
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
          <StatCard glowing icon={<DollarSign className="w-4 h-4" />} label="Disponivel" value={fmt(balance?.available ?? 0)} color="#10B981" />
          <StatCard glowing icon={<Clock className="w-4 h-4" />} label="Pendente" value={fmt(balance?.pending ?? 0)} color="#F59E0B" />
          <StatCard glowing icon={<ArrowDownCircle className="w-4 h-4" />} label="Sacado" value={fmt(balance?.withdrawn ?? 0)} color="#3B82F6" />
          <StatCard glowing icon={<TrendingUp className="w-4 h-4" />} label="Total" value={fmt(balance?.total ?? 0)} color="#7C3AED" />
        </div>

        {/* Withdraw CTA */}
        <Button onClick={() => setShowWithdraw(true)} icon={<CreditCard className="w-5 h-5" />} className="w-full">
          Solicitar Saque PIX
        </Button>

        {/* Earnings breakdown */}
        {earnings && (
          <Card glowing>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Ganhos do Mes</h3>
            <div className="space-y-3">
              {[
                { label: 'Videos', count: earnings.videos.count, amount: earnings.videos.amount, color: '#3B82F6', icon: Video },
                { label: 'Comissoes', count: earnings.commissions.count, amount: earnings.commissions.amount, color: '#7C3AED', icon: Users },
                { label: 'Bonus', count: earnings.bonuses.count, amount: earnings.bonuses.amount, color: '#F59E0B', icon: Award },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-surface-light rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <Badge variant="default">{item.count}x</Badge>
                  </div>
                  <span className="text-sm font-bold text-white">{fmt(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="text-sm font-semibold text-gray-300">Total</span>
                <span className="text-lg font-bold text-emerald-400">{fmt(earnings.total)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Historico</h3>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhuma transacao ainda.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const Icon = TYPE_ICONS[tx.type] ?? DollarSign;
                const isWithdrawal = tx.type === 'withdrawal';
                return (
                  <div key={tx.id} className="flex items-center gap-3 bg-surface rounded-xl border border-gray-800 p-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isWithdrawal ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                      <Icon className="w-4 h-4" style={{ color: isWithdrawal ? '#EF4444' : '#10B981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                      <p className="text-xs text-gray-500">{fmtDate(tx.date)}</p>
                    </div>
                    <span className={`text-sm font-bold ${isWithdrawal ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isWithdrawal ? '-' : '+'}{fmt(tx.amount)}
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
          <div className="relative w-full max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-gray-800 p-6 mx-0 sm:mx-4">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-white mb-5">Saque PIX</h3>
            <div className="space-y-4">
              <Input label="Chave PIX" icon={<CreditCard className="w-4 h-4" />} placeholder="CPF, email, celular ou chave aleatoria" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
              <Input label="Valor" icon={<DollarSign className="w-4 h-4" />} placeholder="0.00" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-gray-500">Disponivel: {fmt(balance?.available ?? 0)}</p>
              <Button onClick={handleWithdraw} loading={withdrawing} icon={<Send className="w-4 h-4" />} className="w-full">Solicitar</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
