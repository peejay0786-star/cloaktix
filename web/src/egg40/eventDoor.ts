/**
 * Per-event door journal. One Durable Object instance = one event (contract + eventId).
 * A single DO runs one request at a time, so a serial can be reserved only once.
 *
 * EGG-41: constructed with `chain`, every state-changing call is authorized (see relayAuth.ts):
 * organizer writes need the on-chain-bound organizer key, a fresh timestamp and an unused nonce; door keys and
 * entries are checked against the on-chain doorKeys map. No chain read = no change (fail closed, HTTP 503).
 * Without `chain` (the in-browser memory relay on one device) the old local rules apply.
 */
import {
  deviceTagOfPublicKey, entryLogHash, isHex, reserveSignPayload, verifyReserveSignature,
  type AuthorizedKey, type RelaySchedule, type ReserveRequest, type ReserveResult, type StoredEntry, type DoorMode,
} from './relayProtocol.ts';
import {
  AUTH_WINDOW_MS, FUTURE_SKEW_MS, SETTLEMENT_GATE, orgMessage, organizerKeyBound, registerMessage, validOrgAuth, verifyEd25519,
  type ChainDoorKey, type ChainSource, type DoorChainSnapshot, type OrgAction, type OrgAuth,
} from './relayAuth.ts';

export type DoorKv = {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  list(prefix: string): Promise<Array<{ key: string; value: unknown }>>;
  delete(key: string): Promise<void>;
};

const K = {
  schedule: 'schedule', mode: 'mode', orgPub: 'organizer-crypto',
  entry: (s: string) => `entry:${s}`,
  key: (id: string) => `key:${id}`,
  pendingDev: (id: string) => `pdev:${id}`,
  missed: (g: string) => `missed:${g}`,
  nonce: (n: string) => `nonce:${n}`,
};
export const MAX_PENDING_DEVICES = 200;
export const MAX_MISSED_PER_DOOR = 5000;
export const MAX_DOORS = 20;
const MAX_SCHEDULE_MS = 7 * 24 * 3600_000;

export type DoorOptions = { chain?: ChainSource; now?: () => number };
export type RegisterDeviceInput = { keyId: string; deviceTag: string; publicKey: string; ts?: number; signature?: string };

export class EventDoor {
  contract: string;
  eventId: string;
  kv: DoorKv;
  private chain?: ChainSource;
  private clock: () => number;
  constructor(contract: string, eventId: string, kv: DoorKv, opts: DoorOptions = {}) {
    this.contract = contract.toLowerCase(); this.eventId = eventId; this.kv = kv;
    this.chain = opts.chain; this.clock = opts.now ?? Date.now;
  }
  get guarded(): boolean { return !!this.chain; }

  // ---------- authorization helpers ----------
  private async snapshot(fresh = false): Promise<DoorChainSnapshot> {
    try { return await this.chain!({ fresh }); }
    catch { throw new RelayError('Indexer unavailable. Nothing was changed. Retry in a moment.', 503); }
  }
  private async chainKey(keyId: string): Promise<ChainDoorKey | undefined> {
    const id = keyId.toLowerCase();
    let k = (await this.snapshot()).doorKeys.get(id);
    if (!k) k = (await this.snapshot(true)).doorKeys.get(id); // just authorized: the cached read may predate it
    return k;
  }
  /** Organizer-only write. No-op when the door is not guarded (memory relay on one device). */
  async requireOrganizer(action: OrgAction, payload: unknown, auth: OrgAuth | undefined): Promise<void> {
    if (!this.chain) return;
    if (!validOrgAuth(auth)) throw new RelayError('Organizer signature required.', 401);
    const now = this.clock();
    if (Math.abs(now - auth.ts) > AUTH_WINDOW_MS) throw new RelayError('Request expired. Check the device clock and retry.', 401);
    if (!await verifyEd25519(auth.pk, await orgMessage(this.contract, this.eventId, action, auth.ts, auth.nonce, payload), auth.sig)) {
      throw new RelayError('Invalid organizer signature.', 401);
    }
    const bound = organizerKeyBound(await this.snapshot(), this.eventId, auth.pk);
    if (bound === 'no-event') throw new RelayError('Event is not on-chain.', 404);
    if (bound === 'not-bound') {
      const again = organizerKeyBound(await this.snapshot(true), this.eventId, auth.pk);
      if (again !== 'ok') throw new RelayError('This organizer key is not registered on-chain for this event. Use Save details once, then retry.', 403);
    }
    // Only a bound organizer key reaches here (no nonce spam from random keys). get + put back to back, no other
    // await between: atomic inside a Durable Object, so each nonce is accepted once.
    if (await this.kv.get(K.nonce(auth.nonce))) throw new RelayError('Replay rejected.', 409);
    await this.kv.put(K.nonce(auth.nonce), auth.ts);
    await this.pruneNonces(now);
  }
  private async pruneNonces(now: number) {
    for (const r of await this.kv.list('nonce:')) if (typeof r.value === 'number' && now - r.value > 2 * AUTH_WINDOW_MS) await this.kv.delete(r.key);
  }
  /** On-chain checks for an entry signed by a door key. mode 'live' = scanned now; 'import' = recorded earlier. */
  private async chainEntryError(req: ReserveRequest, key: AuthorizedKey, now: number, mode: 'live' | 'import'): Promise<string | null> {
    if (!this.chain) return null;
    if (req.gateId === SETTLEMENT_GATE) return 'The settlement key cannot record door entries';
    const ck = await this.chainKey(req.keyId);
    if (!ck || ck.eventId !== this.eventId) return 'Door key is not on-chain for this event';
    if (!ck.active) return 'Door key revoked on-chain';
    if (ck.gateId !== req.gateId) return 'Wrong door';
    if (ck.deviceTag !== key.deviceTag) return 'Device does not match this door key';
    const nowSec = Math.floor(now / 1000);
    if (mode === 'live') {
      if (nowSec < ck.validFrom) return 'Door key not yet valid';
      if (nowSec >= ck.validUntil) return 'This door key has expired';
      if (Math.abs(now - req.at) > AUTH_WINDOW_MS) return 'Entry time is outside the allowed window';
    } else {
      if (req.at < ck.validFrom * 1000 || req.at >= ck.validUntil * 1000) return 'Entry time is outside the door key window';
      if (req.at > now + FUTURE_SKEW_MS) return 'Entry time is in the future';
    }
    return null;
  }

  // ---------- schedule / mode / organizer key ----------
  async getSchedule(): Promise<RelaySchedule | null> { return (await this.kv.get<RelaySchedule>(K.schedule)) ?? null; }
  async putSchedule(schedule: RelaySchedule, auth?: OrgAuth): Promise<void> {
    const err = scheduleError(schedule, this.eventId);
    if (err) throw new RelayError(err, 400);
    await this.requireOrganizer('schedule', schedule, auth);
    await this.kv.put(K.schedule, schedule);
  }
  async getMode(): Promise<DoorMode> { return (await this.kv.get<DoorMode>(K.mode)) ?? 'walletless'; }
  async setMode(mode: DoorMode, auth?: OrgAuth): Promise<void> {
    if (mode !== 'walletless') throw new RelayError('Staff wallet mode is not available yet', 400);
    await this.requireOrganizer('mode', { mode }, auth);
    await this.kv.put(K.mode, mode);
  }
  async getOrganizerCrypto(): Promise<{ publicKey: string; fingerprint: string } | null> {
    return (await this.kv.get(K.orgPub)) ?? null;
  }
  async putOrganizerCrypto(publicKey: string, fingerprint: string, auth?: OrgAuth): Promise<void> {
    if (typeof publicKey !== 'string' || !isHex(publicKey) || publicKey.length > 400 || typeof fingerprint !== 'string' || fingerprint.length > 128) throw new RelayError('Invalid organizer key', 400);
    await this.requireOrganizer('organizer-crypto', { publicKey, fingerprint }, auth);
    await this.kv.put(K.orgPub, { publicKey, fingerprint });
  }

  // ---------- door keys ----------
  async registerDevice(input: RegisterDeviceInput): Promise<void> {
    assertKeyId(input.keyId);
    if (typeof input.publicKey !== 'string' || !isHex(input.publicKey) || input.publicKey.length > 400) throw new RelayError('Invalid device key', 400);
    const tag = await deviceTagOfPublicKey(input.publicKey);
    if (tag !== String(input.deviceTag).toLowerCase()) throw new RelayError('deviceTag does not match the public key', 400);
    const existing = await this.kv.get<AuthorizedKey>(K.key(input.keyId));
    if (existing && existing.deviceTag !== input.deviceTag.toLowerCase()) throw new RelayError('This code was already used. Ask the staff phone to set up again.', 409);
    if (this.chain) {
      // Proof of possession: only the phone holding the private key can register its public key.
      if (!Number.isSafeInteger(input.ts) || Math.abs(this.clock() - input.ts!) > AUTH_WINDOW_MS) throw new RelayError('Request expired. Check the device clock and retry.', 401);
      if (!input.signature || !await verifyReserveSignature(input.publicKey, registerMessage(this.contract, this.eventId, input.keyId, tag, input.ts!), input.signature)) {
        throw new RelayError('Device signature required.', 401);
      }
      const pending = await this.kv.get<{ deviceTag: string }>(K.pendingDev(input.keyId));
      if (pending && pending.deviceTag !== tag) throw new RelayError('This code was already used. Ask the staff phone to set up again.', 409);
      if (!pending && (await this.kv.list('pdev:')).length >= MAX_PENDING_DEVICES) throw new RelayError('Too many phones waiting for approval. Approve or remove some first.', 429);
    }
    await this.kv.put(K.pendingDev(input.keyId), { keyId: input.keyId, deviceTag: tag, publicKey: input.publicKey });
  }
  async authorizeKey(key: AuthorizedKey, auth?: OrgAuth): Promise<void> {
    assertKeyId(key.keyId);
    await this.requireOrganizer('authorize-key', key, auth);
    const pending = await this.kv.get<{ publicKey: string; deviceTag: string }>(K.pendingDev(key.keyId));
    if (pending) {
      if (pending.deviceTag !== key.deviceTag.toLowerCase()) throw new RelayError('This code was already used. Ask the staff phone to set up again.', 409);
      key = { ...key, publicKey: pending.publicKey, deviceTag: pending.deviceTag };
    }
    if (!key.publicKey) throw new RelayError('Staff device has not registered its public key yet', 400);
    const tag = await deviceTagOfPublicKey(key.publicKey);
    if (tag !== key.deviceTag.toLowerCase()) throw new RelayError('deviceTag does not match the public key', 400);
    if (this.chain) {
      const ck = await this.chainKey(key.keyId);
      if (!ck) throw new RelayError('Door key not on-chain yet. Retry in a few seconds.', 409);
      const kind = ck.gateId === SETTLEMENT_GATE ? 'settlement' : 'staff';
      if (ck.eventId !== this.eventId || ck.gateId !== String(key.gateId) || ck.deviceTag !== tag || !ck.active
        || ck.validFrom !== Math.floor(key.validFrom / 1000) || ck.validUntil !== Math.floor(key.validUntil / 1000) || key.kind !== kind) {
        throw new RelayError('Door key does not match the on-chain door key.', 403);
      }
    }
    await this.kv.put(K.key(key.keyId), { ...key, deviceTag: tag, revoked: !!key.revoked });
    await this.kv.delete(K.pendingDev(key.keyId));
  }
  async revokeKey(keyId: string, auth?: OrgAuth): Promise<void> {
    assertKeyId(keyId);
    await this.requireOrganizer(`revoke-key:${keyId.toLowerCase()}`, { keyId }, auth);
    const key = await this.kv.get<AuthorizedKey>(K.key(keyId));
    if (!key) throw new RelayError('No door key', 404);
    if (this.chain) {
      const ck = await this.chainKey(keyId);
      if (!ck || ck.eventId !== this.eventId) throw new RelayError('Door key is not on-chain for this event', 403);
    }
    await this.kv.put(K.key(keyId), { ...key, revoked: true });
  }
  async getKey(keyId: string): Promise<AuthorizedKey | null> { return (await this.kv.get<AuthorizedKey>(K.key(keyId))) ?? null; }
  async listKeys(): Promise<AuthorizedKey[]> { return (await this.kv.list('key:')).map(r => r.value as AuthorizedKey); }

  // ---------- entries ----------
  async reserve(req: ReserveRequest, now = this.clock(), mode: 'live' | 'import' = 'live'): Promise<ReserveResult> {
    if (!validReserveShape(req)) return { ok: false, reason: 'Invalid entry' };
    if (!req.cipher?.iv || !req.cipher?.ct || !req.cipher?.ephPub || !isHex(req.cipher.ct) || !isHex(req.cipher.iv) || !isHex(req.cipher.ephPub)) {
      return { ok: false, reason: 'Missing encrypted ticket secret' };
    }
    const existing = await this.kv.get<StoredEntry>(K.entry(req.serial));
    if (existing && this.chain && existing.signature === req.signature) return { ok: false, reason: 'replay' };
    if (existing) return { ok: false, reason: 'already-used', serial: existing.serial, at: existing.at, gateId: existing.gateId, doorName: existing.doorName };
    const key = await this.kv.get<AuthorizedKey>(K.key(req.keyId));
    if (!key || key.revoked) return { ok: false, reason: 'Door key is not approved' };
    if (key.deviceTag !== req.deviceTag.toLowerCase()) return { ok: false, reason: 'Device does not match this door key' };
    if (key.gateId !== req.gateId) return { ok: false, reason: 'Wrong door' };
    if (mode === 'live' && now < key.validFrom) return { ok: false, reason: 'Door key not yet valid' };
    if (mode === 'live' && now >= key.validUntil) return { ok: false, reason: 'This door key has expired' };
    const okSig = await verifyReserveSignature(key.publicKey, reserveSignPayload(this.contract, this.eventId, req), req.signature);
    if (!okSig) return { ok: false, reason: 'Entry not signed by an approved door: skipped' };
    const chainErr = await this.chainEntryError(req, key, now, mode);
    if (chainErr) return { ok: false, reason: chainErr };
    const schedule = await this.getSchedule();
    const doorName = schedule?.doors.find(d => d.gateId === req.gateId)?.name ?? `Door ${req.gateId}`;
    const logHash = await entryLogHash(req.prevHash, req.serial, req.at, req.cipher.ct);
    const raced = await this.kv.get<StoredEntry>(K.entry(req.serial));
    if (raced) return { ok: false, reason: 'already-used', serial: raced.serial, at: raced.at, gateId: raced.gateId, doorName: raced.doorName };
    await this.kv.put(K.entry(req.serial), { ...req, doorName, logHash } satisfies StoredEntry);
    return { ok: true, serial: req.serial, at: req.at, gateId: req.gateId };
  }

  async importEntries(entries: ReserveRequest[], now = this.clock(), auth?: OrgAuth) {
    if (!Array.isArray(entries)) throw new RelayError('Invalid entries', 400);
    await this.requireOrganizer('import', { entries }, auth);
    return this.importChecked(entries, now);
  }
  private async importChecked(entries: ReserveRequest[], now: number) {
    let imported = 0, skipped = 0, used = 0;
    for (const req of entries) {
      const result = await this.reserve(req, now, this.chain ? 'import' : 'live');
      if (result.ok) imported++;
      else if (result.reason === 'already-used' || result.reason === 'replay') used++;
      else skipped++;
    }
    return { imported, skipped, used };
  }
  async getEntry(serial: string) { return (await this.kv.get<StoredEntry>(K.entry(serial))) ?? null; }
  async listEntries(): Promise<StoredEntry[]> {
    return (await this.kv.list('entry:')).map(r => r.value as StoredEntry).sort((a, b) => a.at - b.at);
  }
  /** Entries a phone recorded while the relay missed them. Guarded: only entries signed by an on-chain door key are kept. */
  async offerMissed(gateId: string, doorName: string, entries: ReserveRequest[], now = this.clock()): Promise<void> {
    if (!Array.isArray(entries)) throw new RelayError('Invalid entries', 400);
    let accepted = entries;
    if (this.chain) {
      accepted = [];
      for (const req of entries.slice(0, MAX_MISSED_PER_DOOR)) {
        if (!validReserveShape(req) || req.gateId !== gateId) continue;
        const key = await this.kv.get<AuthorizedKey>(K.key(req.keyId));
        if (!key || key.revoked || key.gateId !== gateId || key.deviceTag !== req.deviceTag.toLowerCase()) continue;
        if (!await verifyReserveSignature(key.publicKey, reserveSignPayload(this.contract, this.eventId, req), req.signature)) continue;
        if (await this.chainEntryError(req, key, now, 'import')) continue;
        accepted.push(req);
      }
      if (!accepted.length) throw new RelayError('No entry signed by an approved door key.', 403);
      const schedule = await this.getSchedule();
      doorName = schedule?.doors.find(d => d.gateId === gateId)?.name ?? `Door ${gateId}`;
    }
    const prev = (await this.kv.get<{ entries: ReserveRequest[] }>(K.missed(gateId)))?.entries ?? [];
    const seen = new Set(prev.map(e => e.serial));
    const merged = [...prev, ...accepted.filter(e => !seen.has(e.serial))].slice(0, MAX_MISSED_PER_DOOR);
    await this.kv.put(K.missed(gateId), { gateId, doorName, entries: merged });
  }
  async listMissed(): Promise<Array<{ gateId: string; doorName: string; count: number }>> {
    return (await this.kv.list('missed:')).map(r => {
      const v = r.value as { gateId: string; doorName: string; entries: ReserveRequest[] };
      return { gateId: v.gateId, doorName: v.doorName, count: v.entries.length };
    }).filter(m => m.count > 0);
  }
  async takeMissed(gateId: string, auth?: OrgAuth): Promise<ReserveRequest[]> {
    await this.requireOrganizer(`import-missed:${gateId}`, { gateId }, auth);
    const row = await this.kv.get<{ entries: ReserveRequest[] }>(K.missed(gateId));
    await this.kv.delete(K.missed(gateId));
    return row?.entries ?? [];
  }
  /** Organizer import of a door's missed entries: one authorization for take + import. */
  async takeAndImportMissed(gateId: string, auth?: OrgAuth, now = this.clock()) {
    const entries = await this.takeMissed(gateId, auth);
    return this.importChecked(entries, now);
  }
  async stats() {
    const entries = await this.listEntries();
    const schedule = await this.getSchedule();
    const by = new Map<string, { gateId: string; doorName: string; entries: number; lastEntryAt: number | null }>();
    for (const d of schedule?.doors ?? []) by.set(d.gateId, { gateId: d.gateId, doorName: d.name, entries: 0, lastEntryAt: null });
    for (const e of entries) {
      const cur = by.get(e.gateId) ?? { gateId: e.gateId, doorName: e.doorName, entries: 0, lastEntryAt: null };
      cur.entries += 1;
      cur.lastEntryAt = cur.lastEntryAt == null ? e.at : Math.max(cur.lastEntryAt, e.at);
      by.set(e.gateId, cur);
    }
    return [...by.values()];
  }
}

export class RelayError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.name = 'RelayError'; this.status = status; }
}
function assertKeyId(keyId: string) {
  if (typeof keyId !== 'string' || !isHex(keyId, 32) || /^0+$/.test(keyId)) throw new RelayError('Code not recognized.', 400);
}
function validReserveShape(req: ReserveRequest): boolean {
  return !!req && typeof req.serial === 'string' && /^\d{1,39}$/.test(req.serial) && typeof req.gateId === 'string' && /^\d{1,19}$/.test(req.gateId)
    && typeof req.keyId === 'string' && isHex(req.keyId, 32) && typeof req.deviceTag === 'string' && isHex(req.deviceTag, 32)
    && Number.isSafeInteger(req.at) && typeof req.typeName === 'string' && req.typeName.length <= 80
    && typeof req.prevHash === 'string' && req.prevHash.length <= 64 && typeof req.signature === 'string' && !!req.cipher && typeof req.cipher === 'object';
}
/** Door config rules, enforced by the relay and mirrored in the organizer form. */
export function scheduleError(s: RelaySchedule, eventId: string): string | null {
  if (!s || typeof s !== 'object' || s.eventId !== eventId) return 'Event mismatch';
  if (!Number.isSafeInteger(s.doorsOpenAt) || !Number.isSafeInteger(s.doorsCloseAt) || !(s.doorsCloseAt > s.doorsOpenAt)) return 'Invalid door schedule';
  if (s.doorsCloseAt - s.doorsOpenAt > MAX_SCHEDULE_MS) return 'Doors can stay open 7 days at most';
  if (typeof s.eventName !== 'string' || s.eventName.length > 120) return 'Invalid event name';
  if (!Array.isArray(s.doors) || s.doors.length < 1 || s.doors.length > MAX_DOORS) return `Add 1 to ${MAX_DOORS} doors`;
  const seen = new Set<string>();
  for (const d of s.doors) {
    if (!d || typeof d.gateId !== 'string' || !/^[1-9]\d{0,18}$/.test(d.gateId) || d.gateId === SETTLEMENT_GATE) return 'Invalid door number';
    if (seen.has(d.gateId)) return 'Door numbers must be unique';
    seen.add(d.gateId);
    if (typeof d.name !== 'string' || !d.name.trim() || d.name.length > 60) return 'Each door needs a name (60 characters at most)';
    if (!Array.isArray(d.ticketTypes) || d.ticketTypes.length > 40 || d.ticketTypes.some(t => typeof t !== 'string' || t.length > 80)) return 'Invalid ticket types for a door';
    if (d.typeIds !== undefined && (!Array.isArray(d.typeIds) || d.typeIds.some(t => typeof t !== 'string' || !/^\d{1,39}$/.test(t)))) return 'Invalid ticket types for a door';
  }
  return null;
}
export function memoryKv(): DoorKv {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string) { return map.get(key) as T | undefined; },
    async put(key, value) { map.set(key, value); },
    async list(prefix) { return [...map].filter(([k]) => k.startsWith(prefix)).map(([key, value]) => ({ key, value })); },
    async delete(key) { map.delete(key); },
  };
}
