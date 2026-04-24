import type { FastifyInstance } from 'fastify';
import { db, users, type AdminRole } from '@brandly/core';
import { eq, and, asc } from 'drizzle-orm';

const VALID_ADMIN_ROLES: AdminRole[] = [
  'super_admin',
  'educator',
  'financial',
  'moderator',
  'viewer',
];

export async function adminTeamRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /api/admin/team
  // Lista todos os usuarios com role=admin + adminRole atual
  // Qualquer admin pode visualizar
  // ----------------------------------------------------------
  app.get(
    '/team',
    { preHandler: [app.requireAdmin] },
    async () => {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          adminRole: users.adminRole,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, 'admin'))
        .orderBy(asc(users.name));

      return { team: rows };
    },
  );

  // ----------------------------------------------------------
  // PATCH /api/admin/team/:userId/role
  // Altera o adminRole de um membro do time
  // Restrito a super_admin (manage_team)
  // ----------------------------------------------------------
  app.patch<{
    Params: { userId: string };
    Body: { adminRole: AdminRole };
  }>(
    '/team/:userId/role',
    { preHandler: [app.requireAdminPermission('manage_team')] },
    async (request, reply) => {
      const { userId } = request.params;
      const { adminRole } = request.body;
      const { userId: actorId } = request.user;

      if (!adminRole || !VALID_ADMIN_ROLES.includes(adminRole)) {
        return reply.status(400).send({
          error: `adminRole invalido. Aceitos: ${VALID_ADMIN_ROLES.join(', ')}`,
        });
      }

      const [target] = await db
        .select({ id: users.id, name: users.name, role: users.role, adminRole: users.adminRole })
        .from(users)
        .where(eq(users.id, userId));

      if (!target) {
        return reply.status(404).send({ error: 'Usuario nao encontrado' });
      }
      if (target.role !== 'admin') {
        return reply.status(400).send({ error: 'Usuario nao e admin. Use /promote primeiro.' });
      }

      // Guarda: nao se rebaixar pra evitar lockout acidental
      if (target.id === actorId && adminRole !== 'super_admin') {
        return reply.status(400).send({
          error: 'Voce nao pode rebaixar seu proprio cargo. Pessa para outro super_admin.',
        });
      }

      await db
        .update(users)
        .set({ adminRole, updatedAt: new Date() })
        .where(eq(users.id, userId));

      app.log.info(
        { targetId: userId, newRole: adminRole, actorId, previousRole: target.adminRole },
        'Admin role atualizado',
      );

      return { ok: true, message: `Cargo de "${target.name}" atualizado para "${adminRole}"` };
    },
  );

  // ----------------------------------------------------------
  // POST /api/admin/team/promote
  // Promove um usuario existente (por email) a admin com cargo definido
  // Restrito a super_admin
  // ----------------------------------------------------------
  app.post<{
    Body: { email: string; adminRole: AdminRole };
  }>(
    '/team/promote',
    { preHandler: [app.requireAdminPermission('manage_team')] },
    async (request, reply) => {
      const { email, adminRole } = request.body;
      const { userId: actorId } = request.user;

      if (!email || !adminRole) {
        return reply.status(400).send({ error: 'email e adminRole sao obrigatorios' });
      }
      if (!VALID_ADMIN_ROLES.includes(adminRole)) {
        return reply.status(400).send({
          error: `adminRole invalido. Aceitos: ${VALID_ADMIN_ROLES.join(', ')}`,
        });
      }

      const [target] = await db
        .select({ id: users.id, name: users.name, role: users.role })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      if (!target) {
        return reply.status(404).send({
          error: 'Usuario nao encontrado com esse email. Pessa para criar conta primeiro.',
        });
      }

      await db
        .update(users)
        .set({ role: 'admin', adminRole, updatedAt: new Date() })
        .where(eq(users.id, target.id));

      app.log.info(
        { targetId: target.id, email, adminRole, actorId, previousRole: target.role },
        'Usuario promovido a admin',
      );

      return {
        ok: true,
        message: `"${target.name}" promovido a admin com cargo "${adminRole}". Pessa para fazer logout e login novamente.`,
      };
    },
  );

  // ----------------------------------------------------------
  // POST /api/admin/team/:userId/demote
  // Remove privilegios admin (volta a creator)
  // ----------------------------------------------------------
  app.post<{ Params: { userId: string } }>(
    '/team/:userId/demote',
    { preHandler: [app.requireAdminPermission('manage_team')] },
    async (request, reply) => {
      const { userId } = request.params;
      const { userId: actorId } = request.user;

      if (userId === actorId) {
        return reply.status(400).send({ error: 'Voce nao pode se rebaixar.' });
      }

      const [target] = await db
        .select({ id: users.id, name: users.name, role: users.role })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.role, 'admin')));

      if (!target) {
        return reply.status(404).send({ error: 'Admin nao encontrado' });
      }

      await db
        .update(users)
        .set({ role: 'creator', adminRole: null, updatedAt: new Date() })
        .where(eq(users.id, userId));

      app.log.info(
        { targetId: userId, actorId },
        'Admin rebaixado a creator',
      );

      return { ok: true, message: `"${target.name}" voltou a ser creator.` };
    },
  );
}
