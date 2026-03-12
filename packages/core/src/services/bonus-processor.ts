/**
 * Processa bonus de uma venda usando o bonus-engine
 * e persiste os resultados no banco.
 */
import { db } from '../db/connection.js';
import { users, levels, bonuses, qualifications, lines, sales } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { processAllBonuses } from '@brandly/bonus-engine';
import type { NetworkNode, SaleInput, BonusResult } from '@brandly/bonus-engine';
import type { LevelName } from '@brandly/shared';

/**
 * Busca um NetworkNode a partir do userId
 */
async function getNetworkNode(userId: string): Promise<NetworkNode | null> {
  const [row] = await db.select({
    userId: users.id,
    sponsorId: users.sponsorId,
    levelName: levels.name,
  })
    .from(users)
    .leftJoin(levels, eq(users.levelId, levels.id))
    .where(eq(users.id, userId));

  if (!row) return null;

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Buscar qualificacao do periodo
  const [qual] = await db.select({
    qualifiedVolume: qualifications.qualifiedVolume,
    isQualified: qualifications.isQualified,
  })
    .from(qualifications)
    .where(and(
      eq(qualifications.userId, userId),
      eq(qualifications.period, currentMonth),
    ));

  return {
    userId: row.userId,
    levelName: (row.levelName ?? 'Seed') as LevelName,
    sponsorId: row.sponsorId,
    isQualified: qual?.isQualified ?? true, // default true para novos membros
    qualifiedVolume: Number(qual?.qualifiedVolume ?? 0),
  };
}

/**
 * Funcao de upline: dado um userId, retorna o sponsor como NetworkNode
 */
function createUplineResolver(): (userId: string) => Promise<NetworkNode | null> {
  const cache = new Map<string, NetworkNode | null>();

  return async (userId: string): Promise<NetworkNode | null> => {
    if (cache.has(userId)) return cache.get(userId)!;

    const node = await getNetworkNode(userId);
    if (!node || !node.sponsorId) {
      cache.set(userId, null);
      return null;
    }

    const sponsor = await getNetworkNode(node.sponsorId);
    cache.set(userId, sponsor);
    return sponsor;
  };
}

/**
 * Processa todos os bonus para uma venda e salva no banco.
 * Retorna a lista de bonus gerados.
 */
export async function processSaleBonuses(saleId: string): Promise<BonusResult[]> {
  // 1. Buscar venda com produto
  const [sale] = await db.select({
    id: sales.id,
    sellerId: sales.sellerId,
    amount: sales.amount,
    qualifiedVolume: sales.qualifiedVolume,
    productType: sql<string>`(SELECT type FROM products WHERE id = ${sales.productId})`,
  })
    .from(sales)
    .where(eq(sales.id, saleId));

  if (!sale) {
    throw new Error(`Venda ${saleId} nao encontrada`);
  }

  // 2. Montar SaleInput
  const saleInput: SaleInput = {
    saleId: sale.id,
    sellerId: sale.sellerId,
    amount: Number(sale.amount),
    productType: (sale.productType as 'digital' | 'physical') ?? 'digital',
    qualifiedVolume: Number(sale.qualifiedVolume),
  };

  // 3. Buscar seller node
  const seller = await getNetworkNode(sale.sellerId);
  if (!seller) {
    throw new Error(`Seller ${sale.sellerId} nao encontrado`);
  }

  // 4. Buscar sponsor (direto)
  const sponsor = seller.sponsorId
    ? await getNetworkNode(seller.sponsorId)
    : null;

  // 5. Criar resolver de upline (síncrono wrapper com cache pre-carregado)
  // Para o processAllBonuses que espera sync, pre-carregamos a cadeia
  const uplineChain = await buildUplineChain(seller.userId);
  const getUplineSync = (userId: string): NetworkNode | null => {
    const node = uplineChain.get(userId);
    if (!node || !node.sponsorId) return null;
    return uplineChain.get(node.sponsorId) ?? null;
  };

  // 6. Calcular bonus
  const results = processAllBonuses(saleInput, seller, sponsor, getUplineSync);

  // 7. Persistir bonus no banco
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (results.length > 0) {
    await db.insert(bonuses).values(
      results.map((r) => ({
        userId: r.userId,
        saleId: r.saleId,
        type: r.type as 'direct' | 'infinite' | 'matching' | 'global',
        amount: String(r.amount),
        period: currentMonth,
        status: 'pending' as const,
      })),
    );
  }

  // 8. Atualizar QV do seller no periodo
  await updateQualification(sale.sellerId, Number(sale.qualifiedVolume));

  return results;
}

/**
 * Pre-carrega a cadeia de upline ate o topo (max 20 niveis)
 */
async function buildUplineChain(startUserId: string): Promise<Map<string, NetworkNode>> {
  const chain = new Map<string, NetworkNode>();
  let currentId: string | null = startUserId;
  let depth = 0;
  const MAX_DEPTH = 20;

  while (currentId && depth < MAX_DEPTH) {
    const node = await getNetworkNode(currentId);
    if (!node) break;
    chain.set(node.userId, node);
    currentId = node.sponsorId;
    depth++;
  }

  return chain;
}

/**
 * Atualiza/cria registro de qualificacao do periodo atual
 */
async function updateQualification(userId: string, additionalQV: number): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [existing] = await db.select({ id: qualifications.id })
    .from(qualifications)
    .where(and(
      eq(qualifications.userId, userId),
      eq(qualifications.period, currentMonth),
    ));

  if (existing) {
    await db.update(qualifications)
      .set({
        qualifiedVolume: sql`${qualifications.qualifiedVolume} + ${String(additionalQV)}`,
      })
      .where(eq(qualifications.id, existing.id));
  } else {
    // Contar diretos ativos
    const [directsResult] = await db.select({
      total: sql<number>`count(*)::int`,
    })
      .from(users)
      .where(and(eq(users.sponsorId, userId), eq(users.status, 'active')));

    await db.insert(qualifications).values({
      userId,
      period: currentMonth,
      qualifiedVolume: String(additionalQV),
      directsActive: directsResult?.total ?? 0,
      maxLinePML: '0',
      isQualified: true,
    });
  }
}

/**
 * Confirma uma venda e dispara processamento de bonus.
 */
export async function confirmSale(saleId: string): Promise<{
  sale: { id: string; status: string };
  bonuses: BonusResult[];
}> {
  // Atualizar status da venda
  const [updated] = await db.update(sales)
    .set({ status: 'confirmed' })
    .where(eq(sales.id, saleId))
    .returning({ id: sales.id, status: sales.status });

  if (!updated) {
    throw new Error(`Venda ${saleId} nao encontrada`);
  }

  // Processar bonus
  const bonusResults = await processSaleBonuses(saleId);

  return {
    sale: updated,
    bonuses: bonusResults,
  };
}
