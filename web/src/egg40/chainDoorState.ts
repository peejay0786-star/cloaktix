/** Decode the EGG-40 ledger fields the door relay authorizes against (events + doorKeys). Worker and tests. */
import { ContractState } from '@midnight-ntwrk/midnight-js-protocol/v9/onchain-runtime';
import { ledger as egg40 } from '../../../contract/managed/cloaktix-egg40/contract/index.js';
import type { DoorChainSnapshot } from './relayAuth.ts';

const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const fieldHex = (k: bigint) => k.toString(16).padStart(64, '0');

export function decodeDoorChainState(stateHex: string): DoorChainSnapshot {
  if (!/^[0-9a-f]+$/i.test(stateHex) || stateHex.length % 2) throw new Error('Invalid indexed state');
  const state = ContractState.deserialize(Uint8Array.from(stateHex.match(/../g) ?? [], x => parseInt(x, 16)));
  if (!state.operations().some(op => String(op) === 'authorizeDoorKey')) throw new Error('Not an EGG-40 contract');
  const l: any = egg40(state.data);
  return {
    events: new Map([...l.events].map(([id, e]: [bigint, any]) => [String(id), { organizer: hex(e.organizer), payout: hex(e.payout.bytes) }])),
    doorKeys: new Map([...l.doorKeys].map(([k, d]: [bigint, any]) => [fieldHex(k), {
      eventId: String(d.eventId), gateId: String(d.gateId), deviceTag: hex(d.deviceTag),
      validFrom: Number(d.validFrom), validUntil: Number(d.validUntil), active: !!d.active,
    }])),
  };
}

/** EGG-44: tickets of the indexed EGG-40 state (serial, type, event via the ticket type, status, admit epoch). */
export function decodeTicketState(stateHex: string): Array<{ serial: string; typeId: string; eventId: string; status: number; hasAdmit: boolean; epoch: string }> {
  if (!/^[0-9a-f]+$/i.test(stateHex) || stateHex.length % 2) throw new Error('Invalid indexed state');
  const state = ContractState.deserialize(Uint8Array.from(stateHex.match(/../g) ?? [], x => parseInt(x, 16)));
  if (!state.operations().some(op => String(op) === 'authorizeDoorKey')) throw new Error('Not an EGG-40 contract');
  const l: any = egg40(state.data);
  const out = [];
  for (const [serial, t] of l.tickets as Iterable<[bigint, any]>) {
    const type = l.ticketTypes.member(t.typeId) ? l.ticketTypes.lookup(t.typeId) : null;
    out.push({ serial: String(serial), typeId: String(t.typeId), eventId: type ? String(type.eventId) : '0', status: Number(t.status), hasAdmit: !!t.hasAdmit, epoch: String(t.epoch) });
  }
  return out;
}

/** Indexer read used by the relay Worker. Any failure throws: the relay never authorizes on a missing read. */
export function indexerChainSource(opts: { indexerUrl: string; contract: string; fetcher?: typeof fetch; ttlMs?: number; minFreshMs?: number; now?: () => number }) {
  const fetcher = opts.fetcher ?? fetch;
  const ttl = opts.ttlMs ?? 5000;
  // A forced re-read (key just authorized) is honored at most every 2 s, so requests cannot hammer the indexer.
  const minFresh = opts.minFreshMs ?? 2000;
  const now = opts.now ?? Date.now;
  let cache: { at: number; snap: DoorChainSnapshot } | null = null;
  return async ({ fresh = false }: { fresh?: boolean } = {}): Promise<DoorChainSnapshot> => {
    if (cache && now() - cache.at < (fresh ? minFresh : ttl)) return cache.snap;
    const r = await fetcher(opts.indexerUrl, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'query($a:HexEncoded!){contractAction(address:$a){state}}', variables: { a: opts.contract } }),
    });
    if (!r.ok) throw new Error(`Indexer HTTP ${r.status}`);
    const body: any = await r.json();
    const stateHex = body?.data?.contractAction?.state;
    if (body?.errors || typeof stateHex !== 'string') throw new Error('Indexer returned no contract state');
    const snap = decodeDoorChainState(stateHex);
    cache = { at: now(), snap };
    return snap;
  };
}
