// CT-MULTI-BUY: pure helpers for the quantity picker and checkout totals (no wallet / ledger imports, node-testable).
export const MAX_QTY = 4;

/** Highest selectable quantity: 0 = sold out/closed, 1 = single only (adult types, resale), else up to 4 capped by tickets left. */
export function maxQty(t: { supply: bigint; sold: bigint; adultOnly?: boolean }, opts: { open: boolean; multiOk: boolean }): number {
  const left = t.supply - t.sold;
  if (!opts.open || left <= 0n) return 0;
  if (!opts.multiOk || t.adultOnly) return 1;
  return left < BigInt(MAX_QTY) ? Number(left) : MAX_QTY;
}

export function clampQty(q: number, max: number): number {
  if (!Number.isFinite(q) || max < 1) return 1;
  return Math.max(1, Math.min(max, Math.trunc(q)));
}

export type QtyTotals = { qty: number; unitUsd: number; totalUsd: number; totalNight: number | null; approvals: 1 };
export function qtyTotals(usdCents: bigint, qty: number, nightUsd: number | null): QtyTotals {
  const unitUsd = Number(usdCents) / 100, totalUsd = Math.round(Number(usdCents) * qty) / 100;
  return { qty, unitUsd, totalUsd, totalNight: nightUsd && nightUsd > 0 ? totalUsd / nightUsd : null, approvals: 1 };
}

export const fmtUsd = (n: number) => `$${n.toFixed(2)}`;
