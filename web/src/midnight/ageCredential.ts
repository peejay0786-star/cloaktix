/** CT-AGE-CRED: 18+ credential helpers. Pure, no SDK imports. */
import type { AgeCredential } from '../../../contract/witnesses.js';

const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
const pt = (p: any) => ({ x: BigInt(p.x), y: BigInt(p.y) });

/** JSON from /passport/issue (or localStorage) -> witness value. */
export const parseCredential = (j: any): AgeCredential => ({
  claim: { holder: unhex(j.claim.holder), adultFrom: BigInt(j.claim.adultFrom) },
  proof: { issuerMethod: unhex(j.proof.issuerMethod), createdAt: BigInt(j.proof.createdAt), challengeHash: unhex(j.proof.challengeHash),
    publicKey: pt(j.proof.publicKey), signature: { r: pt(j.proof.signature.r), s: BigInt(j.proof.signature.s) } },
});

export type AgeStatus = 'none' | 'adult' | 'minor' | 'untrusted';
type Point = { x: bigint; y: bigint };

/** Same checks as the contract's assertAdult that can be done before proving (holder is bound by the storage key). */
export function ageStatusFor(age: AgeCredential | null | undefined, asOf: bigint, ageIssuer?: Point | null): AgeStatus {
  if (!age) return 'none';
  if (ageIssuer && (age.proof.publicKey.x !== ageIssuer.x || age.proof.publicKey.y !== ageIssuer.y)) return 'untrusted';
  return age.claim.adultFrom <= asOf ? 'adult' : 'minor';
}

export const AGE_CHECK_ANCHOR = 'age-check';

/** Message shown instead of starting an 18+ purchase. null = OK to prove. */
export function adultBuyBlock(status: AgeStatus): string | null {
  switch (status) {
    case 'adult': return null;
    case 'none': return 'This is an 18+ ticket. Get your age credential first in “Age check for 18+ tickets”, then buy. Nothing was bought.';
    case 'minor': return 'Your age credential says you are under 18, so this 18+ ticket cannot be bought. Nothing was bought.';
    case 'untrusted': return 'Your age credential is from an issuer this event does not trust. Remove it and get a new one in “Age check for 18+ tickets”. Nothing was bought.';
  }
}

export const ADULT_CIRCUITS = new Set(['buyTicketAdult', 'buyResaleAdult', 'buyTicketAdaAdult']);

export class AgeCredentialRequiredError extends Error {
  status: AgeStatus;
  constructor(status: AgeStatus) { super(adultBuyBlock(status) ?? 'Age check required.'); this.name = 'AgeCredentialRequiredError'; this.status = status; }
}

/** Throws before any proving when an 18+ circuit would fail the contract's age check. */
export function assertCanProveAdult(circuitId: string, status: AgeStatus): void {
  if (ADULT_CIRCUITS.has(circuitId) && status !== 'adult') throw new AgeCredentialRequiredError(status);
}

/** Contract age asserts -> plain English (for anything that still reaches the circuit). */
export function humanizeAgeError(raw: string): string | null {
  if (/No age credential/.test(raw)) return adultBuyBlock('none');
  if (/Under 18/.test(raw)) return adultBuyBlock('minor');
  if (/Untrusted age issuer/.test(raw)) return adultBuyBlock('untrusted');
  if (/Age credential not for this identity/.test(raw)) return 'Your age credential belongs to a different CloakTix identity. Get a new one in “Age check for 18+ tickets”. Nothing was bought.';
  if (/Invalid age credential signature/.test(raw)) return 'Your age credential is not valid. Remove it and get a new one in “Age check for 18+ tickets”. Nothing was bought.';
  if (/18\+ ticket type: age proof required/.test(raw)) return adultBuyBlock('none');
  return null;
}

/** Window event so every 18+ Buy button refreshes when a credential is added or removed. */
export const AGE_CHANGED_EVENT = 'cloaktix:age-changed';

/** Buyer-chosen proof time, slightly in the past (same as Session nowAsOf). */
export const asOfNow = () => BigInt(Math.floor(Date.now() / 1000) - 120);
