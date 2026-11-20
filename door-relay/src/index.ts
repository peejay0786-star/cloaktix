/**
 * CloakTix EGG-40 door relay. One Durable Object per event (contract + eventId).
 * EGG-41: every state-changing route is authorized against the EGG-40 contract read from the indexer
 * (see web/src/egg40/relayAuth.ts and eventDoor.ts). Indexer unreachable = 503, nothing changed.
 * Only the contract in EGG40_CONTRACT is served. Deploy only with "EGG-41 oui".
 */
import { DurableObject } from 'cloudflare:workers';
import { EventDoor } from '../../web/src/egg40/eventDoor.ts';
import type { ChainSource } from '../../web/src/egg40/relayAuth.ts';
import { EVENT_ID, HEX64, cors, doKv, json, routeDoor } from './routes.ts';
import { indexerChainSource } from '../../web/src/egg40/chainDoorState.ts';

export interface Env {
  EVENT_DOOR: DurableObjectNamespace;
  /** EGG-40 contract address (64 hex). Requests for any other contract are refused. */
  EGG40_CONTRACT: string;
  /** Indexer GraphQL endpoint the relay trusts (fixed by config, never taken from the request). */
  INDEXER_URL: string;
  /** Browser origin allowed by CORS (the app). */
  ALLOWED_ORIGIN?: string;
}

export class EventDoorObject extends DurableObject<Env> {
  private chainSource?: ChainSource;
  private chain(): ChainSource {
    return this.chainSource ??= indexerChainSource({ indexerUrl: this.env.INDEXER_URL, contract: this.env.EGG40_CONTRACT.toLowerCase() });
  }
  async fetch(request: Request): Promise<Response> {
    return routeDoor(request, this.env, (contract, eventId) => new EventDoor(contract, eventId, doKv(this.ctx.storage), { chain: this.chain() }));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/') return json(env, { ok: true, service: 'cloaktix-door-relay', protocol: 'cloaktix-door-relay/v1', auth: 'egg41' });
    if (!HEX64.test(env.EGG40_CONTRACT?.toLowerCase() ?? '') || !env.INDEXER_URL) return json(env, { ok: false, reason: 'Relay not configured' }, 503);
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts[0] !== 'events' || parts.length < 3 || parts[1].toLowerCase() !== env.EGG40_CONTRACT.toLowerCase() || !EVENT_ID.test(parts[2])) {
      return json(env, { ok: false, reason: 'Not found' }, 404);
    }
    const name = `${parts[1].toLowerCase()}:${parts[2]}`;
    return env.EVENT_DOOR.get(env.EVENT_DOOR.idFromName(name)).fetch(request);
  },
};
