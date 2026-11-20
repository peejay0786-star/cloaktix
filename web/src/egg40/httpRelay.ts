/**
 * HTTP client for the EGG-40 door relay (Durable Object per event).
 * Same rules as the in-process memory relay; the Durable Object is the authority.
 * EGG-41: organizer writes are sent as { payload, auth } signed with the organizer key bound on-chain.
 */
import type { AuthorizedKey, DoorMode, ReserveRequest, ReserveResult, StoredEntry } from './relayProtocol.ts';
import { orgAuthFor, type MemoryRelay, type RelayClientOptions } from './memoryRelay.ts';
import type { OrgAction } from './relayAuth.ts';

class OfflineError extends Error { constructor() { super('Relay offline'); this.name = 'OfflineError'; } }
export const NO_ORGANIZER_SIGNER = 'Connect the organizer wallet on this device to change doors or door keys.';

export function createHttpRelay(contract: string, baseUrl: string, fetcher: typeof fetch = fetch, opts: RelayClientOptions = {}): MemoryRelay {
  const root = baseUrl.replace(/\/+$/, '');
  let offline = false;
  const ev = (eventId: string) => `${root}/events/${contract}/${eventId}`;
  const req = async (url: string, init?: RequestInit): Promise<any> => {
    if (offline) throw new OfflineError();
    const r = await fetcher(url, { ...init, headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}), ...(init?.headers ?? {}) } });
    const body = await r.json().catch(() => ({ ok: false, reason: r.statusText }));
    if (!r.ok && body?.reason) {
      if (init?.method === 'POST' && url.endsWith('/reserve')) return body as ReserveResult;
      throw new Error(String(body.reason));
    }
    if (!r.ok) throw new OfflineError();
    return body;
  };
  /** Organizer-only write: refuses locally when no organizer signer is bound (the relay would refuse anyway). */
  const orgWrite = async (eventId: string, path: string, method: string, action: OrgAction, payload: unknown) => {
    const auth = await orgAuthFor(opts, contract, eventId, action, payload);
    if (!auth) throw new Error(NO_ORGANIZER_SIGNER);
    return req(`${ev(eventId)}${path}`, { method, body: JSON.stringify({ payload, auth }) });
  };
  return {
    get offline() { return offline; },
    setOffline(v) { offline = v; },
    door() { throw new Error('HTTP relay has no in-process EventDoor'); },
    health: async () => { if (offline) return false; try { const r = await fetcher(`${root}/health`); return r.ok; } catch { return false; } },
    schedule: async (id) => (await req(`${ev(id)}/schedule`)).schedule ?? null,
    putSchedule: async (id, s) => { await orgWrite(id, '/schedule', 'PUT', 'schedule', s); },
    mode: async (id) => (await req(`${ev(id)}/mode`)).mode ?? 'walletless',
    setMode: async (id, m: DoorMode) => { await orgWrite(id, '/mode', 'PUT', 'mode', { mode: m }); },
    organizerCrypto: async (id) => (await req(`${ev(id)}/organizer-crypto`)).crypto ?? null,
    putOrganizerCrypto: async (id, pk, fp) => { await orgWrite(id, '/organizer-crypto', 'PUT', 'organizer-crypto', { publicKey: pk, fingerprint: fp }); },
    registerDevice: async (id, body) => { await req(`${ev(id)}/devices`, { method: 'POST', body: JSON.stringify(body) }); },
    authorizeKey: async (id, key: AuthorizedKey) => { await orgWrite(id, '/keys', 'PUT', 'authorize-key', key); },
    revokeKey: async (id, keyId) => { await orgWrite(id, `/keys/${keyId}/revoke`, 'POST', `revoke-key:${keyId.toLowerCase()}`, { keyId }); },
    getKey: async (id, keyId) => (await req(`${ev(id)}/keys/${keyId}`)).key ?? null,
    listKeys: async (id) => (await req(`${ev(id)}/keys`)).keys ?? [],
    reserve: async (id, body: ReserveRequest) => (await req(`${ev(id)}/reserve`, { method: 'POST', body: JSON.stringify(body) })) as ReserveResult,
    importEntries: async (id, entries) => { const r = await orgWrite(id, '/import', 'POST', 'import', { entries }); return { imported: r.imported ?? 0, skipped: r.skipped ?? 0, used: r.used ?? 0 }; },
    entries: async (id) => ((await req(`${ev(id)}/entries`)).entries ?? []) as StoredEntry[],
    stats: async (id) => (await req(`${ev(id)}/stats`)).stats ?? [],
    listMissed: async (id) => (await req(`${ev(id)}/missed`)).missed ?? [],
    offerMissed: async (id, g, n, e) => { await req(`${ev(id)}/missed`, { method: 'POST', body: JSON.stringify({ gateId: g, doorName: n, entries: e }) }); },
    takeAndImportMissed: async (id, g) => {
      const r = await orgWrite(id, `/missed/${g}/import`, 'POST', `import-missed:${g}`, { gateId: g });
      return { imported: r.imported ?? 0, skipped: r.skipped ?? 0, used: r.used ?? 0 };
    },
  };
}
