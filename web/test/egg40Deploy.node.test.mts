import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planEgg40DeploySteps, EGG40_CIRCUIT_ORDER, EGG40_DEPLOY_FIRST_COUNT, loadEgg40DeployProgress, EGG40_DEPLOY_PROGRESS_KEY, reconcileEgg40ProgressFromOnChain } from '../src/midnight/deployEgg40Plan.ts';
import { V3_DEPLOY_PROGRESS_KEY } from '../src/midnight/deployV3Plan.ts';
import { pendingDeployKeyStorageKey } from '../src/midnight/privateStateProvider.ts';

(globalThis as any).window ??= { location: { origin: 'http://x' } };
const { deployEgg40Batched } = await import('../src/midnight/deployEgg40.ts');

function mem() {
  const m = new Map<string, string>();
  return { m, s: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) } as Storage };
}
const ADDR = 'e4'.repeat(32);
function fakeChain() {
  const onChain = new Set<string>();
  const keys = new Map<string, unknown>();
  const calls: string[] = [];
  let deployArgs: any[] = [];
  let deployedVkIds: string[] = [];
  const P = { publicDataProvider: {}, privateStateProvider: { getSigningKey: async (a: string) => keys.get(a) ?? null, setSigningKey: async (a: string, k: unknown) => void keys.set(a, k) } };
  class FakeState { setOperation(_o: string, _v: unknown) {} }
  const CTX = Symbol('ctx');
  class FakeContract { provableCircuits = Object.fromEntries(EGG40_CIRCUIT_ORDER.map((c) => [c, 1])); constructor(_w: unknown) {} }
  const compiled = { [CTX]: { ctor: FakeContract, witnesses: {}, compiledAssetsPath: 'x' } };
  const deps = {
    P, compiled, ContractStateCls: FakeState as any,
    deployFn: async (_P: any, o: any) => {
      calls.push('deploy'); deployArgs = o.args;
      const Ctor = o.compiledContract[CTX].ctor; deployedVkIds = Object.keys(new Ctor({}).provableCircuits);
      for (const id of deployedVkIds) onChain.add(id);
      return { deployTxData: { public: { contractAddress: ADDR, txId: 'tx-deploy' } } };
    },
    insertFn: async (_P: any, _c: any, a: string, id: string) => { assert.equal(a, ADDR); calls.push('insert:' + id); onChain.add(id); return { public: { txId: 'tx-' + id } }; },
    fetchVk: async () => new Uint8Array([1]),
    listOnChain: async () => [...onChain],
    waitForCircuits: async () => {},
    sampleKey: () => ({ tag: 't', value: 'k' }),
    verifyingKeyOf: (k: any) => k,
    accountId: () => new Uint8Array(32).fill(7),
    rateSignerPk: { x: 1n, y: 2n },
    createPrivateState: (sk: Uint8Array) => ({ sk }),
  };
  return { deps, calls, onChain, keys, get deployArgs() { return deployArgs; }, get deployedVkIds() { return deployedVkIds; } };
}
const host = { schema: 3, contract: 'b9'.repeat(32), networkId: 'preview', sk: new Uint8Array(32), P: {}, userAddress: () => ({ bytes: new Uint8Array(32) }), age: null } as any;
const issuer = async () => ({ x: 3n, y: 4n });

describe('EGG-40 deploy plan', () => {
  it('15 circuits: 10 in the deploy tx, 5 single inserts, 6 wallet prompts', () => {
    const p = planEgg40DeploySteps();
    assert.equal(EGG40_CIRCUIT_ORDER.length, 15);
    assert.equal(EGG40_DEPLOY_FIRST_COUNT, 10);
    assert.equal(p.totalSteps, 6);
    assert.deepEqual(p.insertBatches.flat(), ['authorizeDoorKey', 'revokeDoorKey', 'admitByDoor', 'admitByDoor4', 'adminSet']);
    assert.ok(!EGG40_CIRCUIT_ORDER.some((c) => /Ada/.test(c)), 'no ADA circuit');
  });
  it('uses storage keys separate from the v3 deploy', () => {
    assert.notEqual(EGG40_DEPLOY_PROGRESS_KEY('preview'), V3_DEPLOY_PROGRESS_KEY('preview'));
  });
  it('reconcile marks done when all 15 present', () => {
    assert.equal(reconcileEgg40ProgressFromOnChain(ADDR, EGG40_CIRCUIT_ORDER, null).status, 'done');
  });
});

describe('deployEgg40Batched', () => {
  it('deploys with the EGG-40 constructor and installs the 5 deferred keys in order', async () => {
    const f = fakeChain(); const { s, m } = mem();
    const steps: number[] = [];
    const r = await deployEgg40Batched(host, 'addr', issuer, { storage: s, deps: f.deps as any, onStep: (e) => steps.push(e.step) });
    assert.equal(r.address, ADDR);
    assert.deepEqual(f.calls, ['deploy', 'insert:authorizeDoorKey', 'insert:revokeDoorKey', 'insert:admitByDoor', 'insert:admitByDoor4', 'insert:adminSet']);
    assert.deepEqual(f.deployedVkIds.sort(), EGG40_CIRCUIT_ORDER.slice(0, 10).slice().sort());
    const a = f.deployArgs;
    assert.equal(a.length, 8, 'no ADA argument');
    assert.equal(a[0], 300n); assert.equal(a[6], 300n); assert.equal(a[7], 100n);
    assert.deepEqual(a[3], { x: 3n, y: 4n }); assert.deepEqual(a[4], { x: 1n, y: 2n });
    assert.equal(loadEgg40DeployProgress('preview', s)?.status, 'done');
    assert.ok(f.keys.get(ADDR), 'maintenance key stored under the new address');
    assert.equal(m.get(pendingDeployKeyStorageKey('preview')), undefined, 'v3 pending key untouched');
    assert.equal(host.contract, 'b9'.repeat(32), 'session contract unchanged');
    assert.ok(steps.includes(6));
  });
  it('resumes after an interrupted insert without a second deploy', async () => {
    const f = fakeChain(); const { s } = mem();
    let fail = true;
    const insert = f.deps.insertFn;
    f.deps.insertFn = async (...x: any[]) => { if (x[3] === 'admitByDoor' && fail) { fail = false; throw new Error('user closed 1AM'); } return (insert as any)(...x); };
    await assert.rejects(deployEgg40Batched(host, 'addr', issuer, { storage: s, deps: f.deps as any }));
    const r = await deployEgg40Batched(host, 'addr', issuer, { storage: s, deps: f.deps as any });
    assert.equal(r.address, ADDR);
    assert.equal(f.calls.filter((c) => c === 'deploy').length, 1);
    assert.deepEqual(f.calls.filter((c) => c.startsWith('insert:')), ['insert:authorizeDoorKey', 'insert:revokeDoorKey', 'insert:admitByDoor', 'insert:admitByDoor4', 'insert:adminSet']);
  });
  it('refuses to prompt inserts when the maintenance key is missing', async () => {
    const f = fakeChain(); const { s } = mem();
    let fail = true; const insert = f.deps.insertFn;
    f.deps.insertFn = async (...x: any[]) => { if (fail) { fail = false; throw new Error('stop'); } return (insert as any)(...x); };
    await assert.rejects(deployEgg40Batched(host, 'addr', issuer, { storage: s, deps: f.deps as any }));
    f.keys.clear();
    await assert.rejects(deployEgg40Batched(host, 'addr', issuer, { storage: s, deps: f.deps as any }), /maintenance key/);
  });
});
