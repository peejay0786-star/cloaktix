// CT-AGE-CRED: the rate-v3 adult check, the live demo issuer (/passport), and the pre-proving guard.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { adultBuyBlock, ageStatusFor, assertCanProveAdult, AgeCredentialRequiredError, humanizeAgeError, parseCredential } from '../src/midnight/ageCredential.ts';
import { humanizeTxError } from '../src/txError.ts';

const P = '/workspace/midnight-pass/cloaktix';
const require = createRequire(import.meta.url);
const rt: any = await import(pathToFileURL(require.resolve('@midnight-ntwrk/compact-runtime', { paths: [P + '/web'] })).href);
const { Contract, ledger, pureCircuits }: any = await import(P + '/contract/managed/cloaktix-rate-v3/contract/index.js');
const { newRateSignerSecret, rateSignerPublicKey, atomsPerUsdCentFromNightUsd, signRateQuote }: any = await import(P + '/contract/rate-quote.mjs');
const { witnesses: appWitnesses }: any = await import(P + '/contract/witnesses-rate-v3.ts');
// The exact issuer code the live Worker serves at /passport/* (same module, no copy of its key here).
const { handlePassport }: any = await import(P + '/preview-worker/passport.js');

const passport = async (method: string, sub: string, body?: unknown) => {
  const res: Response = await handlePassport(new Request('https://app.test/passport' + sub, { method, body: body ? JSON.stringify(body) : undefined }), sub, {});
  return { status: res.status, json: await res.json() };
};

describe('CT-AGE-CRED guard and messages (no proving)', () => {
  const cred = (adultFrom: bigint, pk = { x: 1n, y: 2n }) => ({ claim: { holder: new Uint8Array(32), adultFrom }, proof: { publicKey: pk } }) as any;
  it('status: none, adult, minor, untrusted issuer', () => {
    assert.equal(ageStatusFor(null, 100n), 'none');
    assert.equal(ageStatusFor(cred(50n), 100n), 'adult');
    assert.equal(ageStatusFor(cred(150n), 100n), 'minor');
    assert.equal(ageStatusFor(cred(50n), 100n, { x: 9n, y: 9n }), 'untrusted');
    assert.equal(ageStatusFor(cred(50n), 100n, { x: 1n, y: 2n }), 'adult');
  });
  it('blocks only 18+ circuits, before proving, with a clear message', () => {
    assert.throws(() => assertCanProveAdult('buyTicketAdult', 'none'), (e: any) => e instanceof AgeCredentialRequiredError && /Get your age credential first/.test(e.message) && /Nothing was bought/.test(e.message));
    assert.throws(() => assertCanProveAdult('buyResaleAdult', 'minor'), /under 18/);
    assert.doesNotThrow(() => assertCanProveAdult('buyTicketAdult', 'adult'));
    assert.doesNotThrow(() => assertCanProveAdult('buyTicket', 'none'));
    assert.equal(adultBuyBlock('adult'), null);
  });
  it("P-Jay's raw error becomes plain English", () => {
    const raw = 'failed assert: No age credential <- cause: Error executing circuit';
    assert.match(humanizeTxError(raw), /This is an 18\+ ticket\. Get your age credential first/);
    assert.doesNotMatch(humanizeTxError(raw), /Error executing circuit/);
    assert.match(humanizeAgeError('Under 18')!, /under 18/);
    assert.match(humanizeAgeError('failed assert: Untrusted age issuer')!, /does not trust/);
  });
});

describe('CT-AGE-CRED contract simulator with the live demo issuer', () => {
  const sk: Record<string, Uint8Array> = { admin: randomBytes(32), org: randomBytes(32), alice: randomBytes(32), bob: randomBytes(32) };
  const age: Record<string, any> = {};
  let who = 'org';
  const c = new Contract({
    wit_CloakSK: (ctx: any) => [ctx.privateState, sk[who]],
    wit_AgeCredential: (ctx: any) => appWitnesses.wit_AgeCredential({ ...ctx, privateState: { sk: sk[who], age: age[who] ?? null } }),
  });
  const NOW = Math.floor(Date.now() / 1000);
  const NET = new Uint8Array(32); NET.set(Buffer.from('preview'));
  const rateSk = newRateSignerSecret();
  let addr: any, state: any, zswap: any, adultType: bigint;
  const call = async (k: string, circuit: string, ...args: unknown[]) => {
    who = k;
    const r = await c.circuits[circuit](rt.createCircuitContext({ circuitId: circuit, contractAddress: addr, coinPublicKeyOrZswapState: zswap, contractState: state, privateState: {}, time: NOW }), ...args);
    state = r.context.queryContexts[addr].state; return r.result;
  };
  const quote = () => signRateQuote({ signerSk: rateSk, atomsPerUsdCent: atomsPerUsdCentFromNightUsd(0.05), issuedAt: BigInt(NOW), expiresAt: BigInt(NOW) + 180n,
    networkTag: NET, contractKey: pureCircuits.contractKeyOf(typeof addr === 'string' ? { bytes: Buffer.from(addr, 'hex') } : addr) });
  const buyAdult = async (k: string) => { const q = quote(); const paid = 7500n * q.atomsPerUsdCent; return call(k, 'buyTicketAdult', adultType, new Uint8Array(32), paid, (paid * 300n) / 10000n, q, BigInt(NOW), BigInt(NOW - 120)); };
  const issue = async (k: string, birthdate: string) => {
    const r = await passport('POST', '/issue', { holder: Buffer.from(pureCircuits.accountId(sk[k])).toString('hex'), birthdate });
    assert.equal(r.status, 200); return parseCredential(r.json);
  };

  beforeEach(async () => {
    for (const k of Object.keys(age)) delete age[k];
    const issuer = (await passport('GET', '/issuer')).json.publicKey;
    const init = await c.initialState(rt.createConstructorContext({}, '0'.repeat(64)), 300n, { bytes: randomBytes(32) }, pureCircuits.accountId(sk.admin),
      { x: BigInt(issuer.x), y: BigInt(issuer.y) }, rateSignerPublicKey(rateSk), NET, 180n, 100n, 600n);
    addr = rt.sampleContractAddress(); state = init.currentContractState.data; zswap = init.currentZswapLocalState;
    const ev = await call('org', 'createEvent', { bytes: randomBytes(32) });
    adultType = await call('org', 'addTicketType', ev, 7500n, 50n, 1, 0n, true);
  });

  it('repro: 18+ buy with no credential fails exactly like on live ("No age credential")', async () => {
    await assert.rejects(() => buyAdult('alice'), /No age credential/);
  });
  it('a credential from the demo issuer (/passport/issue) lets the same buy succeed', async () => {
    age.alice = await issue('alice', '1990-04-12');
    const serial = await buyAdult('alice');
    assert.equal(serial, 1n);
    assert.equal(ledger(state).ticketTypes.lookup(adultType).sold, 1n);
  });
  it('under 18 and someone else\'s credential are refused by the contract', async () => {
    const y = new Date().getUTCFullYear() - 10;
    age.alice = await issue('alice', `${y}-01-01`);
    await assert.rejects(() => buyAdult('alice'), /Under 18/);
    age.alice = await issue('bob', '1990-04-12');
    await assert.rejects(() => buyAdult('alice'), /not for this identity/);
  });
});
