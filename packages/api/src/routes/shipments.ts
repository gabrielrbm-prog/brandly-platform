/**
 * Rotas de rastreamento de envios — /api/shipments
 *
 * Gerencia envios com rastreamento pelos Correios.
 * Todos os endpoints exigem autenticacao via JWT.
 */

import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { shipments, users } from '@brandly/core';
import { eq, and, or, desc, not, inArray, count, sql } from 'drizzle-orm';
import {
  trackPackage,
  isValidCorreiosCode,
} from '../services/correios-tracking.js';

// ============================================
// INTERFACES
// ============================================

interface CreateShipmentBody {
  trackingCode: string;
  saleId?: string;
  userId?: string;
  recipientName?: string;
  recipientCpf?: string;
  destinationCity?: string;
  destinationState?: string;
  carrier?: string;
}

interface UpdateShipmentBody {
  trackingCode?: string;
  recipientName?: string;
  recipientCpf?: string;
  destinationCity?: string;
  destinationState?: string;
  carrier?: string;
}

interface ListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

// Estados terminais — envios nestes estados nao precisam de atualizacao
const TERMINAL_STATUSES = ['delivered', 'returned', 'failed'] as const;

// ============================================
// ROTAS
// ============================================

export async function shipmentRoutes(app: FastifyInstance) {
  // GET /api/shipments — listar envios com paginacao
  app.get<{ Querystring: ListQuery }>('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const page = Math.max(1, Number(request.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 20)));
    const offset = (page - 1) * limit;
    const statusFilter = request.query.status;

    const conditions: ReturnType<typeof eq>[] = [];

    // Creators veem envios destinados a eles ou criados por eles; admins veem todos
    if (role !== 'admin') {
      conditions.push(or(eq(shipments.createdBy, userId), eq(shipments.userId, userId))!);
    }

    if (statusFilter) {
      conditions.push(
        eq(
          shipments.status,
          statusFilter as typeof shipments.status._.data,
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(shipments)
        .where(whereClause)
        .orderBy(desc(shipments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(shipments)
        .where(whereClause),
    ]);

    return {
      shipments: rows,
      total: totalResult[0]?.total ?? 0,
      page,
      limit,
    };
  });

  // GET /api/shipments/buyers — lista de compradores (has_purchased = true)
  app.get('/buyers', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user;
    if (role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso restrito' });
    }

    const buyers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.hasPurchased, true))
      .orderBy(users.name);

    return { buyers };
  });

  // GET /api/shipments/compradores — painel de compradores da planilha de vendas
  app.get('/compradores', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { role } = request.user;
    if (role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso restrito' });
    }

    // 1. Ler planilha de vendas
    const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/19SDQsSIz2GNCqeibXQcetHb-TRIPFQSkBYo5zewmgGw/export?format=csv';
    let sheetRows: Array<{
      data: string; cliente: string; celular: string; email: string;
      produto: string; oferta: string; cidade: string; estado: string; cep: string;
    }> = [];

    try {
      const res = await fetch(SHEET_CSV, { redirect: 'follow', signal: AbortSignal.timeout(15_000) });
      if (res.ok) {
        const csv = await res.text();
        const lines = csv.split('\n').slice(1);
        for (const line of lines) {
          // CSV com possíveis campos entre aspas
          const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) ?? line.split(',').map(c => c.trim());
          const email = (cols[3] ?? '').toLowerCase();
          if (!email || !email.includes('@')) continue;
          sheetRows.push({
            data: cols[0] ?? '',
            cliente: cols[1] ?? '',
            celular: cols[2] ?? '',
            email,
            produto: cols[4] ?? '',
            oferta: cols[5] ?? '',
            cidade: cols[11] ?? '',
            estado: cols[12] ?? '',
            cep: cols[13] ?? '',
          });
        }
      }
    } catch { /* silent */ }

    // 2. Buscar usuários correspondentes no banco
    const sheetEmails = sheetRows.map(r => r.email);
    let userRows: any[] = [];
    if (sheetEmails.length > 0) {
      userRows = await db
        .select({ id: users.id, name: users.name, email: users.email, status: users.status, createdAt: users.createdAt, onboardingCompleted: users.onboardingCompleted })
        .from(users)
        .where(inArray(users.email, sheetEmails));
    }
    const userMap = new Map(userRows.map((u: any) => [u.email, u]));

    // 3. Buscar envios
    const userIds = userRows.map((u: any) => u.id);
    let shipmentRows: any[] = [];
    if (userIds.length > 0) {
      shipmentRows = await db.select().from(shipments).where(inArray(shipments.userId, userIds)).orderBy(desc(shipments.createdAt));
    }
    const shipmentMap = new Map<string, any[]>();
    for (const s of shipmentRows) {
      const list = shipmentMap.get(s.userId) ?? [];
      list.push(s);
      shipmentMap.set(s.userId, list);
    }

    // 4. Montar resultado
    const compradores = sheetRows.map(row => {
      const user = userMap.get(row.email);
      return {
        ...row,
        temConta: !!user,
        userId: user?.id ?? null,
        statusConta: user?.status ?? null,
        cadastroPlataforma: user?.createdAt ?? null,
        onboardingCompleted: user?.onboardingCompleted ?? false,
        shipments: user ? (shipmentMap.get(user.id) ?? []) : [],
      };
    });

    return { compradores, total: compradores.length };
  });

  // GET /api/shipments/summary — contagem por status (para o card de resumo)
  app.get('/summary', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const { userId, role } = request.user;

    const baseCondition = role !== 'admin'
      ? eq(shipments.createdBy, userId)
      : undefined;

    const rows = await db
      .select({
        status: shipments.status,
        total: count(),
      })
      .from(shipments)
      .where(baseCondition)
      .groupBy(shipments.status);

    const summary: Record<string, number> = {
      pending: 0,
      posted: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      returned: 0,
      failed: 0,
    };

    for (const row of rows) {
      summary[row.status] = Number(row.total);
    }

    return { summary };
  });

  // GET /api/shipments/:id — detalhe de um envio
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { id } = request.params;

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!shipment) {
      return reply.status(404).send({ error: 'Envio nao encontrado' });
    }

    // Creators so acessam os proprios registros
    if (role !== 'admin' && shipment.createdBy !== userId) {
      return reply.status(403).send({ error: 'Acesso nao autorizado' });
    }

    return { shipment };
  });

  // GET /api/shipments/:id/tracking — eventos de rastreamento apenas
  app.get<{ Params: { id: string } }>('/:id/tracking', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { id } = request.params;

    const [shipment] = await db
      .select({
        id: shipments.id,
        trackingCode: shipments.trackingCode,
        status: shipments.status,
        lastEvent: shipments.lastEvent,
        lastEventDate: shipments.lastEventDate,
        events: shipments.events,
        updatedAt: shipments.updatedAt,
        createdBy: shipments.createdBy,
      })
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!shipment) {
      return reply.status(404).send({ error: 'Envio nao encontrado' });
    }

    if (role !== 'admin' && shipment.createdBy !== userId) {
      return reply.status(403).send({ error: 'Acesso nao autorizado' });
    }

    return {
      trackingCode: shipment.trackingCode,
      status: shipment.status,
      lastEvent: shipment.lastEvent,
      lastEventDate: shipment.lastEventDate,
      events: shipment.events ?? [],
      updatedAt: shipment.updatedAt,
    };
  });

  // POST /api/shipments — criar envio e ja consultar Correios
  app.post<{ Body: CreateShipmentBody }>('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const {
      trackingCode,
      saleId,
      userId: targetUserId,
      recipientName,
      recipientCpf,
      destinationCity,
      destinationState,
      carrier = 'correios',
    } = request.body;

    if (!trackingCode) {
      return reply.status(400).send({ error: 'trackingCode e obrigatorio' });
    }

    const code = trackingCode.toUpperCase().trim();

    if (!isValidCorreiosCode(code)) {
      return reply.status(400).send({
        error: 'Codigo de rastreamento invalido. Formato esperado: AA123456789BR (ex: SS987654321BR)',
      });
    }

    // Consultar Correios imediatamente ao cadastrar
    const tracking = await trackPackage(code);

    const [shipment] = await db
      .insert(shipments)
      .values({
        trackingCode: code,
        saleId: saleId ?? null,
        carrier,
        status: tracking.status,
        recipientName: recipientName ?? null,
        recipientCpf: recipientCpf ?? null,
        destinationCity: destinationCity ?? null,
        destinationState: destinationState ?? null,
        lastEvent: tracking.lastEvent,
        lastEventDate: tracking.lastEventDate,
        events: tracking.events,
        createdBy: userId,
        userId: targetUserId ?? null,
      })
      .returning();

    const response: Record<string, unknown> = {
      shipment,
      message: 'Envio cadastrado com sucesso',
    };

    if (tracking.error) {
      response.warning = tracking.error;
    }

    return reply.status(201).send(response);
  });

  // PATCH /api/shipments/:id — atualizar dados do envio
  app.patch<{ Params: { id: string }; Body: UpdateShipmentBody }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { id } = request.params;

    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Envio nao encontrado' });
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      return reply.status(403).send({ error: 'Acesso nao autorizado' });
    }

    const {
      trackingCode,
      recipientName,
      recipientCpf,
      destinationCity,
      destinationState,
      carrier,
    } = request.body;

    // Se mudou o codigo, validar
    if (trackingCode) {
      const code = trackingCode.toUpperCase().trim();
      if (!isValidCorreiosCode(code)) {
        return reply.status(400).send({
          error: 'Codigo de rastreamento invalido. Formato esperado: AA123456789BR',
        });
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (trackingCode !== undefined) updates.trackingCode = trackingCode.toUpperCase().trim();
    if (recipientName !== undefined) updates.recipientName = recipientName;
    if (recipientCpf !== undefined) updates.recipientCpf = recipientCpf;
    if (destinationCity !== undefined) updates.destinationCity = destinationCity;
    if (destinationState !== undefined) updates.destinationState = destinationState;
    if (carrier !== undefined) updates.carrier = carrier;

    const [updated] = await db
      .update(shipments)
      .set(updates)
      .where(eq(shipments.id, id))
      .returning();

    return { shipment: updated, message: 'Envio atualizado com sucesso' };
  });

  // DELETE /api/shipments/:id — remover envio
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { id } = request.params;

    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Envio nao encontrado' });
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      return reply.status(403).send({ error: 'Acesso nao autorizado' });
    }

    await db.delete(shipments).where(eq(shipments.id, id));

    return { message: 'Envio removido com sucesso' };
  });

  // POST /api/shipments/:id/refresh — atualizar rastreamento de um envio especifico
  app.post<{ Params: { id: string } }>('/:id/refresh', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { id } = request.params;

    const [existing] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Envio nao encontrado' });
    }

    if (role !== 'admin' && existing.createdBy !== userId) {
      return reply.status(403).send({ error: 'Acesso nao autorizado' });
    }

    const tracking = await trackPackage(existing.trackingCode);

    const [updated] = await db
      .update(shipments)
      .set({
        status: tracking.status,
        lastEvent: tracking.lastEvent,
        lastEventDate: tracking.lastEventDate,
        events: tracking.events,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, id))
      .returning();

    const response: Record<string, unknown> = {
      shipment: updated,
      message: 'Rastreamento atualizado',
    };

    if (tracking.error) {
      response.warning = tracking.error;
    }

    return response;
  });

  // POST /api/shipments/refresh-all — atualizar todos os envios ativos (cron)
  app.post('/refresh-all', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    // Buscar envios que nao estao em estado terminal
    const activeShipments = await db
      .select({ id: shipments.id, trackingCode: shipments.trackingCode })
      .from(shipments)
      .where(
        not(
          inArray(shipments.status, [...TERMINAL_STATUSES]),
        ),
      );

    let updated = 0;
    let errors = 0;

    for (const shipment of activeShipments) {
      try {
        const tracking = await trackPackage(shipment.trackingCode);

        if (!tracking.error) {
          await db
            .update(shipments)
            .set({
              status: tracking.status,
              lastEvent: tracking.lastEvent,
              lastEventDate: tracking.lastEventDate,
              events: tracking.events,
              updatedAt: new Date(),
            })
            .where(eq(shipments.id, shipment.id));

          updated++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    return {
      message: `Refresh concluido: ${updated} atualizados, ${errors} erros`,
      total: activeShipments.length,
      updated,
      errors,
    };
  });
}
