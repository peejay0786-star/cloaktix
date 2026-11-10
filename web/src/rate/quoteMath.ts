export type LiveQuote = {
  usdCents: bigint;
  nightUsd: number;
  atomsPerUsdCent: bigint;
  nightAtoms: bigint;
  issuedAt: number;
  expiresAt: number;
};
export function atomsPerUsdCentFromNightUsd(nightUsd: number): bigint {
  if (!(nightUsd > 0) || !Number.isFinite(nightUsd)) throw new Error('invalid nightUsd');
  return BigInt(Math.ceil((1 / nightUsd / 100) * 1_000_000));
}
export function quoteNightForUsd(usdCents: bigint, nightUsd: number, ttlSec = 180): LiveQuote {
  const atomsPerUsdCent = atomsPerUsdCentFromNightUsd(nightUsd);
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    usdCents, nightUsd, atomsPerUsdCent,
    nightAtoms: usdCents * atomsPerUsdCent,
    issuedAt, expiresAt: issuedAt + ttlSec,
  };
}
export function secondsLeft(expiresAt: number, nowSec = Math.floor(Date.now() / 1000)): number {
  return Math.max(0, expiresAt - nowSec);
}
