import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EventDoor, memoryKv } from '../src/egg40/eventDoor.ts';
import { EGG40_QUOTE_TTL_SEC, LIVE_V3_QUOTE_TTL_SEC } from '../src/rate/quoteTtl.ts';
import { MAX_QUOTE_AGE_EGG40 } from '../src/midnight/contract-egg40-meta.ts';
import { createMemoryRelay } from '../src/egg40/memoryRelay.ts';
import { generateNonExtractableP256, exportPublicKeyRaw, deviceTagFromPublicKey, signReserve, encryptNonceForOrganizer, generateNonExtractableEcdh, decryptNonceFromStaff } from '../src/egg40/deviceCrypto.ts';
import { createStaffRecord, memoryKeyStore, ensureOrganizerKeys } from '../src/egg40/keyStore.ts';
import { createLiveEgg40Api, memoryChain, type TicketRow } from '../src/egg40/live.ts';
import { encodeAdmitQr } from '../src/v2/admitCodec.ts';
import { SETTLE_BATCH_SIZE } from '../src/doorkeys/model.ts';
import { readFileSync } from 'node:fs';

const CONTRACT = 'ee'.repeat(32);
const EVENT = '2';

function schedule() {
  return { eventId: EVENT, eventName: 'Launch Night', doorsOpenAt: Date.now() - 3600_000, doorsCloseAt: Date.now() + 6 * 3600_000, doors: [
    { gateId: '1', name: 'Door 1', ticketTypes: ['General admission'], typeIds: ['1'] },
    { gateId: '2', name: 'Door 2', ticketTypes: ['VIP'], typeIds: ['2'] },
  ] };
}

function qr(serial: string, nonce = 'ab'.repeat(32)) {
  return encodeAdmitQr({ v: 2, networkId: 'preview', contract: CONTRACT, serial, epoch: '0', nonceHex: nonce });
}

function ticket(serial: string, over: Partial<TicketRow> = {}): TicketRow {
  return { serial, typeId: '1', eventId: EVENT, status: 0, hasAdmit: true, epoch: '0', typeName: 'General admission', ...over };
}

describe('EGG-40 quote TTL', () => {
  it('bundles 300 s with the new contract and leaves live v3 at 180 s', () => {
    assert.equal(LIVE_V3_QUOTE_TTL_SEC, 180);
    assert.equal(EGG40_QUOTE_TTL_SEC, 300);
    assert.equal(MAX_QUOTE_AGE_EGG40, 300n);
  });
  it('does not edit session-v3.ts', () => {
    const src = readFileSync(new URL('../src/midnight/session-v3.ts', import.meta.url), 'utf8');
    // file still present and not mentioning egg40 circuits
    assert.equal(src.includes('admitByDoor4'), false);
  });
});

describe('EGG-40 relay journal', () => {
  it('reserves a serial once and shows Already used on the second door', async () => {
    const relay = createMemoryRelay(CONTRACT);
    await relay.putSchedule(EVENT, schedule());
    const { staff, signKey, keyId, deviceTag, orgPub } = await staffDevice(relay, '1');
    const a = await reserve(relay, { signKey, keyId, deviceTag, orgPub, gateId: '1', serial: '12' });
    assert.equal(a.ok, true);
    const b = await reserve(relay, { signKey, keyId, deviceTag, orgPub, gateId: '1', serial: '12' });
    assert.equal(b.ok, false);
    if (!b.ok) assert.equal(b.reason, 'already-used');
    void staff;
  });

  it('refuses to invent an entry without an encrypted ticket secret or a valid device signature', async () => {
    const relay = createMemoryRelay(CONTRACT);
    await relay.putSchedule(EVENT, schedule());
    const dev = await staffDevice(relay, '1');
    const unsigned = await reserve(relay, { ...dev, gateId: '1', serial: '13', badSig: true });
    assert.equal(unsigned.ok, false);
    if (!unsigned.ok) assert.match(unsigned.reason, /signed|skipped|Missing/i);
    const noCipher = await relay.reserve(EVENT, {
      serial: '14', gateId: '1', keyId: dev.keyId, deviceTag: dev.deviceTag, at: Date.now(),
      typeName: 'General admission', cipher: { iv: '', ct: '', ephPub: '' }, prevHash: '0'.repeat(64), signature: 'aa'.repeat(64),
    });
    assert.equal(noCipher.ok, false);
    if (!noCipher.ok) assert.match(noCipher.reason, /Missing encrypted ticket secret/);
    // The relay still has no settleable entry for 13 or 14.
    const entries = await relay.entries(EVENT);
    assert.equal(entries.some(e => e.serial === '13' || e.serial === '14'), false);
  });

  it('imports missed signed entries after the relay was down', async () => {
    const relay = createMemoryRelay(CONTRACT);
    await relay.putSchedule(EVENT, schedule());
    const dev = await staffDevice(relay, '2');
    const req = await signedRequest(relay, { ...dev, gateId: '2', serial: '21' });
    await relay.offerMissed(EVENT, '2', 'Door 2', [req]);
    const missed = await relay.listMissed(EVENT);
    assert.equal(missed[0]?.count, 1);
    const imported = await relay.takeAndImportMissed(EVENT, '2');
    assert.equal(imported.imported, 1);
    assert.equal((await relay.entries(EVENT)).map(e => e.serial).join(), '21');
  });
});

describe('EGG-40 live API (memory relay, mocked calls)', () => {
  it('pairs a staff key, scans, blocks a second entry, refuses first entry when offline, and settles in batches of 4', async () => {
    const store = memoryKeyStore();
    const relay = createMemoryRelay(CONTRACT);
    await relay.putSchedule(EVENT, schedule());
    const tickets = ['31', '32', '33', '34', '35'].map(s => ticket(s));
    const chain = memoryChain(tickets);
    const calls: string[] = [];
    const api = await createLiveEgg40Api({
      contract: CONTRACT, relay, store, chain,
      call: async (circuit) => { calls.push(circuit); return { txId: `tx-${calls.length}` }; },
    });

    const org = await api.organizer; // warmup
    void org;
    const staffKey = await api.staff.createKey(2n, 1n);
    assert.equal(staffKey.request.contract, CONTRACT);
    assert.match(staffKey.fingerprint, /^[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$/);
    assert.equal(staffKey.code.startsWith('cloaktix:pair:v1?'), true);

    const preview = await api.organizer.previewPairing(2n, staffKey.code, { from: Date.now(), until: Date.now() + 3600_000 });
    assert.equal(preview.fingerprint, staffKey.fingerprint);
    await api.organizer.authorizeDoorKey(preview, () => {});
    assert.equal(calls.includes('authorizeDoorKey'), true);
    const st = await api.staff.keyState(staffKey);
    assert.equal(st.state, 'approved');

    const first = await api.staff.scan(staffKey, qr('31'));
    assert.equal(first.kind, 'valid');
    const second = await api.staff.scan(staffKey, qr('31'));
    assert.equal(second.kind, 'already-used');

    relay.setOffline(true);
    const offline = await api.staff.scan(staffKey, qr('32'));
    assert.equal(offline.kind, 'relay-offline');
    // Local already-used still works while the relay is down.
    const usedOffline = await api.staff.scan(staffKey, qr('31'));
    assert.equal(usedOffline.kind, 'already-used');
    relay.setOffline(false);

    // Remaining tickets for a batch of 4
    for (const s of ['32', '33', '34', '35']) {
      const r = await api.staff.scan(staffKey, qr(s));
      assert.equal(r.kind, 'valid', s);
    }
    await api.organizer.createSettlementKey(2n, () => {});
    const before = await api.organizer.settlement(2n);
    assert.ok(before.ready >= 4);
    const after = await api.organizer.settleNextBatch(2n, () => {});
    assert.equal(calls.some(c => c === 'admitByDoor4' || c === 'admitByDoor'), true);
    assert.ok(after.recorded >= Math.min(SETTLE_BATCH_SIZE, before.ready));
    assert.ok(after.recorded >= 4);
  });
});

async function staffDevice(relay: ReturnType<typeof createMemoryRelay>, gateId: string) {
  const orgPair = await generateNonExtractableEcdh();
  const orgPub = await exportPublicKeyRaw(orgPair.publicKey);
  await relay.putOrganizerCrypto(EVENT, orgPub, 'org');
  const sign = await generateNonExtractableP256();
  const publicKey = await exportPublicKeyRaw(sign.publicKey);
  const deviceTag = await deviceTagFromPublicKey(publicKey);
  const keyId = '11'.repeat(32);
  await relay.registerDevice(EVENT, { keyId, deviceTag, publicKey });
  await relay.authorizeKey(EVENT, { keyId, deviceTag, publicKey, gateId, validFrom: Date.now() - 1000, validUntil: Date.now() + 86_400_000, revoked: false, kind: 'staff' });
  return { staff: sign, signKey: sign.privateKey, keyId, deviceTag, orgPub, orgPriv: orgPair.privateKey };
}

async function signedRequest(relay: ReturnType<typeof createMemoryRelay>, opts: { signKey: CryptoKey; keyId: string; deviceTag: string; orgPub: string; gateId: string; serial: string; badSig?: boolean; }) {
  const nonce = new Uint8Array(32).fill(7);
  const cipher = await encryptNonceForOrganizer(nonce, opts.orgPub);
  const unsigned = { serial: opts.serial, gateId: opts.gateId, keyId: opts.keyId, deviceTag: opts.deviceTag, at: Date.now(), typeName: 'General admission', cipher, prevHash: '0'.repeat(64) };
  const signature = opts.badSig ? 'bb'.repeat(64) : await signReserve(opts.signKey, CONTRACT, EVENT, unsigned);
  return { ...unsigned, signature };
}

async function reserve(relay: ReturnType<typeof createMemoryRelay>, opts: Parameters<typeof signedRequest>[1]) {
  return relay.reserve(EVENT, await signedRequest(relay, opts));
}

void createStaffRecord;
void memoryKeyStore;
void ensureOrganizerKeys;
void decryptNonceFromStaff;
