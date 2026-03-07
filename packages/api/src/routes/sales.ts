import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import { sales, products, trackingLinks } from '@brandly/core';
import { eq, and, desc, count } from 'drizzle-orm';

interface SaleBody {
  productId: string;
  trackingLinkId?: string;
  buyerEmail?: string;
  amount: number;
  qualifiedVolume: number;
}

export async function saleRoutes(app: FastifyInstance) {
  // POST /api/sales — registrar venda
  app.post<{ Body: SaleBody }>('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { productId, trackingLinkId, buyerEmail, amount, qualifiedVolume } = request.body;

    if (!productId || !amount) {
      return reply.status(400).send({ error: 'productId e amount sao obrigatorios' });
    }

    // Verificar produto existe
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) {
      return reply.status(404).send({ error: 'Produto nao encontrado' });
    }

    // Se tracking link fornecido, incrementar conversoes
    if (trackingLinkId) {
      await db.update(trackingLinks)
        .set({ conversions: (trackingLinks.conversions) })
        .where(eq(trackingLinks.id, trackingLinkId));
    }

    const [sale] = await db.insert(sales).values({
      sellerId: userId,
      productId,
      trackingLinkId: trackingLinkId ?? null,
      buyerEmail: buyerEmail ?? null,
      amount: String(amount),
      qualifiedVolume: String(qualifiedVolume ?? amount),
      status: 'pending',
    }).returning();

    // TODO: disparar calculo de bonus via bonus-engine

    return reply.status(201).send({ sale, message: 'Venda registrada com sucesso' });
  });

  // GET /api/sales — listar vendas
  app.get('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId, role } = request.user;
    const { status, page = 1, limit = 50 } = request.query as { status?: string; page?: number; limit?: number };
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = role === 'admin' ? [] : [eq(sales.sellerId, userId)];
    if (status) {
      conditions.push(eq(sales.status, status as 'pending' | 'confirmed' | 'cancelled' | 'refunded'));
    }

    const result = await db.select({
      id: sales.id,
      sellerId: sales.sellerId,
      productId: sales.productId,
      amount: sales.amount,
      qualifiedVolume: sales.qualifiedVolume,
      status: sales.status,
      createdAt: sales.createdAt,
      productName: products.name,
      productType: products.type,
    })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sales.createdAt))
      .offset(offset)
      .limit(Number(limit));

    return { sales: result, total: result.length, page: Number(page) };
  });
}
