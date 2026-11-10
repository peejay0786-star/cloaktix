import { useEffect, useMemo, useState } from 'react';
import { formatNight } from '../Price';
import { quoteNightForUsd, secondsLeft, type LiveQuote } from './quoteMath';

/** Local UI prototype: live USD→NIGHT quote with countdown. Does not submit chain txs. */
export function RateQuotePanel({ usdCents, nightUsd, ttlSec = 180, onExpired }: {
  usdCents: bigint; nightUsd: number | null; ttlSec?: number; onExpired?: () => void;
}) {
  const initial = useMemo(
    () => (nightUsd != null && nightUsd > 0 ? quoteNightForUsd(usdCents, nightUsd, ttlSec) : null),
    [usdCents, nightUsd, ttlSec],
  );
  const [quote, setQuote] = useState<LiveQuote | null>(initial);
  const [left, setLeft] = useState(() => (initial ? secondsLeft(initial.expiresAt) : 0));
  useEffect(() => {
    setQuote(initial);
    setLeft(initial ? secondsLeft(initial.expiresAt) : 0);
  }, [initial]);
  useEffect(() => {
    if (!quote) return;
    const id = setInterval(() => {
      const remaining = secondsLeft(quote.expiresAt);
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        onExpired?.();
        if (nightUsd != null && nightUsd > 0) {
          const next = quoteNightForUsd(usdCents, nightUsd, ttlSec);
          setQuote(next);
          setLeft(secondsLeft(next.expiresAt));
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [quote, nightUsd, usdCents, ttlSec, onExpired]);
  if (nightUsd == null) return <p role="status" className="warn">Rate unavailable. NIGHT quote paused.</p>;
  if (!quote) return null;
  return <section className="rate-quote-panel" aria-live="polite">
    <h3>Live NIGHT quote</h3>
    <p className="payment-amount">{formatNight(quote.nightAtoms)} NIGHT</p>
    <p className="small muted">For ${(Number(usdCents) / 100).toFixed(2)} USD · spot ${nightUsd.toFixed(6)} / NIGHT</p>
    <p className={left <= 30 ? 'warn' : 'muted'}>Quote expires in {left}s · local preview, not a locked on-chain quote yet</p>
  </section>;
}
