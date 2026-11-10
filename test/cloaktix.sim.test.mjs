// CloakTix simulator tests (compact-runtime 0.16.0) — no network, no real funds.
import { describe, it, expect, beforeEach } from 'vitest';
import * as rt from '@midnight-ntwrk/compact-runtime';
import { randomBytes } from 'node:crypto';
import { Contract, ledger, pureCircuits } from '../contract/managed/cloaktix/contract/index.js';
import { newIssuerSecret, issuerPublicKey, signAgeCredential, adultFromBirthdate } from '../contract/age-credential.mjs';
import { witnesses as appWitnesses } from '../contract/witnesses.ts';

const BPS = 300n; // 3% platform fee
const CAPPED = 0, UNLIMITED = 1, NONE = 2; // ResaleMode
const fee = (p) => (p * BPS) / 10000n;
const hex = (b) => Buffer.from(b).toString('hex');
const ua = () => ({ bytes: randomBytes(32) });

const sk = { admin: randomBytes(32), org: randomBytes(32), alice: randomBytes(32), bob: randomBytes(32), carol: randomBytes(32) };
let who = 'org';
const witnesses = {
  wit_CloakSK: (ctx) => [ctx.privateState, sk[who]],
  wit_MultiTokenSK: (ctx) => [ctx.privateState, sk[who]],
  // same witness as the app, fed with the current caller's credential (if any)
  wit_AgeCredential: (ctx) => appWitnesses.wit_AgeCredential({ ...ctx, privateState: { sk: sk[who], age: age[who] } }),
};
const NOW = Math.floor(Date.now() / 1000);
const ASOF = BigInt(NOW - 60); // buyer-chosen "as of" time, slightly in the past
const issuerSk = newIssuerSecret(), ISSUER = issuerPublicKey(issuerSk);
const age = {}; // per caller: AgeCredential
const NO_ISSUER = { is_some: false, value: rt.ecMulGenerator(1n) };
const c = new Contract(witnesses);
const id = (k) => ({ is_left: true, left: pureCircuits.accountId(sk[k]), right: { bytes: new Uint8Array(32) } });

let addr, state, zswap;
const call = (k, circuit, ...args) => {
  who = k;
  const ctx = rt.createCircuitContext(addr, zswap, state, {}, undefined, undefined, NOW);
  const r = c.circuits[circuit](ctx, ...args);
  state = r.context.currentQueryContext.state;
  return { result: r.result, eff: r.context.currentQueryContext.effects };
};
// outgoing payments: { addressHex: amount }
const payouts = (eff) => {
  const o = {};
  for (const [[, to], v] of eff.claimedUnshieldedSpends) o[to.address] = v;
  return o;
};
const received = (eff) => [...eff.unshieldedInputs.values()].reduce((a, b) => a + b, 0n);
const L = () => ledger(state);
const bal = (k, t) => call('org', 'balanceOf', id(k), t).result;

let feeAddr, orgPayout, alicePayout, eventId, vip, ga;
const PRICE_VIP = 50_000_000n, PRICE_GA = 10_000_000n;

beforeEach(() => {
  for (const k of Object.keys(age)) delete age[k];
  feeAddr = ua(); orgPayout = ua(); alicePayout = ua();
  const init = c.initialState(rt.createConstructorContext({}, '0'.repeat(64)), 'ipfs://cloaktix/{id}', BPS, feeAddr, pureCircuits.accountId(sk.admin), ISSUER);
  addr = rt.sampleContractAddress();
  state = init.currentContractState.data; zswap = init.currentZswapLocalState;
  eventId = call('org', 'createEvent', orgPayout).result;
  vip = call('org', 'addTicketType', eventId, PRICE_VIP, fee(PRICE_VIP), 2n, CAPPED, 60_000_000n, false).result;
  ga = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 100n, CAPPED, 12_000_000n, false).result;
});

describe('CloakTix — organizer', () => {
  it('creates an event and 2 ticket types', () => {
    expect(eventId).toBe(1n); expect(vip).toBe(1n); expect(ga).toBe(2n);
    expect(L().ticketTypes.lookup(ga).maxResale).toBe(12_000_000n);
    expect(L().feeBps).toBe(300n);
  });
  it('rejects a fee that does not match 3%', () => {
    expect(() => call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA) + 1n, 10n, CAPPED, PRICE_GA, false)).toThrow(/fee too high/);
    expect(() => call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA) - 1n, 10n, CAPPED, PRICE_GA, false)).toThrow(/fee too low/);
  });
  it('only the organizer adds types or closes sales', () => {
    expect(() => call('alice', 'addTicketType', eventId, 1000n, 30n, 1n, CAPPED, 1000n, false)).toThrow(/Not organizer/);
    expect(() => call('alice', 'setSalesOpen', eventId, false)).toThrow(/Not organizer/);
    call('org', 'setSalesOpen', eventId, false);
    expect(() => call('alice', 'buyTicket', ga)).toThrow(/Sales closed/);
  });
});

describe('CloakTix — primary sale', () => {
  it('3% to the fee address, 97% to the organizer, ticket minted (10 -> 9.70 / 0.30)', () => {
    const { eff } = call('alice', 'buyTicket', ga);
    expect(received(eff)).toBe(PRICE_GA);
    const p = payouts(eff);
    expect(p[hex(feeAddr.bytes)]).toBe(300_000n);
    expect(p[hex(orgPayout.bytes)]).toBe(9_700_000n);
    expect(bal('alice', ga)).toBe(1n);
    expect(L().ticketTypes.lookup(ga).sold).toBe(1n);
  });
  it('sold out', () => {
    call('alice', 'buyTicket', vip); call('bob', 'buyTicket', vip);
    expect(() => call('carol', 'buyTicket', vip)).toThrow(/Sold out/);
  });
});

describe('CloakTix — capped resale', () => {
  it('rejects a price above the organizer cap', () => {
    call('alice', 'buyTicket', ga);
    expect(() => call('alice', 'listForResale', ga, 12_000_001n, fee(12_000_001n), alicePayout)).toThrow(/Above max resale price/);
  });
  it('resale at the cap: 3% fee, rest to the seller, ticket transferred (12 -> 0.36 / 11.64)', () => {
    call('alice', 'buyTicket', ga);
    const P = 12_000_000n;
    const lid = call('alice', 'listForResale', ga, P, fee(P), alicePayout).result;
    expect(bal('alice', ga)).toBe(0n); // escrowed in the contract
    const { eff } = call('bob', 'buyResale', lid);
    expect(received(eff)).toBe(P);
    const p = payouts(eff);
    expect(p[hex(feeAddr.bytes)]).toBe(360_000n);
    expect(p[hex(alicePayout.bytes)]).toBe(11_640_000n);
    expect(bal('bob', ga)).toBe(1n);
    expect(L().listings.member(lid)).toBe(false);
  });
  it('unlimited resale: any price, 3% fee still applies', () => {
    const free = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 10n, UNLIMITED, 999n, false).result;
    expect(L().ticketTypes.lookup(free).maxResale).toBe(0n); // cap ignored and stored as 0
    call('alice', 'buyTicket', free);
    const P = 100_000_000n;
    const lid = call('alice', 'listForResale', free, P, fee(P), alicePayout).result;
    const p = payouts(call('bob', 'buyResale', lid).eff);
    expect(p[hex(feeAddr.bytes)]).toBe(3_000_000n);
    expect(p[hex(alicePayout.bytes)]).toBe(97_000_000n);
    expect(() => call('bob', 'listForResale', free, P, fee(P) - 1n, alicePayout)).toThrow(/fee too low/);
  });
  it('no resale: listing is rejected, check-in still works', () => {
    const nt = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 10n, NONE, 0n, false).result;
    call('alice', 'buyTicket', nt);
    expect(() => call('alice', 'listForResale', nt, 1000n, 30n, alicePayout)).toThrow(/Resale not allowed/);
    call('alice', 'checkIn', nt, randomBytes(32));
    expect(bal('alice', nt)).toBe(0n);
  });
  it('cannot list without a ticket; the seller withdraws via buyResale (no payment, even while paused)', () => {
    expect(() => call('bob', 'listForResale', ga, 1000n, 30n, ua())).toThrow(/insufficient balance/);
    call('alice', 'buyTicket', ga);
    const lid = call('alice', 'listForResale', ga, 10_000_000n, 300_000n, alicePayout).result;
    call('admin', 'adminSet', true, NO_ISSUER);
    expect(() => call('bob', 'buyResale', lid)).toThrow(/paused/i);
    const w = call('alice', 'buyResale', lid);
    expect(received(w.eff)).toBe(0n);
    expect(Object.keys(payouts(w.eff))).toHaveLength(0);
    expect(bal('alice', ga)).toBe(1n);
    expect(L().listings.member(lid)).toBe(false);
    call('admin', 'adminSet', false, NO_ISSUER);
  });
  it('no direct transfer is exposed (the cap cannot be bypassed on-chain)', () => {
    for (const n of ['transferFrom', '_transfer', '_unsafeTransfer', '_unsafeTransferFrom', 'setApprovalForAll', '_mint', '_burn'])
      expect(c.circuits[n]).toBeUndefined();
  });
});

describe('CloakTix — proof of holding, check-in and pause', () => {
  it('the holder proves, a non-holder is rejected', () => {
    call('alice', 'buyTicket', vip);
    expect(() => call('alice', 'proveHolder', vip)).not.toThrow();
    expect(() => call('bob', 'proveHolder', vip)).toThrow(/Not holder/);
    expect(() => call('alice', 'proveHolder', ga)).toThrow(/Not holder/);
  });
  it('check-in burns the ticket and records the pass once (single-use)', () => {
    call('alice', 'buyTicket', ga);
    const pass = randomBytes(32);
    expect(() => call('bob', 'checkIn', ga, pass)).toThrow(/Not holder/);
    expect(() => call('alice', 'checkIn', vip, pass)).toThrow(/Not holder/); // wrong ticket type
    call('alice', 'checkIn', ga, pass);
    expect(L().checkIns.lookup(pass)).toBe(ga);
    expect(bal('alice', ga)).toBe(0n);
    call('alice', 'buyTicket', ga);
    expect(() => call('alice', 'checkIn', ga, pass)).toThrow(/Pass already used/);
    expect(() => call('alice', 'listForResale', ga, 1000n, 30n, alicePayout)).not.toThrow();
    expect(() => call('alice', 'checkIn', ga, randomBytes(32))).toThrow(/Not holder/); // ticket now escrowed
  });
  it('emergency pause by the admin only', () => {
    expect(() => call('org', 'adminSet', true, NO_ISSUER)).toThrow(/Not admin/);
    call('admin', 'adminSet', true, NO_ISSUER);
    expect(() => call('alice', 'buyTicket', ga)).toThrow(/Pausable: paused/);
    call('admin', 'adminSet', false, NO_ISSUER);
    call('alice', 'buyTicket', ga);
  });
});

describe('CloakTix — 18+ ticket types (ZK age credential)', () => {
  const issue = (k, birthdate, key = issuerSk) => signAgeCredential({ issuerSk: key, holder: pureCircuits.accountId(sk[k]), adultFrom: adultFromBirthdate(birthdate) });
  const yearsAgo = (y) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - y); return d.toISOString().slice(0, 10); };
  let adult;
  beforeEach(() => { adult = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 10n, CAPPED, 12_000_000n, true).result; });

  it('adult buys; the ledger only stores the 18+ flag', () => {
    age.alice = issue('alice', '1990-04-12');
    call('alice', 'buyTicketAdult', adult, ASOF);
    expect(bal('alice', adult)).toBe(1n);
    expect(L().ticketTypes.lookup(adult).adultOnly).toBe(true);
    expect(Object.keys(L().ticketTypes.lookup(adult)).sort()).toEqual(['adultOnly', 'eventId', 'fee', 'maxResale', 'price', 'resale', 'sold', 'supply']);
  });
  it('minor is refused (birthdate-derived claim checked in-circuit)', () => {
    age.alice = issue('alice', yearsAgo(16));
    expect(() => call('alice', 'buyTicketAdult', adult, ASOF)).toThrow(/Under 18/);
  });
  it('no credential is refused; non-18+ types are unaffected', () => {
    expect(() => call('carol', 'buyTicketAdult', adult, ASOF)).toThrow(/Age credential required/);
    call('carol', 'buyTicket', ga);
    expect(bal('carol', ga)).toBe(1n);
  });
  it('credential bound to its holder, trusted issuer and signature', () => {
    age.bob = issue('alice', '1990-04-12'); // Alice's credential presented by Bob
    expect(() => call('bob', 'buyTicketAdult', adult, ASOF)).toThrow(/issued to another account/);
    age.bob = issue('bob', '1990-04-12', newIssuerSecret()); // self-made issuer
    expect(() => call('bob', 'buyTicketAdult', adult, ASOF)).toThrow(/untrusted issuer/);
    const forged = issue('bob', yearsAgo(16)); forged.claim = { ...forged.claim, adultFrom: 0n }; // edit the signed claim
    age.bob = forged;
    expect(() => call('bob', 'buyTicketAdult', adult, ASOF)).toThrow(/Invalid age credential signature/);
    age.bob = issue('bob', '1990-04-12');
    expect(() => call('bob', 'buyTicketAdult', adult, BigInt(NOW + 3600))).toThrow(/asOf is in the future/);
    call('bob', 'buyTicketAdult', adult, ASOF);
  });
  it('resale buyers of an 18+ type must prove too (3% fee unchanged)', () => {
    age.alice = issue('alice', '1990-04-12');
    call('alice', 'buyTicketAdult', adult, ASOF);
    const lid = call('alice', 'listForResale', adult, 12_000_000n, fee(12_000_000n), alicePayout).result;
    expect(() => call('bob', 'buyResaleAdult', lid, ASOF)).toThrow(/Age credential required/);
    age.bob = issue('bob', yearsAgo(17));
    expect(() => call('bob', 'buyResaleAdult', lid, ASOF)).toThrow(/Under 18/);
    age.bob = issue('bob', '2000-01-01');
    const p = payouts(call('bob', 'buyResaleAdult', lid, ASOF).eff);
    expect(p[hex(feeAddr.bytes)]).toBe(360_000n);
    expect(bal('bob', adult)).toBe(1n);
  });
  it('non-18+ circuits refuse 18+ types (no age proof in buyTicket / buyResale)', () => {
    age.alice = issue('alice', '1990-04-12');
    expect(() => call('alice', 'buyTicket', adult)).toThrow(/age proof required \(buyTicketAdult\)/);
    call('alice', 'buyTicketAdult', adult, ASOF);
    const lid = call('alice', 'listForResale', adult, 12_000_000n, fee(12_000_000n), alicePayout).result;
    age.bob = issue('bob', '1990-04-12');
    expect(() => call('bob', 'buyResale', lid)).toThrow(/age proof required \(buyResaleAdult\)/);
    call('alice', 'buyResale', lid); // seller withdraws own 18+ listing without an age proof
    expect(bal('alice', adult)).toBe(1n);
    call('bob', 'buyTicketAdult', ga, ASOF); // adult circuit also works for non-18+ types
    expect(bal('bob', ga)).toBe(1n);
  });
  it('placeholder credential is a valid signature (the check is always proven, even for non-18+ types)', () => {
    const [, m] = appWitnesses.wit_AgeCredential({ privateState: { sk: sk.alice } });
    expect(m.is_some).toBe(false);
    const { claim, proof } = m.value;
    const ch = pureCircuits.ageChallenge(claim, proof.issuerMethod, proof.createdAt, proof.challengeHash, proof.publicKey, proof.signature.r);
    const lhs = rt.ecMulGenerator(proof.signature.s), rhs = rt.ecAdd(proof.signature.r, rt.ecMul(proof.publicKey, ch));
    expect([lhs.x, lhs.y]).toEqual([rhs.x, rhs.y]);
  });
  it('admin can swap the trusted issuer (e.g. to Midnight Passport)', () => {
    const next = newIssuerSecret();
    expect(() => call('org', 'adminSet', false, { is_some: true, value: issuerPublicKey(next) })).toThrow(/Not admin/);
    call('admin', 'adminSet', false, { is_some: true, value: issuerPublicKey(next) });
    age.alice = issue('alice', '1990-04-12');
    expect(() => call('alice', 'buyTicketAdult', adult, ASOF)).toThrow(/untrusted issuer/);
    age.alice = issue('alice', '1990-04-12', next);
    call('alice', 'buyTicketAdult', adult, ASOF);
  });
});
