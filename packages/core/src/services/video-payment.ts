const PAYMENT_PER_VIDEO = 10; // R$10 por video aprovado
const MAX_PAID_VIDEOS_PER_DAY = 10; // maximo 10 videos pagos por dia
const MAX_DAILY_PAYMENT = PAYMENT_PER_VIDEO * MAX_PAID_VIDEOS_PER_DAY; // R$100/dia

export interface DailyVideoStats {
  approvedToday: number;
  paidToday: number;
}

export interface PaymentCalculation {
  shouldPay: boolean;
  amount: number;
  reason: string;
  dailyTotal: number;
  dailyRemaining: number;
}

/**
 * Calcula se um video aprovado deve gerar pagamento.
 * Regra: R$10 por video aprovado, maximo 10 por dia (R$100/dia).
 */
export function calculateVideoPayment(stats: DailyVideoStats): PaymentCalculation {
  if (stats.paidToday >= MAX_PAID_VIDEOS_PER_DAY) {
    return {
      shouldPay: false,
      amount: 0,
      reason: `Limite diario atingido (${MAX_PAID_VIDEOS_PER_DAY} videos pagos hoje)`,
      dailyTotal: stats.paidToday * PAYMENT_PER_VIDEO,
      dailyRemaining: 0,
    };
  }

  const dailyTotal = (stats.paidToday + 1) * PAYMENT_PER_VIDEO;
  const dailyRemaining = MAX_PAID_VIDEOS_PER_DAY - stats.paidToday - 1;

  return {
    shouldPay: true,
    amount: PAYMENT_PER_VIDEO,
    reason: `Video aprovado: R$${PAYMENT_PER_VIDEO} (${stats.paidToday + 1}/${MAX_PAID_VIDEOS_PER_DAY} hoje)`,
    dailyTotal,
    dailyRemaining,
  };
}

/**
 * Retorna constantes de pagamento por video.
 */
export function getVideoPaymentConstants() {
  return {
    perVideo: PAYMENT_PER_VIDEO,
    maxPerDay: MAX_PAID_VIDEOS_PER_DAY,
    maxDailyPayment: MAX_DAILY_PAYMENT,
  };
}
