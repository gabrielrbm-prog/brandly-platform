import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { db } from '@brandly/core';
import { users, levels, creatorProfiles, passwordResetTokens } from '@brandly/core';
import { eq, gt, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/email.js';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { name, email, password, referralCode } = request.body;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'name, email e password sao obrigatorios' });
    }

    if (password.length < 6) {
      return reply.status(400).send({ error: 'password deve ter no minimo 6 caracteres' });
    }

    // Verificar email duplicado
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: 'Email ja cadastrado' });
    }

    // Buscar sponsor se referralCode fornecido
    let sponsorId: string | null = null;
    if (referralCode) {
      const sponsor = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (sponsor.length > 0) {
        sponsorId = sponsor[0].id;
      }
    }

    // Buscar nivel Seed (padrao)
    const seedLevel = await db.select({ id: levels.id })
      .from(levels)
      .where(eq(levels.name, 'Seed'))
      .limit(1);

    const passwordHash = await bcrypt.hash(password, 10);
    const newReferralCode = generateReferralCode();

    const [user] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: 'creator',
      levelId: seedLevel[0]?.id ?? null,
      sponsorId,
      referralCode: newReferralCode,
      status: 'active',
      onboardingCompleted: false,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      referralCode: users.referralCode,
      onboardingCompleted: users.onboardingCompleted,
    });

    const token = app.jwt.sign({ userId: user.id, role: user.role, adminRole: null });

    // Enviar welcome email em background (nao bloqueia resposta)
    sendWelcomeEmail(email, name).catch(() => {});

    return reply.status(201).send({ user, token });
  });

  // POST /api/auth/login
  app.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'email e password sao obrigatorios' });
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: 'Credenciais invalidas' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return reply.status(401).send({ error: 'Credenciais invalidas' });
    }

    const token = app.jwt.sign({
      userId: user.id,
      role: user.role,
      adminRole: user.adminRole ?? null,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminRole: user.adminRole,
        referralCode: user.referralCode,
        onboardingCompleted: user.onboardingCompleted,
        hasPurchased: user.hasPurchased,
      },
      token,
    };
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { userId } = request.user;

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      adminRole: users.adminRole,
      referralCode: users.referralCode,
      status: users.status,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      onboardingCompleted: users.onboardingCompleted,
      hasPurchased: users.hasPurchased,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: 'Usuario nao encontrado' });
    }

    return { user };
  });

  // POST /api/auth/forgot-password
  app.post<{ Body: ForgotPasswordBody }>('/forgot-password', async (request, reply) => {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({ error: 'email e obrigatorio' });
    }

    // Resposta generica independente de o email existir ou nao (evita enumeracao de usuarios)
    const resposta = { message: 'Se o email existir, enviaremos instrucoes de recuperacao.' };

    const [user] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return reply.status(200).send(resposta);
    }

    // Gerar token seguro de 32 bytes (64 chars hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora a partir de agora

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Buscar nome do usuario para o email
    const [userData] = await db.select({ name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Enviar email em background (nao bloqueia resposta)
    sendPasswordResetEmail(email, token, userData?.name ?? 'Creator').catch(() => {});

    return reply.status(200).send(resposta);
  });

  // POST /api/auth/reset-password
  app.post<{ Body: ResetPasswordBody }>('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body;

    if (!token || !newPassword) {
      return reply.status(400).send({ error: 'token e newPassword sao obrigatorios' });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({ error: 'newPassword deve ter no minimo 6 caracteres' });
    }

    const agora = new Date();

    // Buscar token valido: existente, nao usado e nao expirado
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, agora),
        )
      )
      .limit(1);

    if (!resetToken) {
      return reply.status(400).send({ error: 'Token invalido ou expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuario e marcar token como utilizado em paralelo
    await Promise.all([
      db.update(users)
        .set({ passwordHash, updatedAt: agora })
        .where(eq(users.id, resetToken.userId)),
      db.update(passwordResetTokens)
        .set({ usedAt: agora })
        .where(eq(passwordResetTokens.id, resetToken.id)),
    ]);

    return reply.status(200).send({ message: 'Senha alterada com sucesso!' });
  });

  // POST /api/auth/change-password (authenticated)
  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    '/change-password',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body;
      const { userId } = request.user;

      if (!currentPassword || !newPassword) {
        return reply.status(400).send({ error: 'currentPassword e newPassword sao obrigatorios' });
      }
      if (newPassword.length < 6) {
        return reply.status(400).send({ error: 'Nova senha deve ter no minimo 6 caracteres' });
      }

      const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.passwordHash) {
        return reply.status(404).send({ error: 'Usuario nao encontrado' });
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return reply.status(400).send({ error: 'Senha atual incorreta' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      return reply.status(200).send({ message: 'Senha alterada com sucesso!' });
    },
  );
}
