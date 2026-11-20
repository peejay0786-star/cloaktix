/**
 * Public catalog verification must decode the EGG-40 ledger. EGG-40 keeps schemaVersion 3, and the v3 decoder
 * read its state as empty maps, so every Launch Night listing write was refused as "not indexed yet".
 * Fixtures: indexed Preview states (EGG-40 7f6481e3…d372 with event 1 + key event 2, types 1-2; live v3 b927…ab04e).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { register } from 'node:module';

// Same single compact-runtime the Vite and wrangler aliases force (managed-zk is a symlink with its own node_modules).
const RT = new URL('../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnight-ntwrk/compact-runtime') return { url: ${JSON.stringify(RT)}, shortCircuit: true };
  return n(s, c); }`));
const { decodeCatalogState } = await import('../src/catalog/chainDecoder.ts');
const { createSqlCatalog } = await import('../../preview-worker/catalog-store.js');
const { DatabaseSync } = await import('node:sqlite');
// Durable Object SQL shape (exec(...).toArray()/.one()) over an in-memory SQLite.
function doSql() {
  const db = new DatabaseSync(':memory:');
  return { exec(q: string, ...b: unknown[]) {
    const parts = q.split(';').map(x => x.trim()).filter(Boolean);
    let rows: any[] = [];
    for (const part of parts) { const st = db.prepare(part); rows = /^select/i.test(part) ? st.all(...(b as any[])) : (st.run(...(b as any[])), []); }
    return { toArray: () => rows, one: () => rows[0] };
  } };
}
async function signedWrite(kind: 'ev' | 'tt', id: string, v: unknown) {
  const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const pk = Buffer.from(await crypto.subtle.exportKey('raw', kp.publicKey)).toString('hex');
  const j: any = { c: '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372', kind, id, ts: Date.now(), pk, v };
  const msg = `cloaktix:meta:v1|${j.c}|${j.kind}|${j.id}|${j.ts}|${JSON.stringify(j.v)}`;
  j.sig = Buffer.from(await crypto.subtle.sign('Ed25519', kp.privateKey, new TextEncoder().encode(msg))).toString('hex');
  return j;
}
const fx = (n: string) => fs.readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8').trim();

describe('catalog chain decoder', { skip: !fs.existsSync(new URL('./fixtures/egg40-launch-night-state.hex', import.meta.url)) && 'needs a local snapshot of the live contract state (not published: it holds on-chain addresses)' }, () => {
  it('reads EGG-40 events and ticket types', () => {
    const s = decodeCatalogState(fx('egg40-launch-night-state.hex'));
    assert.deepEqual([...s.events.keys()].sort(), ['1', '2']);
    assert.equal(s.types.get('1')?.eventId, '1');
    assert.equal(s.types.get('2')?.eventId, '1');
    assert.equal(s.events.get('1')?.organizer, s.events.get('2')?.organizer);
  });
  it('still reads the live v3 contract with the v3 layout', () => {
    const s = decodeCatalogState(fx('v3-live-state.hex'));
    assert.deepEqual([...s.events.keys()].sort(), ['1', '2', '3']);
    assert.equal(s.types.get('4')?.eventId, '3');
    assert.equal(s.types.get('5')?.eventId, '3');
  });
  it('a Save details write for EGG-40 event 1 now reaches the organizer-key check instead of "not indexed" (404)', async () => {
    const store = createSqlCatalog(doSql(), decodeCatalogState);
    const ev = await signedWrite('ev', '1', { name: 'CloakTix Launch Night', date: '2026-12-12', venue: 'Montréal, QC', description: 'A private launch night for CloakTix.', cover: '/art/signal-room.webp', demoArt: 'true' });
    const r = await store.publish(ev, fx('egg40-launch-night-state.hex'));
    assert.equal(r.status, 403, JSON.stringify(r.body)); // random test key: not the organizer's registered key event (2)
    assert.match(r.body.error, /not registered/);
    const tt = await signedWrite('tt', '1', { name: 'General admission', usdCents: '5000', resaleSummary: 'Capped resale, maximum $75.00 USD' });
    assert.equal((await store.publish(tt, fx('egg40-launch-night-state.hex'))).status, 403);
  });
});
