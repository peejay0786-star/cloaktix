/**
 * Real Egg40Api: Durable Object relay + EGG-40 session circuits.
 * Wallet calls go through an injected `call` (browser: session-egg40 / s.call). Nothing is signed here.
 */
import { DoorKeyError, type DoorScheduleInput, type Egg40Api, type OrganizerDoorApi, type StaffDoorApi, type StaffKey, type WalletPhase, type PairingPreview } from '../doorkeys/api.ts';
import {
  SETTLE_BATCH_SIZE, defaultKeyWindow, encodePairingCode, keyIdFitsField, keyWindowError, parsePairingCode,
  type DoorEntryStats, type DoorKeyRow, type DoorMode, type DoorSchedule, type ScanOutcome, type SettleFailure,
  type SettleFailureReason, type SettlePhase, type SettlementState, type StaffKeyState, type RelayState,
} from '../doorkeys/model.ts';
import { SETTLEMENT_GATE_ID } from '../midnight/contract-egg40-meta.ts';
import { decodeAdmitQr, hexToBytes as hexToBytesAdmit } from '../v2/admitCodec.ts';
import { decryptNonceFromStaff, encryptNonceForOrganizer, realPairingFingerprint, signReserve, hexToBytes } from './deviceCrypto.ts';
import { createStaffRecord, ensureOrganizerKeys, getKeyStore, type KeyStore, type StaffRecord } from './keyStore.ts';
import { createMemoryRelay, type MemoryRelay } from './memoryRelay.ts';
import type { RelaySchedule, ReserveRequest, StoredEntry } from './relayProtocol.ts';
import { signRegister } from './relayAuth.ts';
import { scheduleError } from './eventDoor.ts';

export type TicketRow = { serial: string; typeId: string; eventId: string; status: number; hasAdmit: boolean; epoch: string; typeName: string };
export type CallFn = (circuit: string, args: unknown[], doorSk?: Uint8Array) => Promise<{ txId: string; result?: unknown }>;
export type ChainView = {
  /** Live views re-read the contract state (throttled); a failed read throws. memoryChain has none. */
  refresh?(opts?: { fresh?: boolean }): Promise<void>;
  ticket(serial: string): TicketRow | undefined;
  recordedCount(eventId: string): number;
  markRecorded(serials: string[]): void;
};

export type LiveEgg40Deps = {
  contract: string;
  networkId?: string;
  relay: MemoryRelay;
  store?: KeyStore;
  now?: () => number;
  call?: CallFn;
  chain?: ChainView;
  /** Wait between relay retries while the indexer catches up with a new door key. */
  sleep?: (ms: number) => Promise<void>;
  /** In-tab proof progress: 'done' flips the UI from "Building proof…" to "Approve in your wallet…". */
  proofEvents?: ProofEvents;
};

/** Relay says the key it is asked to approve is not visible on-chain yet (indexer lag after authorizeDoorKey). */
const NOT_ON_CHAIN_YET = /not on-chain yet/i;
export const AUTHORIZE_RETRIES = 10;
export const STAFF_KEY_UNUSABLE = 'This staff phone made a door key the contract cannot accept. On the staff phone tap Delete key, open the staff link again and choose the door, then scan the new code.';
export const AUTHORIZE_RETRY_MS = 3000;



const LISTED = 1, CONSUMED = 2;
const phase = async (onPhase: ((p: WalletPhase) => void) | undefined, p: WalletPhase) => { onPhase?.(p); };
/** In-tab proof progress (localProver.onLocalProof). Optional: tests and the mock have none. */
export type ProofEvents = (listener: (e: { phase: 'start' | 'done' | 'error' }) => void) => () => void;

export function memoryChain(tickets: TicketRow[] = []): ChainView & { tickets: Map<string, TicketRow>; recorded: Set<string> } {
  const map = new Map(tickets.map(t => [t.serial, t]));
  const recorded = new Set<string>();
  return {
    tickets: map, recorded,
    ticket: (s) => map.get(s),
    recordedCount: (eventId) => [...map.values()].filter(t => t.eventId === eventId && (t.status === CONSUMED || recorded.has(t.serial))).length,
    markRecorded: (serials) => { for (const s of serials) { recorded.add(s); const t = map.get(s); if (t) t.status = CONSUMED; } },
  };
}

export async function createLiveEgg40Api(deps: LiveEgg40Deps): Promise<Egg40Api> {
  const contract = deps.contract.toLowerCase();
  const relay = deps.relay;
  const store = deps.store ?? getKeyStore();
  const now = deps.now ?? Date.now;
  const ev = (id: bigint) => String(id);
  const call = deps.call ?? (async () => { throw new DoorKeyError('EGG-40 contract is not deployed yet. Set VITE_EGG40_CONTRACT after it is on Preview.'); });
  const chain = deps.chain;
  /** Up-to-date ticket rows before any decision. A serial not seen yet forces one fresh read (just bought). */
  const syncChain = async (serial?: string) => {
    if (!chain) throw new DoorKeyError('Ticket lookup is not configured on this device. Reload the page.');
    await chain.refresh?.();
    if (serial && !chain.ticket(serial)) await chain.refresh?.({ fresh: true });
  };
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  // Every wallet action: the proof is built in this tab first (tens of seconds, no wallet prompt yet), then 1AM asks.
  const walletCall = async (onPhase: ((p: WalletPhase) => void) | undefined, circuit: string, args: unknown[], doorSk?: Uint8Array) => {
    onPhase?.('proving');
    const stop = deps.proofEvents?.((e) => { if (e.phase === 'done') onPhase?.('wallet'); }) ?? (() => {});
    try { return await call(circuit, args, doorSk); } finally { stop(); }
  };
  const authorizeWithRetry = async (eventId: string, key: Parameters<MemoryRelay['authorizeKey']>[1]) => {
    for (let i = 0; ; i++) {
      try { await relay.authorizeKey(eventId, key); return; }
      catch (e) {
        if (i + 1 >= AUTHORIZE_RETRIES || !NOT_ON_CHAIN_YET.test(String((e as Error)?.message))) throw e;
        await sleep(AUTHORIZE_RETRY_MS);
      }
    }
  };

  const org = async () => ensureOrganizerKeys(store, contract);
  const publishOrg = async (eventId: string) => {
    const o = await org();
    await relay.putOrganizerCrypto(eventId, o.publicKey, o.fingerprint);
    return o;
  };
  const toSchedule = (s: Awaited<ReturnType<MemoryRelay['schedule']>>): DoorSchedule | null => {
    if (!s) return null;
    return { eventId: BigInt(s.eventId), eventName: s.eventName, doorsOpenAt: s.doorsOpenAt, doorsCloseAt: s.doorsCloseAt, doors: s.doors.map(d => ({ gateId: BigInt(d.gateId), name: d.name, ticketTypes: d.ticketTypes })) };
  };
  const staffOf = async (eventId: bigint): Promise<StaffRecord | null> => store.getStaff(contract, ev(eventId));
  const asStaffKey = async (row: StaffRecord): Promise<StaffKey> => {
    const request = { v: 1 as const, contract, eventId: BigInt(row.eventId), gateId: BigInt(row.gateId), keyId: row.keyId, deviceTag: row.deviceTag };
    const orgCrypto = await relay.organizerCrypto(row.eventId).catch(() => null);
    const fingerprint = orgCrypto ? await realPairingFingerprint(request, orgCrypto.publicKey) : '';
    return { request, code: encodePairingCode(request), fingerprint, doorName: row.doorName, createdAt: row.createdAt };
  };

  const evaluate = (text: string, eventId: bigint, gateId: bigint, schedule: DoorSchedule | null): ScanOutcome | { kind: 'ok'; serial: string; typeName: string; nonce: Uint8Array } => {
    const cap = decodeAdmitQr(text.trim());
    if (!cap) return { kind: 'replaced' };
    if (cap.contract !== contract) return { kind: 'wrong-event' };
    const ticket = chain?.ticket(cap.serial);
    if (!ticket) return { kind: 'wrong-event' };
    if (ticket.eventId !== ev(eventId)) return { kind: 'wrong-event' };
    if (ticket.status === LISTED) return { kind: 'listed' };
    if (ticket.status === CONSUMED) return { kind: 'already-used', doorName: 'on-chain', at: now() };
    if (!ticket.hasAdmit || ticket.epoch !== cap.epoch) return { kind: 'replaced' };
    const door = schedule?.doors.find(d => d.gateId === gateId);
    if (door && door.ticketTypes.length && !door.ticketTypes.includes(ticket.typeName) && !schedule!.doors.find(d => d.gateId === gateId)) return { kind: 'wrong-door', doorName: door.name };
    // Wrong door: type not accepted at this gate when type ids / names are listed.
    if (door && (door as any) && schedule) {
      const accepted = schedule.doors.find(d => d.gateId === gateId)?.ticketTypes ?? [];
      const raw = (relay as any); void raw;
      if (accepted.length && !accepted.includes(ticket.typeName) && !accepted.includes('any')) {
        const right = schedule.doors.find(d => d.ticketTypes.includes(ticket.typeName));
        return { kind: 'wrong-door', doorName: right?.name ?? 'another door' };
      }
    }
    return { kind: 'ok', serial: cap.serial, typeName: ticket.typeName, nonce: hexToBytesAdmit(cap.nonceHex) };
  };

  const classifySettle = (serial: string, entry: StoredEntry): SettleFailureReason | 'ready' => {
    const t = chain?.ticket(serial);
    if (!t) return 'ticket-changed';
    if (t.status === CONSUMED) return 'already-recorded';
    if (t.status === LISTED) return 'listed-after-entry';
    if (!t.hasAdmit) return 'ticket-changed';
    if (!entry.signature) return 'unsigned-entry';
    return 'ready';
  };

  const organizer: OrganizerDoorApi = {
    now, contract: () => contract,
    async schedule(eventId) { try { return toSchedule(await relay.schedule(ev(eventId))); } catch { return null; } },
    async setSchedule(eventId, input: DoorScheduleInput) {
      const s: RelaySchedule = {
        eventId: ev(eventId), eventName: input.eventName.trim().slice(0, 120), doorsOpenAt: input.doorsOpenAt, doorsCloseAt: input.doorsCloseAt,
        doors: [],
      };
      // Door numbers already used by keys stay fixed; new doors take the next free number (never 99, the settlement gate).
      const used = new Set(input.doors.map(d => d.gateId).filter((g): g is string => !!g));
      let next = 1;
      for (const d of input.doors) {
        let gateId = d.gateId;
        if (!gateId) { while (used.has(String(next)) || next === Number(SETTLEMENT_GATE_ID)) next++; gateId = String(next); used.add(gateId); }
        s.doors.push({ gateId, name: d.name.trim(), ticketTypes: (d.ticketTypes ?? []).filter(Boolean), typeIds: [] });
      }
      const err = scheduleError(s, ev(eventId));
      if (err) throw new DoorKeyError(err);
      await publishOrg(ev(eventId));
      await relay.putSchedule(ev(eventId), s);
    },
    async relay(eventId): Promise<RelayState> {
      const online = await relay.health();
      if (!online) return { status: 'offline', lastCopyAt: null, missed: [] };
      const missed = (await relay.listMissed(ev(eventId)).catch(() => [])).map(m => ({ gateId: BigInt(m.gateId), doorName: m.doorName, count: m.count }));
      return { status: missed.length ? 'syncing' : 'online', lastCopyAt: now(), missed };
    },
    async doorMode(eventId) { try { return await relay.mode(ev(eventId)); } catch { return 'walletless'; } },
    async setDoorMode(eventId, mode: DoorMode) { if (mode !== 'walletless') throw new DoorKeyError('Staff wallet mode is not available yet'); await relay.setMode(ev(eventId), mode); },
    async keys(eventId) {
      const rows: DoorKeyRow[] = [];
      const stats = await relay.stats(ev(eventId)).catch(() => []);
      const keys = await relay.listKeys(ev(eventId)).catch(() => []);
      const orgRow = await store.getOrganizer(contract);
      const settle = orgRow?.settlement?.eventId === ev(eventId) ? orgRow.settlement : undefined;
      for (const k of keys) {
        const st = stats.find(s => s.gateId === k.gateId);
        rows.push({
          keyId: k.keyId, kind: k.kind, gateId: BigInt(k.gateId),
          doorName: k.kind === 'settlement' ? 'Settlement' : (st?.doorName ?? `Door ${k.gateId}`),
          fingerprint: k.kind === 'settlement' ? (orgRow?.fingerprint.slice(0, 6) ?? '') : '',
          validFrom: k.validFrom, validUntil: k.validUntil, revoked: k.revoked,
          entries: k.kind === 'staff' ? (st?.entries ?? 0) : 0,
        });
      }
      // fingerprints for staff keys are filled when we have pairing context; leave blank if unknown
      void settle;
      return rows;
    },
    async previewPairing(eventId, code, window): Promise<PairingPreview> {
      const parsed = parsePairingCode(code, { contract, eventId });
      if (!parsed.ok) throw new DoorKeyError(parsed.error);
      if (!keyIdFitsField(parsed.request.keyId)) throw new DoorKeyError(STAFF_KEY_UNUSABLE);
      const err = keyWindowError(window.from, window.until, now());
      if (err) throw new DoorKeyError(err);
      const existing = await relay.getKey(ev(eventId), parsed.request.keyId).catch(() => null);
      if (existing) throw new DoorKeyError('This code was already used. Ask the staff phone to set up again.');
      const schedule = toSchedule(await relay.schedule(ev(eventId)));
      const door = schedule?.doors.find(d => d.gateId === parsed.request.gateId);
      if (!door) throw new DoorKeyError('Code not recognized.');
      const o = await publishOrg(ev(eventId));
      return { request: parsed.request, doorName: door.name, fingerprint: await realPairingFingerprint(parsed.request, o.publicKey), validFrom: window.from, validUntil: window.until };
    },
    async authorizeDoorKey(preview, onPhase) {
      if (!keyIdFitsField(preview.request.keyId)) throw new DoorKeyError(STAFF_KEY_UNUSABLE);
      if (preview.validUntil - preview.validFrom > 48 * 3600_000) throw new DoorKeyError('A door key can last 48 hours at most.');
      await walletCall(onPhase, 'authorizeDoorKey', [preview.request.eventId, preview.request.gateId, BigInt('0x' + preview.request.keyId), hexToBytes(preview.request.deviceTag), BigInt(Math.floor(preview.validFrom / 1000)), BigInt(Math.floor(preview.validUntil / 1000))]);
      await phase(onPhase, 'relay');
      await authorizeWithRetry(ev(preview.request.eventId), {
        keyId: preview.request.keyId, deviceTag: preview.request.deviceTag, publicKey: '',
        gateId: String(preview.request.gateId), validFrom: preview.validFrom, validUntil: preview.validUntil, revoked: false, kind: 'staff',
      });
    },
    async createSettlementKey(eventId, onPhase) {
      const o = await publishOrg(ev(eventId));
      const { randomDoorSecret, deviceTagFromPublicKey, exportPublicKeyRaw, generateNonExtractableP256 } = await import('./deviceCrypto.ts');
      const { doorKeyIdHex } = await import('./doorKeyId.ts');
      // Settlement key lives on this organizer device. deviceTag is of a local signing key (unused at the door).
      const sign = await generateNonExtractableP256();
      const pub = await exportPublicKeyRaw(sign.publicKey);
      // EGG-44: about half of SHA-256 key ids exceed the contract Field bound; draw a new secret instead of failing
      // (before, Create settlement key failed at random with "could not create a settlement key").
      let doorSecret = randomDoorSecret();
      let keyId = await doorKeyIdHex(doorSecret);
      for (let i = 0; i < 32 && !keyIdFitsField(keyId); i++) { doorSecret = randomDoorSecret(); keyId = await doorKeyIdHex(doorSecret); }
      const deviceTag = await deviceTagFromPublicKey(pub);
      const schedule = toSchedule(await relay.schedule(ev(eventId)));
      const window = schedule ? defaultKeyWindow(schedule) : { from: now(), until: now() + 48 * 3600_000 };
      if (!keyIdFitsField(keyId)) throw new DoorKeyError('This device could not create a settlement key. Reload the page and try again.');
      await walletCall(onPhase, 'authorizeDoorKey', [eventId, SETTLEMENT_GATE_ID, BigInt('0x' + keyId), hexToBytes(deviceTag), BigInt(Math.floor(window.from / 1000)), BigInt(Math.floor(window.until / 1000))], doorSecret);
      await phase(onPhase, 'relay');
      const regTs = now();
      await relay.registerDevice(ev(eventId), { keyId, deviceTag, publicKey: pub, ts: regTs, signature: await signRegister(sign.privateKey, contract, ev(eventId), keyId, deviceTag, regTs) });
      await authorizeWithRetry(ev(eventId), { keyId, deviceTag, publicKey: pub, gateId: String(SETTLEMENT_GATE_ID), validFrom: window.from, validUntil: window.until, revoked: false, kind: 'settlement' });
      o.settlement = { eventId: ev(eventId), keyId, doorSecret, validFrom: window.from, validUntil: window.until, gateId: String(SETTLEMENT_GATE_ID) };
      await store.putOrganizer(o);
    },
    async revokeDoorKey(eventId, keyId, onPhase) {
      await walletCall(onPhase, 'revokeDoorKey', [BigInt('0x' + keyId)]);
      await phase(onPhase, 'relay');
      await relay.revokeKey(ev(eventId), keyId);
    },
    async stats(eventId): Promise<DoorEntryStats[]> {
      const rows = await relay.stats(ev(eventId)).catch(() => []);
      return rows.map(r => ({ gateId: BigInt(r.gateId), doorName: r.doorName, entries: r.entries, lastEntryAt: r.lastEntryAt }));
    },
    async importMissed(eventId, gateId) { await relay.takeAndImportMissed(ev(eventId), String(gateId)); },
    async settlement(eventId): Promise<SettlementState> {
      const entries = await relay.entries(ev(eventId)).catch(() => []);
      await chain?.refresh?.().catch(() => { /* shown as ticket-changed until the next poll */ });
      const staffEntries = entries.filter(e => e.gateId !== String(SETTLEMENT_GATE_ID));
      const failures: SettleFailure[] = [];
      let ready = 0, recorded = 0;
      const doors = new Set(staffEntries.map(e => e.gateId));
      for (const e of staffEntries) {
        const reason = classifySettle(e.serial, e);
        if (reason === 'ready') ready++;
        else if (reason === 'already-recorded') recorded++;
        else failures.push({ serial: e.serial, doorName: e.doorName, reason });
      }
      recorded += chain ? staffEntries.filter(e => chain.ticket(e.serial)?.status === CONSUMED && classifySettle(e.serial, e) === 'already-recorded').length : 0;
      // recorded from chain marks already counted above; unique:
      recorded = staffEntries.filter(e => classifySettle(e.serial, e) === 'already-recorded').length;
      ready = staffEntries.filter(e => classifySettle(e.serial, e) === 'ready').length;
      const orgRow = await store.getOrganizer(contract);
      return { total: staffEntries.length, doorCount: doors.size, ready: ready + recorded, recorded, failures, keyUntil: orgRow?.settlement?.validUntil ?? null };
    },
    async settleNextBatch(eventId, onPhase: (p: SettlePhase) => void) {
      const orgRow = await store.getOrganizer(contract);
      const settle = orgRow?.settlement;
      if (!settle?.doorSecret) throw new DoorKeyError('Create a settlement key on this device first.');
      await syncChain().catch(() => { throw new DoorKeyError('Could not read the tickets on Midnight. Check the connection and try again.'); });
      const entries = (await relay.entries(ev(eventId))).filter(e => classifySettle(e.serial, e) === 'ready');
      const batch = entries.slice(0, SETTLE_BATCH_SIZE);
      if (!batch.length) return organizer.settlement(eventId);
      const decrypt = async (e: StoredEntry) => decryptNonceFromStaff(e.cipher, (await org()).ecdhKey);
      const runOne = async (e: StoredEntry) => {
        const nonce = await decrypt(e);
        await call('admitByDoor', [BigInt(e.serial), nonce, SETTLEMENT_GATE_ID], settle.doorSecret);
        chain?.markRecorded([e.serial]);
      };
      const pad = async <T>(xs: T[], fill: T): Promise<[T, T, T, T]> => {
        const out = xs.slice();
        while (out.length < 4) out.push(fill);
        return out as [T, T, T, T];
      };
      try {
        if (batch.length === 4) {
          onPhase('proving');
          const nonces = await Promise.all(batch.map(decrypt));
          onPhase('wallet');
          await call('admitByDoor4', [await pad(batch.map(e => BigInt(e.serial)), 0n), await pad(nonces, new Uint8Array(32)), SETTLEMENT_GATE_ID], settle.doorSecret);
          onPhase('network');
          chain?.markRecorded(batch.map(e => e.serial));
        } else {
          onPhase('retrying');
          for (const e of batch) await runOne(e);
        }
      } catch {
        onPhase('retrying');
        for (const e of batch) {
          try { await runOne(e); } catch { /* left as failure in settlement() */ }
        }
      }
      onPhase('idle');
      return organizer.settlement(eventId);
    },
    async directAdmit(eventId, code, onPhase) {
      const schedule = toSchedule(await relay.schedule(ev(eventId)).catch(() => null));
      const cap = decodeAdmitQr(code.trim());
      if (cap) await syncChain(cap.serial).catch(() => { throw new DoorKeyError('Could not read the tickets on Midnight. Check the connection and try again.'); });
      const evl = evaluate(code, eventId, schedule?.doors[0]?.gateId ?? 1n, schedule);
      if (evl.kind !== 'ok') return evl;
      await walletCall(onPhase, 'admit', [BigInt(evl.serial), evl.nonce]);
      await phase(onPhase, 'network');
      chain?.markRecorded([evl.serial]);
      return { kind: 'valid', typeName: evl.typeName };
    },
  };

  const staff: StaffDoorApi = {
    now, schedule: organizer.schedule, relay: organizer.relay,
    async currentKey(eventId) { const row = await staffOf(eventId); return row ? asStaffKey(row) : null; },
    async createKey(eventId, gateId) {
      const schedule = toSchedule(await relay.schedule(ev(eventId)));
      const door = schedule?.doors.find(d => d.gateId === gateId);
      if (!door) throw new DoorKeyError('Code not recognized.');
      // Same-device organizer only: the write is organizer-signed, so a staff phone without the organizer wallet is refused (ignored here).
      await publishOrg(ev(eventId)).catch(() => { /* organizer publishes it when setting doors */ });
      // keyId must be a Compact Field (< BLS12-381 r). A fresh key almost always is; retry the rare one that is not.
      let row = await createStaffRecord({ contract, eventId: ev(eventId), gateId: String(gateId), doorName: door.name, now: now() });
      for (let i = 0; i < 16 && !keyIdFitsField(row.keyId); i++) row = await createStaffRecord({ contract, eventId: ev(eventId), gateId: String(gateId), doorName: door.name, now: now() });
      if (!keyIdFitsField(row.keyId)) throw new DoorKeyError('Could not create a door key on this phone. Reload the page and try again.');
      await store.putStaff(row);
      const regTs = now();
      await relay.registerDevice(ev(eventId), { keyId: row.keyId, deviceTag: row.deviceTag, publicKey: row.publicKey, ts: regTs, signature: await signRegister(row.signKey, contract, row.eventId, row.keyId, row.deviceTag, regTs) });
      return asStaffKey(row);
    },
    async keyState(key): Promise<StaffKeyState> {
      const onChain = chain ? null : null;
      void onChain;
      try {
        const k = await relay.getKey(ev(key.request.eventId), key.request.keyId);
        if (!k) return { state: 'pending' };
        if (k.revoked) return { state: 'revoked' };
        if (now() >= k.validUntil) return { state: 'expired' };
        return { state: 'approved', validUntil: k.validUntil, validFrom: k.validFrom };
      } catch { return { state: 'pending' }; }
    },
    async deleteKey(key) { await store.deleteStaff(contract, ev(key.request.eventId)); },
    async scan(key, ticketCode): Promise<ScanOutcome> {
      const row = await staffOf(key.request.eventId);
      if (!row) return { kind: 'replaced' };
      const cap = decodeAdmitQr(ticketCode.trim());
      const local = cap && row.log.find(l => l.serial === cap.serial);
      if (local) return { kind: 'already-used', doorName: row.doorName, at: local.at };
      const online = await relay.health();
      if (!online) return { kind: 'relay-offline' };
      const schedule = toSchedule(await relay.schedule(ev(key.request.eventId)));
      if (cap) { try { await syncChain(cap.serial); } catch { return { kind: 'relay-offline' }; } }
      const evl = evaluate(ticketCode, key.request.eventId, key.request.gateId, schedule);
      if (evl.kind !== 'ok') return evl;
      // EGG-45: the door key's window is checked here, after the ticket. Before, the relay refused
      // ("Door key not yet valid") and every refusal was shown as "This copy was replaced".
      const approved = await relay.getKey(row.eventId, row.keyId).catch(() => null);
      if (approved && now() < approved.validFrom) return { kind: 'key-not-yet-valid', opensAt: approved.validFrom, typeName: evl.typeName };
      if (approved && now() >= approved.validUntil) return { kind: 'key-expired' };
      const orgCrypto = await relay.organizerCrypto(row.eventId);
      if (!orgCrypto) return { kind: 'relay-offline' };
      const at = now();
      const prevHash = row.log.at(-1)?.request.prevHash ?? '0'.repeat(64);
      const cipher = await encryptNonceForOrganizer(evl.nonce, orgCrypto.publicKey);
      const unsigned: Omit<ReserveRequest, 'signature'> = {
        serial: evl.serial, gateId: row.gateId, keyId: row.keyId, deviceTag: row.deviceTag, at,
        typeName: evl.typeName, cipher, prevHash,
      };
      const signature = await signReserve(row.signKey, contract, row.eventId, unsigned);
      const req: ReserveRequest = { ...unsigned, signature };
      const result = await relay.reserve(row.eventId, req);
      if (result.ok) {
        row.log.push({ serial: evl.serial, at, request: req, sent: true });
        await store.putStaff(row);
        return { kind: 'valid', typeName: evl.typeName };
      }
      if (result.reason === 'already-used' && 'at' in result && 'doorName' in result) {
        row.log.push({ serial: evl.serial, at: result.at, request: req, sent: true });
        await store.putStaff(row);
        return { kind: 'already-used', doorName: result.doorName, at: result.at };
      }
      if (/not yet valid/i.test(result.reason)) return { kind: 'key-not-yet-valid', opensAt: approved?.validFrom ?? now(), typeName: evl.typeName };
      if (/expired/i.test(result.reason)) return { kind: 'key-expired' };
      if (/Wrong door/i.test(result.reason)) return { kind: 'wrong-door', doorName: 'another door' };
      return { kind: 'refused', reason: result.reason || 'The relay refused this entry' };
    },
    async localEntries(key) {
      const row = await staffOf(key.request.eventId);
      const last = row?.log.at(-1);
      return { count: row?.log.length ?? 0, lastSentAt: last && last.sent ? last.at : null };
    },
  };

  return { source: 'live', organizer, staff };
}

export function defaultLiveDeps(contract: string): LiveEgg40Deps {
  return { contract, relay: createMemoryRelay(contract) };
}
