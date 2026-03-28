/**
 * Tarefas agendadas (cron jobs) da plataforma Brandly.
 * - distributeMonthlyGlobalPool: distribui bonus global mensal (Empire + Infinity)
 * - syncAllSocialMetrics: atualiza metricas sociais de todas as contas conectadas
 */
import { db } from '../db/connection.js';
import {
  globalPools,
  bonuses,
  users,
  levels,
  qualifications,
  sales,
  socialAccounts,
  shipments,
} from '../db/schema.js';
import { eq, and, sql, sum, not, inArray } from 'drizzle-orm';
import { calculateGlobalPool } from '@brandly/bonus-engine';
import type { NetworkNode } from '@brandly/bonus-engine';

// ============================================
// GLOBAL POOL — Distribuicao mensal
// ============================================

export async function distributeMonthlyGlobalPool(period?: string): Promise<{
  period: string;
  poolAmount: string;
  distributed: number;
  bonuses: { userId: string; amount: string }[];
}> {
  // Periodo anterior (mes passado) ou o informado
  if (!period) {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    period = now.toISOString().slice(0, 7);
  }

  // Verificar se ja foi distribuido
  const [existingPool] = await db.select()
    .from(globalPools)
    .where(eq(globalPools.period, period));

  if (existingPool?.status === 'distributed') {
    return {
      period,
      poolAmount: String(existingPool.totalAmount),
      distributed: 0,
      bonuses: [],
    };
  }

  // Calcular volume total de vendas do periodo
  const [salesVolume] = await db.select({
    total: sum(sales.qualifiedVolume),
  })
    .from(sales)
    .where(and(
      eq(sales.status, 'confirmed'),
      sql`to_char(${sales.createdAt}, 'YYYY-MM') = ${period}`,
    ));

  const totalVolume = Number(salesVolume?.total ?? 0);

  if (totalVolume <= 0) {
    return { period, poolAmount: '0.00', distributed: 0, bonuses: [] };
  }

  // Buscar membros elegiveis (Empire + Infinity qualificados)
  const eligibleRows = await db.select({
    userId: users.id,
    sponsorId: users.sponsorId,
    levelName: levels.name,
    qualifiedVolume: qualifications.qualifiedVolume,
    isQualified: qualifications.isQualified,
  })
    .from(users)
    .innerJoin(levels, eq(users.levelId, levels.id))
    .innerJoin(qualifications, and(
      eq(qualifications.userId, users.id),
      eq(qualifications.period, period),
    ))
    .where(sql`${levels.name} IN ('Empire', 'Infinity')`);

  const eligibleMembers: NetworkNode[] = eligibleRows.map(r => ({
    userId: r.userId,
    sponsorId: r.sponsorId,
    levelName: r.levelName as any,
    qualifiedVolume: Number(r.qualifiedVolume ?? 0),
    isQualified: r.isQualified ?? false,
  }));

  // Calcular distribuicao
  const results = calculateGlobalPool({
    totalSalesVolume: totalVolume,
    period,
    eligibleMembers,
  });

  if (results.length === 0) {
    return { period, poolAmount: '0.00', distributed: 0, bonuses: [] };
  }

  // Persistir pool
  const poolAmount = results.reduce((s, r) => s + r.amount, 0);

  if (existingPool) {
    await db.update(globalPools)
      .set({
        totalAmount: String(poolAmount),
        status: 'distributed',
        distributedAt: new Date(),
      })
      .where(eq(globalPools.id, existingPool.id));
  } else {
    await db.insert(globalPools).values({
      period,
      totalAmount: String(poolAmount),
      status: 'distributed',
      distributedAt: new Date(),
    });
  }

  // Persistir bonus individuais
  for (const result of results) {
    await db.insert(bonuses).values({
      userId: result.userId,
      type: 'global',
      amount: String(result.amount),
      period,
      status: 'approved',
    });
  }

  return {
    period,
    poolAmount: poolAmount.toFixed(2),
    distributed: results.length,
    bonuses: results.map(r => ({ userId: r.userId, amount: r.amount.toFixed(2) })),
  };
}

// ============================================
// SOCIAL SYNC — Atualiza metricas de todas as contas
// ============================================

export async function syncAllSocialMetrics(): Promise<{
  synced: number;
  errors: number;
}> {
  // Buscar todas as contas conectadas
  const accounts = await db.select()
    .from(socialAccounts)
    .where(eq(socialAccounts.status, 'connected'));

  let synced = 0;
  let errors = 0;

  for (const account of accounts) {
    try {
      // Se tem phylloAccountId, usar Phyllo API para sync
      if (account.phylloAccountId && account.phylloProfileId) {
        const { getProfiles, getContents, calculateEngagementMetrics } = await import('./phyllo-client.js');

        const profiles = await getProfiles(account.phylloUserId!);
        const profile = profiles.data?.find((p: any) => p.id === account.phylloProfileId);

        if (profile) {
          const contents = await getContents(account.phylloAccountId);
          const metrics = calculateEngagementMetrics(contents.data || []);

          await db.update(socialAccounts)
            .set({
              followers: profile.follower_count ?? account.followers,
              following: profile.following_count ?? account.following,
              avgLikes: metrics.avgLikes,
              avgViews: metrics.avgViews,
              avgComments: metrics.avgComments,
              engagementRate: String(metrics.engagementRate),
              isVerified: profile.is_verified ?? account.isVerified,
              platformUsername: profile.platform_username ?? account.platformUsername,
              lastSyncAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(socialAccounts.id, account.id));

          synced++;
        }
      }
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}

// ============================================
// SHIPMENT REFRESH — Atualiza rastreamentos ativos
// ============================================

/** Estados terminais — envios entregues/devolvidos/com falha nao precisam de atualizacao */
const TERMINAL_STATUSES = ['delivered', 'returned', 'failed'] as const;

export interface ShipmentTrackingUpdate {
  status: string;
  lastEvent: string | null;
  lastEventDate: Date | null;
  events: unknown[];
  error?: string;
}

export type TrackPackageFn = (trackingCode: string) => Promise<ShipmentTrackingUpdate>;

/**
 * Atualiza o rastreamento de todos os envios que ainda nao chegaram ao estado terminal.
 * Recebe a funcao de consulta como parametro para evitar dependencia circular entre pacotes.
 *
 * @param trackFn - funcao que consulta a API dos Correios (vem do pacote api)
 *
 * Deve ser chamado a cada 2 horas pelo agendador externo.
 */
export async function refreshActiveShipments(trackFn: TrackPackageFn): Promise<{
  total: number;
  updated: number;
  errors: number;
}> {
  const activeShipments = await db
    .select({ id: shipments.id, trackingCode: shipments.trackingCode })
    .from(shipments)
    .where(
      not(inArray(shipments.status, [...TERMINAL_STATUSES])),
    );

  let updated = 0;
  let errors = 0;

  for (const shipment of activeShipments) {
    try {
      const tracking = await trackFn(shipment.trackingCode);

      if (!tracking.error) {
        await db
          .update(shipments)
          .set({
            status: tracking.status as typeof shipments.status._.data,
            lastEvent: tracking.lastEvent,
            lastEventDate: tracking.lastEventDate,
            events: tracking.events as any,
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

  return { total: activeShipments.length, updated, errors };
}
