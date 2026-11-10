import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buyerCatalog, buyerVisibleEvents, collapseDuplicateTypes, duplicateTypeName, isKeyRegistration } from '../src/catalog/buyerView.ts';
import { ownedOrganizerEvent } from '../src/organizer/eventRoute.ts';
import { shouldDeleteCacheOnActivate } from '../src/swPolicy.ts';

// Shape of the live Preview contract (read-only indexer, 2026-11-09 17:24 ET): event 2 = key registration, no types.
const events = [{ id: 2n, mine: false, open: true, isKey: false }, { id: 1n, mine: false, open: true, isKey: false }];
const T = (id: bigint, sold: bigint, supply: bigint, price: bigint, extra: Record<string, unknown> = {}) =>
  ({ id, eventId: 1n, sold, supply, price, resale: 0, maxResale: 7500n, adultOnly: false, ...extra });
const types = [T(2n, 1n, 100n, 5000n), T(1n, 3n, 100n, 5000n), T(3n, 0n, 50n, 7500n, { resale: 1, maxResale: 0n, adultOnly: true })];
const names: Record<string, string> = { '1': 'General admission', '2': 'General admission', '3': 'VIP 18+' };
const nameOf = (id: bigint) => names[String(id)] ?? `Ticket #${id}`;

describe('CT-POLISH-3 fix 1: key registration hidden from buyers', () => {
  it('hides event 2 with no key list (other device), keeps event 1', () => {
    assert.deepEqual(buyerVisibleEvents(events, types, new Set()).map((e) => e.id), [1n]);
  });
  it('hides a key registration by isKey or the /meta key list even if it had types', () => {
    const withType = [...types, T(9n, 0n, 1n, 100n, { eventId: 2n })];
    assert.equal(isKeyRegistration({ id: 2n, isKey: true }, new Set()), true);
    assert.deepEqual(buyerVisibleEvents(events, withType, new Set(['2'])).map((e) => e.id), [1n]);
    assert.deepEqual(buyerVisibleEvents([{ ...events[0], isKey: true }, events[1]], withType, new Set()).map((e) => e.id), [1n]);
  });
  it('organizer can still open a real event that has no ticket types yet', () => {
    const st: any = { schemaVersion: 3, events: [{ id: 5n, mine: true, open: true, isKey: false }], types: [], tickets: [] };
    assert.equal(ownedOrganizerEvent(st, 5n)?.id, 5n);
  });
  it('walletless catalog drops events without ticket options and dedupes identical options', () => {
    const ev = (id: string, tickets: any[]) => ({ id, name: 'X', date: '2026-12-01', venue: 'V', cover: '', description: 'd', demoArt: 'false', publishedAt: 1, tickets });
    const ga = { name: 'General admission', usdCents: '5000', resaleSummary: 'Capped resale — maximum $75.00 USD' };
    const c = buyerCatalog({ source: 'organizer-published', contract: 'a'.repeat(64), events: [ev('2', []), ev('1', [{ id: '2', ...ga }, { id: '1', ...ga }, { id: '3', name: 'VIP', usdCents: '7500', resaleSummary: 'Unlimited resale' }])] });
    assert.deepEqual(c.events.map((e) => e.id), ['1']);
    assert.deepEqual(c.events[0].tickets.map((t) => t.id), ['2', '3']);
  });
});

describe('CT-POLISH-3 fix 2: duplicate General admission', () => {
  it('collapses types 1 and 2 into one option, buys go to type 1 first', () => {
    const before = JSON.stringify(types, (_, v) => typeof v === 'bigint' ? String(v) : v);
    const g = collapseDuplicateTypes(types, nameOf);
    assert.equal(g.length, 2);
    const ga = g.find((x) => x.members.length === 2)!;
    assert.equal(ga.primary.id, 1n);
    assert.deepEqual(ga.members.map((m) => m.id), [1n, 2n]);
    assert.equal(ga.sold, 4n); assert.equal(ga.supply, 200n);
    assert.equal(JSON.stringify(types, (_, v) => typeof v === 'bigint' ? String(v) : v), before, 'state is not mutated (serial 1 stays type 2)');
  });
  it('routes to type 2 once type 1 is sold out, and to type 1 if all are sold out', () => {
    assert.equal(collapseDuplicateTypes([T(1n, 100n, 100n, 5000n), T(2n, 1n, 100n, 5000n)], nameOf)[0].primary.id, 2n);
    assert.equal(collapseDuplicateTypes([T(1n, 100n, 100n, 5000n), T(2n, 100n, 100n, 5000n)], nameOf)[0].primary.id, 1n);
  });
  it('does not collapse different price, rules or age, or different events', () => {
    assert.equal(collapseDuplicateTypes([T(1n, 0n, 1n, 5000n), T(2n, 0n, 1n, 6000n)], nameOf).length, 2);
    assert.equal(collapseDuplicateTypes([T(1n, 0n, 1n, 5000n), T(2n, 0n, 1n, 5000n, { resale: 2 })], nameOf).length, 2);
    assert.equal(collapseDuplicateTypes([T(1n, 0n, 1n, 5000n), T(2n, 0n, 1n, 5000n, { adultOnly: true })], nameOf).length, 2);
    assert.equal(collapseDuplicateTypes([T(1n, 0n, 1n, 5000n), T(2n, 0n, 1n, 5000n, { eventId: 7n })], nameOf).length, 2);
  });
  it('add-type form flags the same name (case and spacing ignored) only on the same event', () => {
    assert.equal(duplicateTypeName('  general   ADMISSION ', 1n, types, nameOf), 'General admission');
    assert.equal(duplicateTypeName('Balcony', 1n, types, nameOf), null);
    assert.equal(duplicateTypeName('General admission', 7n, types, nameOf), null);
    assert.equal(duplicateTypeName('   ', 1n, types, nameOf), null);
  });
  it('App wires the buyer filter, the collapse and the add-type guard', () => {
    const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /const visible = buyerVisibleEvents\(st\.events, st\.types, KEY_EVENTS\)/);
    assert.match(app, /visible\.map\(\(e\) => <EventCard/);
    assert.match(app, /const e = buyerVisibleEvents\(st\.events, st\.types, KEY_EVENTS\)\.find/);
    assert.match(app, /collapseDuplicateTypes\(st!\.types\.filter\(\(x\) => x\.eventId === e\.id\)/);
    assert.match(app, /disabled=\{!tt\.name\.trim\(\) \|\| !!dupName/);
    assert.doesNotMatch(app, /\{st\.events\.map\(\(e\) => <EventCard/);
  });
});

describe('CT-POLISH-3 fix 3: service worker keeps the zk cache', () => {
  const runActivate = async (names: string[]) => {
    const deleted: string[] = []; const handlers: Record<string, (e: any) => void> = {};
    const self: any = { addEventListener: (n: string, f: any) => { handlers[n] = f; }, clients: { claim: async () => {} }, skipWaiting: () => {}, location: { origin: 'https://app.cloaktix.com' } };
    const caches = { keys: async () => names, delete: async (k: string) => { deleted.push(k); return true; }, open: async () => ({ addAll: async () => {}, put: async () => {} }), match: async () => undefined };
    vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, caches, URL, fetch: async () => new Response('') });
    let p: Promise<unknown> = Promise.resolve();
    handlers.activate({ waitUntil: (x: Promise<unknown>) => { p = x; } });
    await p; return deleted;
  };
  it('sw.js activate deletes old shell caches but keeps cloaktix-zk-v1', async () => {
    const names = ['cloaktix-shell-v0', 'cloaktix-shell-v1', 'cloaktix-zk-v1', 'cloaktix-zk-v2', 'other-app'];
    assert.deepEqual(await runActivate(names), ['cloaktix-shell-v0']);
  });
  it('swPolicy mirrors sw.js', async () => {
    const names = ['cloaktix-shell-v0', 'cloaktix-shell-v1', 'cloaktix-zk-v1', 'cloaktix-old', 'x'];
    assert.deepEqual(names.filter((n) => shouldDeleteCacheOnActivate(n)), await runActivate(names));
  });
  it('zk cache name used by zkFetch and the prover worker is exempt', () => {
    for (const f of ['../src/midnight/zkFetch.ts', '../src/midnight/zkirV3.worker.ts']) {
      const src = fs.readFileSync(new URL(f, import.meta.url), 'utf8');
      const name = src.match(/'(cloaktix-zk-[^']+)'/)![1];
      assert.equal(shouldDeleteCacheOnActivate(name), false, f);
    }
  });
});
