import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Brandly <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL ?? 'https://app.brandlycreator.com.br';

export async function sendPasswordResetEmail(to: string, token: string, userName: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    console.warn('[email] RESEND_API_KEY nao configurada — email nao enviado. Token:', token);
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Brandly — Recuperacao de senha',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #7C3AED; margin: 0;">Brandly</h1>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Profissao Creator</p>
        </div>

        <p style="font-size: 16px; color: #1F2937;">Ola, <strong>${userName}</strong>!</p>

        <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
          Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #7C3AED; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
            Redefinir Senha
          </a>
        </div>

        <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5;">
          Este link expira em 1 hora. Se voce nao solicitou a recuperacao, ignore este email.
        </p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 11px; color: #D1D5DB; text-align: center;">
          Brandly — Plataforma Creator Economy
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Erro ao enviar email de reset:', error);
    return false;
  }

  return true;
}

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY nao configurada — welcome email nao enviado');
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Bem-vindo a Brandly! 🚀',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #7C3AED; margin: 0;">Brandly</h1>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Profissao Creator</p>
        </div>

        <p style="font-size: 16px; color: #1F2937;">Ola, <strong>${userName}</strong>!</p>

        <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
          Sua conta foi criada com sucesso. Voce agora faz parte da comunidade de creators profissionais da Brandly!
        </p>

        <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
          <strong>Proximos passos:</strong>
        </p>
        <ol style="font-size: 14px; color: #4B5563; line-height: 1.8; padding-left: 20px;">
          <li>Complete seu perfil de onboarding</li>
          <li>Conecte-se a uma marca parceira</li>
          <li>Envie seu primeiro video e ganhe R$10</li>
        </ol>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}"
             style="display: inline-block; background: #7C3AED; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
            Acessar Plataforma
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 11px; color: #D1D5DB; text-align: center;">
          Brandly — Plataforma Creator Economy
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[email] Erro ao enviar welcome email:', error);
    return false;
  }

  return true;
}
