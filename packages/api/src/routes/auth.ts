import type { FastifyInstance } from 'fastify';

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

    // TODO: verificar email duplicado no banco
    // TODO: hash password com bcrypt
    // TODO: se referralCode, buscar sponsor
    // TODO: gerar referralCode unico para o novo user
    // TODO: salvar no banco

    return reply.status(201).send({
      user: {
        id: 'generated-uuid',
        name,
        email,
        role: 'creator',
        referralCode: 'generated-code',
        onboardingCompleted: false,
      },
      token: 'jwt-token-here',
    });
  });

  // POST /api/auth/login
  app.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'email e password sao obrigatorios' });
    }

    // TODO: buscar user por email
    // TODO: verificar password hash
    // TODO: gerar JWT

    return {
      user: {
        id: 'user-uuid',
        email,
        role: 'creator',
      },
      token: 'jwt-token-here',
    };
  });

  // GET /api/auth/me — perfil do usuario autenticado
  app.get('/me', async (request, reply) => {
    // TODO: extrair user do JWT
    return { message: 'not implemented — requires JWT middleware' };
  });
}
