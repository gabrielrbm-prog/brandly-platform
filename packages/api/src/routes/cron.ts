import type { FastifyInstance } from 'fastify';
import { distributeMonthlyGlobalPool, syncAllSocialMetrics } from '@brandly/core';

export async function cronRoutes(app: FastifyInstance) {
  // POST /api/cron/global-pool — distribui bonus global mensal (admin)
  app.post<{ Body: { period?: string } }>('/global-pool', {
    preHandler: [app.requireAdmin],
  }, async (request, reply) => {
    const { period } = request.body ?? {};
    const result = await distributeMonthlyGlobalPool(period);
    return {
      message: result.distributed > 0
        ? `Pool distribuido: R$${result.poolAmount} para ${result.distributed} membros`
        : 'Nenhum membro elegivel ou pool ja distribuido',
      ...result,
    };
  });

  // POST /api/cron/sync-social — sincroniza metricas sociais (admin)
  app.post('/sync-social', {
    preHandler: [app.requireAdmin],
  }, async (_request, reply) => {
    const result = await syncAllSocialMetrics();
    return {
      message: `Sync concluido: ${result.synced} contas atualizadas, ${result.errors} erros`,
      ...result,
    };
  });
}
