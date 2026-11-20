import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { deployTxVkProblems, EGG40_CIRCUIT_ORDER, planEgg40DeploySteps } from '../src/midnight/deployEgg40Plan.ts';
import { humanizeTxError } from '../src/txError.ts';

// Load the wasm before the window stub: wasm-bindgen looks for window.crypto.
const L: any = await import(new URL('../node_modules/@midnight-ntwrk/midnight-js-protocol/node_modules/@midnightntwrk/ledger-v9/midnight_ledger_wasm_v9_fs.js', import.meta.url).href);
(globalThis as any).window ??= { location: { origin: 'http://x' }, crypto: globalThis.crypto };
const { deployEgg40Batched, withDeployTxGuard } = await import('../src/midnight/deployEgg40.ts');
const KEYS = new URL('../../contract/managed/cloaktix-egg40/keys/', import.meta.url);

function deployTx(ids: string[], empty: string[] = []) {
  const st = new L.ContractState();
  for (const id of ids) { const op = new L.ContractOperation(); op.verifierKey = new Uint8Array(fs.readFileSync(new URL(`${id}.verifier`, KEYS))); st.setOperation(id, op); }
  for (const id of empty) st.setOperation(id, new L.ContractOperation());
  return L.Transaction.fromParts('preview', undefined, undefined, L.Intent.new(new Date(Date.now() + 3600e3)).addDeploy(new L.ContractDeploy(st))).mockProve();
}

describe('EGG-40 deploy tx guard (real ledger-v9 tx)', { skip: !fs.existsSync(new URL('createEvent.verifier', KEYS)) && 'needs the compiled verifier keys (not published; compile locally with Compact)' }, () => {
  const first = planEgg40DeploySteps().deployCircuits;
  it('accepts the planned 10-key deploy', () => assert.deepEqual(deployTxVkProblems(deployTx(first), first), []));
  it('flags an empty deferred slot (Custom error 110)', () => {
    const p = deployTxVkProblems(deployTx(first, ['adminSet']), first);
    assert.ok(p.some((x) => /empty verifier key slot adminSet/.test(x)), p.join());
  });
  it('flags a missing planned key', () => assert.ok(deployTxVkProblems(deployTx(first.slice(1)), first).some((x) => /missing verifier key createEvent/.test(x))));
  it('wallet never sees a bad deploy tx', async () => {
    let seen = 0;
    const P = withDeployTxGuard({ walletProvider: { balanceTx: async () => { seen++; return 'ok'; }, getCoinPublicKey: () => 'c' } }, first);
    await assert.rejects(() => P.walletProvider.balanceTx(deployTx(first, ['adminSet'])), /nothing was sent/);
    assert.equal(seen, 0);
    assert.equal(await P.walletProvider.balanceTx(deployTx(first)), 'ok');
    assert.equal(P.walletProvider.getCoinPublicKey(), 'c');
  });
});

describe('EGG-40 indexer check', () => {
  it('stops before any wallet prompt when the indexer is down', async () => {
    let deployed = 0;
    const m = new Map<string, string>();
    const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) } as Storage;
    const host = { contract: 'b9'.repeat(32), networkId: 'preview', sk: new Uint8Array(32), P: {}, userAddress: () => ({}) } as any;
    const deps: any = { P: { publicDataProvider: {} }, compiled: {}, ContractStateCls: class { setOperation() {} }, deployFn: async () => { deployed++; }, listOnChain: async () => [], indexerCheck: async () => { throw new Error('503'); } };
    await assert.rejects(() => deployEgg40Batched(host, 'a', async () => ({ x: 1n, y: 1n }), { storage: s, deps }), /indexer is not responding.*Nothing was sent/);
    assert.equal(deployed, 0);
    assert.equal(m.size, 0, 'no progress or pending key written');
  });
});

describe('1010 node rejection copy', () => {
  const raw = '[MIDNIGHT_JS_C_PROVIDER_FAILED] submitTx rejected the transaction. <- cause: Error: Operation failed: 1010: Invalid Transaction: Custom error: 171';
  it('names the code and says nothing was created', () => {
    const h = humanizeTxError(raw);
    assert.match(h, /code 171/); assert.match(h, /Nothing was created and no DUST was spent/);
    assert.ok(h.length < 300, 'fits the error banner');
  });
  it('170 says wallet DUST proof out of sync, nothing spent, retry after sync', () => {
    const h = humanizeTxError('Operation failed: 1010: Invalid Transaction: Custom error: 170');
    assert.match(h, /code 170/); assert.match(h, /out of sync/); assert.match(h, /fully synced/); assert.ok(h.length < 300);
  });
  it('block limits text', () => assert.match(humanizeTxError('1010: Invalid Transaction: Transaction would exhaust the block limits'), /block limits/));
  it('order of circuits unchanged', () => assert.equal(EGG40_CIRCUIT_ORDER.length, 15));
});
