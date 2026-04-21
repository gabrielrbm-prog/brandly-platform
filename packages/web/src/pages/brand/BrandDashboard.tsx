import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Users, Wallet, TrendingUp } from 'lucide-react';
import { brandPortalApi } from '@/lib/api';

export default function BrandDashboard() {
  const [stats, setStats] = useState({
    creators: 0,
    pendingVideos: 0,
    approvedThisMonth: 0,
    pendingPayouts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [creatorsRes, pendingRes, approvedRes, payoutsRes] = await Promise.all([
          brandPortalApi.creators(),
          brandPortalApi.videos('pending'),
          brandPortalApi.videos('approved'),
          brandPortalApi.payouts(),
        ]);

        const period = new Date().toISOString().slice(0, 7);
        const approvedMonth = approvedRes.videos.filter(
          (v) => v.reviewedAt?.startsWith(period),
        ).length;
        const pendingPayouts = payoutsRes.payouts.filter((p) => p.status === 'pending').length;

        setStats({
          creators: creatorsRes.creators.length,
          pendingVideos: pendingRes.videos.length,
          approvedThisMonth: approvedMonth,
          pendingPayouts,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = [
    { label: 'Creators ativos', value: stats.creators, icon: Users, color: 'text-blue-400', to: '/marca/creators' },
    { label: 'Videos pendentes', value: stats.pendingVideos, icon: Film, color: 'text-yellow-400', to: '/marca/videos?status=pending' },
    { label: 'Aprovados no mes', value: stats.approvedThisMonth, icon: TrendingUp, color: 'text-green-400', to: '/marca/videos?status=approved' },
    { label: 'Pagamentos pendentes', value: stats.pendingPayouts, icon: Wallet, color: 'text-purple-400', to: '/marca/pagamentos' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold themed-text mb-2">Painel</h1>
      <p className="themed-text-muted mb-6">Visao geral da sua marca na Brandly</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="themed-surface-card border themed-border rounded-xl p-4 md:p-5 hover:border-brand-primary/50 transition-colors"
          >
            <card.icon className={`w-6 h-6 ${card.color} mb-3`} />
            <div className="text-2xl md:text-3xl font-bold themed-text">
              {loading ? '—' : card.value}
            </div>
            <div className="text-xs themed-text-muted mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="themed-surface-card border themed-border rounded-xl p-6">
        <h2 className="text-lg font-bold themed-text mb-3">Proximos passos</h2>
        <ol className="space-y-3 themed-text-secondary text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary-light text-xs font-bold flex items-center justify-center">1</span>
            <span>Veja seus creators na aba <Link to="/marca/creators" className="text-brand-primary-light underline">Creators</Link></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary-light text-xs font-bold flex items-center justify-center">2</span>
            <span>Aprove ou rejeite videos pendentes em <Link to="/marca/videos?status=pending" className="text-brand-primary-light underline">Videos</Link></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary-light text-xs font-bold flex items-center justify-center">3</span>
            <span>Gere pagamentos mensais em <Link to="/marca/pagamentos" className="text-brand-primary-light underline">Pagamentos</Link></span>
          </li>
        </ol>
      </div>
    </div>
  );
}
