import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real session source with only SDK/browser boundaries substituted.
// The real shared sleep/retry helper runs against Node's fake clock.
const require = createRequire(import.meta.url);
function loadSource(name: string, imports: Record<string, unknown>) {
  const source = readFileSync(new URL(`../src/midnight/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Date, setTimeout, performance, Uint8Array,
    require: (id: string) => {
      assert.ok(id in imports, `unexpected dependency ${id}`);
      return imports[id];
    },
  });
  return exports as any;
}
async function flush() { for (let i = 0; i < 40; i++) await Promise.resolve(); }
function setup(t: any, opts: { visibleAfter?: number; pendingFailures?: number; terminalError?: boolean } = {}) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 });
  const helper = loadSource('walletPending', {});
  const calls: { id: string; time: number; args: unknown[] }[] = [];
  const reads: number[] = [];
  let attempts = 0;
  const session = loadSource('session-v3', {
    './walletPending': helper,
    './contract-v3': {
      pureCircuitsV3: { contractKeyOf: () => new Uint8Array(32), admitCommitOf: () => new Uint8Array(32) },
      TicketStatusV3: { owned: 0 },
      ledgerV3: (data: unknown) => data,
    },
    '@midnight-ntwrk/midnight-js-contracts': {
      submitCallTx: async (_: unknown, call: { circuitId: string; args: unknown[] }) => {
        calls.push({ id: call.circuitId, time: Date.now(), args: call.args });
        if (call.circuitId === 'registerAdmit') {
          attempts++;
          if (opts.terminalError) throw new Error('Rejected by user');
          if (attempts <= (opts.pendingFailures ?? 0)) throw new Error('DUST SPONSORSHIP FAILED\nA transaction is already pending. Wait for it to confirm or expire before requesting another. Nothing was sent; try again shortly.');
        }
        return { public: { txId: call.circuitId === 'registerAdmit' ? 'admit-tx' : 'buy-tx' }, private: { result: 42n } };
      },
    },
    './deployV3Batched': {},
    './contractStateRead': { readContractState: (p: any, a: string) => p.queryContractState(a) },
    './schema': { networkTagBytes: () => new Uint8Array(32), contractAddressStruct: () => ({}) },
    './circuitArgs': { v3NightAmounts: () => ({ nightPaid: 5n, fee: 0n }), nowInWindow: () => 1n, buyTicketV3Call: () => ({ circuit: 'buyTicket', args: [] }) },
    '../rate/rateSignerClient': { fetchSignedRateQuote: async () => ({ quote: { atomsPerUsdCent: 1n, issuedAt: 1n, expiresAt: 100n } }) },
    '../v2/admitCodec': { randomNonce32: () => new Uint8Array(32), bytesToHex: () => '00'.repeat(32) },
    '../v2/prepareAdmit': { packageAdmitCapability: () => ({ capability: 'packed' }) },
  });
  const host = { contract: 'contract', networkId: 'preview', P: { publicDataProvider: { queryContractState: async () => {
    reads.push(Date.now());
    return { data: { schemaVersion: 3, tickets: Date.now() >= (opts.visibleAfter ?? 0) ? [[42n, { epoch: 7n, status: 0, owner: new Uint8Array(32) }]] : [], events: [], ticketTypes: [], listings: [] } };
  } } } };
  const result = session.buyNightV3(host, { typeId: 1n, adult: false, priceUsdCents: 1n, feeBps: 0n });
  return { calls, reads, result, async advance(ms: number) { t.mock.timers.tick(ms); await flush(); } };
}

it('buy waits for the serial then the full extra 4s before registerAdmit', async (t) => {
  const h = setup(t, { visibleAfter: 5_000 });
  await flush();
  assert.equal(h.calls.length, 1);
  await h.advance(2_500);
  assert.equal(h.calls.length, 1);
  await h.advance(2_500);
  // CT-ONE-BUY: first read at 0 is the pre-buy serialCount probe (absent here -> fallback path).
  assert.deepEqual(h.reads, [0, 0, 2_500, 5_000]);
  await h.advance(3_999);
  assert.equal(h.calls.length, 1);
  await h.advance(1);
  const r = await h.result;
  assert.equal(h.calls[1].id, 'registerAdmit');
  assert.equal(h.calls[1].time, 9_000);
  assert.equal(r.prepareOk, true);
  assert.equal(r.buyTxId, 'buy-tx');
});

it('registerAdmit retries the exact 1AM pending error without buying again', async (t) => {
  const h = setup(t, { pendingFailures: 1 });
  await flush(); await h.advance(4_000);
  assert.equal(h.calls.length, 2);
  await h.advance(6_499); assert.equal(h.calls.length, 2);
  await h.advance(1);
  const r = await h.result;
  assert.equal(r.prepareOk, true);
  assert.deepEqual(h.calls.map((c) => c.id), ['buyTicket', 'registerAdmit', 'registerAdmit']);
  assert.deepEqual(h.calls[1].args, h.calls[2].args);
});

it('serial timeout preserves successful payment identifiers and needsPrepare', async (t) => {
  const h = setup(t, { visibleAfter: Infinity });
  await flush();
  for (let i = 0; i < 72; i++) await h.advance(2_500);
  const r = await h.result;
  assert.equal(r.needsPrepare, true); assert.equal(r.prepareOk, false);
  assert.equal(r.serial, 42n); assert.equal(r.buyTxId, 'buy-tx'); assert.equal(r.txId, 'buy-tx');
  assert.match(r.prepareError, /Timed out/);
  assert.equal(h.calls.length, 1);
});

it('eight exhausted attempts preserve payment and never submit another buy', async (t) => {
  const h = setup(t, { pendingFailures: 99 });
  await flush(); await h.advance(4_000);
  for (let attempt = 1; attempt < 8; attempt++) await h.advance(5_000 + attempt * 1_500);
  const r = await h.result;
  assert.equal(r.needsPrepare, true); assert.equal(r.prepareOk, false);
  assert.equal(r.serial, 42n); assert.equal(r.buyTxId, 'buy-tx'); assert.equal(r.txId, 'buy-tx');
  assert.match(r.prepareError, /DUST SPONSORSHIP/);
  assert.equal(h.calls.filter((c) => c.id === 'registerAdmit').length, 8);
  assert.equal(h.calls.filter((c) => c.id === 'buyTicket').length, 1);
});

it('non-pending registration failures are not retried and preserve payment', async (t) => {
  const h = setup(t, { terminalError: true });
  await flush(); await h.advance(4_000);
  const r = await h.result;
  assert.equal(r.needsPrepare, true); assert.equal(r.serial, 42n); assert.equal(r.buyTxId, 'buy-tx');
  assert.equal(r.prepareError, 'Rejected by user'); assert.equal(h.calls.length, 2);
});
