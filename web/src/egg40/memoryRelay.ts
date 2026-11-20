/** In-process EGG-40 relay with the same EventDoor rules as the Durable Object. */
import { EventDoor, memoryKv, type RegisterDeviceInput } from './eventDoor.ts';
import type { AuthorizedKey, DoorMode, RelaySchedule, ReserveRequest, ReserveResult, StoredEntry } from './relayProtocol.ts';
import { signOrgWrite, type ChainSource, type OrgAction, type OrgAuth, type OrgSigner } from './relayAuth.ts';

export type MemoryRelay = {
  offline: boolean;
  setOffline(value: boolean): void;
  door(eventId: string): EventDoor;
  health(): Promise<boolean>;
  schedule(eventId: string): Promise<RelaySchedule | null>;
  putSchedule(eventId: string, schedule: RelaySchedule): Promise<void>;
  mode(eventId: string): Promise<DoorMode>;
  setMode(eventId: string, mode: DoorMode): Promise<void>;
  organizerCrypto(eventId: string): Promise<{ publicKey: string; fingerprint: string } | null>;
  putOrganizerCrypto(eventId: string, publicKey: string, fingerprint: string): Promise<void>;
  registerDevice(eventId: string, body: RegisterDeviceInput): Promise<void>;
  authorizeKey(eventId: string, key: AuthorizedKey): Promise<void>;
  revokeKey(eventId: string, keyId: string): Promise<void>;
  getKey(eventId: string, keyId: string): Promise<AuthorizedKey | null>;
  listKeys(eventId: string): Promise<AuthorizedKey[]>;
  reserve(eventId: string, req: ReserveRequest): Promise<ReserveResult>;
  importEntries(eventId: string, entries: ReserveRequest[]): Promise<{ imported: number; skipped: number; used: number }>;
  entries(eventId: string): Promise<StoredEntry[]>;
  stats(eventId: string): Promise<Array<{ gateId: string; doorName: string; entries: number; lastEntryAt: number | null }>>;
  listMissed(eventId: string): Promise<Array<{ gateId: string; doorName: string; count: number }>>;
  offerMissed(eventId: string, gateId: string, doorName: string, entries: ReserveRequest[]): Promise<void>;
  takeAndImportMissed(eventId: string, gateId: string): Promise<{ imported: number; skipped: number; used: number }>;
};

/** Signer for organizer writes. Resolved at call time: the wallet session binds it after boot. */
export type SignerSource = () => OrgSigner | null;
export type RelayClientOptions = { signer?: SignerSource; now?: () => number };
export type MemoryRelayOptions = RelayClientOptions & { chain?: ChainSource };

class OfflineError extends Error { constructor() { super('Relay offline'); this.name = 'OfflineError'; } }

/** Organizer auth for a write, or undefined when no signer is bound (an unguarded door ignores it). */
export async function orgAuthFor(opts: RelayClientOptions, contract: string, eventId: string, action: OrgAction, payload: unknown): Promise<OrgAuth | undefined> {
  const signer = opts.signer?.();
  if (!signer) return undefined;
  return (await signOrgWrite(signer, contract, eventId, action, payload, (opts.now ?? Date.now)())).auth;
}

export function createMemoryRelay(contract: string, opts: MemoryRelayOptions = {}): MemoryRelay {
  const doors = new Map<string, EventDoor>();
  const door = (eventId: string) => {
    let d = doors.get(eventId);
    if (!d) { d = new EventDoor(contract, eventId, memoryKv(), { chain: opts.chain, now: opts.now }); doors.set(eventId, d); }
    return d;
  };
  const auth = (id: string, action: OrgAction, payload: unknown) => orgAuthFor(opts, contract, id, action, payload);
  let offline = false;
  const guard = async <T>(fn: () => Promise<T>): Promise<T> => { if (offline) throw new OfflineError(); return fn(); };
  return {
    get offline() { return offline; },
    setOffline(v) { offline = v; },
    door,
    health: async () => !offline,
    schedule: (id) => guard(() => door(id).getSchedule()),
    putSchedule: (id, s) => guard(async () => door(id).putSchedule(s, await auth(id, 'schedule', s))),
    mode: (id) => guard(() => door(id).getMode()),
    setMode: (id, m) => guard(async () => door(id).setMode(m, await auth(id, 'mode', { mode: m }))),
    organizerCrypto: (id) => guard(() => door(id).getOrganizerCrypto()),
    putOrganizerCrypto: (id, pk, fp) => guard(async () => door(id).putOrganizerCrypto(pk, fp, await auth(id, 'organizer-crypto', { publicKey: pk, fingerprint: fp }))),
    registerDevice: (id, body) => guard(() => door(id).registerDevice(body)),
    authorizeKey: (id, key) => guard(async () => door(id).authorizeKey(key, await auth(id, 'authorize-key', key))),
    revokeKey: (id, keyId) => guard(async () => door(id).revokeKey(keyId, await auth(id, `revoke-key:${keyId.toLowerCase()}`, { keyId }))),
    getKey: (id, keyId) => guard(() => door(id).getKey(keyId)),
    listKeys: (id) => guard(() => door(id).listKeys()),
    reserve: (id, req) => guard(() => door(id).reserve(req)),
    importEntries: (id, entries) => guard(async () => door(id).importEntries(entries, undefined, await auth(id, 'import', { entries }))),
    entries: (id) => guard(() => door(id).listEntries()),
    stats: (id) => guard(() => door(id).stats()),
    listMissed: (id) => guard(() => door(id).listMissed()),
    offerMissed: (id, g, n, e) => guard(() => door(id).offerMissed(g, n, e)),
    takeAndImportMissed: (id, g) => guard(async () => door(id).takeAndImportMissed(g, await auth(id, `import-missed:${g}`, { gateId: g }))),
  };
}
export type RelayClient = MemoryRelay;
