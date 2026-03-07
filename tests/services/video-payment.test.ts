import { describe, it, expect } from 'vitest';
import { calculateVideoPayment, getVideoPaymentConstants } from '../../packages/core/src/services/video-payment.js';

describe('calculateVideoPayment', () => {
  it('paga R$10 para o primeiro video do dia', () => {
    const result = calculateVideoPayment({ approvedToday: 1, paidToday: 0 });
    expect(result.shouldPay).toBe(true);
    expect(result.amount).toBe(10);
    expect(result.dailyRemaining).toBe(9);
  });

  it('paga R$10 para o 5o video do dia', () => {
    const result = calculateVideoPayment({ approvedToday: 5, paidToday: 4 });
    expect(result.shouldPay).toBe(true);
    expect(result.amount).toBe(10);
    expect(result.dailyTotal).toBe(50);
    expect(result.dailyRemaining).toBe(5);
  });

  it('paga R$10 para o 10o video (ultimo do dia)', () => {
    const result = calculateVideoPayment({ approvedToday: 10, paidToday: 9 });
    expect(result.shouldPay).toBe(true);
    expect(result.amount).toBe(10);
    expect(result.dailyTotal).toBe(100);
    expect(result.dailyRemaining).toBe(0);
  });

  it('NAO paga alem de 10 videos por dia', () => {
    const result = calculateVideoPayment({ approvedToday: 11, paidToday: 10 });
    expect(result.shouldPay).toBe(false);
    expect(result.amount).toBe(0);
    expect(result.dailyRemaining).toBe(0);
  });

  it('NAO paga alem de 15 videos por dia', () => {
    const result = calculateVideoPayment({ approvedToday: 15, paidToday: 10 });
    expect(result.shouldPay).toBe(false);
    expect(result.amount).toBe(0);
  });
});

describe('getVideoPaymentConstants', () => {
  it('retorna constantes corretas', () => {
    const constants = getVideoPaymentConstants();
    expect(constants.perVideo).toBe(10);
    expect(constants.maxPerDay).toBe(10);
    expect(constants.maxDailyPayment).toBe(100);
  });
});
