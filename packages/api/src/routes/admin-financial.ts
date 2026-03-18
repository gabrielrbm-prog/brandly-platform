import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  sales,
  products,
  brands,
  payments,
  withdrawals,
  users,
} from '@brandly/core';
import { eq, and, sql, desc, sum, count, inArray } from 'drizzle-orm';

// ============================================================
// Tipos das query strings / bodies
// ============================================================

interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface WithdrawalsQuery extends PaginationQuery {
  status?: string;
}

interface SalesQuery extends PaginationQuery {
  status?: string;
}

interface PaymentsQuery extends PaginationQuery {
  type?: string;
}

// "completed" = saque aprovado e pago | "failed" = saque recusado/falhou
interface UpdateWithdrawalBody {
  status: 'completed' | 'failed';
  reason?: string;
}

interface BatchWithdrawalBody {
  ids: string[];
  status: 'completed' | 'failed';
  reason?: string;
}

// ============================================================
// Helpers
// ============================================================

const VALID_WITHDRAWAL_STATUSES = ['requested', 'processing', 'completed', 'failed'] as const;
type WithdrawalStatus = typeof VALID_WITHDRAWAL_STATUSES[number];

function parsePage(page?: number, limit?: number) {
  const p = Math.max(1, Number(page ?? 1));
  const l = Math.min(100, Math.max(1, Number(limit ?? 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

// ============================================================
// Rotas
// ============================================================

export async function adminFinancialRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------
  // GET /api/admin/financial/overview
  // Resumo financeiro geral da plataforma
  // ---------------------------------------------------------
  app.get('/financial/overview', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    // Receita total (vendas confirmadas)
    const [revenueRow] = await db
      .select({ total: sum(sales.amount) })
      .from(sales)
      .where(eq(sales.status, 'confirmed'));

    // Total pago aos creators (pagamentos com status "paid")
    const [paidRow] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, 'paid'));

    // Saques pendentes (status "requested" ou "processing")
    const [pendingWithdrawRow] = await db
      .select({
        total: sum(withdrawals.amount),
        qty: count(),
      })
      .from(withdrawals)
      .where(
        sql`${withdrawals.status}::text IN ('requested', 'processing')`,
      );

    // Vendas aguardando confirmacao
    const [pendingSalesRow] = await db
      .select({ qty: count() })
      .from(sales)
      .where(eq(sales.status, 'pending'));

    const totalRevenue = Number(revenueRow?.total ?? 0);
    const totalPaidToCreators = Number(paidRow?.total ?? 0);
    const pendingWithdrawals = Number(pendingWithdrawRow?.total ?? 0);
    const pendingWithdrawalsCount = Number(pendingWithdrawRow?.qty ?? 0);
    const pendingSalesCount = Number(pendingSalesRow?.qty ?? 0);

    // Margem estimada da Brandly:
    // Precisariamos do tipo de cada venda, mas como simplificacao usamos a media ponderada
    // referenciada no plano de negocios (fisico ~23%, digital ~30%).
    // Como nao temos a separacao aqui usamos 25% como estimativa conservadora.
    const brandlyMargin = totalRevenue * 0.25;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      brandlyMargin: brandlyMargin.toFixed(2),
      totalPaidToCreators: totalPaidToCreators.toFixed(2),
      pendingWithdrawals: pendingWithdrawals.toFixed(2),
      pendingWithdrawalsCount,
      pendingSalesCount,
    };
  });

  // ---------------------------------------------------------
  // GET /api/admin/withdrawals?status=requested&page=1&limit=20
  // Lista paginada de saques com info do creator
  // ---------------------------------------------------------
  app.get<{ Querystring: WithdrawalsQuery }>('/withdrawals', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { status, page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    // Validar status se fornecido
    if (status && !VALID_WITHDRAWAL_STATUSES.includes(status as WithdrawalStatus)) {
      return reply.status(400).send({
        error: `Status invalido. Valores aceitos: ${VALID_WITHDRAWAL_STATUSES.join(', ')}`,
      });
    }

    const whereClause = status
      ? sql`${withdrawals.status}::text = ${status}`
      : undefined;

    const rows = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        pixKey: withdrawals.pixKey,
        status: withdrawals.status,
        processedAt: withdrawals.processedAt,
        createdAt: withdrawals.createdAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(whereClause)
      .orderBy(desc(withdrawals.createdAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db
      .select({ qty: count() })
      .from(withdrawals)
      .where(whereClause);

    const result = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      pixKey: r.pixKey,
      status: r.status,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
      creator: {
        id: r.creatorId,
        name: r.creatorName,
        email: r.creatorEmail,
      },
    }));

    return {
      withdrawals: result,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });

  // ---------------------------------------------------------
  // PATCH /api/admin/withdrawals/:id
  // Atualiza status de um saque individualmente
  // ---------------------------------------------------------
  app.patch<{
    Params: { id: string };
    Body: UpdateWithdrawalBody;
  }>('/withdrawals/:id', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, reason } = request.body;
    const { userId: adminId } = request.user;

    if (!status || !['completed', 'failed'].includes(status)) {
      return reply.status(400).send({
        error: 'Status invalido. Use "completed" (aprovado) ou "failed" (recusado).',
      });
    }

    // Verificar se o saque existe
    const [existing] = await db
      .select({ id: withdrawals.id, status: withdrawals.status })
      .from(withdrawals)
      .where(eq(withdrawals.id, id));

    if (!existing) {
      return reply.status(404).send({ error: 'Saque nao encontrado' });
    }

    // Nao permitir regredir de "completed" para outro status
    if (existing.status === 'completed') {
      return reply.status(400).send({
        error: 'Nao e possivel alterar um saque ja concluido',
      });
    }

    const [updated] = await db
      .update(withdrawals)
      .set({
        status,
        processedAt: new Date(),
      })
      .where(eq(withdrawals.id, id))
      .returning();

    app.log.info(
      { withdrawalId: id, newStatus: status, adminId, reason },
      'Saque atualizado pelo admin',
    );

    return {
      withdrawal: updated,
      message: status === 'completed'
        ? 'Saque aprovado e concluido com sucesso'
        : 'Saque recusado (falhou)',
    };
  });

  // ---------------------------------------------------------
  // POST /api/admin/withdrawals/batch
  // Atualiza multiplos saques em lote
  // ---------------------------------------------------------
  app.post<{ Body: BatchWithdrawalBody }>('/withdrawals/batch', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { ids, status, reason } = request.body;
    const { userId: adminId } = request.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: 'ids deve ser um array nao-vazio' });
    }

    if (!status || !['completed', 'failed'].includes(status)) {
      return reply.status(400).send({
        error: 'Status invalido. Use "completed" (aprovado) ou "failed" (recusado).',
      });
    }

    // Nao permitir processar saques ja concluidos
    const alreadyDone = await db
      .select({ id: withdrawals.id })
      .from(withdrawals)
      .where(
        and(
          inArray(withdrawals.id, ids),
          eq(withdrawals.status, 'completed'),
        ),
      );

    if (alreadyDone.length > 0) {
      return reply.status(400).send({
        error: `${alreadyDone.length} saque(s) ja estao concluidos e nao podem ser alterados`,
        ids: alreadyDone.map((r) => r.id),
      });
    }

    const updated = await db
      .update(withdrawals)
      .set({
        status,
        processedAt: new Date(),
      })
      .where(inArray(withdrawals.id, ids))
      .returning({ id: withdrawals.id });

    app.log.info(
      { count: updated.length, newStatus: status, adminId, reason },
      'Saques atualizados em lote pelo admin',
    );

    return {
      updated: updated.length,
      ids: updated.map((r) => r.id),
      message: `${updated.length} saque(s) atualizados para "${status}"`,
    };
  });

  // ---------------------------------------------------------
  // GET /api/admin/sales?status=pending&page=1&limit=20
  // Lista paginada de vendas com info do creator e da marca
  // ---------------------------------------------------------
  app.get<{ Querystring: SalesQuery }>('/sales', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { status, page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    const validSaleStatuses = ['pending', 'confirmed', 'cancelled', 'refunded'];
    if (status && !validSaleStatuses.includes(status)) {
      return reply.status(400).send({
        error: `Status invalido. Valores aceitos: ${validSaleStatuses.join(', ')}`,
      });
    }

    const whereClause = status
      ? sql`${sales.status}::text = ${status}`
      : undefined;

    const rows = await db
      .select({
        id: sales.id,
        amount: sales.amount,
        status: sales.status,
        createdAt: sales.createdAt,
        productName: products.name,
        productType: products.type,
        brandName: brands.name,
        sellerId: users.id,
        sellerName: users.name,
        sellerEmail: users.email,
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(users, eq(sales.sellerId, users.id))
      .where(whereClause)
      .orderBy(desc(sales.createdAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db
      .select({ qty: count() })
      .from(sales)
      .where(whereClause);

    const result = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      productName: r.productName,
      type: r.productType,
      status: r.status,
      createdAt: r.createdAt,
      brandName: r.brandName,
      seller: {
        id: r.sellerId,
        name: r.sellerName,
        email: r.sellerEmail,
      },
    }));

    return {
      sales: result,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });

  // ---------------------------------------------------------
  // GET /api/admin/payments?page=1&limit=20&type=video|commission|bonus
  // Ledger de pagamentos de todos os creators
  // ---------------------------------------------------------
  app.get<{ Querystring: PaymentsQuery }>('/payments', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { type, page: rawPage, limit: rawLimit } = request.query;
    const { page, limit, offset } = parsePage(rawPage, rawLimit);

    const validTypes = ['video', 'commission', 'bonus'];
    if (type && !validTypes.includes(type)) {
      return reply.status(400).send({
        error: `Tipo invalido. Valores aceitos: ${validTypes.join(', ')}`,
      });
    }

    const whereClause = type
      ? eq(payments.type, type)
      : undefined;

    const rows = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        type: payments.type,
        status: payments.status,
        description: payments.description,
        period: payments.period,
        createdAt: payments.createdAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(payments)
      .innerJoin(users, eq(payments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .offset(offset)
      .limit(limit);

    const [totalRow] = await db
      .select({ qty: count() })
      .from(payments)
      .where(whereClause);

    const result = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      status: r.status,
      description: r.description,
      period: r.period,
      createdAt: r.createdAt,
      creator: {
        id: r.creatorId,
        name: r.creatorName,
        email: r.creatorEmail,
      },
    }));

    return {
      payments: result,
      total: Number(totalRow?.qty ?? 0),
      page,
      limit,
    };
  });
}
