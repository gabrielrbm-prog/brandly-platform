import type { FastifyInstance } from 'fastify';
import { db } from '@brandly/core';
import {
  users,
  socialAccounts,
  creatorProfiles,
  createPhylloUser,
  getPhylloUserByExternalId,
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
    // Verificar se Phyllo esta configurado
    if (!process.env.PHYLLO_CLIENT_ID || !process.env.PHYLLO_CLIENT_SECRET) {
      return reply.status(503).send({
        error: 'Integracao com redes sociais em manutencao',
        message: 'A conexao com redes sociais estara disponivel em breve. Estamos configurando a integracao.',
      });
    }

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
    try {
      if (!phylloUserId) {
        try {
          const phylloUser = await createPhylloUser(user.name, userId);
          phylloUserId = phylloUser.id;
        } catch (createErr: any) {
          // Se usuario ja existe no Phyllo, buscar pelo external_id
          if (createErr.message?.includes('already exist')) {
            const existing = await getPhylloUserByExternalId(userId);
            phylloUserId = existing.id;
          } else {
            throw createErr;
          }
        }
      }

      // Gerar SDK token
      const tokenData = await createSdkToken(phylloUserId, ['IDENTITY', 'ENGAGEMENT']);

      return {
        sdkToken: tokenData.sdk_token,
        userId: phylloUserId,
        environment: process.env.PHYLLO_ENVIRONMENT ?? 'sandbox',
      };
    } catch (err: any) {
      request.log.error({ err: err.message, stack: err.stack }, 'Erro ao conectar com Phyllo');
      return reply.status(502).send({
        error: 'Erro ao conectar com o servico de redes sociais. Tente novamente em alguns minutos.',
      });
    }
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

  // POST /api/social/connect-manual — conecta conta via username manual
  app.post<{
    Body: { platform: 'instagram' | 'tiktok'; username: string };
  }>('/connect-manual', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { platform, username } = request.body;

    if (!platform || !['instagram', 'tiktok'].includes(platform)) {
      return reply.status(400).send({ error: 'Plataforma invalida. Use instagram ou tiktok.' });
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (!cleanUsername) {
      return reply.status(400).send({ error: 'Username invalido.' });
    }

    // Tentar buscar dados publicos do perfil
    let followers = 0;
    let isVerified = false;

    try {
      if (platform === 'instagram') {
        const igRes = await fetch(
          `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`,
          {
            headers: {
              'User-Agent': 'Instagram 76.0.0.15.395 Android',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (igRes.ok) {
          const igData = await igRes.json() as any;
          const user = igData?.data?.user;
          if (user) {
            followers = user.edge_followed_by?.count ?? 0;
            isVerified = user.is_verified ?? false;
          }
        }
      } else if (platform === 'tiktok') {
        const ttRes = await fetch(
          `https://www.tiktok.com/api/user/detail/?uniqueId=${encodeURIComponent(cleanUsername)}&aid=1988`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://www.tiktok.com/',
            },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (ttRes.ok) {
          const ttData = await ttRes.json() as any;
          const userInfo = ttData?.userInfo?.stats;
          if (userInfo) {
            followers = userInfo.followerCount ?? 0;
            isVerified = ttData?.userInfo?.user?.verified ?? false;
          }
        }
      }
    } catch {
      // API publica falhou — continua sem dados (usuario pode preencher manualmente)
      request.log.info({ platform, cleanUsername }, 'Nao foi possivel buscar dados publicos; salvando sem metricas');
    }

    // Upsert na tabela socialAccounts
    const [existing] = await db.select({ id: socialAccounts.id })
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
      ))
      .limit(1);

    const accountData = {
      userId,
      platform,
      platformUsername: cleanUsername,
      followers,
      following: 0,
      avgLikes: 0,
      avgViews: 0,
      avgComments: 0,
      engagementRate: '0',
      isVerified,
      status: 'connected' as const,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(socialAccounts).set(accountData).where(eq(socialAccounts.id, existing.id));
    } else {
      await db.insert(socialAccounts).values(accountData);
    }

    // Atualizar handle no users
    const handleField = platform === 'instagram'
      ? { instagramHandle: cleanUsername }
      : { tiktokHandle: cleanUsername };
    await db.update(users).set(handleField).where(eq(users.id, userId));

    // Atualizar followers no creatorProfiles
    if (followers > 0) {
      const followersField = platform === 'instagram'
        ? { instagramFollowers: followers }
        : { tiktokFollowers: followers };
      await db.update(creatorProfiles).set(followersField).where(eq(creatorProfiles.userId, userId));
    }

    return {
      message: `${platform} conectado com sucesso`,
      account: {
        platform,
        username: cleanUsername,
        followers,
        isVerified,
      },
    };
  });

  // PATCH /api/social/update-manual — atualiza metricas manualmente
  app.patch<{
    Body: {
      platform: 'instagram' | 'tiktok';
      followers?: number;
      avgLikes?: number;
      avgViews?: number;
    };
  }>('/update-manual', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { userId } = request.user;
    const { platform, followers, avgLikes, avgViews } = request.body;

    if (!platform || !['instagram', 'tiktok'].includes(platform)) {
      return reply.status(400).send({ error: 'Plataforma invalida.' });
    }

    const [account] = await db.select({ id: socialAccounts.id, followers: socialAccounts.followers })
      .from(socialAccounts)
      .where(and(
        eq(socialAccounts.userId, userId),
        eq(socialAccounts.platform, platform),
        eq(socialAccounts.status, 'connected'),
      ))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ error: `Conta ${platform} nao encontrada. Conecte primeiro.` });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date(), lastSyncAt: new Date() };
    if (followers !== undefined && followers >= 0) updateData.followers = followers;
    if (avgLikes !== undefined && avgLikes >= 0) updateData.avgLikes = avgLikes;
    if (avgViews !== undefined && avgViews >= 0) updateData.avgViews = avgViews;

    // Recalcular engajamento se tiver dados suficientes
    const newFollowers = (followers ?? account.followers) || 1;
    const newLikes = avgLikes ?? 0;
    const newViews = avgViews ?? 0;
    if (followers !== undefined || avgLikes !== undefined || avgViews !== undefined) {
      const engRate = newFollowers > 0 ? ((newLikes + newViews * 0.3) / newFollowers) * 100 : 0;
      updateData.engagementRate = String(Math.min(engRate, 100).toFixed(2));
    }

    await db.update(socialAccounts).set(updateData).where(eq(socialAccounts.id, account.id));

    // Atualizar creatorProfiles se followers foi alterado
    if (followers !== undefined && followers >= 0) {
      const followersField = platform === 'instagram'
        ? { instagramFollowers: followers }
        : { tiktokFollowers: followers };
      await db.update(creatorProfiles).set(followersField).where(eq(creatorProfiles.userId, userId));
    }

    const [updated] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, account.id));

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
