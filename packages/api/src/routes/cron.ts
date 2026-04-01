import type { FastifyInstance } from 'fastify';
import { distributeMonthlyGlobalPool, syncAllSocialMetrics, refreshActiveShipments } from '@brandly/core';
import { db } from '@brandly/core';
import { users } from '@brandly/core';
import { eq } from 'drizzle-orm';
import { trackPackage } from '../services/correios-tracking.js';

const BUYERS_SHEET_CSV = 'https://docs.google.com/spreadsheets/d/19SDQsSIz2GNCqeibXQcetHb-TRIPFQSkBYo5zewmgGw/export?format=csv';

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

  // POST /api/cron/sync-buyers — sincroniza compradores da planilha Google Sheets
  app.post('/sync-buyers', {
    preHandler: [app.requireAdmin],
  }, async (_request, _reply) => {
    try {
      // 1. Baixar CSV da planilha
      const response = await fetch(BUYERS_SHEET_CSV, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        return { error: 'Falha ao acessar planilha', status: response.status };
      }

      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // pula header

      // 2. Extrair emails da planilha (coluna 4 = Email, index 3)
      const sheetEmails: string[] = [];
      for (const line of lines) {
        const cols = line.split(',');
        const email = (cols[3] ?? '').trim().replace(/"/g, '').toLowerCase();
        if (email && email.includes('@')) {
          sheetEmails.push(email);
        }
      }

      if (sheetEmails.length === 0) {
        return { message: 'Nenhum email encontrado na planilha', synced: 0 };
      }

      // 3. Atualizar has_purchased pra cada email
      let synced = 0;
      let notFound = 0;
      const newEmails: string[] = [];

      for (const email of sheetEmails) {
        const [existing] = await db.select({ id: users.id, hasPurchased: users.hasPurchased })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing) {
          if (!existing.hasPurchased) {
            await db.update(users)
              .set({ hasPurchased: true, updatedAt: new Date() })
              .where(eq(users.id, existing.id));
            synced++;
          }
        } else {
          notFound++;
          newEmails.push(email);
        }
      }

      return {
        message: `Sync concluido: ${synced} novos compradores marcados, ${notFound} emails sem conta`,
        totalSheet: sheetEmails.length,
        synced,
        notFound,
        newEmails,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Erro no sync: ${message}` };
    }
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
