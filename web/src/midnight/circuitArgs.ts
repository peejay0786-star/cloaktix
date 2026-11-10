/**
 * Schema-aware Compact call-site argument builders.
 *
 * Compact wrappers count CircuitContext as arg 1 "as invoked from Typescript",
 * so submitCallTx(args) must pass exactly:
 *   v1/v2 addTicketType → 7 circuit args (expected 8 with context)
 *   v3   addTicketType → 6 circuit args (expected 7 with context)
 *
 * The live deployed rate-v3 circuit (cf197bee…) matches Compact source:
 *   addTicketType(eventId, priceUsdCents, supply, resale, maxResaleUsdCents, adultOnly)
 * There is no fee argument on-chain for v3 (fee is settled from the rate quote at buy).
 */
import type { CloakSchema } from './schema';

export type AddTicketTypeInput = {
  eventId: bigint;
  /** USD cents for schema 3; NIGHT atoms for schema 1/2. */
  priceUnits: bigint;
  /** Platform fee in NIGHT atoms — schema 1/2 only; ignored on schema 3. */
  feeAtoms: bigint;
  supply: bigint;
  resale: number;
  /** USD cents (v3) or NIGHT atoms (v1/v2) max resale when capped; else 0n. */
  maxResaleUnits: bigint;
  adultOnly: boolean;
};

export type ListForResaleInput = {
  serialOrTypeId: bigint;
  /** USD cents for schema 3; NIGHT atoms for schema 1/2. */
  priceUnits: bigint;
  feeAtoms: bigint;
  payout: unknown;
};

/** Circuit-arg vector passed to Session.call (no CircuitContext). */
export function addTicketTypeArgs(schema: CloakSchema, input: AddTicketTypeInput): unknown[] {
  if (schema === 3 || schema === 4) {
    return [
      input.eventId,
      input.priceUnits,
      input.supply,
      input.resale,
      input.maxResaleUnits,
      input.adultOnly,
    ];
  }
  return [
    input.eventId,
    input.priceUnits,
    input.feeAtoms,
    input.supply,
    input.resale,
    input.maxResaleUnits,
    input.adultOnly,
  ];
}

export function listForResaleArgs(schema: CloakSchema, input: ListForResaleInput): unknown[] {
  if (schema === 3 || schema === 4) {
    return [input.serialOrTypeId, input.priceUnits, input.payout];
  }
  return [input.serialOrTypeId, input.priceUnits, input.feeAtoms, input.payout];
}

/** Expected circuit-arg count (what App must pass into Session.call). */
export function addTicketTypeCircuitArity(schema: CloakSchema): 6 | 7 {
  return (schema === 3 || schema === 4) ? 6 : 7;
}

export function listForResaleCircuitArity(schema: CloakSchema): 3 | 4 {
  return (schema === 3 || schema === 4) ? 3 : 4;
}

// ---------------------------------------------------------------------------
// Schema-3 primary sales (deployed rate-v3 cf197bee…). Wrapper arity strings
// ("as invoked from Typescript", i.e. +1 for CircuitContext):
//   buyTicket          expected 7 → 6 circuit args
//   buyTicketAdult     expected 8 → 7 circuit args
//   buyTicketAda       expected 5 → 4 circuit args
//   buyTicketAdaAdult  expected 6 → 5 circuit args
// Compact:
//   buyTicket(typeId, admitCommit, nightPaid, fee, q: RateQuote, now)
//   buyTicketAdult(typeId, admitCommit, nightPaid, fee, q, now, asOf)
//   buyTicketAda(typeId, admitCommit, a: AdaAttestation, now)
//   buyTicketAdaAdult(typeId, admitCommit, a, now, asOf)
// ---------------------------------------------------------------------------

export type JubjubPointArg = { x: bigint; y: bigint };
export type SignatureArg = { r: JubjubPointArg; s: bigint };
export type RateQuoteArg = { atomsPerUsdCent: bigint; issuedAt: bigint; expiresAt: bigint; signature: SignatureArg };
export type AdaAttestationArg = {
  typeId: bigint; buyer: Uint8Array; txHash: Uint8Array; priceUsdCents: bigint; lovelacePaid: bigint;
  issuedAt: bigint; expiresAt: bigint; signature: SignatureArg;
};

export type BuyTicketV3Input = {
  typeId: bigint; admitCommit: Uint8Array; nightPaid: bigint; fee: bigint; quote: RateQuoteArg; now: bigint; asOf?: bigint;
};

export function buyTicketV3Call(input: BuyTicketV3Input): { circuit: 'buyTicket' | 'buyTicketAdult'; args: unknown[] } {
  const base = [input.typeId, input.admitCommit, input.nightPaid, input.fee, input.quote, input.now];
  if (input.asOf !== undefined) return { circuit: 'buyTicketAdult', args: [...base, input.asOf] };
  return { circuit: 'buyTicket', args: base };
}


export const V3_BUY_CIRCUIT_ARITY = { buyTicket: 6, buyTicketAdult: 7, buyTicketAda: 4, buyTicketAdaAdult: 5 } as const;

/**
 * NIGHT amounts that satisfy deployed checkFee + assertCoversUsd:
 *   nightPaid = usdCents * atomsPerUsdCent (exact USD at quote, no slippage used)
 *   fee = floor(nightPaid * feeBps / 10000)  (checkFee: f*1e4 <= p*bps < (f+1)*1e4)
 */
export function v3NightAmounts(usdCents: bigint, atomsPerUsdCent: bigint, feeBps: bigint): { nightPaid: bigint; fee: bigint } {
  if (usdCents <= 0n) throw new Error('USD price must be positive');
  if (atomsPerUsdCent <= 0n) throw new Error('Rate quote has zero NIGHT rate');
  const nightPaid = usdCents * atomsPerUsdCent;
  const fee = (nightPaid * feeBps) / 10000n;
  return { nightPaid, fee };
}

/** Choose a circuit `now` inside the signed window (tolerates small client clock skew). */
export function nowInWindow(issuedAt: bigint, expiresAt: bigint, nowSec = BigInt(Math.floor(Date.now() / 1000))): bigint {
  const now = nowSec < issuedAt ? issuedAt : nowSec;
  if (now > expiresAt) throw new Error('Signed quote/attestation expired. Retry to get a fresh one.');
  return now;
}
