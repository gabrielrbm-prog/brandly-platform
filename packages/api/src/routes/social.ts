import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  users,
  socialAccounts,
  creatorProfiles,
  createPhylloUser,
  createSdkToken,
  getProfiles,
  getContents,
  calculateEngagementMetrics,
  mapPlatformName,
} from '@brandly/core';
import { eq, and } from 'drizzle-orm';

// ============================================
// ROTAS DE INTEGRACAO SOCIAL (Phyllo)
// ============================================

export async function socialRoutes(app: FastifyInstance) {
  // POST /api/social/connect — gera SDK token para o Phyllo Connect
  app.post('/connect', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    // Buscar usuario
    const [user] = await db.select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return reply.status(404).send({ error: 'Usuario nao encontrado' });
    }

    // Verificar se ja tem um phylloUserId salvo
    const [existingAccount] = await db.select({ phylloUserId: socialAccounts.phylloUserId })
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId))
      .limit(1);

    let phylloUserId = existingAccount?.phylloUserId;

    // Criar usuario Phyllo se necessario
    if (!phylloUserId) {
      const phylloUser = await createPhylloUser(user.name, userId);
      phylloUserId = phylloUser.id;
    }

    // Gerar SDK token
    const tokenData = await createSdkToken(phylloUserId, ['IDENTITY', 'ENGAGEMENT']);

    return {
      sdkToken: tokenData.sdk_token,
      userId: phylloUserId,
      environment: process.env.PHYLLO_ENVIRONMENT ?? 'sandbox',
    };
  });

  // POST /api/social/account-connected — callback do frontend apos conectar conta
  app.post<{
    Body: {
      accountId: string;
      workPlatformId: string;
      phylloUserId: string;
    };
  }>('/account-connected', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { accountId, phylloUserId } = request.body;

    if (!accountId || !phylloUserId) {
      return reply.status(400).send({ error: 'accountId e phylloUserId sao obrigatorios' });
    }

    // Buscar perfil via Phyllo API
    const profilesResponse = await getProfiles(accountId);
    const profile = profilesResponse.data?.[0];

    if (!profile) {
      return reply.status(404).send({ error: 'Perfil nao encontrado no Phyllo' });
    }

    const platform = mapPlatformName(profile.work_platform.name);
    if (!platform) {
      return reply.status(400).send({ error: `Plataforma nao suportada: ${profile.work_platform.name}` });
    }

    // Buscar metricas de engajamento dos ultimos posts
    let avgLikes = 0, avgViews = 0, avgComments = 0, engagementRate = 0;
    try {
      const contentsResponse = await getContents(accountId, 30);
      const metrics = calculateEngagementMetrics(contentsResponse.data ?? []);
      avgLikes = metrics.avgLikes;
      avgViews = metrics.avgViews;
      avgComments = metrics.avgComments;
      engagementRate = metrics.engagementRate;
    } catch {
      // Metricas de conteudo podem nao estar disponiveis ainda (async no Phyllo)
    }

    // Upsert conta social
    const [existing] = await db.select({ id: socialAccounts.id })
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
      ))
      .limit(1);

    const accountData = {
      userId,
      platform: platform as 'instagram' | 'tiktok',
      phylloUserId,
      phylloAccountId: accountId,
      phylloProfileId: profile.id,
      platformUsername: profile.platform_username,
      platformUrl: profile.url,
      followers: profile.follower_count ?? 0,
      following: profile.following_count ?? 0,
      avgLikes,
      avgViews,
      avgComments,
      engagementRate: String(engagementRate),
      isVerified: profile.is_verified ?? false,
      status: 'connected' as const,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(socialAccounts).set(accountData).where(eq(socialAccounts.id, existing.id));
    } else {
      await db.insert(socialAccounts).values(accountData);
    }

    // Atualizar handle e followers no users/creatorProfiles tambem
    const handleField = platform === 'instagram'
      ? { instagramHandle: profile.platform_username }
      : { tiktokHandle: profile.platform_username };
    await db.update(users).set(handleField).where(eq(users.id, userId));

    const followersField = platform === 'instagram'
      ? { instagramFollowers: profile.follower_count ?? 0 }
      : { tiktokFollowers: profile.follower_count ?? 0 };
    await db.update(creatorProfiles).set(followersField).where(eq(creatorProfiles.userId, userId));

    return {
      message: `${platform} conectado com sucesso`,
      account: {
        platform,
        username: profile.platform_username,
        followers: profile.follower_count,
        engagementRate,
      },
    };
  });

  // POST /api/social/webhook — recebe eventos do Phyllo
  app.post('/webhook', async (request, reply) => {
    const event = (request.body as any)?.event;
    const accountId = (request.body as any)?.account_id;

    if (!event) {
      return reply.status(400).send({ error: 'Evento invalido' });
    }

    app.log.info({ event, accountId }, 'Phyllo webhook recebido');

    // Processar eventos relevantes
    if (event === 'PROFILES.ADDED' || event === 'PROFILES.UPDATED') {
      await syncAccountMetrics(accountId);
    }

    if (event === 'CONTENT.ADDED' || event === 'CONTENT.UPDATED') {
      await syncAccountMetrics(accountId);
    }

    if (event === 'ACCOUNTS.DISCONNECTED') {
      if (accountId) {
        await db.update(socialAccounts)
          .set({ status: 'disconnected', updatedAt: new Date() })
          .where(eq(socialAccounts.phylloAccountId, accountId));
      }
    }

    return { received: true };
  });

  // GET /api/social/accounts — lista contas conectadas do creator
  app.get('/accounts', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;

    const accounts = await db.select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));

    return {
      accounts: accounts.map(a => ({
        id: a.id,
        platform: a.platform,
        username: a.platformUsername,
        url: a.platformUrl,
        followers: a.followers,
        following: a.following,
        avgLikes: a.avgLikes,
        avgViews: a.avgViews,
        avgComments: a.avgComments,
        engagementRate: Number(a.engagementRate),
        isVerified: a.isVerified,
        status: a.status,
        lastSyncAt: a.lastSyncAt,
      })),
    };
  });

  // POST /api/social/sync — atualiza metricas manualmente
  app.post<{ Body: { platform: 'instagram' | 'tiktok' } }>('/sync', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { platform } = request.body;

    const [account] = await db.select()
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
        eq(socialAccounts.status, 'connected'),
      ))
      .limit(1);

    if (!account || !account.phylloAccountId) {
      return reply.status(404).send({ error: `Conta ${platform} nao conectada` });
    }

    await syncAccountMetrics(account.phylloAccountId);

    // Retornar dados atualizados
    const [updated] = await db.select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, account.id));

    return {
      message: 'Metricas atualizadas',
      account: {
        platform: updated.platform,
        username: updated.platformUsername,
        followers: updated.followers,
        avgLikes: updated.avgLikes,
        avgViews: updated.avgViews,
        engagementRate: Number(updated.engagementRate),
        lastSyncAt: updated.lastSyncAt,
      },
    };
  });

  // DELETE /api/social/disconnect/:platform — desconecta conta
  app.delete<{ Params: { platform: string } }>('/disconnect/:platform', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { platform } = request.params;

    if (!['instagram', 'tiktok'].includes(platform)) {
      return reply.status(400).send({ error: 'Plataforma invalida' });
    }

    await db.update(socialAccounts)
      .set({ status: 'disconnected', updatedAt: new Date() })
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform as 'instagram' | 'tiktok'),
      ));

    return { message: `${platform} desconectado` };
  });
}

// ============================================
// FUNCOES AUXILIARES
// ============================================

async function syncAccountMetrics(phylloAccountId: string) {
  try {
    // Buscar perfil atualizado
    const profilesResponse = await getProfiles(phylloAccountId);
    const profile = profilesResponse.data?.[0];
    if (!profile) return;

    // Buscar metricas de conteudo
    let avgLikes = 0, avgViews = 0, avgComments = 0, engagementRate = 0;
    try {
      const contentsResponse = await getContents(phylloAccountId, 30);
      const metrics = calculateEngagementMetrics(contentsResponse.data ?? []);
      avgLikes = metrics.avgLikes;
      avgViews = metrics.avgViews;
      avgComments = metrics.avgComments;
      engagementRate = metrics.engagementRate;
    } catch {
      // Conteudo pode nao estar disponivel
    }

    // Atualizar no banco
    await db.update(socialAccounts).set({
      followers: profile.follower_count ?? 0,
      following: profile.following_count ?? 0,
      platformUsername: profile.platform_username,
      platformUrl: profile.url,
      isVerified: profile.is_verified ?? false,
      avgLikes,
      avgViews,
      avgComments,
      engagementRate: String(engagementRate),
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(socialAccounts.phylloAccountId, phylloAccountId));

    // Atualizar creatorProfiles tambem
    const [account] = await db.select({ userId: socialAccounts.userId, platform: socialAccounts.platform })
      .from(socialAccounts)
      .where(eq(socialAccounts.phylloAccountId, phylloAccountId));

    if (account) {
      const followersField = account.platform === 'instagram'
        ? { instagramFollowers: profile.follower_count ?? 0 }
        : { tiktokFollowers: profile.follower_count ?? 0 };
      await db.update(creatorProfiles).set(followersField).where(eq(creatorProfiles.userId, account.userId));
    }
  } catch (err) {
    console.error('Erro ao sincronizar metricas Phyllo:', err);
  }
}
