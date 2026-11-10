// CloakTix v2 simulator tests — unique serials + domain-bound admit. No network, no deploy.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const rt = await import(
  pathToFileURL(
    require.resolve('@midnight-ntwrk/compact-runtime', { paths: ['/workspace/midnight-pass/cloaktix/web'] }),
  ).href,
);

const { Contract, ledger, pureCircuits, TicketStatus, ResaleMode } = await import(
  '../contract/managed/cloaktix-v2/contract/index.js'
);
const { newIssuerSecret, issuerPublicKey, signAgeCredential, adultFromBirthdate } = await import(
  '../contract/age-credential.mjs'
);
const { witnesses: appWitnesses } = await import('../contract/witnesses-v2.ts');

const BPS = 300n;
const CAPPED = 0, UNLIMITED = 1, NONE = 2;
const fee = (p) => (p * BPS) / 10000n;
const hex = (b) => Buffer.from(b).toString('hex');
const ua = () => ({ bytes: randomBytes(32) });
const EMPTY = new Uint8Array(32);
const tagNetwork = (s) => {
  const u = new Uint8Array(32);
  u.set(Buffer.from(s, 'utf8').subarray(0, 32));
  return u;
};
const NETWORK_TAG = tagNetwork('undeployed');

const sk = {
  admin: randomBytes(32), org: randomBytes(32), alice: randomBytes(32),
  bob: randomBytes(32), carol: randomBytes(32),
};
let who = 'org';
const age = {};
const witnesses = {
  wit_CloakSK: (ctx) => [ctx.privateState, sk[who]],
  wit_AgeCredential: (ctx) =>
    appWitnesses.wit_AgeCredential({ ...ctx, privateState: { sk: sk[who], age: age[who] } }),
};

const NOW = Math.floor(Date.now() / 1000);
const ASOF = BigInt(NOW - 60);
const issuerSk = newIssuerSecret();
const ISSUER = issuerPublicKey(issuerSk);
const c = new Contract(witnesses);
const id = (k) => pureCircuits.accountId(sk[k]);

let addr, state, zswap;
const call = (k, circuit, ...args) => {
  who = k;
  const ctx = rt.createCircuitContext(addr, zswap, state, {}, undefined, undefined, NOW);
  const r = c.circuits[circuit](ctx, ...args);
  state = r.context.currentQueryContext.state;
  return { result: r.result, eff: r.context.currentQueryContext.effects };
};
const L = () => ledger(state);
const tk = (serial) => {
  const L = ledger(state);
  assert.equal(L.tickets.member(serial), true, 'ticket missing');
  return L.tickets.lookup(serial);
};
const commitOf = (serial, epoch, nonce, net = NETWORK_TAG, contractAddr = addr) =>
  pureCircuits.admitCommitOf(net, pureCircuits.contractKeyOf(typeof contractAddr === 'string' ? { bytes: Buffer.from(contractAddr, 'hex') } : contractAddr), serial, epoch, nonce);

const PRICE_VIP = 50_000_000n, PRICE_GA = 10_000_000n;
let feeAddr, orgPayout, alicePayout, eventId, vip, ga;

beforeEach(() => {
  for (const k of Object.keys(age)) delete age[k];
  feeAddr = ua(); orgPayout = ua(); alicePayout = ua();
  const init = c.initialState(
    rt.createConstructorContext({}, '0'.repeat(64)),
    BPS, feeAddr, pureCircuits.accountId(sk.admin), ISSUER, NETWORK_TAG,
  );
  addr = rt.sampleContractAddress();
  state = init.currentContractState.data;
  zswap = init.currentZswapLocalState;
  eventId = call('org', 'createEvent', orgPayout).result;
  vip = call('org', 'addTicketType', eventId, PRICE_VIP, fee(PRICE_VIP), 2n, CAPPED, 60_000_000n, false).result;
  ga = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 100n, CAPPED, 12_000_000n, false).result;
});

describe('CloakTix v2 — schema + unique serials', () => {
  it('schemaVersion 2, networkTag sealed, serials unique', () => {
    assert.equal(L().schemaVersion, 2n);
    assert.equal(hex(L().networkTag), hex(NETWORK_TAG));
    const s1 = call('alice', 'buyTicket', ga, EMPTY).result;
    const s2 = call('alice', 'buyTicket', ga, EMPTY).result;
    const s3 = call('bob', 'buyTicket', vip, EMPTY).result;
    assert.deepEqual([s1, s2, s3], [1n, 2n, 3n]);
    assert.equal(tk(s1).typeId, ga);
    assert.equal(tk(s1).status, TicketStatus.owned);
    assert.equal(hex(tk(s1).owner), hex(id('alice')));
  });

  it('same type multiple units stay independent', () => {
    const a = call('alice', 'buyTicket', ga, EMPTY).result;
    const b = call('alice', 'buyTicket', ga, EMPTY).result;
    call('alice', 'listForResale', a, 12_000_000n, fee(12_000_000n), alicePayout);
    assert.equal(tk(a).status, TicketStatus.listed);
    assert.equal(tk(b).status, TicketStatus.owned);
  });
});

describe('CloakTix v2 — domain-bound admit', () => {
  it('registerAdmit does not consume; organizer admit once; double admit rejects', () => {
    const serial = call('alice', 'buyTicket', ga, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    assert.equal(tk(serial).status, TicketStatus.owned);
    assert.throws(() => call('alice', 'admit', serial, nonce), /Not gate\/organizer/);
    call('org', 'admit', serial, nonce);
    assert.equal(tk(serial).status, TicketStatus.consumed);
    assert.throws(() => call('org', 'admit', serial, nonce), /Not owned/);
  });

  it('wrong nonce / empty / wrong networkTag commit fail', () => {
    const serial = call('alice', 'buyTicket', ga, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    assert.throws(() => call('org', 'admit', serial, randomBytes(32)), /Bad admit/);
    // Commit computed under a different network tag cannot be registered usefully for this deploy:
    const foreign = commitOf(serial, 1n, nonce, tagNetwork('preview'));
    call('alice', 'registerAdmit', serial, EMPTY);
    call('alice', 'registerAdmit', serial, foreign);
    assert.throws(() => call('org', 'admit', serial, nonce), /Bad admit/);
  });

  it('buyTicket can embed domain-bound commit', () => {
    const nonce = randomBytes(32);
    const commit = commitOf(1n, 1n, nonce);
    const serial = call('alice', 'buyTicket', ga, commit).result;
    assert.equal(serial, 1n);
    call('org', 'admit', serial, nonce);
    assert.equal(tk(serial).status, TicketStatus.consumed);
  });

  it('wrong event organizer cannot admit', () => {
    const e2 = call('bob', 'createEvent', ua()).result;
    const ga2 = call('bob', 'addTicketType', e2, PRICE_GA, fee(PRICE_GA), 5n, NONE, 0n, false).result;
    const serial = call('alice', 'buyTicket', ga2, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    assert.throws(() => call('org', 'admit', serial, nonce), /Not gate\/organizer/);
    call('bob', 'admit', serial, nonce);
    assert.equal(tk(serial).status, TicketStatus.consumed);
  });
});

describe('CloakTix v2 — resale / withdraw / stale QR', () => {
  it('list bumps epoch clears admit; buy transfers; stale nonce rejects', () => {
    const serial = call('alice', 'buyTicket', ga, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    const lid = call('alice', 'listForResale', serial, 12_000_000n, fee(12_000_000n), alicePayout).result;
    assert.equal(tk(serial).epoch, 2n);
    assert.equal(tk(serial).hasAdmit, false);
    assert.throws(() => call('org', 'admit', serial, nonce), /Not owned/);
    call('bob', 'buyResale', lid);
    assert.equal(hex(tk(serial).owner), hex(id('bob')));
    assert.equal(tk(serial).epoch, 3n);
    assert.throws(() => call('org', 'admit', serial, nonce), /No admit registered/);
    const n2 = randomBytes(32);
    call('bob', 'registerAdmit', serial, commitOf(serial, 3n, n2));
    assert.throws(() => call('org', 'admit', serial, nonce), /Bad admit/);
    call('org', 'admit', serial, n2);
    assert.throws(() => call('org', 'admit', serial, n2), /Not owned/);
  });

  it('withdraw invalidates nonce; consumed cannot list; transfer away/back rejects old nonce', () => {
    const serial = call('alice', 'buyTicket', ga, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    const lid = call('alice', 'listForResale', serial, 12_000_000n, fee(12_000_000n), alicePayout).result;
    call('alice', 'buyResale', lid); // withdraw
    assert.equal(tk(serial).epoch, 3n);
    assert.equal(tk(serial).hasAdmit, false);
    assert.throws(() => call('org', 'admit', serial, nonce), /No admit registered/);

    const n2 = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, tk(serial).epoch, n2));
    call('org', 'admit', serial, n2);
    assert.throws(
      () => call('alice', 'listForResale', serial, 12_000_000n, fee(12_000_000n), alicePayout),
      /Not owned/,
    );

    const s2 = call('alice', 'buyTicket', ga, EMPTY).result;
    const n3 = randomBytes(32);
    call('alice', 'registerAdmit', s2, commitOf(s2, 1n, n3));
    let l = call('alice', 'listForResale', s2, 12_000_000n, fee(12_000_000n), alicePayout).result;
    call('bob', 'buyResale', l);
    l = call('bob', 'listForResale', s2, 11_000_000n, fee(11_000_000n), ua()).result;
    call('alice', 'buyResale', l);
    assert.throws(() => call('org', 'admit', s2, n3), /No admit registered/);
  });
});

describe('CloakTix v2 — resale modes + pause + payments', () => {
  it('none forbids list; capped enforces max; unlimited allows above primary', () => {
    const noneT = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 5n, NONE, 0n, false).result;
    const unlim = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 5n, UNLIMITED, 0n, false).result;
    const sn = call('alice', 'buyTicket', noneT, EMPTY).result;
    assert.throws(
      () => call('alice', 'listForResale', sn, PRICE_GA, fee(PRICE_GA), alicePayout),
      /Resale not allowed/,
    );
    const sc = call('alice', 'buyTicket', ga, EMPTY).result;
    assert.throws(
      () => call('alice', 'listForResale', sc, 12_000_001n, fee(12_000_001n), alicePayout),
      /Above max resale/,
    );
    const su = call('alice', 'buyTicket', unlim, EMPTY).result;
    const lid = call('alice', 'listForResale', su, 99_000_000n, fee(99_000_000n), alicePayout).result;
    assert.ok(lid > 0n);
  });

  it('paused blocks buy/admit; seller withdraw still works', () => {
    const serial = call('alice', 'buyTicket', ga, EMPTY).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    call('admin', 'adminSet', true, { is_some: false, value: ISSUER });
    assert.throws(() => call('bob', 'buyTicket', ga, EMPTY), /Paused/);
    assert.throws(() => call('org', 'admit', serial, nonce), /Paused/);
    assert.throws(() => call('alice', 'listForResale', serial, 12_000_000n, fee(12_000_000n), alicePayout), /Paused/);
    // unpause, list, pause, withdraw
    call('admin', 'adminSet', false, { is_some: false, value: ISSUER });
    const idL = call('alice', 'listForResale', serial, 12_000_000n, fee(12_000_000n), alicePayout).result;
    call('admin', 'adminSet', true, { is_some: false, value: ISSUER });
    call('alice', 'buyResale', idL); // withdraw while paused
    assert.equal(tk(serial).status, TicketStatus.owned);
  });
});

describe('CloakTix v2 — adult paths', () => {
  const issue = (k, birthdate, key = issuerSk) =>
    signAgeCredential({
      issuerSk: key,
      holder: pureCircuits.accountId(sk[k]),
      adultFrom: adultFromBirthdate(birthdate),
    });
  let adult;
  beforeEach(() => {
    adult = call('org', 'addTicketType', eventId, PRICE_GA, fee(PRICE_GA), 10n, CAPPED, 12_000_000n, true).result;
  });

  it('adult buy + admit; non-adult circuit refuses; resale needs age', () => {
    age.alice = issue('alice', '1990-04-12');
    assert.throws(() => call('alice', 'buyTicket', adult, EMPTY), /age proof required/);
    const serial = call('alice', 'buyTicketAdult', adult, EMPTY, ASOF).result;
    const nonce = randomBytes(32);
    call('alice', 'registerAdmit', serial, commitOf(serial, 1n, nonce));
    call('org', 'admit', serial, nonce);
    assert.equal(tk(serial).status, TicketStatus.consumed);

    const s2 = call('alice', 'buyTicketAdult', adult, EMPTY, ASOF).result;
    const lid = call('alice', 'listForResale', s2, 12_000_000n, fee(12_000_000n), alicePayout).result;
    assert.throws(() => call('bob', 'buyResale', lid), /age proof required/);
    age.bob = issue('bob', '2000-01-01');
    call('bob', 'buyResaleAdult', lid, ASOF);
    assert.equal(hex(tk(s2).owner), hex(id('bob')));
  });
});
