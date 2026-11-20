/** EGG-40 constants and address helpers. No compact-js / managed contract import. */
export const PRIVATE_STATE_ID_EGG40 = 'cloaktix-egg40';
export const FEE_BPS_EGG40 = 300n;
export const MAX_QUOTE_AGE_EGG40 = 300n;
export const SLIPPAGE_BPS_EGG40 = 100n;
export const SETTLEMENT_GATE_ID = 99n;

const HEX64 = /^[0-9a-fA-F]{64}$/;
export function normalizedEgg40Address(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const hex = raw.replace(/^0x/i, '').toLowerCase();
  return HEX64.test(hex) ? hex : null;
}
export function configuredEgg40Contract(): string | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_EGG40_CONTRACT;
  return normalizedEgg40Address(env);
}
export function isEgg40Contract(address: string | null | undefined): boolean {
  const configured = configuredEgg40Contract();
  const got = normalizedEgg40Address(address);
  return !!configured && !!got && configured === got;
}
