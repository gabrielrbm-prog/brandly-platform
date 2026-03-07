import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { db } from '@brandly/core';
import { users, levels, creatorProfiles } from '@brandly/core';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

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

    const token = app.jwt.sign({ userId: user.id, role: user.role });

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

    const token = app.jwt.sign({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        onboardingCompleted: user.onboardingCompleted,
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
      referralCode: users.referralCode,
      status: users.status,
      instagramHandle: users.instagramHandle,
      tiktokHandle: users.tiktokHandle,
      onboardingCompleted: users.onboardingCompleted,
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
}
