/** Device-local EGG-40 keys. P-256 keys are non-extractable CryptoKey objects. Door secrets stay on this device. */
import { exportPublicKeyRaw, generateNonExtractableEcdh, generateNonExtractableP256, organizerKeyFingerprint, randomDoorSecret, deviceTagFromPublicKey } from './deviceCrypto.ts';
import { doorKeyIdHex } from './doorKeyId.ts';
import type { ReserveRequest } from './relayProtocol.ts';

export type StaffRecord = {
  contract: string; eventId: string; gateId: string; keyId: string; deviceTag: string; publicKey: string;
  doorName: string; createdAt: number; doorSecret: Uint8Array; signKey: CryptoKey;
  log: Array<{ serial: string; at: number; request: ReserveRequest; sent: boolean }>;
};
export type OrganizerRecord = {
  contract: string; publicKey: string; fingerprint: string; ecdhKey: CryptoKey;
  settlement?: { eventId: string; keyId: string; doorSecret: Uint8Array; validFrom: number; validUntil: number; gateId: string };
};
export type KeyStore = {
  getStaff(contract: string, eventId: string): Promise<StaffRecord | null>;
  putStaff(row: StaffRecord): Promise<void>;
  deleteStaff(contract: string, eventId: string): Promise<void>;
  getOrganizer(contract: string): Promise<OrganizerRecord | null>;
  putOrganizer(row: OrganizerRecord): Promise<void>;
};

export function memoryKeyStore(): KeyStore {
  const staff = new Map<string, StaffRecord>();
  const org = new Map<string, OrganizerRecord>();
  return {
    async getStaff(c, e) { return staff.get(`${c}:${e}`) ?? null; },
    async putStaff(row) { staff.set(`${row.contract}:${row.eventId}`, row); },
    async deleteStaff(c, e) { staff.delete(`${c}:${e}`); },
    async getOrganizer(c) { return org.get(c) ?? null; },
    async putOrganizer(row) { org.set(row.contract, row); },
  };
}

const DB = 'cloaktix-egg40-keys-v1';
function idbStore(): KeyStore {
  const open = () => new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('staff')) db.createObjectStore('staff'); if (!db.objectStoreNames.contains('organizer')) db.createObjectStore('organizer'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const sk = (c: string, e: string) => `${c}:${e}`;
  const one = async <T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> => {
    const db = await open();
    return new Promise((resolve, reject) => { const q = run(db.transaction(store, mode).objectStore(store)); q.onsuccess = () => resolve(q.result as T); q.onerror = () => reject(q.error); });
  };
  return {
    async getStaff(c, e) { return (await one<StaffRecord | undefined>('staff', 'readonly', s => s.get(sk(c, e)))) ?? null; },
    async putStaff(row) { await one('staff', 'readwrite', s => s.put(row, sk(row.contract, row.eventId))); },
    async deleteStaff(c, e) { await one('staff', 'readwrite', s => s.delete(sk(c, e))); },
    async getOrganizer(c) { return (await one<OrganizerRecord | undefined>('organizer', 'readonly', s => s.get(c))) ?? null; },
    async putOrganizer(row) { await one('organizer', 'readwrite', s => s.put(row, row.contract)); },
  };
}

let singleton: KeyStore | undefined;
export function getKeyStore(): KeyStore {
  if (!singleton) singleton = typeof indexedDB !== 'undefined' ? idbStore() : memoryKeyStore();
  return singleton;
}
export function setKeyStoreForTests(store: KeyStore | undefined) { singleton = store; }

export async function ensureOrganizerKeys(store: KeyStore, contract: string): Promise<OrganizerRecord> {
  const existing = await store.getOrganizer(contract);
  if (existing) return existing;
  const pair = await generateNonExtractableEcdh();
  const publicKey = await exportPublicKeyRaw(pair.publicKey);
  const row: OrganizerRecord = { contract, publicKey, fingerprint: await organizerKeyFingerprint(publicKey), ecdhKey: pair.privateKey };
  await store.putOrganizer(row);
  return row;
}

export async function createStaffRecord(input: { contract: string; eventId: string; gateId: string; doorName: string; now?: number }): Promise<StaffRecord> {
  const sign = await generateNonExtractableP256();
  const publicKey = await exportPublicKeyRaw(sign.publicKey);
  const doorSecret = randomDoorSecret();
  return {
    contract: input.contract, eventId: input.eventId, gateId: input.gateId,
    keyId: await doorKeyIdHex(doorSecret), deviceTag: await deviceTagFromPublicKey(publicKey), publicKey,
    doorName: input.doorName, createdAt: input.now ?? Date.now(), doorSecret, signKey: sign.privateKey, log: [],
  };
}
