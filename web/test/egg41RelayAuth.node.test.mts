/**
 * EGG-41: door relay write authorization, through the exact HTTP routes the Worker serves (door-relay/src/routes.ts).
 * Chain = fake EGG-40 snapshot (events + doorKeys) that the test mutates like authorizeDoorKey / revokeDoorKey would.
 * Nothing touches a network, a wallet or a deployed relay.
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import fs from 'node:fs';
import { register } from 'node:module';
import { EventDoor, memoryKv, type DoorKv } from '../src/egg40/eventDoor.ts';
import { createHttpRelay } from '../src/egg40/httpRelay.ts';
import { createLiveEgg40Api, memoryChain, type TicketRow } from '../src/egg40/live.ts';
import { memoryKeyStore } from '../src/egg40/keyStore.ts';
import { signOrgWrite, signRegister, organizerKeyBound, type DoorChainSnapshot, type OrgSigner, type ChainDoorKey } from '../src/egg40/relayAuth.ts';
import { generateNonExtractableP256, exportPublicKeyRaw, deviceTagFromPublicKey, signReserve, encryptNonceForOrganizer, generateNonExtractableEcdh } from '../src/egg40/deviceCrypto.ts';
import { bytesToHex } from '../src/egg40/relayProtocol.ts';
import { encodeAdmitQr } from '../src/v2/admitCodec.ts';
import { routeDoor, type RelayEnv } from '../../door-relay/src/routes.ts';

const CONTRACT = '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372';
const EVENT = '1';
const ORG = 'aa'.repeat(32), OTHER_ORG = 'bb'.repeat(32);
const env: RelayEnv = { EGG40_CONTRACT: CONTRACT, INDEXER_URL: 'http://indexer.test/graphql', ALLOWED_ORIGIN: 'https://app.cloaktix.com' };
const BASE = 'http://relay.test';
const H = 3_600_000;

async function ed25519(): Promise<{ pk: string; signer: OrgSigner }> {
  const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const pk = bytesToHex(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)));
  return { pk, signer: async (m) => ({ pk, sig: bytesToHex(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, kp.privateKey, new TextEncoder().encode(m)))) }) };
}

type World = Awaited<ReturnType<typeof world>>;
async function world() {
  const organizer = await ed25519();
  const attacker = await ed25519();        // knows only contract + event id; has its own key event as another organizer
  const snap: DoorChainSnapshot = {
    events: new Map([
      ['1', { organizer: ORG, payout: 'cd'.repeat(32) }],      // Launch Night (real NIGHT payout)
      ['2', { organizer: ORG, payout: organizer.pk }],         // organizer key event (catalog binding)
      ['3', { organizer: OTHER_ORG, payout: attacker.pk }],    // attacker's own key event
    ]),
    doorKeys: new Map<string, ChainDoorKey>(),
  };
  const state = { down: false, reads: 0 };
  const chain = async () => { state.reads++; if (state.down) throw new Error('indexer down'); return snap; };
  const stores = new Map<string, DoorKv>();
  const door = (c: string, e: string) => { const k = `${c}:${e}`; if (!stores.has(k)) stores.set(k, memoryKv()); return new EventDoor(c, e, stores.get(k)!, { chain }); };
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith('/health')) return Response.json({ ok: true });
    return routeDoor(new Request(u, init), env, door);
  }) as typeof fetch;
  const raw = (path: string, method: string, body?: unknown) => fetcher(`${BASE}/events/${CONTRACT}/${EVENT}${path}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const kv = () => stores.get(`${CONTRACT}:${EVENT}`) ?? memoryKv();
  return { organizer, attacker, snap, state, fetcher, raw, kv };
}

function schedule() {
  return { eventId: EVENT, eventName: 'CloakTix Launch Night', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 6 * H, doors: [{ gateId: '1', name: 'Main door', ticketTypes: [], typeIds: [] }] };
}
async function orgBody(w: World, signer: OrgSigner, action: Parameters<typeof signOrgWrite>[3], payload: unknown, ts = Date.now()) {
  return signOrgWrite(signer, CONTRACT, EVENT, action, payload, ts);
}
/** A staff phone that registered with proof, plus its on-chain door key (as authorizeDoorKey would write it). */
async function staffOnChain(w: World, gateId = '1', onChain = true) {
  const sign = await generateNonExtractableP256();
  const publicKey = await exportPublicKeyRaw(sign.publicKey);
  const deviceTag = await deviceTagFromPublicKey(publicKey);
  const keyId = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const ts = Date.now();
  const reg = await w.raw('/devices', 'POST', { keyId, deviceTag, publicKey, ts, signature: await signRegister(sign.privateKey, CONTRACT, EVENT, keyId, deviceTag, ts) });
  assert.equal(reg.status, 200, await reg.clone().text());
  const validFrom = Math.floor((Date.now() - H) / 1000) * 1000, validUntil = Math.floor((Date.now() + 10 * H) / 1000) * 1000;
  if (onChain) w.snap.doorKeys.set(keyId, { eventId: EVENT, gateId, deviceTag, validFrom: validFrom / 1000, validUntil: validUntil / 1000, active: true });
  const key = { keyId, deviceTag, publicKey: '', gateId, validFrom, validUntil, revoked: false, kind: 'staff' as const };
  return { sign, publicKey, deviceTag, keyId, key };
}
async function approve(w: World, s: Awaited<ReturnType<typeof staffOnChain>>) {
  const r = await w.raw('/keys', 'PUT', await orgBody(w, w.organizer.signer, 'authorize-key', s.key));
  assert.equal(r.status, 200, await r.clone().text());
}
async function entry(s: Awaited<ReturnType<typeof staffOnChain>>, orgPub: string, serial: string, at = Date.now(), gateId = s.key.gateId) {
  const cipher = await encryptNonceForOrganizer(new Uint8Array(32).fill(7), orgPub);
  const unsigned = { serial, gateId, keyId: s.keyId, deviceTag: s.deviceTag, at, typeName: 'General admission', cipher, prevHash: '0'.repeat(64) };
  return { ...unsigned, signature: await signReserve(s.sign.privateKey, CONTRACT, EVENT, unsigned) };
}
async function setUp(w: World) {
  assert.equal((await w.raw('/schedule', 'PUT', await orgBody(w, w.organizer.signer, 'schedule', schedule()))).status, 200);
  const ecdh = await generateNonExtractableEcdh();
  const orgPub = await exportPublicKeyRaw(ecdh.publicKey);
  assert.equal((await w.raw('/organizer-crypto', 'PUT', await orgBody(w, w.organizer.signer, 'organizer-crypto', { publicKey: orgPub, fingerprint: 'fp' }))).status, 200);
  return { orgPub };
}
const reason = async (r: Response) => ((await r.json()) as any).reason as string;

describe('EGG-41 relay: an attacker who knows only the contract and event id', () => {
  let w: World;
  beforeEach(async () => { w = await world(); });

  it('is rejected on every organizer route, unsigned or signed with a key not bound to this organizer', async () => {
    const { orgPub } = await setUp(w);
    const victim = await staffOnChain(w);
    await approve(w, victim);
    const before = JSON.stringify(await (await w.raw('/schedule', 'GET')).json()) + JSON.stringify(await (await w.raw('/keys', 'GET')).json()) + JSON.stringify(await (await w.raw('/organizer-crypto', 'GET')).json());
    const evilSchedule = { ...schedule(), doors: [{ gateId: '1', name: 'Fake door', ticketTypes: [], typeIds: [] }] };
    const routes: Array<[string, string, Parameters<typeof signOrgWrite>[3], unknown]> = [
      ['/schedule', 'PUT', 'schedule', evilSchedule],
      ['/mode', 'PUT', 'mode', { mode: 'walletless' }],
      ['/organizer-crypto', 'PUT', 'organizer-crypto', { publicKey: orgPub.replace(/^04../, '04ff'), fingerprint: 'evil' }],
      ['/keys', 'PUT', 'authorize-key', { ...victim.key, keyId: 'ab'.repeat(32) }],
      [`/keys/${victim.keyId}/revoke`, 'POST', `revoke-key:${victim.keyId}`, { keyId: victim.keyId }],
      ['/import', 'POST', 'import', { entries: [] }],
      ['/missed/1/import', 'POST', 'import-missed:1', { gateId: '1' }],
    ];
    for (const [path, method, action, payload] of routes) {
      const unsigned = await w.raw(path, method, payload);
      assert.equal(unsigned.status, 401, `${path} unsigned -> ${unsigned.status}`);
      const noAuth = await w.raw(path, method, { payload });
      assert.equal(noAuth.status, 401, `${path} no auth -> ${noAuth.status}`);
      const evil = await w.raw(path, method, await orgBody(w, w.attacker.signer, action, payload));
      assert.equal(evil.status, 403, `${path} attacker key -> ${evil.status}`);
      assert.match(await reason(evil), /not registered on-chain/);
      // The organizer's signature over a different body does not carry over (body digest is signed).
      const good = await orgBody(w, w.organizer.signer, action, { other: true });
      const swapped = await w.raw(path, method, { payload, auth: good.auth });
      assert.equal(swapped.status, 401, `${path} swapped body -> ${swapped.status}`);
    }
    const after = JSON.stringify(await (await w.raw('/schedule', 'GET')).json()) + JSON.stringify(await (await w.raw('/keys', 'GET')).json()) + JSON.stringify(await (await w.raw('/organizer-crypto', 'GET')).json());
    assert.equal(after, before, 'relay state must be unchanged');
  });

  it('cannot approve a door key that is not on-chain, nor one whose device, door or window differs', async () => {
    await setUp(w);
    const off = await staffOnChain(w, '1', false);
    const r = await w.raw('/keys', 'PUT', await orgBody(w, w.organizer.signer, 'authorize-key', off.key));
    assert.equal(r.status, 409); assert.match(await reason(r), /not on-chain yet/);
    const s = await staffOnChain(w);
    for (const bad of [{ gateId: '2' }, { validUntil: s.key.validUntil + 60_000 }, { kind: 'settlement' as const }]) {
      const x = await w.raw('/keys', 'PUT', await orgBody(w, w.organizer.signer, 'authorize-key', { ...s.key, ...bad }));
      assert.equal(x.status, 403, JSON.stringify(bad));
    }
    // A key on-chain for another event is refused too.
    w.snap.doorKeys.set(s.keyId, { ...w.snap.doorKeys.get(s.keyId)!, eventId: '9' });
    assert.equal((await w.raw('/keys', 'PUT', await orgBody(w, w.organizer.signer, 'authorize-key', s.key))).status, 403);
    assert.equal(((await (await w.raw('/keys', 'GET')).json()) as any).keys.length, 0);
  });

  it('cannot register a phone without holding its private key, nor take over a pending code', async () => {
    const sign = await generateNonExtractableP256();
    const publicKey = await exportPublicKeyRaw(sign.publicKey);
    const deviceTag = await deviceTagFromPublicKey(publicKey);
    const keyId = '5a'.repeat(32);
    assert.equal((await w.raw('/devices', 'POST', { keyId, deviceTag, publicKey })).status, 401);
    const other = await generateNonExtractableP256();
    const ts = Date.now();
    assert.equal((await w.raw('/devices', 'POST', { keyId, deviceTag, publicKey, ts, signature: await signRegister(other.privateKey, CONTRACT, EVENT, keyId, deviceTag, ts) })).status, 401);
    assert.equal((await w.raw('/devices', 'POST', { keyId, deviceTag, publicKey, ts, signature: await signRegister(sign.privateKey, CONTRACT, EVENT, keyId, deviceTag, ts) })).status, 200);
    // Attacker registers its own phone under the same code: refused, first registration stays.
    const evil = await generateNonExtractableP256();
    const evilPub = await exportPublicKeyRaw(evil.publicKey), evilTag = await deviceTagFromPublicKey(evilPub);
    const r = await w.raw('/devices', 'POST', { keyId, deviceTag: evilTag, publicKey: evilPub, ts, signature: await signRegister(evil.privateKey, CONTRACT, EVENT, keyId, evilTag, ts) });
    assert.equal(r.status, 409);
  });

  it('cannot mark tickets used: forged, unapproved, revoked-on-chain, settlement-gate or out-of-window entries are refused', async () => {
    const { orgPub } = await setUp(w);
    const s = await staffOnChain(w);
    // Not approved on the relay yet.
    let r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '41'));
    assert.equal(r.status, 400); assert.match(await reason(r), /not approved/);
    await approve(w, s);
    // Forged signature.
    const forged = { ...(await entry(s, orgPub, '42')), signature: 'bb'.repeat(64) };
    r = await w.raw('/reserve', 'POST', forged); assert.equal(r.status, 400); assert.match(await reason(r), /not signed/);
    // An attacker's own key, never authorized on-chain.
    const evil = await staffOnChain(w, '1', false);
    r = await w.raw('/reserve', 'POST', await entry(evil, orgPub, '43')); assert.equal(r.status, 400);
    // Stale timestamp (replayed old scan) and future timestamp.
    r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '44', Date.now() - 10 * 60_000)); assert.match(await reason(r), /outside the allowed window/);
    // Settlement gate cannot record entries.
    w.snap.doorKeys.set(s.keyId, { ...w.snap.doorKeys.get(s.keyId)!, gateId: '99' });
    r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '45', Date.now(), '1')); assert.equal(r.status, 400);
    w.snap.doorKeys.set(s.keyId, { ...w.snap.doorKeys.get(s.keyId)!, gateId: '1' });
    // Revoked on-chain (revokeDoorKey) takes effect even before the relay is told.
    w.snap.doorKeys.set(s.keyId, { ...w.snap.doorKeys.get(s.keyId)!, active: false });
    r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '46')); assert.match(await reason(r), /revoked on-chain/);
    // Missed-entry offers keep only entries signed by an approved on-chain key.
    r = await w.raw('/missed', 'POST', { gateId: '1', doorName: 'x', entries: [forged] }); assert.equal(r.status, 403);
    const entries = ((await (await w.raw('/entries', 'GET')).json()) as any).entries;
    assert.equal(entries.length, 0, 'no ticket was marked used');
  });
});

describe('EGG-41 relay: valid organizer and door flows', () => {
  it('organizer sets doors and approves a phone; the phone records one entry; replays are refused', async () => {
    const w = await world();
    const { orgPub } = await setUp(w);
    const s = await staffOnChain(w);
    await approve(w, s);
    const e1 = await entry(s, orgPub, '51');
    let r = await w.raw('/reserve', 'POST', e1); assert.equal(r.status, 200, await r.clone().text());
    r = await w.raw('/reserve', 'POST', e1); assert.equal(r.status, 409); assert.equal(await reason(r), 'replay');
    r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '51')); assert.equal(r.status, 409); assert.equal(await reason(r), 'already-used');
    // Organizer write replay: the same signed request twice.
    const signed = await orgBody(w, w.organizer.signer, 'mode', { mode: 'walletless' });
    assert.equal((await w.raw('/mode', 'PUT', signed)).status, 200);
    assert.equal((await w.raw('/mode', 'PUT', signed)).status, 409);
    // Expired organizer request (captured 6 minutes ago).
    assert.equal((await w.raw('/mode', 'PUT', await orgBody(w, w.organizer.signer, 'mode', { mode: 'walletless' }, Date.now() - 6 * 60_000))).status, 401);
    // Organizer revokes on the relay (key on-chain for this event): next scan refused.
    assert.equal((await w.raw(`/keys/${s.keyId}/revoke`, 'POST', await orgBody(w, w.organizer.signer, `revoke-key:${s.keyId}`, { keyId: s.keyId }))).status, 200);
    r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '52')); assert.match(await reason(r), /not approved/);
  });

  it('imports entries a phone recorded while the relay missed them, organizer-signed, only within the key window', async () => {
    const w = await world();
    const { orgPub } = await setUp(w);
    const s = await staffOnChain(w);
    await approve(w, s);
    const old = await entry(s, orgPub, '61', Date.now() - 30 * 60_000);
    const tooOld = await entry(s, orgPub, '62', Date.now() - 2 * H);   // before validFrom
    assert.equal((await w.raw('/missed', 'POST', { gateId: '1', doorName: 'Main door', entries: [old, tooOld] })).status, 200);
    assert.equal(((await (await w.raw('/missed', 'GET')).json()) as any).missed[0].count, 1);
    assert.equal((await w.raw('/missed/1/import', 'POST', { payload: { gateId: '1' } })).status, 401);
    const r = await w.raw('/missed/1/import', 'POST', await orgBody(w, w.organizer.signer, 'import-missed:1', { gateId: '1' }));
    assert.equal(r.status, 200); const j: any = await r.json(); assert.equal(j.imported, 1);
  });

  it('fails closed when the indexer is unreachable: nothing changes', async () => {
    const w = await world();
    const { orgPub } = await setUp(w);
    const s = await staffOnChain(w);
    await approve(w, s);
    w.state.down = true;
    for (const [path, method, action, payload] of [
      ['/schedule', 'PUT', 'schedule', schedule()], ['/mode', 'PUT', 'mode', { mode: 'walletless' }],
      [`/keys/${s.keyId}/revoke`, 'POST', `revoke-key:${s.keyId}`, { keyId: s.keyId }],
    ] as const) {
      const r = await w.raw(path, method, await orgBody(w, w.organizer.signer, action as any, payload));
      assert.equal(r.status, 503, path); assert.match(await reason(r), /Indexer unavailable/);
    }
    const r = await w.raw('/reserve', 'POST', await entry(s, orgPub, '71'));
    assert.equal(r.status, 503);
    assert.equal(((await (await w.raw('/entries', 'GET')).json()) as any).entries.length, 0);
    assert.equal(((await (await w.raw('/keys', 'GET')).json()) as any).keys[0].revoked, false);
  });

  it('serves only the configured EGG-40 contract', async () => {
    const w = await world();
    const r = await w.fetcher(`${BASE}/events/${'ee'.repeat(32)}/${EVENT}/schedule`, { method: 'PUT', body: '{}' });
    assert.equal(r.status, 404);
    assert.equal((await w.fetcher(`${BASE}/events/${CONTRACT}/0/schedule`)).status, 404);
  });
});

describe('EGG-41 app wiring (live API over the HTTP routes)', () => {
  const qr = (serial: string) => encodeAdmitQr({ v: 2, networkId: 'preview', contract: CONTRACT, serial, epoch: '0', nonceHex: 'ab'.repeat(32) });
  const ticket = (serial: string, over: Partial<TicketRow> = {}): TicketRow => ({ serial, typeId: '1', eventId: EVENT, status: 0, hasAdmit: true, epoch: '0', typeName: 'General admission', ...over });

  it('organizer sets doors in the app, pairs a phone (authorizeDoorKey), the phone scans, settlement key at gate 99', async () => {
    const w = await world();
    const calls: string[] = [];
    // Fake wallet: writes the on-chain door key exactly like the circuit would.
    const call = async (circuit: string, args: unknown[]) => {
      calls.push(circuit);
      if (circuit === 'authorizeDoorKey') {
        const [eventId, gateId, keyId, deviceTag, vf, vu] = args as [bigint, bigint, bigint, Uint8Array, bigint, bigint];
        w.snap.doorKeys.set(keyId.toString(16).padStart(64, '0'), { eventId: String(eventId), gateId: String(gateId), deviceTag: bytesToHex(deviceTag), validFrom: Number(vf), validUntil: Number(vu), active: true });
      }
      return { txId: `tx-${calls.length}` };
    };
    const store = memoryKeyStore();
    const orgRelay = createHttpRelay(CONTRACT, BASE, w.fetcher, { signer: () => w.organizer.signer });
    const staffRelay = createHttpRelay(CONTRACT, BASE, w.fetcher); // staff phone: no organizer wallet
    const chain = memoryChain([ticket('81'), ticket('82')]);
    const orgApi = await createLiveEgg40Api({ contract: CONTRACT, relay: orgRelay, store, chain, call, sleep: async () => {} });
    const staffApi = await createLiveEgg40Api({ contract: CONTRACT, relay: staffRelay, store: memoryKeyStore(), chain, call: async () => { throw new Error('staff has no wallet'); } });

    // Staff phone cannot set doors (no organizer signer) and the relay would refuse anyway.
    await assert.rejects(staffApi.organizer.setSchedule(1n, { eventName: 'x', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 5 * H, doors: [{ name: 'Evil' }] }));
    await orgApi.organizer.setSchedule(1n, { eventName: 'CloakTix Launch Night', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 5 * H, doors: [{ name: 'Main door' }, { name: 'After party', ticketTypes: ['After party'] }] });
    const sched = await staffApi.staff.schedule(1n);
    assert.deepEqual(sched?.doors.map(d => [String(d.gateId), d.name]), [['1', 'Main door'], ['2', 'After party']]);

    const staffKey = await staffApi.staff.createKey(1n, 1n);
    assert.match(staffKey.fingerprint, /^[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$/);
    const t0 = Date.now();
    const preview = await orgApi.organizer.previewPairing(1n, staffKey.code, { from: Math.floor((t0 - 60_000) / 1000) * 1000, until: Math.floor((t0 + 4 * H) / 1000) * 1000 });
    await orgApi.organizer.authorizeDoorKey(preview, () => {});
    assert.equal((await staffApi.staff.keyState(staffKey)).state, 'approved');
    assert.equal((await staffApi.staff.scan(staffKey, qr('81'))).kind, 'valid');
    assert.equal((await staffApi.staff.scan(staffKey, qr('81'))).kind, 'already-used');

    await orgApi.organizer.createSettlementKey(1n, () => {});
    const keys = await orgApi.organizer.keys(1n);
    assert.ok(keys.some(k => k.kind === 'settlement' && k.gateId === 99n));
    assert.deepEqual(calls, ['authorizeDoorKey', 'authorizeDoorKey']);

    // Editing doors keeps door numbers in use.
    await orgApi.organizer.setSchedule(1n, { eventName: 'CloakTix Launch Night', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 5 * H, doors: [{ gateId: '1', name: 'Main entrance' }, { name: 'Side door' }, { gateId: '2', name: 'After party' }] });
    assert.deepEqual((await staffApi.staff.schedule(1n))?.doors.map(d => String(d.gateId)), ['1', '3', '2']);
  });

  it('retries the relay approval while the indexer has not seen the new door key yet', async () => {
    const w = await world();
    let pendingKey: [string, ChainDoorKey] | null = null;
    let sleeps = 0;
    const call = async (circuit: string, args: unknown[]) => {
      if (circuit === 'authorizeDoorKey') {
        const [eventId, gateId, keyId, deviceTag, vf, vu] = args as [bigint, bigint, bigint, Uint8Array, bigint, bigint];
        pendingKey = [keyId.toString(16).padStart(64, '0'), { eventId: String(eventId), gateId: String(gateId), deviceTag: bytesToHex(deviceTag), validFrom: Number(vf), validUntil: Number(vu), active: true }];
      }
      return { txId: 'tx' };
    };
    const relay = createHttpRelay(CONTRACT, BASE, w.fetcher, { signer: () => w.organizer.signer });
    const api = await createLiveEgg40Api({ contract: CONTRACT, relay, store: memoryKeyStore(), chain: memoryChain([]), call,
      sleep: async () => { if (++sleeps === 2 && pendingKey) w.snap.doorKeys.set(...pendingKey); } });
    await api.organizer.setSchedule(1n, { eventName: 'Launch', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 5 * H, doors: [{ name: 'Main door' }] });
    const staff = await createLiveEgg40Api({ contract: CONTRACT, relay: createHttpRelay(CONTRACT, BASE, w.fetcher), store: memoryKeyStore(), chain: memoryChain([]) });
    const key = await staff.staff.createKey(1n, 1n);
    const t0 = Date.now();
    const preview = await api.organizer.previewPairing(1n, key.code, { from: Math.floor(t0 / 1000) * 1000, until: Math.floor((t0 + H) / 1000) * 1000 });
    await api.organizer.authorizeDoorKey(preview, () => {});
    assert.equal(sleeps, 2);
    assert.equal((await staff.staff.keyState(key)).state, 'approved');
  });

  it('organizer check-in on the organizer device keeps working with no relay at all', async () => {
    const calls: string[] = [];
    const deadRelay = createHttpRelay(CONTRACT, 'http://down.test', (async () => { throw new TypeError('fetch failed'); }) as typeof fetch);
    const api = await createLiveEgg40Api({ contract: CONTRACT, relay: deadRelay, store: memoryKeyStore(), chain: memoryChain([ticket('91')]), call: async (c) => { calls.push(c); return { txId: 'tx' }; } });
    const r = await api.organizer.directAdmit(1n, qr('91'), () => {});
    assert.equal(r.kind, 'valid');
    assert.deepEqual(calls, ['admit']);
  });
});

describe('EGG-41 chain binding on the real Launch Night state', { skip: !fs.existsSync(new URL('./fixtures/egg40-launch-night-state.hex', import.meta.url)) && 'needs a local snapshot of the live contract state (not published: it holds on-chain addresses)' }, () => {
  it('decodes events and doorKeys from the indexed EGG-40 state; only the key event payout is a bound organizer key', async () => {
    const RT = new URL('../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js', import.meta.url).href;
    register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
      if (s === '@midnight-ntwrk/compact-runtime') return { url: ${JSON.stringify(RT)}, shortCircuit: true };
      return n(s, c); }`));
    const { decodeDoorChainState } = await import('../src/egg40/chainDoorState.ts');
    const snap = decodeDoorChainState(fs.readFileSync(new URL('./fixtures/egg40-launch-night-state.hex', import.meta.url), 'utf8').trim());
    assert.deepEqual([...snap.events.keys()].sort(), ['1', '2']);
    assert.equal(snap.doorKeys.size, 0);
    assert.equal(organizerKeyBound(snap, '1', snap.events.get('2')!.payout), 'ok');
    assert.equal(organizerKeyBound(snap, '1', snap.events.get('1')!.payout), 'ok'); // a NIGHT payout is not an Ed25519 key anyone holds
    assert.equal(organizerKeyBound(snap, '1', 'ab'.repeat(32)), 'not-bound');
    assert.equal(organizerKeyBound(snap, '7', 'ab'.repeat(32)), 'no-event');
    assert.throws(() => decodeDoorChainState(fs.readFileSync(new URL('./fixtures/v3-live-state.hex', import.meta.url), 'utf8').trim()), /Not an EGG-40 contract/);
  });
});
