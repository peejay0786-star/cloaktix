import { useRates } from './useRates';

/** Format atomic NIGHT units without a lossy conversion to Number. */
export function formatNight(amount: bigint): string {
  const negative = amount < 0n;
  const value = negative ? -amount : amount;
  const fraction = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '').padEnd(2, '0');
  return `${negative ? '-' : ''}${value / 1_000_000n}.${fraction}`;
}

/** USD is the display currency; NIGHT is a reference equivalent only. */
export function Price({ amount, usdCents, compactNight = false }: { amount?: bigint; usdCents?: string; compactNight?: boolean }) {
  const state = useRates();
  const historical = usdCents !== undefined && /^\d+$/.test(usdCents) ? Number(usdCents) / 100 : null;
  const usd = historical ?? (state.kind === 'ready' && amount !== undefined ? Number(amount) / 1_000_000 * state.rates.nightUsd : null);
  // Compact list estimates only; exact atom formatting stays unchanged in checkout.
  const night = amount !== undefined ? (compactNight ? (Number(amount) / 1_000_000).toFixed(2) : formatNight(amount)) : (usd !== null && state.kind === 'ready' ? (usd / state.rates.nightUsd).toFixed(2) : null);
  return <span className="price">
    <span>{usd === null ? 'USD rate unavailable' : `$${usd.toFixed(2)} USD`}</span>
    <small>{usd !== null && state.kind === 'ready' && night !== null
      ? `≈ ${night} NIGHT`
      : 'NIGHT rate unavailable'}</small>
  </span>;
}
