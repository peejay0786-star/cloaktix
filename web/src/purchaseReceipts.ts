import type { RateState } from './rates';
export type PurchaseReceipt = { atoms: string; usdCents?: string; at: string };
const key = (network: string, contract: string, serial: string) => `cloaktix:purchase:v1:${network}:${contract}:${serial}`;
/** Store only confirmed acquisition amounts, never infer an old purchase from today's ticket-type price. */
export function recordPurchase(network: string, contract: string, serial: string, atoms: bigint, state: RateState): void {
  const cents=state.kind==='ready' ? Math.round(Number(atoms)/1_000_000*state.rates.nightUsd*100) : null;
  const receipt: PurchaseReceipt = { atoms: atoms.toString(), at: new Date().toISOString(),
    ...(cents!==null && Number.isSafeInteger(cents) ? { usdCents:cents.toString() } : {}) };
  try { localStorage.setItem(key(network, contract, serial), JSON.stringify(receipt)); } catch { /* Purchase remains confirmed even when optional receipt storage is denied. */ }
}
export function loadPurchase(network: string, contract: string, serial: string): PurchaseReceipt | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(network, contract, serial)) ?? 'null');
    if (!value || typeof value !== 'object' || !('atoms' in value) || typeof value.atoms !== 'string' || !/^\d+$/.test(value.atoms) || !('at' in value) || typeof value.at !== 'string') return;
    if ('usdCents' in value && (typeof value.usdCents !== 'string' || !/^\d+$/.test(value.usdCents))) return;
    return { atoms: value.atoms, at: value.at, ...('usdCents' in value && typeof value.usdCents === 'string' ? { usdCents: value.usdCents } : {}) };
  } catch { return; }
}
