/** Local, durable used-list and admit queue. No secrets. Shared across same-origin gates. */
export type UsedStatus = 'pending' | 'committed' | 'failed';

export type UsedEntry = {
  contract: string;
  serial: string;
  at: string;
  doorLabel: string;
  status: UsedStatus;
};

export type QueuedAdmit = {
  id: string;
  contract: string;
  schema: 2 | 3 | 4;
  serial: string;
  typeId: string;
  qrText: string;
  doorId: string;
  doorLabel: string;
  acceptedTypeIds: string[];
  queuedAt: string;
  attempts: number;
  lastError: string;
};

export type GateAdmitSnapshot = { used: UsedEntry[]; queue: QueuedAdmit[] };

export interface GateAdmitStore {
  getUsed(contract: string, serial: string): Promise<UsedEntry | undefined>;
  /** Returns the existing row if the serial was already claimed, otherwise the new row. */
  claimUsed(entry: UsedEntry): Promise<{ claimed: boolean; entry: UsedEntry }>;
  putUsed(entry: UsedEntry): Promise<void>;
  listUsed(contract: string): Promise<UsedEntry[]>;
  putQueue(item: QueuedAdmit): Promise<void>;
  removeQueue(id: string): Promise<void>;
  listQueue(contract: string): Promise<QueuedAdmit[]>;
  pendingCount(contract: string): Promise<number>;
  snapshot(): Promise<GateAdmitSnapshot>;
  restore(data: GateAdmitSnapshot): Promise<void>;
  subscribe(listener: () => void): () => void;
}

const usedKey = (contract: string, serial: string) => `${contract}::${serial}`;

export function createMemoryStore(initial?: GateAdmitSnapshot): GateAdmitStore {
  const used = new Map<string, UsedEntry>();
  const queue = new Map<string, QueuedAdmit>();
  const listeners = new Set<() => void>();
  if (initial) applySnapshot(used, queue, initial);
  const notify = () => { for (const l of listeners) l(); };
  return {
    async getUsed(contract, serial) { return used.get(usedKey(contract, serial)); },
    async claimUsed(entry) {
      const key = usedKey(entry.contract, entry.serial);
      const existing = used.get(key);
      if (existing) return { claimed: false, entry: existing };
      used.set(key, entry);
      notify();
      return { claimed: true, entry };
    },
    async putUsed(entry) { used.set(usedKey(entry.contract, entry.serial), entry); notify(); },
    async listUsed(contract) { return [...used.values()].filter((e) => e.contract === contract); },
    async putQueue(item) { queue.set(item.id, item); notify(); },
    async removeQueue(id) { queue.delete(id); notify(); },
    async listQueue(contract) {
      return [...queue.values()].filter((e) => e.contract === contract).sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
    },
    async pendingCount(contract) { return (await this.listQueue(contract)).length; },
    async snapshot() { return { used: [...used.values()], queue: [...queue.values()] }; },
    async restore(data) { used.clear(); queue.clear(); applySnapshot(used, queue, data); notify(); },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}

function applySnapshot(used: Map<string, UsedEntry>, queue: Map<string, QueuedAdmit>, data: GateAdmitSnapshot) {
  for (const row of data.used) used.set(usedKey(row.contract, row.serial), row);
  for (const row of data.queue) queue.set(row.id, row);
}

/** Two gates that share one backing store, like two doors on the same sync ledger. */
export function createLinkedMemoryStores(): [GateAdmitStore, GateAdmitStore] {
  const shared = createMemoryStore();
  return [shared, shared];
}

const DB_NAME = 'cloaktix-gate-admit-v1';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('used')) db.createObjectStore('used', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

type UsedRow = UsedEntry & { key: string };

export function createIndexedDbStore(): GateAdmitStore {
  const listeners = new Set<() => void>();
  const notify = () => { for (const l of listeners) l(); };
  const tx = async <T>(name: 'used' | 'queue', mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(name, mode);
      const store = transaction.objectStore(name);
      const req = run(store);
      transaction.oncomplete = () => resolve((req ? req.result : undefined) as T);
      transaction.onerror = () => reject(transaction.error);
      if (req) req.onerror = () => reject(req.error);
    });
  };
  return {
    async getUsed(contract, serial) {
      const row = await tx<UsedRow>('used', 'readonly', (s) => s.get(usedKey(contract, serial)));
      return row ? stripKey(row) : undefined;
    },
    async claimUsed(entry) {
      const db = await openDb();
      const result = await new Promise<{ claimed: boolean; entry: UsedEntry }>((resolve, reject) => {
        const transaction = db.transaction('used', 'readwrite');
        const store = transaction.objectStore('used');
        const key = usedKey(entry.contract, entry.serial);
        const get = store.get(key);
        get.onsuccess = () => {
          const existing = get.result as UsedRow | undefined;
          if (existing) {
            resolve({ claimed: false, entry: stripKey(existing) });
            return;
          }
          store.put({ ...entry, key });
        };
        transaction.oncomplete = () => resolve({ claimed: true, entry });
        transaction.onerror = () => reject(transaction.error);
      });
      if (result.claimed) notify();
      return result;
    },
    async putUsed(entry) {
      await tx('used', 'readwrite', (s) => s.put({ ...entry, key: usedKey(entry.contract, entry.serial) }));
      notify();
    },
    async listUsed(contract) {
      const rows = (await tx<UsedRow[]>('used', 'readonly', (s) => s.getAll())) ?? [];
      return rows.filter((e) => e.contract === contract).map(stripKey);
    },
    async putQueue(item) { await tx('queue', 'readwrite', (s) => s.put(item)); notify(); },
    async removeQueue(id) { await tx('queue', 'readwrite', (s) => s.delete(id)); notify(); },
    async listQueue(contract) {
      const rows = (await tx<QueuedAdmit[]>('queue', 'readonly', (s) => s.getAll())) ?? [];
      return rows.filter((e) => e.contract === contract).sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
    },
    async pendingCount(contract) { return (await this.listQueue(contract)).length; },
    async snapshot() {
      const used = ((await tx<UsedRow[]>('used', 'readonly', (s) => s.getAll())) ?? []).map(stripKey);
      const queue = (await tx<QueuedAdmit[]>('queue', 'readonly', (s) => s.getAll())) ?? [];
      return { used, queue };
    },
    async restore(data) {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['used', 'queue'], 'readwrite');
        const usedStore = transaction.objectStore('used');
        const queueStore = transaction.objectStore('queue');
        usedStore.clear();
        queueStore.clear();
        for (const row of data.used) usedStore.put({ ...row, key: usedKey(row.contract, row.serial) });
        for (const row of data.queue) queueStore.put(row);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      notify();
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}

function stripKey(row: UsedRow): UsedEntry {
  const { key: _key, ...entry } = row;
  return entry;
}

const CHANNEL = 'cloaktix:gate:admit-sync';

export function withBroadcastSync(store: GateAdmitStore): GateAdmitStore {
  const extra = new Set<() => void>();
  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => { for (const l of extra) l(); };
  }
  const notifyPeers = () => { try { channel?.postMessage({ t: Date.now() }); } catch { /* closed */ } };
  const wrap = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, writes: boolean) =>
    async (...args: A) => {
      const result = await fn(...args);
      if (writes) notifyPeers();
      return result;
    };
  return {
    getUsed: store.getUsed.bind(store),
    claimUsed: wrap(store.claimUsed.bind(store), true),
    putUsed: wrap(store.putUsed.bind(store), true),
    listUsed: store.listUsed.bind(store),
    putQueue: wrap(store.putQueue.bind(store), true),
    removeQueue: wrap(store.removeQueue.bind(store), true),
    listQueue: store.listQueue.bind(store),
    pendingCount: store.pendingCount.bind(store),
    snapshot: store.snapshot.bind(store),
    restore: wrap(store.restore.bind(store), true),
    subscribe(listener) {
      extra.add(listener);
      const off = store.subscribe(listener);
      return () => { extra.delete(listener); off(); };
    },
  };
}

let singleton: GateAdmitStore | undefined;

export function getGateAdmitStore(): GateAdmitStore {
  if (singleton) return singleton;
  if (typeof indexedDB !== 'undefined') singleton = withBroadcastSync(createIndexedDbStore());
  else singleton = createMemoryStore();
  return singleton;
}

export function setGateAdmitStoreForTests(store: GateAdmitStore | undefined) {
  singleton = store;
}
