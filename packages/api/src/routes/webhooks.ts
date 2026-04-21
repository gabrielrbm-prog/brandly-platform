import type { FastifyInstance } from 'fastify';
import { db, users } from '@brandly/core';
import { eq } from 'drizzle-orm';

type NewBuyerPayload = {
  email?: string;
};

export async function webhookRoutes(app: FastifyInstance) {
  // POST /api/webhooks/new-buyer
  // Called by Google Sheets Apps Script when a new buyer is added to the sheet.
  // Auth via header: X-Webhook-Secret
  app.post<{ Body: NewBuyerPayload }>('/new-buyer', async (request, reply) => {
    const expectedSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
    if (!expectedSecret) {
      app.log.error('[webhook/new-buyer] GOOGLE_SHEETS_WEBHOOK_SECRET not configured');
      return reply.code(500).send({ error: 'Webhook not configured' });
    }

    const providedSecret = request.headers['x-webhook-secret'];
    if (providedSecret !== expectedSecret) {
      app.log.warn(`[webhook/new-buyer] Invalid secret from ${request.ip}`);
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const email = (request.body?.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return reply.code(400).send({ error: 'Invalid email' });
    }

    const [existing] = await db
      .select({ id: users.id, hasPurchased: users.hasPurchased })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      app.log.info(`[webhook/new-buyer] ${email} not registered yet — will sync on next login`);
      return reply.code(202).send({ status: 'pending', reason: 'user_not_registered' });
    }

    if (existing.hasPurchased) {
      return reply.code(200).send({ status: 'already_marked' });
    }

    await db
      .update(users)
      .set({ hasPurchased: true, updatedAt: new Date() })
      .where(eq(users.id, existing.id));

    app.log.info(`[webhook/new-buyer] ${email} marked as buyer`);
    return reply.code(200).send({ status: 'marked' });
  });
}
