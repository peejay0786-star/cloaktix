// CT-MULTI-BUY (2026-11-09): N buyTicket calls in ONE transaction (Midnight.js 5 scoped tx), one wallet approval.
// Fast tests (always): quantity helpers + multiBuyV3 control flow with injected fakes (no proofs).
// Heavy e2e (CT_MULTIBUY_E2E=1): real in-tab ZKIR v3 proofs (node runner) for 2- and 4-ticket txs against a simulated
// contract state with a TEST rate signer; measures proof time, tx bytes and ledger cost. No network, no signing.
import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire, register } from 'node:module';
import { maxQty, clampQty, qtyTotals } from '../src/multiBuyQty.ts';
import { proofPoolSize } from '../src/midnight/localProver.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_V9 = new URL('../node_modules/@midnight-ntwrk/midnight-js-protocol/node_modules/@midnightntwrk/ledger-v9/', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnightntwrk/ledger-v9' || s.startsWith('@midnightntwrk/ledger-v9/')) return n(s, { ...c, parentURL: ${JSON.stringify(LEDGER_V9 + 'x.js')} });
  return n(s, c); }`));
const require = createRequire(import.meta.url);
const MANAGED = path.resolve(here, '../../contract/managed/cloaktix-rate-v3');
const PARAMS_DIR = path.resolve(here, '../../contract/zk-params');
const OUT = path.join(here, '.tmp-multi-buy');
const E2E = process.env.CT_MULTIBUY_E2E === '1';
const DUMP = process.env.CT_MULTIBUY_DUMP; // optional dir: write buyTicket preimages for the browser bench

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => (m.has(k) ? m.get(k)! : null), setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as any;
}
(globalThis as any).localStorage ??= memStorage();

let B: any;
before(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const entry = path.join(OUT, 'entry.ts');
  fs.writeFileSync(entry, `export * from '../../src/midnight/deployV3Batched';\nexport * from '../../src/midnight/contract-v3';\nexport * from '../../src/midnight/multiBuyV3';\nexport { networkTagBytes } from '../../src/midnight/schema';\nexport { readContractState } from '../../src/midnight/contractStateRead';\nexport { onLocalProof, hybridProver } from '../../src/midnight/localProver';\nexport { mergeCallsIntoOneIntent } from '../../src/midnight/singleIntent';\nexport { cachingKeyMaterial } from '../../src/midnight/keyMaterial';\nexport { makeLocalProver } from '../../src/midnight/zkirV3Core';\n`);
  // TEST rate signer: replace the live public key in the bundle only (never touches the source or the live signer).
  const testPk = { name: 'test-rate-pk', setup(b: any) { b.onLoad({ filter: /contract-v3\.ts$/ }, async (a: any) => ({ loader: 'ts',
    contents: fs.readFileSync(a.path, 'utf8').replace(/export const RATE_SIGNER_PK = \{[\s\S]*?\};/, 'export const RATE_SIGNER_PK = { get x(): bigint { return (globalThis as any).__CT_TEST_RATE_PK__.x; }, get y(): bigint { return (globalThis as any).__CT_TEST_RATE_PK__.y; } };') })); } };
  await require('esbuild').build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', packages: 'external', plugins: [testPk],
    outfile: path.join(OUT, 'bundle.mjs'), logLevel: 'silent',
    define: { 'import.meta.env': JSON.stringify({ VITE_ZK_ASSETS_PATH_V3: 'managed/cloaktix-rate-v3' }) } });
  B = await import(pathToFileURL(path.join(OUT, 'bundle.mjs')).href + '?t=' + Date.now());
});
after(() => fs.rmSync(OUT, { recursive: true, force: true }));

describe('multi-buy quantity + totals', () => {
  it('caps at 4 and at tickets left; adult/closed/sold-out are single or none', () => {
    const o = { open: true, multiOk: true };
    assert.equal(maxQty({ supply: 100n, sold: 1n }, o), 4);
    assert.equal(maxQty({ supply: 100n, sold: 98n }, o), 2);
    assert.equal(maxQty({ supply: 100n, sold: 99n }, o), 1);
    assert.equal(maxQty({ supply: 100n, sold: 100n }, o), 0);
    assert.equal(maxQty({ supply: 50n, sold: 0n, adultOnly: true }, o), 1);
    assert.equal(maxQty({ supply: 50n, sold: 0n }, { open: false, multiOk: true }), 0);
    assert.equal(maxQty({ supply: 50n, sold: 0n }, { open: true, multiOk: false }), 1);
    assert.equal(clampQty(9, 3), 3); assert.equal(clampQty(0, 3), 1); assert.equal(clampQty(NaN, 3), 1);
  });
  it('2-worker proof pool only on capable desktops', () => {
    const none = { getItem: () => null };
    const desk = { hardwareConcurrency: 8, deviceMemory: 8, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130' };
    assert.equal(proofPoolSize(desk, none), 2);
    assert.equal(proofPoolSize({ ...desk, hardwareConcurrency: 2 }, none), 1);
    assert.equal(proofPoolSize({ ...desk, deviceMemory: 4 }, none), 1);
    assert.equal(proofPoolSize({ ...desk, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile' }, none), 1);
    assert.equal(proofPoolSize({ ...desk, userAgentData: { mobile: true } }, none), 1);
    assert.equal(proofPoolSize({ ...desk, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 }, none), 1);
    assert.equal(proofPoolSize(desk, { getItem: (k: string) => (k === 'cloaktix:prover-pool' ? '1' : null) }), 1);
    assert.equal(proofPoolSize(null, none), 1);
  });
  it('totals: unit, USD total, NIGHT total, one approval', () => {
    const t = qtyTotals(5000n, 3, 0.05);
    assert.equal(t.unitUsd, 50); assert.equal(t.totalUsd, 150); assert.equal(Math.round(t.totalNight!), 3000); assert.equal(t.approvals, 1);
    assert.equal(qtyTotals(5000n, 2, null).totalNight, null);
  });
});

// ---------- control flow with fakes ----------
const quote = { quote: { atomsPerUsdCent: 2000n, issuedAt: BigInt(Math.floor(Date.now() / 1000)) - 5n, expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 175n, signature: { r: { x: 1n, y: 2n }, s: 3n } }, nightUsd: 0.05, adaUsd: 0.5 };
function fakeHost(balance: (tx: any) => Promise<any> = async (tx) => tx) {
  const P = { walletProvider: { balanceTx: balance, getCoinPublicKey: () => 'c' }, midnightProvider: { submitTx: async () => 'txid-1' } };
  return { schema: 3, contract: '11'.repeat(32), networkId: 'preview', sk: new Uint8Array(32).fill(7), P, userAddress: () => ({ bytes: new Uint8Array(32) }), age: null, accountId: 'ab'.repeat(32) } as any;
}
/** A fake scope: runs the calls (each "proved"), then balances + submits once, like withContractScopedTransaction. */
const fakeScoped = (opts: { failAtCall?: number } = {}) => async (P: any, fn: any) => {
  await fn({ ctx: true });
  const tx = await P.walletProvider.balanceTx({ tx: 1 });
  const id = await P.midnightProvider.submitTx(tx);
  return { public: { txId: id } };
};
const fakeCall = (first: bigint, seen: any[], failAt?: number) => async (_P: any, o: any, ctx: any) => {
  assert.ok(ctx, 'call is inside the scope'); seen.push(o);
  if (failAt !== undefined && seen.length === failAt) throw new Error('proof failed: circuit assertion');
  return { private: { result: first + BigInt(seen.length - 1) } };
};

describe('buyNightV3Multi control flow (fakes, no proofs)', () => {
  it('2 tickets: one scope, 2 buyTicket calls on predicted serials, 2 separate capabilities, one balance', async () => {
    const seen: any[] = []; let balances = 0; const prog: string[] = [];
    const host = fakeHost(async (t) => { balances++; return t; });
    const r = await B.buyNightV3Multi(host, { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n, ticketName: 'GA', eventName: 'Show', onProgress: (p: any) => prog.push(B.multiBuyProgressLabel(p)) },
      { fetchQuote: async () => quote, readSerialCount: async () => 7n, scoped: fakeScoped() as any, call: fakeCall(8n, seen) as any });
    assert.equal(seen.length, 2); assert.deepEqual(seen.map((o) => o.circuitId), ['buyTicket', 'buyTicket']);
    assert.equal(balances, 1, 'one wallet approval');
    assert.deepEqual(r.tickets.map((t: any) => t.serial), [8n, 9n]);
    assert.notDeepEqual(seen[0].args[1], seen[1].args[1], 'distinct admit commits');
    assert.equal(r.nightPaidEach, 5000n * 2000n); assert.equal(r.nightPaid, 2n * 5000n * 2000n);
    assert.equal(seen[0].args[5], seen[1].args[5], 'one quote/now for all calls');
    assert.ok(r.tickets.every((t: any) => t.cap && t.cap !== r.tickets[0].cap || t === r.tickets[0]));
    assert.ok(prog.includes('Approve 1 transaction for 2 tickets in your wallet…'), prog.join('|'));
  });
  it('wallet refuses the multi-call tx: "nothing bought" + offer one at a time', async () => {
    const host = fakeHost(async () => { throw new Error('Unsupported transaction: more than one contract call'); });
    const e: any = await B.buyNightV3Multi(host, { typeId: 2n, qty: 3, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: fakeScoped() as any, call: fakeCall(2n, []) as any }).catch((x: any) => x);
    assert.equal(e.kind, 'wallet-refused-multi'); assert.match(e.message, /Nothing was bought\. You can buy them one at a time/);
  });
  it('Midnight.js wraps the wallet error ("balanceTx rejected …"): still classified by the wallet\'s own error', async () => {
    const host = fakeHost(async () => { throw new Error('fake 1AM: refuses this transaction'); });
    const wrapScoped = async (P: any, fn: any) => { await fn({}); try { await P.walletProvider.balanceTx({}); } catch (c) { throw Object.assign(new Error("balanceTx rejected the transaction (circuit 'buyTicket')."), { cause: c }); } };
    const e: any = await B.buyNightV3Multi(host, { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: wrapScoped as any, call: fakeCall(2n, []) as any }).catch((x: any) => x);
    assert.equal(e.kind, 'wallet-refused-multi'); assert.match(e.message, /fake 1AM: refuses/);
  });
  it('user cancels in the wallet: nothing bought, no one-at-a-time offer', async () => {
    const host = fakeHost(async () => { throw new Error('Transaction rejected by user'); });
    const e: any = await B.buyNightV3Multi(host, { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: fakeScoped() as any, call: fakeCall(2n, []) as any }).catch((x: any) => x);
    assert.equal(e.kind, 'nothing-bought');
  });
  it('a proof fails mid-way: nothing bought, nothing submitted', async () => {
    let submitted = 0; const host = fakeHost(); host.P.midnightProvider.submitTx = async () => { submitted++; return 'x'; };
    const e: any = await B.buyNightV3Multi(host, { typeId: 2n, qty: 4, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: fakeScoped() as any, call: fakeCall(2n, [], 3) as any }).catch((x: any) => x);
    assert.equal(e.kind, 'nothing-bought'); assert.match(e.message, /^Nothing was bought/); assert.equal(submitted, 0);
  });
  it('after submit: tickets found on chain = success; not found = "check My tickets", never "nothing bought"', async () => {
    const mk = () => { const h = fakeHost(); h.P.midnightProvider.submitTx = async () => { throw new Error('watchForTxData timeout'); }; return h; };
    const ok = await B.buyNightV3Multi(mk(), { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 4n, scoped: fakeScoped() as any, call: fakeCall(5n, []) as any, ownsSerial: async () => true });
    assert.deepEqual(ok.tickets.map((t: any) => t.serial), [5n, 6n]);
    const e: any = await B.buyNightV3Multi(mk(), { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 4n, scoped: fakeScoped() as any, call: fakeCall(5n, []) as any, ownsSerial: async () => false }).catch((x: any) => x);
    assert.equal(e.kind, 'unknown-after-submit'); assert.doesNotMatch(e.message, /Nothing was bought/);
  });
  it('parses ledger key locations to circuit names', () => {
    assert.equal(B.circuitOfKeyLocation('contract:ab12/buyTicket?vk=ff'), 'buyTicket');
    assert.equal(B.circuitOfKeyLocation('buyTicket'), 'buyTicket');
    assert.equal(B.circuitOfKeyLocation('midnight/dust/spend'), 'spend');
  });
  it('rejects qty outside 2..4 before any network call', async () => {
    for (const qty of [1, 5, 0]) {
      const e: any = await B.buyNightV3Multi(fakeHost(), { typeId: 2n, qty, priceUsdCents: 5000n, feeBps: 300n }, { fetchQuote: async () => { throw new Error('must not fetch'); } }).catch((x: any) => x);
      assert.equal(e.kind, 'nothing-bought');
    }
  });
  it('rate quote unavailable: nothing bought, clear message', async () => {
    const e: any = await B.buyNightV3Multi(fakeHost(), { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => { throw new TypeError('Failed to fetch'); } }).catch((x: any) => x);
    assert.equal(e.kind, 'nothing-bought'); assert.match(e.message, /^Nothing was bought\. Could not get a signed NIGHT rate: Failed to fetch/);
  });
  it('node rejects at submit (1AM "1010: Invalid Transaction … 227"): nothing bought + one at a time, not "sent but not confirmed"', async () => {
    const h = fakeHost(); h.P.midnightProvider.submitTx = async () => { throw new Error('Operation failed: 1010: Invalid Transaction: Custom error: 227: (FiberFailure) SubmissionError: Transaction submission error'); };
    const wrapScoped = async (P: any, fn: any) => { await fn({}); const t = await P.walletProvider.balanceTx({}); try { await P.midnightProvider.submitTx(t); } catch (c) { throw Object.assign(new Error("submitTx rejected the transaction (circuit 'buyTicket')."), { cause: c }); } };
    const e: any = await B.buyNightV3Multi(h, { typeId: 2n, qty: 3, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: wrapScoped as any, call: fakeCall(2n, []) as any, ownsSerial: async () => false }).catch((x: any) => x);
    assert.equal(e.kind, 'network-rejected'); assert.ok(B.offersOneAtATime(e.kind));
    assert.match(e.message, /Nothing was bought and no NIGHT was spent\. You can buy them one at a time/); assert.doesNotMatch(e.message, /not confirmed/);
  });
  it('submit timed out (no rejection text): stays "check My tickets"', async () => {
    const h = fakeHost(); h.P.midnightProvider.submitTx = async () => { throw new Error('network timeout'); };
    const e: any = await B.buyNightV3Multi(h, { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: fakeScoped() as any, call: fakeCall(2n, []) as any, ownsSerial: async () => false }).catch((x: any) => x);
    assert.equal(e.kind, 'unknown-after-submit'); assert.equal(B.offersOneAtATime(e.kind), false);
  });
  it('single intent: N intents (random segments) become one intent with calls in purchase order', () => {
    const m = [1, 2, 3].map((k) => new Uint8Array(32).fill(k));
    const call = (k: number) => ({ k, proof: { serialize: () => { const b = new Uint8Array(100); b.set(m[k - 1].subarray(0, 31), 40); b[90] = m[k - 1][31]; return b; } } });
    const intent = (k: number, ttl: number) => ({ actions: [call(k)], guaranteedUnshieldedOffer: undefined, fallibleUnshieldedOffer: undefined, dustActions: undefined, ttl: new Date(ttl) });
    const tx: any = { intents: new Map([[9, intent(1, 5000)], [3, intent(3, 4000)], [41, intent(2, 6000)]]), fallibleOffer: undefined };
    B.mergeCallsIntoOneIntent(tx, m);
    assert.equal(tx.intents.size, 1); const [only] = [...tx.intents.values()];
    assert.deepEqual(only.actions.map((a: any) => a.k), [1, 2, 3]); assert.equal(only.ttl.getTime(), 4000);
    const bad: any = { intents: new Map([[1, intent(1, 1)], [2, { ...intent(2, 1), guaranteedUnshieldedOffer: { inputs: [{}], outputs: [] } }]]) };
    assert.throws(() => B.mergeCallsIntoOneIntent(bad, m.slice(0, 2)), /already balanced/);
  });
  it('wallet busy with another tx: clear pending message', async () => {
    const host = fakeHost(async () => { throw new Error('A transaction is already pending'); });
    const e: any = await B.buyNightV3Multi(host, { typeId: 2n, qty: 2, priceUsdCents: 5000n, feeBps: 300n },
      { fetchQuote: async () => quote, readSerialCount: async () => 1n, scoped: fakeScoped() as any, call: fakeCall(2n, []) as any }).catch((x: any) => x);
    assert.equal(e.kind, 'wallet-pending');
  });
});

// ---------- heavy e2e: real proofs ----------
describe('E2E: 2 and 4 tickets in one tx, real in-tab proofs (CT_MULTIBUY_E2E=1)', { skip: !E2E }, () => {
  let SDK: any, PROTO: any, TXMOD: any, TYPES: any, DC: any, ZK: any, RQ: any;
  before(async () => {
    SDK = await import('@midnight-ntwrk/midnight-js-contracts');
    PROTO = await import('@midnight-ntwrk/midnight-js-protocol/v9');
    TXMOD = await import('@midnight-ntwrk/midnight-js-protocol/transaction');
    TYPES = await import('@midnight-ntwrk/midnight-js-types');
    DC = await import('@midnight-ntwrk/midnight-js-dapp-connector-proof-provider');
    ZK = await import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider');
    RQ = await import(pathToFileURL(path.resolve(here, '../../contract/rate-quote.mjs')).href);
  });
  const hexOf = (u: Uint8Array) => Buffer.from(u).toString('hex');

  it('deploys, sets up a $10 type, then buys 2 and 4 tickets in single transactions', async () => {
    const rateSk = RQ.newRateSignerSecret();
    (globalThis as any).__CT_TEST_RATE_PK__ = RQ.rateSignerPublicKey(rateSk);
    let state: Uint8Array | null = null;
    let simulateWallet = false, fundNight = false; const inspect: any[] = []; const usedUtxos = new Set<string>();
    const nightSk = PROTO.sampleSigningKey(); const nightVk = PROTO.signatureVerifyingKey(nightSk); const nightAddr = PROTO.addressFromKey(nightVk);
    const balanced: string[] = [], submitted: string[] = [];
    const api: any = {
      getShieldedAddresses: async () => ({ shieldedCoinPublicKey: PROTO.sampleCoinPublicKey(), shieldedEncryptionPublicKey: PROTO.sampleEncryptionPublicKey() }),
      balanceUnsealedTransaction: async (txHex: string) => {
        balanced.push(txHex);
        const unbound = await TXMOD.deserializeTransactionAtStage('v9', 'Unbound', Uint8Array.from(Buffer.from(txHex, 'hex')));
        if (simulateWallet) {
          // What 1AM evidently did on 2026-11-09: cover each intent's NIGHT demand with the SAME unshielded UTXO.
          inspect.push({ intents: unbound.intents?.size ?? 0, segments: [...(unbound.intents?.keys() ?? [])] });
          const vk = PROTO.signatureVerifyingKey(PROTO.sampleSigningKey());
          const spend = { value: 10n ** 12n, owner: vk, type: PROTO.nativeToken().raw, intentHash: PROTO.sampleIntentHash(), outputNo: 0 };
          const m = unbound.intents; // getter returns a copy: modify the copy, then write it back
          for (const [seg, intent] of m) { const o = intent.guaranteedUnshieldedOffer; intent.guaranteedUnshieldedOffer = PROTO.UnshieldedOffer.new([spend], o ? o.outputs : [], []); m.set(seg, intent); }
          unbound.intents = m;
        } else {
          inspect.push({ intents: unbound.intents?.size ?? 0, segments: [...(unbound.intents?.keys() ?? [])] });
          if (fundNight) {
            // A correct wallet: cover the NIGHT demand with ONE real UTXO of the buyer (+ change), in the segment that needs it.
            const m = unbound.intents;
            for (const [seg, intent] of m) {
              for (const [which, sid] of [['fallibleUnshieldedOffer', seg], ['guaranteedUnshieldedOffer', 0]] as const) {
                let need = 0n;
                for (const [tt, v] of unbound.imbalances(sid)) if ((tt as any).tag === 'unshielded' && (tt as any).raw === PROTO.nativeToken().raw && v < 0n) need += -v;
                if (need === 0n) continue;
                const utxo = [...ls.utxo.filter(nightAddr)].find((u: any) => u.type === PROTO.nativeToken().raw && u.value >= need && !usedUtxos.has(u.intentHash + ':' + u.outputNo));
                if (!utxo) throw new Error('test wallet: no NIGHT utxo');
                usedUtxos.add(utxo.intentHash + ':' + utxo.outputNo);
                const o = (intent as any)[which];
                const change = utxo.value - need;
                const ins = [{ value: utxo.value, owner: nightVk, type: utxo.type, intentHash: utxo.intentHash, outputNo: utxo.outputNo }];
                const outs = [...(o ? o.outputs : []), ...(change > 0n ? [{ value: change, owner: nightAddr, type: utxo.type }] : [])];
                (intent as any)[which] = PROTO.UnshieldedOffer.new(ins, outs, []);
                // Sign the buyer's NIGHT input (TEST key on the local ledger only; nothing real is signed).
                (intent as any)[which] = PROTO.UnshieldedOffer.new(ins, outs, [new PROTO.SignatureEnabled(PROTO.signData(nightSk, intent.signatureData(seg)))]);
              }
              m.set(seg, intent);
            }
            unbound.intents = m;
          }
        }
        const tx = unbound.bind();

        const deploy = tx.intents?.get(1)?.actions?.find?.((a: any) => a instanceof PROTO.ContractDeploy);
        if (deploy) state = deploy.initialState.serialize();
        return { tx: hexOf(tx.serialize()) };
      },
      submitTransaction: async (txHex: string) => { submitted.push(txHex); applied.push(await applyLocal(txHex)); },
    };
    // Local ledger: apply every submitted tx (no balancing/signature/proof enforcement; structure, sequencing,
    // effects and transcripts against the real running state are checked). This is what the fake indexer lacked.
    let ls = PROTO.LedgerState.blank('preview');
    const applied: { ok: boolean; type: string; err?: string }[] = [];
    const strict = new PROTO.WellFormedStrictness();
    strict.enforceBalancing = false; strict.verifySignatures = false; strict.verifyNativeProofs = false; strict.verifyContractProofs = false; strict.enforceLimits = false;
    const applyLocal = async (txHex: string) => {
      try {
        const tx = await TXMOD.deserializeTransactionAtStage('v9', 'Finalized', Uint8Array.from(Buffer.from(txHex, 'hex')));
        const now = new Date(); const sec = BigInt(Math.floor(now.getTime() / 1000));
        const block = { secondsSinceEpoch: sec, secondsSinceEpochErr: 30, parentBlockHash: '00'.repeat(32), lastBlockTime: sec - 6n } as any;
        const [next, res] = ls.apply(tx.wellFormed(ls, strict, now), new PROTO.TransactionContext(ls, block));
        const type = String(res?.type ?? res);
        if (type === 'success') ls = next;
        return { ok: type === 'success', type, err: res?.error ? String(res.error).slice(0, 400) : undefined };
      } catch (e: any) { return { ok: false, type: 'malformed', err: String(e?.message ?? e).slice(0, 400) }; }
    };
    const proveLog: { k: string; phase: string; t: number }[] = [];
    const stopLog = B.onLocalProof((e: any) => proveLog.push({ k: e.keyLocation, phase: e.phase, t: Date.now() }));
    const run = B.makeLocalProver(async (k: number) => { const b = fs.readFileSync(path.join(PARAMS_DIR, `bls_midnight_2p${k}`)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); });
    let rid = 0; let dumpIx = 0;
    const nodeRunner = async (req: any) => {
      if (process.env.CT_MULTIBUY_DEBUG) console.log('# runner', req.op, req.keyLocation);
      if (DUMP && req.op === 'prove' && B.circuitOfKeyLocation(req.keyLocation) === 'buyTicket') fs.writeFileSync(path.join(DUMP, `buyTicket-${++dumpIx}.preimage`), req.preimage);
      return run({ ...req, id: ++rid, paramsBase: 'file:' });
    };
    const wallet1am = { check: async () => { throw new Error('wallet prover must not be used'); }, prove: async () => { throw new Error('wallet prover must not be used'); } };
    api.getProvingProvider = async (kmp: any) => { const c = B.cachingKeyMaterial(kmp); return B.hybridProver(c.wrapProver(wallet1am), c.kmp, nodeRunner, true); };
    const fetchFunc = async (url: string) => { const rel = decodeURIComponent(new URL(url).pathname.replace(/^\/managed\/cloaktix-rate-v3\//, '')); const f = path.join(MANAGED, rel);
      return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('nf', { status: 404 }); };
    const pdp: any = {
      queryLatestProtocolVersion: async () => 2001100,
      queryBlock: async () => ({ hash: '00'.repeat(32), height: 1, timestamp: Date.now(), protocolVersion: 2001100 }),
      queryZSwapAndContractState: async () => state ? { protocolVersion: 2001100, contractState: TYPES.SerializedContractState.fromBytes('v9', state),
        zswapChainState: TYPES.SerializedZswapChainState.fromBytes('v9', new PROTO.ZswapChainState().serialize()),
        ledgerParameters: TYPES.SerializedLedgerParameters.fromBytes('v9', PROTO.LedgerParameters.initialParameters().serialize()) } : null,
      queryContractState: async () => state ? { protocolVersion: 2001100, contractState: TYPES.SerializedContractState.fromBytes('v9', state) } : null,
    };
    const zkConfigProvider = new ZK.FetchZkConfigProvider('http://zk.test/managed/cloaktix-rate-v3', { fetchFunc: fetchFunc as any });
    const proofProvider = await DC.dappConnectorProofProvider(api, zkConfigProvider, PROTO.CostModel.initialCostModel());
    const { walletProvider, midnightProvider } = await DC.dappConnectorWalletProviders(api);
    const origSubmit = midnightProvider.submitTx.bind(midnightProvider);
    (midnightProvider as any).submitTx = async (tx: any) => { const id = await origSubmit(tx);
      pdp.watchForTxData = async (txId: string) => ({ era: 'v9', tx, status: TYPES.SucceedEntirely, txId, identifiers: [txId], txHash: '00'.repeat(32), blockHash: '00'.repeat(32), blockHeight: 1, blockTimestamp: Date.now(), segmentStatusMap: undefined, unshielded: { created: [], spent: [] } });
      return id; };
    const storage = memStorage();
    const { createCloakPrivateStateProvider } = await import('../src/midnight/privateStateProvider.ts');
    const P: any = { config: { networkId: 'preview', ttlSeconds: 1800 }, zkConfigProvider, proofProvider, walletProvider, midnightProvider, publicDataProvider: pdp,
      privateStateProvider: createCloakPrivateStateProvider({ networkId: 'preview', storage }) };
    const sk = new Uint8Array(32).fill(7);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    const d = await B.deployV3Batched(host, 'fee', async () => ({ x: 1n, y: 2n }), { storage, resume: true, waitForCircuits: async () => {}, insertFn: async () => ({ public: { txId: 'x' } }), listOnChain: async () => [...B.V3_CIRCUIT_ORDER] });
    host.contract = d.address;
    const setData = (enc: any) => { const cs = PROTO.ContractState.deserialize(state!); cs.data = new PROTO.ChargedState(PROTO.StateValue.decode(enc)); state = cs.serialize(); };
    const call = async (circuitId: string, args: any[]) => { const r: any = await SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: d.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId, args }); setData(r.public.nextContractStateEncoded); return r.private.result; };
    const ev = await call('createEvent', [{ bytes: new Uint8Array(32).fill(3) }]);
    const typeId = await call('addTicketType', [ev, 1000n, 100n, 0, 1200n, false]);
    console.log('# setup applied on local ledger: ' + JSON.stringify(applied));
    assert.ok(applied.every((a) => a.ok), 'deploy + setup apply on the local ledger');
    const ck = B.pureCircuitsV3.contractKeyOf({ bytes: Buffer.from(d.address, 'hex') });
    const fetchQuote = async () => { const now = BigInt(Math.floor(Date.now() / 1000));
      return { quote: RQ.signRateQuote({ signerSk: rateSk, atomsPerUsdCent: RQ.atomsPerUsdCentFromNightUsd(0.05), issuedAt: now - 2n, expiresAt: now + 178n, networkTag: B.networkTagBytes('preview'), contractKey: ck }), nightUsd: 0.05, adaUsd: 0.5 }; };
    // Measure the real scoped tx: wrap the scope so we can update the fake indexer with the final state.
    const scoped = async (Pp: any, fn: any, o: any) => { const r: any = await SDK.withLedger9ContractScopedTransaction(Pp, fn, o); if (r?.public?.nextContractStateEncoded) setData(r.public.nextContractStateEncoded); return r; };
    const results: any[] = [];
    // REPRO of the live failure (b924016c): Midnight.js's scoped tx = one intent per call (random segment ids).
    // With a wallet that funds each intent from the same NIGHT UTXO, the ledger rejects it as malformed: disjoint check
    // (node code 227). Nothing is minted; the fake indexer state is not advanced.
    if (process.env.CT_MULTIBUY_REPRO !== '0') {
      simulateWallet = true; const a0 = applied.length, i0 = inspect.length;
      const noState = async (Pp: any, fn: any, o: any) => SDK.withLedger9ContractScopedTransaction(Pp, fn, o);
      const e: any = await B.buyNightV3Multi(host, { typeId, qty: 3, priceUsdCents: 1000n, feeBps: 300n }, { fetchQuote, scoped: noState as any, keepIntentPerCall: true }).catch((x: any) => x);
      simulateWallet = false;
      const repro = { intents: inspect[i0], apply: applied[a0], result: e?.kind ?? 'resolved' };
      console.log('# REPRO-227 ' + JSON.stringify(repro));
      assert.equal(repro.intents.intents, 3, 'Midnight.js scoped tx carries one intent per call');
      assert.equal(repro.apply.type, 'malformed'); assert.match(repro.apply.err ?? '', /disjoint/i);
      // Same calls in a single intent with the same wallet behaviour: the duplicate-input condition cannot occur.
      inspect.length = i0; applied.length = a0;
    }
    // Give the test buyer one real NIGHT UTXO on the local ledger (reward distribution + claim, test-only APIs).
    ls = ls.testingDistributeNight(nightAddr, 10n ** 16n, new Date());
    { const claim = PROTO.Transaction.fromRewards(PROTO.ClaimRewardsTransaction.new('preview', 10n ** 16n, nightVk, '00'.repeat(32), 'Reward'));
      const now = new Date(); const sec = BigInt(Math.floor(now.getTime() / 1000));
      const [n2, res] = ls.apply(claim.wellFormed(ls, strict, now), new PROTO.TransactionContext(ls, { secondsSinceEpoch: sec, secondsSinceEpochErr: 30, parentBlockHash: '00'.repeat(32), lastBlockTime: sec - 6n } as any));
      assert.equal(res.type, 'success'); ls = n2; }
    fundNight = true;
    const QTYS = (process.env.CT_MULTIBUY_QTYS ?? '2,4').split(',').filter(Boolean).map(Number);
    for (const qty of QTYS) {
      const b0 = balanced.length, s0 = submitted.length, p0 = proveLog.length; const prog: string[] = []; const t0 = Date.now();
      const r = await B.buyNightV3Multi(host, { typeId, qty, priceUsdCents: 1000n, feeBps: 300n, ticketName: 'GA', eventName: 'Test',
        onProgress: (p: any) => prog.push(B.multiBuyProgressLabel(p)) }, { fetchQuote, scoped: scoped as any });
      const ms = Date.now() - t0;
      assert.equal(balanced.length - b0, 1, 'ONE wallet balance/approval for the whole purchase');
      assert.equal(submitted.length - s0, 1, 'one submitted transaction');
      assert.equal(inspect.at(-1).intents, 1, 'CT-MULTI-BUY-227: all calls in ONE intent');
      assert.deepEqual(applied.at(-1), { ok: true, type: 'success', err: undefined }, 'the N-call tx applies on the local ledger in call order');
      const txBytes = Uint8Array.from(Buffer.from(submitted.at(-1)!, 'hex'));
      const tx = await TXMOD.deserializeTransactionAtStage('v9', 'Finalized', txBytes);
      const calls = [...tx.intents.values()].flatMap((i: any) => i.actions).filter((a: any) => a instanceof PROTO.ContractCall);
      assert.equal(calls.length, qty); assert.ok(calls.every((c: any) => Buffer.from(c.entryPoint).toString() === 'buyTicket'));
      assert.equal(r.tickets.length, qty);
      assert.equal(new Set(r.tickets.map((t: any) => t.cap.nonceHex ?? JSON.stringify(t.cap))).size, qty, 'distinct capabilities');
      if (process.env.CT_MULTIBUY_DEBUG) console.log('# proveLog', JSON.stringify(proveLog.slice(p0)));
      const proofs = proveLog.slice(p0).filter((e) => B.circuitOfKeyLocation(e.k) === 'buyTicket');
      const starts = proofs.filter((e) => e.phase === 'start'), dones = proofs.filter((e) => e.phase === 'done');
      assert.equal(dones.length, qty, 'one in-tab proof per ticket');
      const overlap = starts.some((s, i) => i > 0 && s.t < dones[i - 1].t);
      const per = dones.map((dd, i) => dd.t - starts[i].t);
      let cost: any = null, fees: any = null;
      try { const c = tx.cost(PROTO.LedgerParameters.initialParameters()); cost = { readTime: String(c.readTime), computeTime: String(c.computeTime), blockUsage: String(c.blockUsage), bytesWritten: String(c.bytesWritten), bytesChurned: String(c.bytesChurned) }; } catch (e: any) { cost = 'n/a: ' + e.message; }
      try { fees = String(tx.fees(PROTO.LedgerParameters.initialParameters())); } catch (e: any) { fees = 'n/a: ' + e.message; }
      results.push({ qty, totalMs: ms, perProofMs: per, concurrentProofs: overlap, txBytes: txBytes.length, cost, fees, serials: r.tickets.map((t: any) => String(t.serial)), progress: [...new Set(prog)] });
    }
    stopLog();
    console.log('# MULTIBUY ' + JSON.stringify(results));
    if (DUMP) fs.writeFileSync(path.join(DUMP, 'e2e-result.json'), JSON.stringify(results, null, 2));
    const L: any = B.ledgerV3((await B.readContractState(pdp, d.address)).data);
    const total = QTYS.reduce((a, b) => a + b, 0);
    assert.equal(L.serialCount, BigInt(total), 'tickets minted'); assert.equal(L.ticketTypes.lookup(typeId).sold, BigInt(total));
    assert.deepEqual(results.flatMap((x) => x.serials), Array.from({ length: total }, (_, i) => String(i + 1)));
    // Every tx (deploy, setup, each N-ticket tx) applied successfully on the local ledger, in order.
    assert.ok(applied.every((a) => a.ok), JSON.stringify(applied));
  });
});
