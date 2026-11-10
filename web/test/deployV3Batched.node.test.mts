import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  planV3DeploySteps,
  V3_CIRCUIT_ORDER,
  V3_DEPLOY_FIRST_COUNT,
  saveV3DeployProgress,
  loadV3DeployProgress,
  clearV3DeployProgress,
  V3_DEPLOY_PROGRESS_KEY,
  withOmittingEmptyDeferredOps,
  operationEntryName,
  reconcileV3ProgressFromOnChain,
  resolveV3DeployResume,
  isPendingTxWalletError,
} from '../src/midnight/deployV3Plan.ts';

describe('deployV3Batched plan', () => {
  it('splits circuits under block-limit headroom (11 + inserts)', () => {
    const p = planV3DeploySteps();
    assert.equal(V3_DEPLOY_FIRST_COUNT, 11);
    assert.equal(p.totalSteps, 3);
    assert.deepEqual(p.insertBatches.flat(), ['buyTicketAdaAdult', 'adminSet']);
  });

  it('persists progress for resume under v3 key', () => {
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    } as Storage;
    clearV3DeployProgress('preview', storage);
    saveV3DeployProgress('preview', {
      address: 'ab'.repeat(32),
      deployTxId: 'tx1',
      done: V3_CIRCUIT_ORDER.slice(0, 12) as string[],
      pending: ['adminSet'],
      step: 3,
      totalSteps: 3,
      updatedAt: Date.now(),
      status: 'inserting',
    }, storage);
    assert.equal(loadV3DeployProgress('preview', storage)?.pending[0], 'adminSet');
    assert.ok(V3_DEPLOY_PROGRESS_KEY('preview').includes(':v3:'));
    clearV3DeployProgress('preview', storage);
  });
});

describe('withOmittingEmptyDeferredOps', () => {
  it('skips empty deferred setOperation', async () => {
    const calls: string[] = [];
    class FakeState {
      setOperation(operation: string | Uint8Array, value: { verifierKey?: Uint8Array }) {
        calls.push(operationEntryName(operation) + (value?.verifierKey?.length ? '+vk' : ''));
      }
    }
    await withOmittingEmptyDeferredOps(['adminSet'], FakeState as any, async () => {
      const s = new FakeState();
      s.setOperation('createEvent', { verifierKey: new Uint8Array([1]) });
      s.setOperation('adminSet', {});
      s.setOperation('adminSet', { verifierKey: new Uint8Array([9]) });
    });
    assert.deepEqual(calls, ['createEvent+vk', 'adminSet+vk']);
  });
});

describe('on-chain resume reconcile', () => {
  it('only pending adminSet when 12 VKs already on-chain', () => {
    const onChain = V3_CIRCUIT_ORDER.filter((id) => id !== 'adminSet');
    const p = reconcileV3ProgressFromOnChain('cf'.repeat(32), onChain, null);
    assert.equal(p.status, 'inserting');
    assert.deepEqual(p.pending, ['adminSet']);
    assert.ok(p.done.includes('buyTicketAdaAdult'));
  });

  it('marks done when all 13 present', () => {
    const p = reconcileV3ProgressFromOnChain('cf'.repeat(32), V3_CIRCUIT_ORDER, null);
    assert.equal(p.status, 'done');
    assert.equal(p.pending.length, 0);
  });
});

describe('pending tx detection', () => {
  it('matches 1AM pending transaction wording', () => {
    assert.equal(isPendingTxWalletError(new Error('there is already a pending transaction')), true);
    assert.equal(isPendingTxWalletError(new Error('boom')), false);
    const banner = 'DUST SPONSORSHIP FAILED\nA transaction is already pending. Wait for it to confirm or expire before requesting another. Nothing was sent; try again shortly.';
    assert.equal(isPendingTxWalletError(new Error(banner)), true);
    for (const wording of ['pending transaction', 'already a pending', 'transaction is pending', 'another transaction', 'already pending', 'transaction is already pending', 'dust sponsorship']) {
      assert.equal(isPendingTxWalletError(wording.toUpperCase()), true, wording);
    }
  });
});

describe('resolveV3DeployResume forceNew', () => {
  const oldAddr = 'cf'.repeat(32);
  const newAddr = 'ab'.repeat(32);
  const doneOn = (address: string) => ({
    address, deployTxId: 'tx1', done: [...V3_CIRCUIT_ORDER] as string[], pending: [] as string[],
    step: 3, totalSteps: 3, updatedAt: 1, status: 'done' as const,
  });

  it('forceNew ignores a completed resume on the already-connected contract', () => {
    const r = resolveV3DeployResume({ forceNew: true, hostContract: oldAddr, progress: doneOn(oldAddr) });
    assert.equal(r.progress, null);
    assert.equal(r.knownAddress, null);
  });

  it('forceNew still resumes an in-progress replacement at a different address', () => {
    const progress = { ...doneOn(newAddr), status: 'inserting' as const, pending: ['adminSet'], done: V3_CIRCUIT_ORDER.filter((id) => id !== 'adminSet') as string[] };
    const r = resolveV3DeployResume({ forceNew: true, hostContract: oldAddr, progress });
    assert.equal(r.knownAddress, newAddr);
    assert.equal(r.progress?.address, newAddr);
  });

  it('without forceNew, the connected contract remains the resume target', () => {
    const r = resolveV3DeployResume({ forceNew: false, hostContract: oldAddr, progress: doneOn(oldAddr) });
    assert.equal(r.knownAddress, oldAddr);
  });
});
