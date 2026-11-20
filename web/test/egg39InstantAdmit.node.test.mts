import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLinkedMemoryStores, createMemoryStore, setGateAdmitStoreForTests } from '../src/midnight/gateAdmitStore.ts';
import {
  COMMIT_INTERVAL_MS,
  COMMIT_THRESHOLD,
  commitQueuedAdmits,
  evaluateSerialTicket,
  instantAdmit,
  shouldAutoCommit,
  submitQueuedAdmit,
} from '../src/midnight/instantAdmit.ts';
const OWNED = 0;
const CONSUMED = 2;

const CONTRACT = '0'.repeat(64);
const QR = (serial: string) =>
  `cloaktix:admit:v2?net=preview&c=${CONTRACT}&s=${serial}&e=0&n=${'ab'.repeat(32)}`;

function state(over: Partial<{ status: number; typeId: bigint; hasAdmit: boolean; consumed: boolean }> = {}) {
  const typeId = over.typeId ?? 1n;
  const status = over.consumed ? CONSUMED : (over.status ?? OWNED);
  const ticket = { serial: 12n, typeId, status, epoch: 0n, hasAdmit: over.hasAdmit ?? true, mine: true, listingId: 0n };
  return {
    schemaVersion: 3 as const,
    feeBps: 0n,
    ageIssuer: { x: 0n, y: 0n },
    events: [{ id: 2n, mine: true, open: true, isKey: false }],
    types: [{ id: typeId, eventId: 2n, price: 0n, maxResale: 0n } as any],
    held: null,
    checkIns: new Map(),
    listings: [],
    tickets: [ticket],
    ownedTickets: [ticket],
    networkTag: new Uint8Array(32),
  };
}

function input(store: ReturnType<typeof createMemoryStore>, extra: Record<string, unknown> = {}) {
  return {
    store,
    networkId: 'preview',
    contract: CONTRACT,
    schema: 3 as const,
    text: QR('12'),
    state: state(),
    online: true,
    acceptedTypeIds: [1n],
    doorLabel: 'Door A',
    ...extra,
  };
}

describe('EGG-39 instant admit', () => {
  it('returns a pending Valid in well under a second and queues the admit', async () => {
    const store = createMemoryStore();
    const t0 = Date.now();
    const result = await instantAdmit(input(store));
    const ms = Date.now() - t0;
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.recordingPending, true);
      assert.equal(result.serial, 12n);
      assert.equal(result.queued, 1);
    }
    assert.ok(ms < 200, `expected <200ms, got ${ms}`);
    assert.equal(await store.pendingCount(CONTRACT), 1);
    const used = await store.getUsed(CONTRACT, '12');
    assert.equal(used?.status, 'pending');
    assert.equal(used?.doorLabel, 'Door A');
  });

  it('shows Already used on a second gate that shares the used-list', async () => {
    const [gateA, gateB] = createLinkedMemoryStores();
    const first = await instantAdmit(input(gateA, { doorLabel: 'Door A' }));
    assert.equal(first.ok, true);
    const second = await instantAdmit(input(gateB, { doorLabel: 'Door B' }));
    assert.equal(second.ok, false);
    if (!second.ok) {
      assert.match(second.reason, /Already admitted/);
      assert.equal(second.firstAdmittedDoor, 'Door A');
      assert.ok(second.firstAdmittedAt);
    }
    assert.equal(await gateB.pendingCount(CONTRACT), 1);
  });

  it('keeps the queue and used-list after a reload snapshot', async () => {
    const store = createMemoryStore();
    await instantAdmit(input(store));
    const snap = await store.snapshot();
    const reloaded = createMemoryStore(snap);
    assert.equal(await reloaded.pendingCount(CONTRACT), 1);
    const again = await instantAdmit(input(reloaded, { doorLabel: 'Door B' }));
    assert.equal(again.ok, false);
    if (!again.ok) assert.match(again.reason, /Already admitted/);
  });

  it('commits a batch with one mocked submit per item and retries failures', async () => {
    const store = createMemoryStore();
    await instantAdmit(input(store, { text: QR('12'), state: state() }));
    await instantAdmit(input(store, { text: QR('13'), state: state({ typeId: 1n }) }));
    // second serial needs to exist in state
    const st = state();
    st.tickets.push({ serial: 13n, typeId: 1n, status: OWNED, epoch: 0n, hasAdmit: true, mine: true, listingId: 0n });
    const store2 = createMemoryStore();
    await instantAdmit(input(store2, { text: QR('12'), state: st, doorLabel: 'Door A' }));
    await instantAdmit(input(store2, { text: QR('13'), state: st, doorLabel: 'Door A' }));
    let calls = 0;
    const submit = async (item: { serial: string }) => {
      calls += 1;
      if (item.serial === '12' && calls === 1) throw new Error('wallet rejected');
      return { txId: `tx-${item.serial}-${calls}` };
    };
    const first = await commitQueuedAdmits(store2, CONTRACT, submit);
    assert.equal(first.ok, 1);
    assert.equal(first.failed, 1);
    assert.equal(await store2.pendingCount(CONTRACT), 1);
    const retry = await commitQueuedAdmits(store2, CONTRACT, submit);
    assert.equal(retry.ok, 1);
    assert.equal(retry.failed, 0);
    assert.equal(await store2.pendingCount(CONTRACT), 0);
    assert.equal((await store2.getUsed(CONTRACT, '12'))?.status, 'committed');
    assert.equal((await store2.getUsed(CONTRACT, '13'))?.status, 'committed');
    assert.ok(calls >= 3);
  });

  it('does not allow a first admission when the door is offline', async () => {
    const store = createMemoryStore();
    const result = await instantAdmit(input(store, { online: false, state: null }));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /No offline first admission/);
    assert.equal(await store.pendingCount(CONTRACT), 0);
  });

  it('still reports Already used from the local list when offline', async () => {
    const store = createMemoryStore();
    await instantAdmit(input(store, { doorLabel: 'Door A' }));
    const offline = await instantAdmit(input(store, { online: false, state: null, doorLabel: 'Door B' }));
    assert.equal(offline.ok, false);
    if (!offline.ok) {
      assert.match(offline.reason, /Already admitted/);
      assert.equal(offline.firstAdmittedDoor, 'Door A');
    }
  });

  it('rejects a consumed ticket or a wrong type without queueing', async () => {
    const store = createMemoryStore();
    const consumed = await instantAdmit(input(store, { state: state({ consumed: true }) }));
    assert.equal(consumed.ok, false);
    if (!consumed.ok) assert.match(consumed.reason, /consumed|no longer in owned/i);
    const wrong = await instantAdmit(input(store, { acceptedTypeIds: [9n] }));
    assert.equal(wrong.ok, false);
    assert.equal(await store.pendingCount(CONTRACT), 0);
  });

  it('builds one on-chain admit call per queued item (no batch circuit)', async () => {
    const item = {
      id: '1', contract: CONTRACT, schema: 3 as const, serial: '12', typeId: '1',
      qrText: QR('12'), doorId: '', doorLabel: 'Door A', acceptedTypeIds: ['1'],
      queuedAt: new Date().toISOString(), attempts: 0, lastError: '',
    };
    let seen: unknown[] | undefined;
    await submitQueuedAdmit(item, async (circuit, args) => {
      assert.equal(circuit, 'admit');
      seen = args;
      return { txId: 't' };
    });
    assert.equal((seen?.[0] as bigint), 12n);
    assert.equal(COMMIT_THRESHOLD, 10);
    assert.equal(COMMIT_INTERVAL_MS, 120_000);
    assert.equal(shouldAutoCommit(10, Date.now()), true);
    assert.equal(shouldAutoCommit(1, Date.now()), false);
    assert.equal(shouldAutoCommit(1, Date.now() - COMMIT_INTERVAL_MS), true);
  });

  it('evaluate does not call a submitter', () => {
    const evaluated = evaluateSerialTicket({
      networkId: 'preview', contract: CONTRACT, schema: 3, text: QR('12'),
      state: state(), online: true, acceptedTypeIds: [1n],
    });
    assert.equal(evaluated.ok, true);
  });
});

setGateAdmitStoreForTests(undefined);
