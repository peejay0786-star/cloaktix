// CT-RATE local prototype tests — USD cents + signed Jubjub rate quotes. No deploy / no live v2.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const rt = await import(
  pathToFileURL(require.resolve('@midnight-ntwrk/compact-runtime', { paths: ['/workspace/midnight-pass/cloaktix/web'] })).href,
);
const { Contract, ledger, pureCircuits, TicketStatus } = await import('../contract/managed/cloaktix-rate-v3/contract/index.js');
const { newIssuerSecret, issuerPublicKey } = await import('../contract/age-credential.mjs');
const {
  newRateSignerSecret, rateSignerPublicKey, atomsPerUsdCentFromNightUsd,
  coversUsd, signRateQuote, minAcceptableAtoms,
} = await import('../contract/rate-quote.mjs');
const { witnesses: appWitnesses } = await import('../contract/witnesses-rate-v3.ts');

const BPS = 300n, SLIP = 100n, MAX_AGE = 180n; // 1% slippage, 3 min
const CAPPED = 0, NONE = 2;
const fee = (p) => (p * BPS) / 10000n;
const hex = (b) => Buffer.from(b).toString('hex');
const ua = () => ({ bytes: randomBytes(32) });
const EMPTY = new Uint8Array(32);
const tagNetwork = (s) => { const u = new Uint8Array(32); u.set(Buffer.from(s, 'utf8').subarray(0, 32)); return u; };
const NETWORK_TAG = tagNetwork('undeployed');

const sk = { admin: randomBytes(32), org: randomBytes(32), alice: randomBytes(32), bob: randomBytes(32) };
let who = 'org';
const age = {};
const witnesses = {
  wit_CloakSK: (ctx) => [ctx.privateState, sk[who]],
  wit_AgeCredential: (ctx) => appWitnesses.wit_AgeCredential({ ...ctx, privateState: { sk: sk[who], age: age[who] } }),
};

const NOW = Math.floor(Date.now() / 1000);
const issuerSk = newIssuerSecret();
const rateSk = newRateSignerSecret();
const ISSUER = issuerPublicKey(issuerSk);
const RATE_PK = rateSignerPublicKey(rateSk);
const c = new Contract(witnesses);
const id = (k) => pureCircuits.accountId(sk[k]);

let addr, state, zswap, feeAddr, orgPayout, alicePayout, eventId, ga;
// compact-runtime 0.21 (ledger 9): options-object context, async circuits.
const call = async (k, circuit, ...args) => {
  who = k;
  const ctx = rt.createCircuitContext({ circuitId: circuit, contractAddress: addr, coinPublicKeyOrZswapState: zswap, contractState: state, privateState: {}, time: NOW });
  const r = await c.circuits[circuit](ctx, ...args);
  const qc = r.context.queryContexts[addr];
  state = qc.state;
  return { result: r.result, eff: qc.effects };
};
const L = () => ledger(state);
const tk = (serial) => L().tickets.lookup(serial);
const contractKey = () => pureCircuits.contractKeyOf(typeof addr === 'string' ? { bytes: Buffer.from(addr, 'hex') } : addr);
const commitOf = (serial, epoch, nonce) =>
  pureCircuits.admitCommitOf(NETWORK_TAG, contractKey(), serial, epoch, nonce);
const quoteAt = (nightUsd, issuedAt = BigInt(NOW), ttl = MAX_AGE) => {
  const atoms = atomsPerUsdCentFromNightUsd(nightUsd);
  return signRateQuote({
    signerSk: rateSk, atomsPerUsdCent: atoms, issuedAt, expiresAt: issuedAt + ttl,
    networkTag: NETWORK_TAG, contractKey: contractKey(),
  });
};

beforeEach(async () => {
  for (const k of Object.keys(age)) delete age[k];
  feeAddr = ua(); orgPayout = ua(); alicePayout = ua();
  const init = await c.initialState(
    rt.createConstructorContext({}, '0'.repeat(64)),
    BPS, feeAddr, pureCircuits.accountId(sk.admin), ISSUER, RATE_PK, NETWORK_TAG, MAX_AGE, SLIP, 600n,
  );
  addr = rt.sampleContractAddress();
  state = init.currentContractState.data;
  zswap = init.currentZswapLocalState;
  eventId = (await call('org', 'createEvent', orgPayout)).result;
  ga = (await call('org', 'addTicketType', eventId, 1000n /* $10.00 */, 100n, CAPPED, 1200n, false)).result;
});

describe('CT-RATE quote math (off-chain)', () => {
  it('ceil atomsPerUsdCent and coversUsd respect slippage without division surprises', async () => {
    const atoms = atomsPerUsdCentFromNightUsd(0.05); // $0.05/NIGHT → 200_000 atoms per cent
    assert.equal(atoms, 200_000n);
    const paid = 1000n * atoms; // exact $10
    assert.equal(coversUsd(1000n, atoms, paid, SLIP), true);
    assert.equal(coversUsd(1000n, atoms, paid - 1n, 0n), false);
    const min = minAcceptableAtoms(1000n, atoms, SLIP);
    assert.equal(coversUsd(1000n, atoms, min, SLIP), true);
    assert.equal(coversUsd(1000n, atoms, min - 1n, SLIP), false);
  });
});

describe('CT-RATE Compact simulator — USD purchase with signed quote', () => {
  it('schemaVersion 3 and sealed quote window/slippage', async () => {
    assert.equal(L().schemaVersion, 3n);
    assert.equal(L().maxQuoteAge, MAX_AGE);
    assert.equal(L().slippageBps, SLIP);
    assert.equal(L().ticketTypes.lookup(ga).priceUsdCents, 1000n);
  });

  it('valid quote buys at exact NIGHT conversion', async () => {
    const q = quoteAt(0.05);
    const paid = 1000n * q.atomsPerUsdCent;
    const serial = (await call('alice', 'buyTicket', ga, EMPTY, paid, fee(paid), q, BigInt(NOW))).result;
    assert.equal(serial, 1n);
    assert.equal(tk(serial).status, TicketStatus.owned);
    assert.equal(hex(tk(serial).owner), hex(id('alice')));
  });

  it('rejects expired quote, bad signature, and underpayment beyond slippage', async () => {
    const good = quoteAt(0.05);
    const paid = 1000n * good.atomsPerUsdCent;
    const expired = quoteAt(0.05, BigInt(NOW - 400), 180n);
    await assert.rejects(() => call('alice', 'buyTicket', ga, EMPTY, paid, fee(paid), expired, BigInt(NOW)), /quote expired|quote window/);
    const forged = { ...good, signature: { ...good.signature, s: (good.signature.s + 1n) % 6554484396890773809930967563523245729705921265872317281365359162392183254199n } };
    await assert.rejects(() => call('alice', 'buyTicket', ga, EMPTY, paid, fee(paid), forged, BigInt(NOW)), /Invalid rate quote/);
    const short = minAcceptableAtoms(1000n, good.atomsPerUsdCent, SLIP) - 1n;
    await assert.rejects(() => call('alice', 'buyTicket', ga, EMPTY, short, fee(short), good, BigInt(NOW)), /below USD quote/);
  });

  it('resale also settles in USD via a fresh quote', async () => {
    const q1 = quoteAt(0.05);
    const paid1 = 1000n * q1.atomsPerUsdCent;
    const serial = (await call('alice', 'buyTicket', ga, EMPTY, paid1, fee(paid1), q1, BigInt(NOW))).result;
    const lid = (await call('alice', 'listForResale', serial, 1100n, alicePayout)).result;
    const q2 = quoteAt(0.05);
    const paid2 = 1100n * q2.atomsPerUsdCent;
    await call('bob', 'buyResale', lid, paid2, fee(paid2), q2, BigInt(NOW));
    assert.equal(hex(tk(serial).owner), hex(id('bob')));
    assert.equal(tk(serial).status, TicketStatus.owned);
  });
});
