// CT-ADA-PONT local — buyTicketAda with Jubjub attestation; replay nullifier; no deploy.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const rt = await import(
  pathToFileURL(require.resolve('@midnight-ntwrk/compact-runtime', { paths: ['/workspace/midnight-pass/cloaktix/web'] })).href,
);
const { Contract, ledger, pureCircuits } = await import('../contract/managed/cloaktix-rate-v3/contract/index.js');
const { newIssuerSecret, issuerPublicKey } = await import('../contract/age-credential.mjs');
const { newRateSignerSecret, rateSignerPublicKey } = await import('../contract/rate-quote.mjs');
const { signAdaAttestation, txHashToBytes32 } = await import('../contract/ada-attest.mjs');
const { witnesses: appWitnesses } = await import('../contract/witnesses-rate-v3.ts');
const { expectedSplit, lovelaceFromUsdCents, verifyAdaPaymentForAttest } = await import('../preview-worker/rate-signer-unreleased/adaVerifyKoios.mjs');
const { prepareAdaAttestationRequest } = await import('../preview-worker/rate-signer-unreleased/adaAttest.mjs');

const BPS = 300n, SLIP = 100n, MAX_AGE = 180n, MAX_ADA = 600n;
const CAPPED = 0;
const ua = () => ({ bytes: randomBytes(32) });
const tagNetwork = (s) => { const u = new Uint8Array(32); u.set(Buffer.from(s, 'utf8').subarray(0, 32)); return u; };
const NETWORK_TAG = tagNetwork('undeployed');
const sk = { admin: randomBytes(32), org: randomBytes(32), alice: randomBytes(32) };
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
let addr, state, zswap, feeAddr, orgPayout, eventId, ga;
const call = (k, circuit, ...args) => {
  who = k;
  const ctx = rt.createCircuitContext(addr, zswap, state, {}, undefined, undefined, NOW);
  const r = c.circuits[circuit](ctx, ...args);
  state = r.context.currentQueryContext.state;
  return { result: r.result };
};
const L = () => ledger(state);
const contractKey = () => pureCircuits.contractKeyOf(typeof addr === 'string' ? { bytes: Buffer.from(addr, 'hex') } : addr);
const EMPTY = new Uint8Array(32);
const fakeTx = () => randomBytes(32);

beforeEach(() => {
  for (const k of Object.keys(age)) delete age[k];
  feeAddr = ua(); orgPayout = ua();
  const init = c.initialState(
    rt.createConstructorContext({}, '0'.repeat(64)),
    BPS, feeAddr, pureCircuits.accountId(sk.admin), ISSUER, RATE_PK, NETWORK_TAG, MAX_AGE, SLIP, MAX_ADA,
  );
  addr = rt.sampleContractAddress();
  state = init.currentContractState.data;
  zswap = init.currentZswapLocalState;
  eventId = call('org', 'createEvent', orgPayout).result;
  ga = call('org', 'addTicketType', eventId, 1000n, 100n, CAPPED, 1200n, false).result;
});

describe('CT-ADA-PONT buyTicketAda', () => {
  it('mints a ticket from a valid signed ADA attestation without NIGHT payment', () => {
    const buyer = pureCircuits.accountId(sk.alice);
    const txHash = fakeTx();
    const attest = signAdaAttestation({
      signerSk: rateSk,
      typeId: ga,
      buyer,
      txHash,
      priceUsdCents: 1000n,
      lovelacePaid: 20_000_000n,
      issuedAt: BigInt(NOW),
      expiresAt: BigInt(NOW) + 300n,
      networkTag: NETWORK_TAG,
      contractKey: contractKey(),
    });
    const serial = call('alice', 'buyTicketAda', ga, EMPTY, attest, BigInt(NOW)).result;
    assert.equal(L().tickets.lookup(serial).owner.toString(), buyer.toString());
    assert.equal(L().adaNullifiers.member(txHash), true);
  });

  it('rejects replay of the same txHash nullifier', () => {
    const buyer = pureCircuits.accountId(sk.alice);
    const txHash = fakeTx();
    const mk = () => signAdaAttestation({
      signerSk: rateSk, typeId: ga, buyer, txHash, priceUsdCents: 1000n, lovelacePaid: 20_000_000n,
      issuedAt: BigInt(NOW), expiresAt: BigInt(NOW) + 300n, networkTag: NETWORK_TAG, contractKey: contractKey(),
    });
    call('alice', 'buyTicketAda', ga, EMPTY, mk(), BigInt(NOW));
    assert.throws(() => call('alice', 'buyTicketAda', ga, EMPTY, mk(), BigInt(NOW)));
  });

  it('rejects attestation for a different buyer identity', () => {
    const txHash = fakeTx();
    const attest = signAdaAttestation({
      signerSk: rateSk,
      typeId: ga,
      buyer: pureCircuits.accountId(sk.org), // not alice
      txHash,
      priceUsdCents: 1000n,
      lovelacePaid: 1n,
      issuedAt: BigInt(NOW),
      expiresAt: BigInt(NOW) + 300n,
      networkTag: NETWORK_TAG,
      contractKey: contractKey(),
    });
    assert.throws(() => call('alice', 'buyTicketAda', ga, EMPTY, attest, BigInt(NOW)));
  });
});

describe('CT-ADA-PONT worker verify (mocked Koios)', () => {
  it('splits 97/3 and prices lovelace from USD cents', () => {
    assert.deepEqual(expectedSplit(1_000_000n), { total: 1_000_000n, organizer: 970_000n, fee: 30_000n });
    assert.equal(lovelaceFromUsdCents(1000n, 0.5), 20_000_000n); // $10 / $0.5 = 20 ADA
  });

  it('verifyAdaPaymentForAttest accepts matching outputs + confirmations', async () => {
    const org = 'addr_test1qorganizer';
    const fee = 'addr_test1qplatform';
    const txHash = 'ab'.repeat(32);
    const fetcher = async (url, init) => {
      if (String(url).endsWith('/tip')) {
        return new Response(JSON.stringify([{ block_height: 100 }]));
      }
      const body = JSON.parse(init.body);
      assert.equal(body._tx_hashes[0], txHash);
      return new Response(JSON.stringify([{
        block_height: 98,
        outputs: [
          { payment_addr: { bech32: org }, value: '970000' },
          { payment_addr: { bech32: fee }, value: '30000' },
        ],
      }]));
    };
    const r = await verifyAdaPaymentForAttest({
      txHash, organizerAddress: org, platformFeeAddress: fee, expectedLovelace: 1_000_000n, fetcher,
    });
    assert.equal(r.ok, true);
    assert.equal(r.confirmations, 3);
  });

  it('prepareAdaAttestationRequest stays unsigned when signingEnabled=false', async () => {
    const org = 'addr_test1qorganizer';
    const feeAddr = 'addr_test1qplatform';
    const txHash = 'cd'.repeat(32);
    const fetcher = async (url) => {
      if (String(url).endsWith('/tip')) return new Response(JSON.stringify([{ block_height: 50 }]));
      return new Response(JSON.stringify([{
        block_height: 48,
        outputs: [
          { payment_addr: { bech32: org }, value: '19400000' },
          { payment_addr: { bech32: feeAddr }, value: '600000' },
        ],
      }]));
    };
    const result = await prepareAdaAttestationRequest({
      txHash, organizerAddress: org, typeId: '1', buyerHex: 'aa'.repeat(32),
      priceUsdCents: '1000', expectedLovelace: '20000000',
    }, { PLATFORM_ADA_FEE_ADDRESS: feeAddr }, { signingEnabled: false, fetcher });
    assert.equal(result.ok, true);
    assert.equal(result.body.signed, false);
    assert.equal(result.body.signature, null);
    assert.equal(result.body.signingEnabled, false);
  });
});
