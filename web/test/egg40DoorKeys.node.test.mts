import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  FINGERPRINT_ALPHABET, MAX_DOOR_KEY_MS, approvalsLeft, batchesTotal, currentBatch, defaultKeyWindow, doorsOpen, encodePairingCode,
  keyWindowError, pairingFingerprint, parsePairingCode, settledCount, settlementDone, splitKeys, type DoorKeyRow, type DoorSchedule, type SettlementState,
} from '../src/doorkeys/model.ts';

const H = 3_600_000;
const C = 'ab'.repeat(32);
const REQ = { v: 1 as const, contract: C, eventId: 3n, gateId: 2n, keyId: '5a'.repeat(32), deviceTag: 'd7'.repeat(32) };
const SCHEDULE: DoorSchedule = { eventId: 3n, eventName: 'Launch Night', doorsOpenAt: 100 * H, doorsCloseAt: 107 * H, doors: [] };
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p: string) => readFileSync(join(root, 'src', p), 'utf8');

describe('EGG-40 door key window', () => {
  it('defaults to doors open minus 1 h and doors close plus 24 h, under 48 h', () => {
    const w = defaultKeyWindow(SCHEDULE);
    assert.equal(w.from, 99 * H);
    assert.equal(w.until, 131 * H);
    assert.equal(keyWindowError(w.from, w.until, 98 * H), null);
  });
  it('caps the default at 48 h for long events', () => {
    const w = defaultKeyWindow({ ...SCHEDULE, doorsCloseAt: 140 * H });
    assert.equal(w.until - w.from, MAX_DOOR_KEY_MS);
  });
  it('mirrors the circuit guards with the spec copy', () => {
    assert.equal(keyWindowError(0, MAX_DOOR_KEY_MS + 60_000, 0), 'A door key can last 48 hours at most.');
    assert.equal(keyWindowError(0, MAX_DOOR_KEY_MS, -1), null);
    assert.equal(keyWindowError(5 * H, 5 * H, 0), 'Valid until must be after Valid from.');
    assert.equal(keyWindowError(0, H, 2 * H), 'This time window has already ended.');
    assert.equal(keyWindowError(Number.NaN, H, 0), 'Choose both dates.');
  });
});

describe('EGG-40 pairing code', () => {
  it('round-trips the public values only', () => {
    const code = encodePairingCode(REQ);
    assert.match(code, /^cloaktix:pair:v1\?/);
    assert.deepEqual(parsePairingCode(code, { contract: C, eventId: 3n }), { ok: true, request: REQ });
    assert.deepEqual(Object.keys(Object.fromEntries(new URLSearchParams(code.split('?')[1]))).sort(), ['c', 'd', 'e', 'g', 'k']);
  });
  it('refuses other events, other contracts and malformed codes', () => {
    const code = encodePairingCode(REQ);
    assert.deepEqual(parsePairingCode(code, { contract: C, eventId: 4n }), { ok: false, error: 'This code is for another event.' });
    assert.deepEqual(parsePairingCode(code, { contract: 'cd'.repeat(32), eventId: 3n }), { ok: false, error: 'This code is for another event.' });
    for (const bad of ['hello', code.replace('&g=2', '&g=0'), code.replace('k=5a', 'k=zz'), encodePairingCode({ ...REQ, keyId: '0'.repeat(64) })]) {
      assert.deepEqual(parsePairingCode(bad, { contract: C, eventId: 3n }), { ok: false, error: 'Code not recognized.' });
    }
  });
  it('derives a stable 6-character fingerprint without 0, O, 1 or I', async () => {
    const a = await pairingFingerprint(REQ, 'org-key');
    assert.match(a, /^[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$/);
    assert.equal(a, await pairingFingerprint(REQ, 'org-key'));
    assert.notEqual(a, await pairingFingerprint({ ...REQ, gateId: 3n }, 'org-key'));
    assert.notEqual(a, await pairingFingerprint(REQ, 'other-organizer-key'));
    assert.equal(FINGERPRINT_ALPHABET.length, 32);
    assert.doesNotMatch(FINGERPRINT_ALPHABET, /[01OI]/);
  });
});

describe('EGG-40 key list and settlement', () => {
  const key = (over: Partial<DoorKeyRow>): DoorKeyRow => ({ keyId: 'k', kind: 'staff', gateId: 1n, doorName: 'Door 1', fingerprint: '7KQ-4MD', validFrom: 0, validUntil: 10 * H, revoked: false, entries: 0, ...over });
  it('hides expired and revoked keys, settlement key first', () => {
    const { active, expired } = splitKeys([key({ keyId: 'a', gateId: 2n }), key({ keyId: 's', kind: 'settlement', gateId: 99n }), key({ keyId: 'x', validUntil: H }), key({ keyId: 'r', revoked: true })], 5 * H);
    assert.deepEqual(active.map(k => k.keyId), ['s', 'a']);
    assert.deepEqual(expired.map(k => k.keyId), ['x']);
  });
  it('counts batches of 4, approvals left and progress like the spec example', () => {
    const s: SettlementState = { total: 200, doorCount: 3, ready: 198, recorded: 36, failures: [], keyUntil: 0 };
    assert.equal(batchesTotal(s), 50);
    assert.equal(currentBatch(s), 10);
    assert.equal(approvalsLeft(s), 41);
    assert.equal(settlementDone(s), false);
    assert.equal(settlementDone({ ...s, recorded: 198 }), true);
    assert.equal(settledCount({ ...s, failures: [{ serial: '1', doorName: 'Door 1', reason: 'already-recorded' }] }), 37);
  });
  it('treats an event as open from the doors-open time', () => {
    assert.equal(doorsOpen(SCHEDULE, 100 * H - 1), false);
    assert.equal(doorsOpen(SCHEDULE, 100 * H), true);
    assert.equal(doorsOpen(null, 100 * H), false);
  });
});

describe('EGG-40 wiring', () => {
  it('portals full-screen staff layers to document.body (backdrop-filter containing block, EGG-38)', () => {
    assert.match(src('doorkeys/shared.tsx'), /createPortal\(node, document\.body\)/);
    assert.match(src('doorkeys/StaffDoor.tsx'), /<FullScreen label="Waiting for organizer approval"/);
  });
  it('keeps the mock behind one build-time flag', () => {
    const api = src('doorkeys/api.ts');
    assert.match(api, /import\.meta\.env\.VITE_EGG40_MOCK === '1'\s*\?\s*import\('\.\.\/mocks\/egg40'\)/);
    for (const f of ['App.tsx', 'v2/TicketsGateV2.tsx', 'doorkeys/OrganizerDoors.tsx', 'doorkeys/StaffDoor.tsx', 'doorkeys/SettleEntries.tsx', 'doorkeys/hooks.ts']) assert.doesNotMatch(src(f), /mocks\/egg40/, f);
  });
  it('never puts wallet prompts on the walletless staff screen', () => {
    assert.doesNotMatch(src('doorkeys/StaffDoor.tsx'), /s\.call\(|PENDING_WALLET|Approve in your wallet|Connect wallet/);
  });
});
