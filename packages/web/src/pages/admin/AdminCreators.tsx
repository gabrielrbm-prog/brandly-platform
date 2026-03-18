import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { adminApi, type AdminUser } from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';

const LIMIT = 20;

function formatDate(d: string) {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

const LEVEL_COLORS: Record<string, string> = {
  Seed: '#9CA3AF',
  Spark: '#FBBF24',
  Flow: '#34D399',
  Iconic: '#60A5FA',
  Vision: '#A78BFA',
  Empire: '#F472B6',
  Infinity: '#FBBF24',
};

export default function AdminCreators() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users(page, LIMIT, search || undefined);
      setUsers(res.users ?? []);
      setTotal(res.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <PageContainer title="Admin — Creators">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 themed-text-secondary" />
            <h2 className="text-lg font-bold themed-text">Creators Cadastrados</h2>
            <Badge variant="primary">{total}</Badge>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Buscar por nome ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Buscar
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-10 h-10 themed-text-muted mx-auto mb-3" />
              <p className="themed-text-secondary">Nenhum creator encontrado</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Desktop table header */}
            <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2">
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Nome</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Email</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Nivel</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Status</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider">Cadastro</span>
              <span className="text-xs font-semibold themed-text-muted uppercase tracking-wider"></span>
            </div>

            {users.map((user) => {
              const levelColor = LEVEL_COLORS[user.level ?? 'Seed'] ?? '#9CA3AF';
              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/admin/creators/${user.id}`)}
                  className="rounded-2xl border themed-border themed-surface p-4 cursor-pointer hover:border-brand-primary/30 transition-all"
                >
                  {/* Mobile layout */}
                  <div className="flex items-center gap-3 md:hidden">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/15 flex items-center justify-center text-sm font-bold text-brand-primary-light shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold themed-text truncate">{user.name}</p>
                      <p className="text-xs themed-text-muted truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {user.level && (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: levelColor }}
                          >
                            {user.level}
                          </span>
                        )}
                        {user.onboardingCompleted ? (
                          <Badge variant="success" className="text-xs">Ativo</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Onboarding</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 themed-text-muted shrink-0" />
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/15 flex items-center justify-center text-sm font-bold text-brand-primary-light shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium themed-text truncate">{user.name}</span>
                    </div>
                    <span className="text-sm themed-text-secondary truncate">{user.email}</span>
                    <span className="text-sm font-semibold" style={{ color: levelColor }}>
                      {user.level ?? 'Seed'}
                    </span>
                    <div>
                      {user.onboardingCompleted ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          Onboarding
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm themed-text-muted">{formatDate(user.createdAt)}</span>
                    <ChevronRight className="w-4 h-4 themed-text-muted" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
            <span className="text-sm themed-text-secondary">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Proxima
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
