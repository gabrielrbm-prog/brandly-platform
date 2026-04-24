import { useEffect, useState } from 'react';
import { UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_DESCRIPTIONS,
  type AdminRole,
} from '@/lib/permissions';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole | null;
  status: string;
  createdAt: string;
}

const ROLE_OPTIONS: AdminRole[] = ['super_admin', 'educator', 'financial', 'moderator', 'viewer'];

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: '#A78BFA',
  educator: '#60A5FA',
  financial: '#34D399',
  moderator: '#FBBF24',
  viewer: '#9CA3AF',
};

export default function AdminTeam() {
  const toast = useToast();
  const { user, can } = useAuth();
  const canManage = can('manage_team');

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState<AdminRole>('viewer');
  const [promoting, setPromoting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.team();
      setTeam(res.team as TeamMember[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar time');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleChangeRole(memberId: string, newRole: AdminRole) {
    setSavingId(memberId);
    try {
      await adminApi.setAdminRole(memberId, newRole);
      toast.success('Cargo atualizado');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cargo');
    } finally {
      setSavingId(null);
    }
  }

  async function handlePromote(e: React.FormEvent) {
    e.preventDefault();
    if (!promoteEmail || !promoteRole) return;
    setPromoting(true);
    try {
      await adminApi.promoteToAdmin(promoteEmail.trim(), promoteRole);
      toast.success('Usuario promovido. Pessa para fazer logout/login.');
      setPromoteEmail('');
      setPromoteRole('viewer');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao promover');
    } finally {
      setPromoting(false);
    }
  }

  async function handleDemote(member: TeamMember) {
    if (!confirm(`Remover privilegios admin de "${member.name}"? Ele(a) volta a ser creator.`)) return;
    setSavingId(member.id);
    try {
      await adminApi.demoteAdmin(member.id);
      toast.success('Admin rebaixado');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao rebaixar');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageContainer title="Time Admin">
      <p className="text-sm themed-text-muted mb-6">
        Gerencie quem tem acesso administrativo e quais permissoes cada um tem.
      </p>

      {/* Promote new admin */}
      {canManage && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-primary-light" />
            Promover usuario existente a admin
          </h2>
          <form onSubmit={handlePromote} className="flex flex-col md:flex-row gap-3">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              required
              className="flex-1"
            />
            <select
              value={promoteRole}
              onChange={(e) => setPromoteRole(e.target.value as AdminRole)}
              className="themed-input rounded-xl px-3 py-2 border themed-border"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
              ))}
            </select>
            <Button type="submit" loading={promoting} disabled={!promoteEmail}>
              Promover
            </Button>
          </form>
          <p className="text-xs themed-text-muted mt-3">
            {ADMIN_ROLE_DESCRIPTIONS[promoteRole]}
          </p>
        </Card>
      )}

      {/* Team list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {team.length} {team.length === 1 ? 'admin' : 'admins'}
          </h2>
          <button
            onClick={load}
            className="text-xs themed-text-muted hover:themed-text flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <p className="text-sm themed-text-muted">Carregando...</p>
        ) : team.length === 0 ? (
          <p className="text-sm themed-text-muted">Nenhum admin cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {team.map((member) => {
              const isSelf = member.id === user?.id;
              const role = member.adminRole;
              const color = role ? ROLE_COLORS[role] : '#6B7280';
              return (
                <div
                  key={member.id}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border themed-border themed-surface-light"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold themed-text">{member.name}</span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-primary-light font-semibold">
                          VOCE
                        </span>
                      )}
                    </div>
                    <p className="text-xs themed-text-muted truncate">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ color, backgroundColor: `${color}15` }}
                    >
                      {role ? ADMIN_ROLE_LABELS[role] : 'Sem cargo'}
                    </span>

                    {canManage && (
                      <select
                        value={role ?? ''}
                        disabled={savingId === member.id || (isSelf && role === 'super_admin')}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as AdminRole)}
                        className="themed-input rounded-lg px-2 py-1 text-xs border themed-border"
                      >
                        <option value="" disabled>Definir cargo...</option>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}

                    {canManage && !isSelf && (
                      <button
                        onClick={() => handleDemote(member)}
                        disabled={savingId === member.id}
                        title="Rebaixar a creator"
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Roles legend */}
      <Card className="mt-6">
        <h2 className="text-base font-semibold mb-3">O que cada cargo faz</h2>
        <div className="space-y-2">
          {ROLE_OPTIONS.map((r) => (
            <div key={r} className="flex gap-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full h-fit shrink-0"
                style={{ color: ROLE_COLORS[r], backgroundColor: `${ROLE_COLORS[r]}15` }}
              >
                {ADMIN_ROLE_LABELS[r]}
              </span>
              <p className="text-sm themed-text-muted">{ADMIN_ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
