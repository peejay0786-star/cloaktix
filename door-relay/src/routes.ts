/** Door relay HTTP routes (no Cloudflare imports, so node tests drive the exact routing the Worker uses). */
import { EventDoor, RelayError, type DoorKv, type RegisterDeviceInput } from '../../web/src/egg40/eventDoor.ts';
import type { AuthorizedKey, RelaySchedule, ReserveRequest, DoorMode } from '../../web/src/egg40/relayProtocol.ts';
import type { OrgAuth } from '../../web/src/egg40/relayAuth.ts';

export type RelayEnv = { EGG40_CONTRACT: string; INDEXER_URL: string; ALLOWED_ORIGIN?: string };
const MAX_BODY = 512 * 1024;
export const HEX64 = /^[0-9a-f]{64}$/;
export const EVENT_ID = /^[1-9]\d{0,18}$/;

export function doKv(storage: DurableObjectStorage): DoorKv {
  return {
    async get<T>(key: string) { return await storage.get(key) as T | undefined; },
    async put(key, value) { await storage.put(key, value as never); },
    async list(prefix) {
      const raw = await storage.list({ prefix });
      const out: Array<{ key: string; value: unknown }> = [];
      raw.forEach((value, key) => { out.push({ key, value }); });
      return out;
    },
    async delete(key) { await storage.delete(key); },
  };
}

export function cors(env: RelayEnv): Record<string, string> {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  };
}
export function json(env: RelayEnv, data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { ...cors(env), 'cache-control': 'no-store' } });
}
async function body<T>(request: Request): Promise<T> {
  const len = Number(request.headers.get('content-length') ?? '0');
  if (len > MAX_BODY) throw new RelayError('Request too large', 413);
  const text = await request.text();
  if (text.length > MAX_BODY) throw new RelayError('Request too large', 413);
  try { return JSON.parse(text) as T; } catch { throw new RelayError('Invalid JSON', 400); }
}
type Signed<T> = { payload: T; auth?: OrgAuth };
async function signed<T>(request: Request): Promise<Signed<T>> {
  const b = await body<Signed<T>>(request);
  if (!b || typeof b !== 'object' || !('payload' in b)) throw new RelayError('Organizer signature required.', 401);
  return b;
}

export async function routeDoor(request: Request, env: RelayEnv, door: (contract: string, eventId: string) => EventDoor): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'events' || parts.length < 3) return json(env, { ok: false, reason: 'Not found' }, 404);
  const contract = parts[1].toLowerCase();
  const eventId = parts[2];
  if (contract !== env.EGG40_CONTRACT?.toLowerCase() || !EVENT_ID.test(eventId)) return json(env, { ok: false, reason: 'Not found' }, 404);
  const rest = parts.slice(3);
  const d = door(contract, eventId);
  const m = request.method;
  try {
    if (m === 'GET' && rest.length === 0) return json(env, { ok: true, contract, eventId });
    if (m === 'GET' && rest[0] === 'schedule' && rest.length === 1) return json(env, { ok: true, schedule: await d.getSchedule() });
    if (m === 'PUT' && rest[0] === 'schedule' && rest.length === 1) { const b = await signed<RelaySchedule>(request); await d.putSchedule(b.payload, b.auth); return json(env, { ok: true }); }
    if (m === 'GET' && rest[0] === 'mode' && rest.length === 1) return json(env, { ok: true, mode: await d.getMode() });
    if (m === 'PUT' && rest[0] === 'mode' && rest.length === 1) { const b = await signed<{ mode: DoorMode }>(request); await d.setMode(b.payload?.mode, b.auth); return json(env, { ok: true, mode: await d.getMode() }); }
    if (m === 'GET' && rest[0] === 'organizer-crypto' && rest.length === 1) return json(env, { ok: true, crypto: await d.getOrganizerCrypto() });
    if (m === 'PUT' && rest[0] === 'organizer-crypto' && rest.length === 1) { const b = await signed<{ publicKey: string; fingerprint: string }>(request); await d.putOrganizerCrypto(b.payload?.publicKey, b.payload?.fingerprint, b.auth); return json(env, { ok: true }); }
    if (m === 'POST' && rest[0] === 'devices' && rest.length === 1) { await d.registerDevice(await body<RegisterDeviceInput>(request)); return json(env, { ok: true }); }
    if (m === 'GET' && rest[0] === 'keys' && rest.length === 1) return json(env, { ok: true, keys: await d.listKeys() });
    if (m === 'GET' && rest[0] === 'keys' && rest.length === 2) return json(env, { ok: true, key: await d.getKey(rest[1]) });
    if (m === 'PUT' && rest[0] === 'keys' && rest.length === 1) { const b = await signed<AuthorizedKey>(request); await d.authorizeKey(b.payload, b.auth); return json(env, { ok: true }); }
    if (m === 'POST' && rest[0] === 'keys' && rest[1] && rest[2] === 'revoke' && rest.length === 3) {
      const b = await signed<{ keyId: string }>(request);
      if (b.payload?.keyId?.toLowerCase() !== rest[1].toLowerCase()) throw new RelayError('Key mismatch', 400);
      await d.revokeKey(rest[1], b.auth); return json(env, { ok: true });
    }
    if (m === 'POST' && rest[0] === 'reserve' && rest.length === 1) { const result = await d.reserve(await body<ReserveRequest>(request)); return json(env, result, result.ok ? 200 : result.reason === 'already-used' || result.reason === 'replay' ? 409 : 400); }
    if (m === 'POST' && rest[0] === 'import' && rest.length === 1) { const b = await signed<{ entries: ReserveRequest[] }>(request); return json(env, { ok: true, ...(await d.importEntries(b.payload?.entries, undefined, b.auth)) }); }
    if (m === 'GET' && rest[0] === 'entries' && rest.length === 1) return json(env, { ok: true, entries: await d.listEntries() });
    if (m === 'GET' && rest[0] === 'stats' && rest.length === 1) return json(env, { ok: true, stats: await d.stats() });
    if (m === 'GET' && rest[0] === 'missed' && rest.length === 1) return json(env, { ok: true, missed: await d.listMissed() });
    if (m === 'POST' && rest[0] === 'missed' && rest.length === 1) { const b = await body<{ gateId: string; doorName: string; entries: ReserveRequest[] }>(request); await d.offerMissed(String(b?.gateId), String(b?.doorName ?? ''), b?.entries); return json(env, { ok: true }); }
    if (m === 'POST' && rest[0] === 'missed' && rest[1] && rest[2] === 'import' && rest.length === 3) {
      const b = await signed<{ gateId: string }>(request);
      if (b.payload?.gateId !== rest[1]) throw new RelayError('Door mismatch', 400);
      return json(env, { ok: true, ...(await d.takeAndImportMissed(rest[1], b.auth)) });
    }
    if (m === 'GET' && rest[0] === 'health' && rest.length === 1) return json(env, { ok: true, status: 'online' });
    return json(env, { ok: false, reason: 'Not found' }, 404);
  } catch (e) {
    const err = e as RelayError;
    if (err instanceof RelayError) return json(env, { ok: false, reason: err.message }, err.status);
    return json(env, { ok: false, reason: 'Relay error. Nothing was changed.' }, 500);
  }
}
