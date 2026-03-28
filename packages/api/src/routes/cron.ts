import type { FastifyInstance } from 'fastify';
import { distributeMonthlyGlobalPool, syncAllSocialMetrics, refreshActiveShipments } from '@brandly/core';
import { trackPackage } from '../services/correios-tracking.js';

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

  // POST /api/cron/refresh-shipments — atualiza rastreamentos ativos a cada 2h
  // Configurar no agendador externo (Railway Cron, etc.) para chamar a cada 2 horas:
  //   0 */2 * * *   POST https://api.brandlycreator.com.br/api/cron/refresh-shipments
  app.post('/refresh-shipments', {
    preHandler: [app.requireAdmin],
  }, async (_request, _reply) => {
    const result = await refreshActiveShipments(trackPackage);
    return {
      message: `Refresh de rastreamentos concluido: ${result.updated} atualizados, ${result.errors} erros`,
      ...result,
    };
  });
}
