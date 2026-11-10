/**
 * ADA payment attestation (Jubjub Schnorr) — same rateSigner key as rate quotes.
 * Domain: cloaktix:ada-attest:v1
 * LOCAL / Worker source. Deployed Worker keeps signingEnabled=false until approved.
 */
import * as rt from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from 'node:crypto';
const { pureCircuits } = await import(new URL('./managed/cloaktix-rate-v3/contract/index.js', import.meta.url).href);

export const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const randScalar = () => {
  const b = BigInt('0x' + randomBytes(64).toString('hex')) % (JUBJUB_ORDER - 1n);
  return b + 1n;
};

export function txHashToBytes32(txHashHex) {
  const h = String(txHashHex).replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) throw new Error('txHash must be 32-byte hex');
  return Uint8Array.from(Buffer.from(h, 'hex'));
}

export function signAdaAttestation({
  signerSk, typeId, buyer, txHash, priceUsdCents, lovelacePaid, issuedAt, expiresAt, networkTag, contractKey,
}) {
  const tx = typeof txHash === 'string' ? txHashToBytes32(txHash) : txHash;
  for (;;) {
    const k = randScalar();
    const r = rt.ecMulGenerator(k);
    const c = pureCircuits.adaAttestChallenge(
      typeId, buyer, tx, priceUsdCents, lovelacePaid, issuedAt, expiresAt, networkTag, contractKey, r,
    );
    if (c >= JUBJUB_ORDER) continue;
    const s = (k + c * signerSk) % JUBJUB_ORDER;
    return {
      typeId, buyer, txHash: tx, priceUsdCents, lovelacePaid, issuedAt, expiresAt,
      signature: { r, s },
    };
  }
}
