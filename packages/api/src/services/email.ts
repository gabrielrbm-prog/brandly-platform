const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_ZMSrnWVc_NVdTjLzAA68Acd454MZ2kgGM';
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Brandly <nao-responda@brandlycreator.com.br>';
const APP_URL = process.env.APP_URL ?? 'https://app.brandlycreator.com.br';

async function sendViaResend(payload: { from: string; to: string; subject: string; html: string }): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[email] Resend error:', res.status, err);
    return false;
  }
  return true;
}

export async function sendPasswordResetEmail(to: string, token: string, userName: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  return sendViaResend({
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
}

export async function sendBrandInviteEmail(to: string, brandName: string, inviteUrl: string): Promise<boolean> {
  return sendViaResend({
    from: FROM_EMAIL,
    to,
    subject: `Brandly — Convite para ${brandName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #7C3AED; margin: 0;">Brandly</h1>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Portal das Marcas</p>
        </div>

        <p style="font-size: 16px; color: #1F2937;">Ola!</p>

        <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
          Voce foi convidado a acessar o portal da Brandly como marca parceira
          <strong>${brandName}</strong>.
        </p>

        <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
          No portal voce pode:
        </p>
        <ul style="font-size: 14px; color: #4B5563; line-height: 1.8; padding-left: 20px;">
          <li>Ver os creators vinculados a sua marca</li>
          <li>Aprovar ou rejeitar videos enviados</li>
          <li>Gerenciar pagamentos mensais aos creators</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}"
             style="display: inline-block; background: #7C3AED; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
            Aceitar convite
          </a>
        </div>

        <p style="font-size: 12px; color: #9CA3AF; line-height: 1.5;">
          Este convite expira em 7 dias. Se voce nao reconhece esse convite, ignore este email.
        </p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="font-size: 11px; color: #D1D5DB; text-align: center;">
          Brandly — Plataforma Creator Economy
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  return sendViaResend({
    from: FROM_EMAIL,
    to,
    subject: 'Bem-vindo a Brandly!',
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
}
