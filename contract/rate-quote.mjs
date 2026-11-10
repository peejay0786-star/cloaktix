// Local rate-quote signer for CT-RATE (Jubjub Schnorr, Preview-compatible).
// Domain: cloaktix:rate:v1 + atomsPerUsdCent + issuedAt + expiresAt + networkTag + contractKey + r.
import * as rt from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from 'node:crypto';
const { pureCircuits } = await import(new URL('./managed/cloaktix-rate-v3/contract/index.js', import.meta.url).href);

export const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const randScalar = () => {
  const b = BigInt('0x' + randomBytes(64).toString('hex')) % (JUBJUB_ORDER - 1n);
  return b + 1n;
};
export const newRateSignerSecret = () => randScalar();
export const rateSignerPublicKey = (sk) => rt.ecMulGenerator(sk);

/** Ceil atoms of NIGHT for one USD cent from a USD/NIGHT spot. */
export function atomsPerUsdCentFromNightUsd(nightUsd) {
  if (!(nightUsd > 0) || !Number.isFinite(nightUsd)) throw new Error('invalid nightUsd');
  // 1 USD = 1/nightUsd NIGHT; 1 cent = that / 100; atoms = * 1e6. Ceil.
  const atoms = Math.ceil((1 / nightUsd / 100) * 1_000_000);
  if (!Number.isSafeInteger(atoms) || atoms <= 0) throw new Error('atomsPerUsdCent out of range');
  return BigInt(atoms);
}

export function minAcceptableAtoms(usdCents, atomsPerUsdCent, slippageBps) {
  const required = usdCents * atomsPerUsdCent;
  const keep = 10000n - slippageBps;
  return (required * keep + 9999n) / 10000n;
}

export function coversUsd(usdCents, atomsPerUsdCent, paid, slippageBps) {
  const required = usdCents * atomsPerUsdCent;
  const keep = 10000n - slippageBps;
  return paid * 10000n >= required * keep;
}

export function signRateQuote({
  signerSk, atomsPerUsdCent, issuedAt, expiresAt, networkTag, contractKey,
}) {
  const publicKey = rateSignerPublicKey(signerSk);
  for (;;) {
    const k = randScalar();
    const r = rt.ecMulGenerator(k);
    const c = pureCircuits.rateChallenge(atomsPerUsdCent, issuedAt, expiresAt, networkTag, contractKey, r);
    if (c >= JUBJUB_ORDER) continue;
    const s = (k + c * signerSk) % JUBJUB_ORDER;
    return {
      atomsPerUsdCent, issuedAt, expiresAt,
      signature: { r, s },
      publicKey,
    };
  }
}
