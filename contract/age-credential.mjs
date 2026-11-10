// SPDX-License-Identifier: Apache-2.0
// Off-chain side of the CloakTix 18+ credential (Node): key generation and issuer signing.
// Signature = Jubjub Schnorr as in the Midnight Verifiable Credentials core: s*G == r + c*publicKey,
// with c = pureCircuits.ageChallenge(...) (the exact function the contract verifies in-circuit).
import * as rt from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from 'node:crypto';
import { pureCircuits } from './managed/cloaktix/contract/index.js';

export const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const randScalar = () => {
  const b = BigInt('0x' + randomBytes(64).toString('hex')) % (JUBJUB_ORDER - 1n);
  return b + 1n;
};
const tag32 = (s) => { const u = new Uint8Array(32); u.set(new TextEncoder().encode(s).slice(0, 32)); return u; };

export const ISSUER_METHOD = tag32('cloaktix:passport-stub#key-1');
export const newIssuerSecret = () => randScalar();
export const issuerPublicKey = (sk) => rt.ecMulGenerator(sk);

// Unix seconds at the holder's 18th birthday (UTC). Only this derived value is signed.
export function adultFromBirthdate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Birthdate must be YYYY-MM-DD');
  return BigInt(Math.floor(Date.UTC(y + 18, m - 1, d) / 1000));
}

// holder: Uint8Array(32) CloakTix account id. Returns the AgeCredential struct the contract expects.
export function signAgeCredential({ issuerSk, holder, adultFrom, createdAt = BigInt(Math.floor(Date.now() / 1000)), challengeHash = new Uint8Array(32), issuerMethod = ISSUER_METHOD }) {
  const publicKey = issuerPublicKey(issuerSk);
  const claim = { holder, adultFrom };
  // compact-runtime rejects scalars >= the Jubjub order in ecMul, so resample the nonce until c < order.
  for (;;) {
    const k = randScalar();
    const r = rt.ecMulGenerator(k);
    const c = pureCircuits.ageChallenge(claim, issuerMethod, createdAt, challengeHash, publicKey, r);
    if (c >= JUBJUB_ORDER) continue;
    const s = (k + c * issuerSk) % JUBJUB_ORDER;
    return { claim, proof: { issuerMethod, createdAt, challengeHash, publicKey, signature: { r, s } } };
  }
}

// JSON transport (bigints and bytes as strings)
const hex = (u) => Buffer.from(u).toString('hex');
export const credentialToJson = (c) => ({
  claim: { holder: hex(c.claim.holder), adultFrom: String(c.claim.adultFrom) },
  proof: { issuerMethod: hex(c.proof.issuerMethod), createdAt: String(c.proof.createdAt), challengeHash: hex(c.proof.challengeHash),
    publicKey: { x: String(c.proof.publicKey.x), y: String(c.proof.publicKey.y) },
    signature: { r: { x: String(c.proof.signature.r.x), y: String(c.proof.signature.r.y) }, s: String(c.proof.signature.s) } },
});
