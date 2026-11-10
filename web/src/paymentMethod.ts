/** CloakTix accepts NIGHT on Midnight only. */
export type PaymentMethod = 'NIGHT';

export function canPay(method: PaymentMethod): boolean {
  return method === 'NIGHT';
}

export async function executeSelectedPayment(method: PaymentMethod, payNight: () => Promise<void>): Promise<void> {
  if (method !== 'NIGHT') throw new Error('Only NIGHT on Midnight is accepted.');
  await payNight();
}
