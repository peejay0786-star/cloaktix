/**
 * EGG-45: ticket #1 scanned at Main door showed "Not valid / This copy was replaced". The QR and its admit commit
 * are fine. The staff key on-chain starts at doors (Dec 12, 2026 18:00 ET); the relay refused "Door key not yet
 * valid" and the phone showed every relay refusal as "replaced". Real on-chain state for ticket #1 and key window.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { register } from 'node:module';
const RT = new URL('../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnight-ntwrk/compact-runtime') return { url: ${JSON.stringify(RT)}, shortCircuit: true };
  return n(s, c); }`));
const { createLiveEgg40Api } = await import('../src/egg40/live.ts');
const { createMemoryRelay } = await import('../src/egg40/memoryRelay.ts');
const { memoryKeyStore } = await import('../src/egg40/keyStore.ts');
const { indexerTicketChain } = await import('../src/egg40/ticketChain.ts');
const { encodeAdmitQr } = await import('../src/v2/admitCodec.ts');
const { decodeTicketState } = await import('../src/egg40/chainDoorState.ts');
const { createRequire } = await import('node:module');
const { mkdtempSync, rmSync } = await import('node:fs');
const ROOT = new URL('../', import.meta.url).pathname;
const TMP = mkdtempSync(ROOT + '.egg45-');
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));
createRequire(ROOT + 'package.json')('esbuild').buildSync({ entryPoints: [ROOT + 'src/doorkeys/shared.tsx'], bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', logLevel: 'silent', outfile: TMP + '/shared.mjs' });
const { scanVerdictCopy } = await import(TMP + '/shared.mjs');
const { networkTagBytes } = await import('../src/midnight/schema.ts');
const egg40: any = await import('../../contract/managed/cloaktix-egg40/contract/index.js');
const v3: any = await import('../../contract/managed/cloaktix-rate-v3/contract/index.js');
const rt: any = await import(RT);

const C = '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372';
const STATE_FILE = new URL('./fixtures/egg40-ticket1-state.hex', import.meta.url);
const HAS_STATE = fs.existsSync(STATE_FILE);
const STATE = HAS_STATE ? fs.readFileSync(STATE_FILE, 'utf8').trim() : '';
const META = { tt: { '1': { name: 'General admission' }, '2': { name: 'After party' } } };
// Launch Night door key window as on-chain for gate 1 (validFrom / validUntil, seconds).
const KEY_FROM = Date.parse('2026-12-12T18:00:00-05:00');
const KEY_UNTIL = Date.parse('2026-12-13T23:00:00-05:00');
const TODAY = Date.parse('2026-11-19T20:53:00-05:00');
const DOORS = Date.parse('2026-12-12T19:30:00-05:00');
const nonce = 'cd'.repeat(32);
const qr = encodeAdmitQr({ v: 2, networkId: 'preview', contract: C, serial: '1', epoch: '1', nonceHex: nonce });

function chain() {
  const fetcher = (async (url: string) => String(url).includes('/meta') ? Response.json(META) : Response.json({ data: { contractAction: { state: STATE } } })) as typeof fetch;
  return indexerTicketChain({ contract: C, indexerUrl: 'https://app.test/indexer?u=x', metaUrl: 'https://app.test/meta?c=' + C, decode: decodeTicketState, fetcher, ttlMs: 0, minFreshMs: 0 });
}
async function launchNightPhone(clock: { t: number }) {
  const now = () => clock.t;
  const relay = createMemoryRelay(C, { now });
  await relay.putSchedule('1', { eventId: '1', eventName: 'CloakTix Launch Night', doorsOpenAt: Date.parse('2026-12-12T20:00:00-05:00'), doorsCloseAt: Date.parse('2026-12-13T02:00:00-05:00'), doors: [{ gateId: '1', name: 'Main door', ticketTypes: [], typeIds: [] }] } as any);
  const ch = chain();
  const org = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain: ch, now, call: async () => ({ txId: 'tx' }), sleep: async () => {} });
  const staff = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain: ch, now });
  const key = await staff.staff.createKey(1n, 1n);
  const preview = await org.organizer.previewPairing(1n, key.code, { from: KEY_FROM, until: KEY_UNTIL });
  await org.organizer.authorizeDoorKey(preview, () => {});
  return { relay, staff, key };
}

describe('EGG-45 the ticket QR is fine', { skip: !HAS_STATE && 'needs a local snapshot of the live contract state (not published: it holds on-chain addresses)' }, () => {
  it('buy (session-v3 admitCommitOf) and the EGG-40 contract use the same commitment; on-chain networkTag is "preview"', () => {
    const L = egg40.ledger(rt.ContractState.deserialize(Buffer.from(STATE, 'hex')).data);
    assert.deepEqual(Buffer.from(L.networkTag), Buffer.from(networkTagBytes('preview')));
    const t = L.tickets.lookup(1n);
    assert.equal(t.epoch, 1n); assert.equal(t.hasAdmit, true); assert.equal(Number(t.status), 0);
    const ck = new Uint8Array(32).fill(7), n = new Uint8Array(32).fill(9);
    assert.deepEqual(Buffer.from(v3.pureCircuits.admitCommitOf(networkTagBytes('preview'), ck, 1n, 1n, n)), Buffer.from(egg40.pureCircuits.admitCommitOf(networkTagBytes('preview'), ck, 1n, 1n, n)));
  });
});

describe('EGG-45 staff key window (real Launch Night key: Dec 12 18:00 to Dec 13 23:00 ET)', { skip: !HAS_STATE && 'needs a local snapshot of the live contract state (not published: it holds on-chain addresses)' }, () => {
  it('REPRO: today the relay refuses "Door key not yet valid" (this used to be shown as "replaced")', async () => {
    const clock = { t: TODAY };
    const { relay, key } = await launchNightPhone(clock);
    const k = await relay.getKey('1', key.request.keyId);
    assert.equal(k!.validFrom, KEY_FROM);
    const r: any = await relay.reserve('1', { serial: '1', gateId: '1', keyId: key.request.keyId, deviceTag: key.request.deviceTag, at: TODAY, typeName: 'x', cipher: { iv: 'aa', ct: 'aa', ephPub: 'aa' }, prevHash: '0'.repeat(64), signature: 'aa' } as any);
    assert.equal(r.reason, 'Door key not yet valid');
  });

  it('FIX: today the phone says Door not open yet (ticket checks out), records nothing; on Dec 12 it is Valid, then Already used', async () => {
    const clock = { t: TODAY };
    const { staff, key } = await launchNightPhone(clock);
    const early = await staff.staff.scan(key, qr);
    assert.deepEqual(early, { kind: 'key-not-yet-valid', opensAt: KEY_FROM, typeName: 'General admission' });
    const copy = scanVerdictCopy(early);
    assert.equal(copy.title, 'Door not open yet');
    assert.doesNotMatch(copy.detail, /replaced/);
    assert.match(copy.detail, /Nothing was recorded/);
    assert.equal((await staff.staff.localEntries(key)).count, 0);
    const state = await staff.staff.keyState(key);
    assert.deepEqual(state, { state: 'approved', validUntil: KEY_UNTIL, validFrom: KEY_FROM });
    clock.t = DOORS;
    assert.deepEqual(await staff.staff.scan(key, qr), { kind: 'valid', typeName: 'General admission' });
    assert.equal((await staff.staff.scan(key, qr)).kind, 'already-used');
  });

  it('after the window: key-expired, not replaced', async () => {
    const clock = { t: TODAY };
    const { staff, key } = await launchNightPhone(clock);
    clock.t = KEY_UNTIL + 1000;
    assert.equal((await staff.staff.scan(key, qr)).kind, 'key-expired');
  });

  it('a relay refusal unrelated to the ticket is shown with its reason, never as "replaced"', () => {
    const c = scanVerdictCopy({ kind: 'refused', reason: 'Door key is not approved' });
    assert.equal(c.title, "Can't record entry");
    assert.match(c.detail, /^Door key is not approved\. Nothing was recorded\.$/);
    const src = fs.readFileSync(new URL('../src/egg40/live.ts', import.meta.url), 'utf8');
    const scan = src.slice(src.indexOf('async scan(key, ticketCode)'));
    assert.doesNotMatch(scan.slice(scan.indexOf('relay.reserve')), /return \{ kind: 'replaced' \}/);
  });
});
