import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { payments, withdrawals, trackingLinks, products } from '@brandly/core';
import { eq, and, sql, desc, sum } from 'drizzle-orm';

interface WithdrawBody {
  amount: number;
  pixKey: string;
}

export async function financialRoutes(app: FastifyInstance) {
  // GET /api/financial/balance
  app.get('/balance', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const [earned] = await db.select({
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, 'approved')));

    const [pending] = await db.select({
      total: sum(payments.amount),
    })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, 'pending')));

    const [withdrawn] = await db.select({
      total: sum(withdrawals.amount),
    })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, userId), eq(withdrawals.status, 'completed')));

    const totalEarned = Number(earned?.total ?? 0);
    const totalPending = Number(pending?.total ?? 0);
    const totalWithdrawn = Number(withdrawn?.total ?? 0);
    const available = totalEarned - totalWithdrawn;

    return {
      available: available.toFixed(2),
      pending: totalPending.toFixed(2),
      withdrawn: totalWithdrawn.toFixed(2),
      totalEarned: totalEarned.toFixed(2),
    };
  });

  // GET /api/financial/earnings
  app.get('/earnings', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const rows = await db.select({
      type: payments.type,
      total: sum(payments.amount),
      count: sql<number>`count(*)::int`,
    })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.period, currentMonth)))
      .groupBy(payments.type);

    const byType: Record<string, { total: string; count: number }> = {};
    let grandTotal = 0;
    for (const row of rows) {
      byType[row.type] = { total: Number(row.total ?? 0).toFixed(2), count: row.count };
      grandTotal += Number(row.total ?? 0);
    }

    return {
      period: currentMonth,
      breakdown: {
        videos: byType['video'] ?? { total: '0.00', count: 0 },
        commissions: byType['commission'] ?? { total: '0.00', count: 0 },
        bonuses: byType['bonus'] ?? { total: '0.00', count: 0 },
      },
      grandTotal: grandTotal.toFixed(2),
    };
  });

  // GET /api/financial/history
  app.get('/history', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { type, period } = request.query as { type?: string; period?: string };

    const conditions = [eq(payments.userId, userId)];
    if (type) conditions.push(eq(payments.type, type));
    if (period) conditions.push(eq(payments.period, period));

    const result = await db.select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(100);

    return { payments: result, total: result.length };
  });

  // POST /api/financial/withdraw
  app.post<{ Body: WithdrawBody }>('/withdraw', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { amount, pixKey } = request.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: 'amount deve ser maior que zero' });
    }

    if (!pixKey) {
      return reply.status(400).send({ error: 'pixKey e obrigatorio' });
    }

    // Verificar saldo
    const [earned] = await db.select({ total: sum(payments.amount) })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, 'approved')));

    const [alreadyWithdrawn] = await db.select({ total: sum(withdrawals.amount) })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, userId), eq(withdrawals.status, 'completed')));

    const available = Number(earned?.total ?? 0) - Number(alreadyWithdrawn?.total ?? 0);

    if (amount > available) {
      return reply.status(400).send({
        error: `Saldo insuficiente. Disponivel: R$${available.toFixed(2)}`,
      });
    }

    const [withdrawal] = await db.insert(withdrawals).values({
      userId,
      amount: String(amount),
      pixKey,
      status: 'requested',
    }).returning();

    return reply.status(201).send({
      withdrawal,
      message: 'Saque solicitado. Processamento em ate 24h uteis.',
    });
  });

  // GET /api/financial/withdrawals
  app.get('/withdrawals', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const result = await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));

    return { withdrawals: result, total: result.length };
  });

  // GET /api/financial/tracking-links
  app.get('/tracking-links', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const result = await db.select({
      id: trackingLinks.id,
      code: trackingLinks.code,
      clicks: trackingLinks.clicks,
      conversions: trackingLinks.conversions,
      productName: products.name,
      productPrice: products.price,
    })
      .from(trackingLinks)
      .innerJoin(products, eq(trackingLinks.productId, products.id))
      .where(eq(trackingLinks.creatorId, userId));

    return { links: result, total: result.length };
  });
}
