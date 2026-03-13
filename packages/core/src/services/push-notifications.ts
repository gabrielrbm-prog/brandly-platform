/**
 * Expo Push Notifications — envia notificacoes para creators
 * Usa a API gratuita do Expo: https://exp.host/--/api/v2/push/send
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;        // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

export async function sendPushNotification(message: PushMessage): Promise<boolean> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data ?? {},
        sound: message.sound ?? 'default',
        badge: message.badge,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendBatchNotifications(messages: PushMessage[]): Promise<number> {
  if (messages.length === 0) return 0;
  let sent = 0;
  // Expo aceita ate 100 por batch
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    } catch { /* skip */ }
  }
  return sent;
}

// Helpers para notificacoes comuns da Brandly
export function videoApprovedNotification(pushToken: string, amount: number): PushMessage {
  return {
    to: pushToken,
    title: 'Video aprovado! ✅',
    body: `Seu video foi aprovado! R$${amount.toFixed(2)} creditado na sua conta.`,
    data: { type: 'video_approved' },
  };
}

export function videoRejectedNotification(pushToken: string, reason: string): PushMessage {
  return {
    to: pushToken,
    title: 'Video precisa de ajustes',
    body: `Motivo: ${reason}. Corrija e reenvie!`,
    data: { type: 'video_rejected' },
  };
}

export function bonusCreditedNotification(pushToken: string, amount: number, type: string): PushMessage {
  const typeLabels: Record<string, string> = {
    direct: 'Bonus Direto',
    infinite: 'Bonus Infinito',
    matching: 'Bonus Equiparacao',
    global: 'Bonus Global',
  };
  return {
    to: pushToken,
    title: `${typeLabels[type] ?? 'Bonus'} recebido! 💰`,
    body: `R$${amount.toFixed(2)} creditado. Continue crescendo!`,
    data: { type: 'bonus_credited', bonusType: type },
  };
}

export function newReferralNotification(pushToken: string, referralName: string): PushMessage {
  return {
    to: pushToken,
    title: 'Novo membro na sua rede! 🎉',
    body: `${referralName} se cadastrou com seu link. Ajude-o a comecar!`,
    data: { type: 'new_referral' },
  };
}
