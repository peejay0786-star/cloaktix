import { useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { Price, formatNight } from './Price';
import { useRates } from './useRates';
import { canPay, executeSelectedPayment, type PaymentMethod } from './paymentMethod';
import { clampQty, fmtUsd, qtyTotals } from './multiBuyQty';
export type { PaymentMethod } from './paymentMethod';
export { canPay, executeSelectedPayment };

export function QtyPicker({ qty, max, onChange, disabled }: { qty: number; max: number; onChange: (q: number) => void; disabled?: boolean }) {
  if (max < 2) return null;
  return <label className="qty-picker small">Qty{' '}
    <select aria-label="Number of tickets" value={qty} disabled={disabled} onChange={(e) => onChange(clampQty(Number(e.target.value), max))}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
    </select></label>;
}

export function CheckoutPanel({ amount, usdCents, onPay, busy = false, error = '', qty = 1, maxQty = 1, onQty, progress, onOneAtATime }: {
  amount: bigint; usdCents?: bigint; onPay: () => void; busy?: boolean; error?: string;
  /** CT-MULTI-BUY (v3 only): quantity, picker bound, live progress, and the one-at-a-time fallback offer. */
  qty?: number; maxQty?: number; onQty?: (q: number) => void; progress?: string; onOneAtATime?: () => void;
}) {
  const state = useRates();
  if (usdCents !== undefined && qty > 1) {
    const tt = qtyTotals(usdCents, qty, state.kind === 'ready' ? state.rates.nightUsd : null);
    return <section className="checkout-panel"><h2>Checkout</h2>
      {onQty && <QtyPicker qty={qty} max={maxQty} onChange={onQty} disabled={busy} />}
      <p className="payment-unit">{qty} tickets × {fmtUsd(tt.unitUsd)}</p>
      <p className="payment-total"><b>Total {fmtUsd(tt.totalUsd)} USD</b></p>
      <p className="payment-night">{tt.totalNight !== null ? `≈ ${tt.totalNight.toFixed(2)} NIGHT total (exact amount locked by one signed quote when you pay)` : 'NIGHT rate unavailable'}</p>
      <p role="status" className="note">1 approval in 1AM for all {qty} tickets. All or nothing: if the transaction fails, nothing is bought.</p>
      <p className="small muted">Each ticket is proved on this device first (about 40 s per ticket on a computer, longer on a phone). Each one gets its own entry QR in My tickets.</p>
      {progress && busy ? <p role="status" className="note progress">{progress}</p> : null}
      {error ? <p role="alert" className="warn">{error}</p> : null}
      {error && onOneAtATime ? <button type="button" className="ghost wide" onClick={onOneAtATime}>Buy one at a time instead</button> : null}
      <p className="small muted">USD and NIGHT are reference estimates, not locked quotes. Preview test assets have no cash value.</p>
      <button type="button" className="primary big" disabled={busy || !!error} onClick={() => { if (!busy) onPay(); }}>
        {busy ? 'Processing…' : `Pay for ${qty} tickets with NIGHT on Midnight`}
      </button>
    </section>;
  }
  // Schema v3 prices are USD cents; v1/v2 prices are NIGHT atoms.
  const usd = usdCents !== undefined ? Number(usdCents) / 100 : (state.kind === 'ready' ? Number(amount) / 1_000_000 * state.rates.nightUsd : null);
  const nightLabel = usdCents === undefined ? `${formatNight(amount)} NIGHT` : (state.kind === 'ready' && usd !== null ? `≈ ${(usd / state.rates.nightUsd).toFixed(2)} NIGHT (exact amount locked by a signed quote when you pay)` : 'NIGHT rate unavailable');
  return <section className="checkout-panel"><h2>Checkout</h2>
    {onQty && usdCents !== undefined && <QtyPicker qty={qty} max={maxQty} onChange={onQty} disabled={busy} />}
    {usdCents !== undefined ? <Price usdCents={String(usdCents)} hideNight /> : <Price amount={amount} hideNight />}
    <p className={usdCents !== undefined ? 'payment-night' : 'payment-amount'}>{nightLabel}</p>
    <p role="status" className="note">Pay from your Midnight wallet. NIGHT on Cardano isn&apos;t accepted.</p>
    <p className="small muted">NIGHT on Midnight only. After payment, find your pass in My tickets to print, show QR or Send to phone.</p>
    {error ? <p role="alert" className="warn">{error}</p> : null}
    <p className="small muted">USD and NIGHT are reference estimates, not locked quotes. Preview test assets have no cash value.</p>
    <button type="button" className="primary big" disabled={busy || !!error} onClick={() => { if (!busy) onPay(); }}>
      {busy ? 'Processing…' : 'Pay with NIGHT on Midnight'}
    </button>
    <p className="small muted market-data">Market data: <a href="https://www.coingecko.com/" target="_blank" rel="noreferrer">CoinGecko</a> · <a href="https://www.kraken.com/" target="_blank" rel="noreferrer">Kraken</a></p>
  </section>;
}

export type MultiPurchase = {
  /** Highest quantity (2..4) for this type; below 2 hides the picker. */
  max: number;
  /** Buy qty (>=2) in one transaction. Report progress text; throw with .kind on failure. */
  buy: (qty: number, onProgress: (text: string) => void) => Promise<void>;
};

export function PurchaseButton({ amount, usdCents, disabled, legacyNightPurchase, onOpen, multi }: {
  amount: bigint; disabled?: boolean; legacyNightPurchase: () => Promise<void>;
  /** CT-PROOF-SPEED: called when Checkout opens (e.g. prefetch keys + warm the prover). Must not throw. */
  onOpen?: () => void;
  /** Schema v3: price in USD cents (amount is then ignored for pricing). */
  usdCents?: bigint;
  /** CT-MULTI-BUY (v3, primary sale, non-adult). Qty 1 always uses legacyNightPurchase. */
  multi?: MultiPurchase;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const max = multi && usdCents !== undefined ? multi.max : 1;
  const [qtyRaw, setQty] = useState(1); const qty = clampQty(qtyRaw, max);
  const [progress, setProgress] = useState(''), [oneAtATime, setOneAtATime] = useState(false);
  const method: PaymentMethod = 'NIGHT';
  const paying = useRef(false);
  const [error, setError] = useState('');
  const pay = async () => {
    if (error || paying.current || disabled || !canPay(method)) return;
    paying.current = true; setBusy(true);
    try {
      if (qty > 1 && multi) await executeSelectedPayment(method, () => multi.buy(qty, setProgress));
      else await executeSelectedPayment(method, legacyNightPurchase);
      setOpen(false); setError(''); setQty(1);
    } catch (e: any) {
      setError(String(e?.message ?? e)); setOneAtATime(qty > 1 && (e?.kind === 'wallet-refused-multi' || e?.kind === 'network-rejected'));
    } finally {
      paying.current = false; setBusy(false); setProgress('');
    }
  };
  return <>
    <div className="buy-action">
      {!disabled && <QtyPicker qty={qty} max={max} onChange={setQty} />}
      <button type="button" className="primary" disabled={disabled} onClick={() => { setError(''); setOneAtATime(false); setOpen(true); try { onOpen?.(); } catch { /* best effort */ } }}>{qty > 1 ? `Buy ${qty}` : 'Buy'}</button>
      {usdCents !== undefined ? <Price usdCents={String(usdCents)} compactNight /> : <Price amount={amount} compactNight />}
    </div>
    {open && <Dialog label="Checkout" onClose={() => { if (!busy) setOpen(false); }}><div className="card checkout-dialog">
      <CheckoutPanel amount={amount} usdCents={usdCents} onPay={() => { void pay(); }} busy={busy} error={error}
        qty={qty} maxQty={max} onQty={max > 1 ? (q) => { setQty(q); setError(''); setOneAtATime(false); } : undefined} progress={progress}
        onOneAtATime={oneAtATime ? () => { setQty(1); setError(''); setOneAtATime(false); } : undefined} />
      <button type="button" className="ghost wide checkout-close" disabled={busy} onClick={() => setOpen(false)}>Close</button>
    </div></Dialog>}
  </>;
}
