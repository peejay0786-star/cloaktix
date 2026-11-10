import assert from 'node:assert/strict';
import { it } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// CT-ONE-BUY: real session + shared helper source, SDK/browser boundaries mocked.
function loadSource(name: string, imports: Record<string, unknown>) {
  const source = readFileSync(new URL(`../src/midnight/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, Date, setTimeout, performance, Uint8Array,
    require: (id: string) => { assert.ok(id in imports, `unexpected dependency ${id}`); return imports[id]; } });
  return exports as any;
}
async function flush() { for (let i = 0; i < 40; i++) await Promise.resolve(); }
const NONCE = new Uint8Array(32).fill(9);
function setup(t: any, opts: { serialCount?: unknown; minted: bigint; adult?: boolean }) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 });
  const helper = loadSource('walletPending', {});
  const calls: { id: string; args: unknown[] }[] = [];
  const buyArgs: any[] = [];
  const commits: unknown[][] = [];
  const packs: any[] = [];
  let nonces = 0;
  const session = loadSource('session-v3', {
    './walletPending': helper,
    './contract-v3': {
      pureCircuitsV3: { contractKeyOf: () => new Uint8Array(32).fill(2),
        admitCommitOf: (...a: unknown[]) => { commits.push(a); return new Uint8Array(32).fill(Number(a[2]) & 0xff || 1); } },
      TicketStatusV3: { owned: 0 }, ledgerV3: (data: unknown) => data,
    },
    '@midnight-ntwrk/midnight-js-contracts': {
      submitCallTx: async (_: unknown, call: { circuitId: string; args: unknown[] }) => {
        calls.push({ id: call.circuitId, args: call.args });
        return { public: { txId: call.circuitId === 'registerAdmit' ? 'admit-tx' : 'buy-tx' }, private: { result: opts.minted } };
      },
    },
    './deployV3Batched': {},
    './contractStateRead': { readContractState: (p: any, a: string) => p.queryContractState(a) },
    './schema': { networkTagBytes: () => new Uint8Array(32).fill(1), contractAddressStruct: () => ({}) },
    './circuitArgs': { v3NightAmounts: () => ({ nightPaid: 5n, fee: 0n }), nowInWindow: () => 1n,
      buyTicketV3Call: (a: any) => { buyArgs.push(a); return { circuit: a.asOf !== undefined ? 'buyTicketAdult' : 'buyTicket', args: [a.admitCommit] }; } },
    '../rate/rateSignerClient': { fetchSignedRateQuote: async () => ({ quote: { atomsPerUsdCent: 1n, issuedAt: 1n, expiresAt: 100n } }) },
    '../v2/admitCodec': { randomNonce32: () => { nonces++; return NONCE; }, bytesToHex: (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('') },
    '../v2/prepareAdmit': { packageAdmitCapability: (p: any) => { packs.push(p); return { capability: 'packed' }; } },
  });
  const ledger: any = { schemaVersion: 3, tickets: [[opts.minted, { epoch: 3n, status: 0, owner: new Uint8Array(32) }]], events: [], ticketTypes: [], listings: [] };
  if ('serialCount' in opts) ledger.serialCount = opts.serialCount;
  const host = { contract: 'contract', networkId: 'preview', P: { publicDataProvider: { queryContractState: async () => ({ data: ledger }) } } };
  const result = session.buyNightV3(host, { typeId: 1n, adult: !!opts.adult, asOf: opts.adult ? 7n : undefined, priceUsdCents: 1n, feeBps: 0n, ticketName: 'GA', eventName: 'E' });
  return { calls, buyArgs, commits, packs, result, nonces: () => nonces, async advance(ms: number) { t.mock.timers.tick(ms); await flush(); } };
}

it('predicted serial: one buy with non-empty commit, no registerAdmit', async (t) => {
  const h = setup(t, { serialCount: 41n, minted: 42n });
  const r = await h.result;
  assert.deepEqual(h.calls.map((c) => c.id), ['buyTicket']);
  const commit = h.buyArgs[0].admitCommit as Uint8Array;
  assert.equal(commit.length, 32); assert.ok(commit.some((b) => b !== 0));
  assert.equal(r.prepareOk, true); assert.equal(r.needsPrepare, false);
  assert.equal(r.serial, 42n); assert.equal(r.epoch, 1n); assert.equal(r.buyTxId, 'buy-tx'); assert.equal(r.nightPaid, 5n); assert.equal(r.method, 'NIGHT');
  assert.equal(h.packs[0].serial, '42'); assert.equal(h.packs[0].epoch, '1'); assert.equal(h.packs[0].nonceHex, '09'.repeat(32));
  assert.equal(r.capability, 'packed'); assert.equal(h.nonces(), 1);
});

it('commit preimage uses predicted serial and mint epoch 1n', async (t) => {
  const h = setup(t, { serialCount: 41n, minted: 42n });
  await h.result;
  const [tag, key, serial, epoch, nonce] = h.commits[0] as any[];
  assert.ok(tag.every((b: number) => b === 1)); assert.ok(key.every((b: number) => b === 2));
  assert.equal(serial, 42n); assert.equal(epoch, 1n); assert.equal(nonce, NONCE);
});

it('adult buy uses the same one-tx path', async (t) => {
  const h = setup(t, { serialCount: 41n, minted: 42n, adult: true });
  const r = await h.result;
  assert.deepEqual(h.calls.map((c) => c.id), ['buyTicketAdult']);
  assert.equal(h.buyArgs[0].asOf, 7n); assert.equal(r.prepareOk, true);
});

it('serial mismatch falls back to registerAdmit for the actual serial, single buy', async (t) => {
  const h = setup(t, { serialCount: 41n, minted: 43n });
  await flush(); await h.advance(4_000);
  const r = await h.result;
  assert.deepEqual(h.calls.map((c) => c.id), ['buyTicket', 'registerAdmit']);
  assert.equal(h.calls[1].args[0], 43n);
  assert.equal(h.commits[1][2], 43n); assert.equal(h.commits[1][3], 3n);
  assert.equal(r.prepareOk, true); assert.equal(r.serial, 43n); assert.equal(r.buyTxId, 'buy-tx'); assert.equal(r.nightPaid, 5n);
});

it('unreadable serialCount falls back to EMPTY commit + registerAdmit', async (t) => {
  const h = setup(t, { minted: 42n });
  await flush(); await h.advance(4_000);
  const r = await h.result;
  assert.ok((h.buyArgs[0].admitCommit as Uint8Array).every((b) => b === 0));
  assert.deepEqual(h.calls.map((c) => c.id), ['buyTicket', 'registerAdmit']);
  assert.equal(r.prepareOk, true); assert.equal(r.buyTxId, 'buy-tx');
});
