/** Publish public catalog details for an existing on-chain event. No new event is created. */
import { formatPublishedUsd, parseEventDetails, type EventDetails } from './model.ts';
import type { Session } from '../midnight/types.ts';
import { parseListingErrorBody, type ListingWriteFailure } from './listingErrors.ts';

const CAPPED = 0, UNLIMITED = 1;
const META_SKEW_MS = 600_000;
export const INDEXER_RETRY_STATUSES = new Set([403, 404, 503]);
export const KEY_WAIT_ATTEMPTS = 8;
export const PUBLISH_RETRY_ATTEMPTS = 4;
export const RETRY_DELAY_MS = 1500;

export type ListingRun = <T>(label: string, action: () => Promise<T>) => Promise<T | undefined>;
export type TicketLike = { id: bigint; eventId: bigint; price: bigint; resale: unknown; maxResale: bigint; priceUsdCents?: bigint };
export type PublishFn = (kind: 'ev' | 'tt', id: bigint, values: Record<string, string>) => Promise<boolean>;

export const metaMessage = (c: string, kind: string, id: string, ts: number, v: unknown) =>
  `cloaktix:meta:v1|${c}|${kind}|${id}|${ts}|${JSON.stringify(v)}`;

export function eventListedInCatalog(catalog: { events: { id: string }[] } | null | undefined, eventId: bigint): boolean {
  return !!catalog?.events.some((event) => event.id === String(eventId));
}

export function ticketListingValues(
  schema: number,
  type: TicketLike,
  name: string,
  cached?: { usdCents?: string },
): Record<string, string> {
  const cents = schema === 3 ? ((type.priceUsdCents ?? type.price).toString()) : cached?.usdCents;
  const values: Record<string, string> = {
    name,
    resaleSummary: Number(type.resale) === CAPPED
      ? (schema === 3 ? `Capped resale, maximum ${formatPublishedUsd(type.maxResale.toString())}` : 'Capped resale, live maximum confirmed after connection')
      : Number(type.resale) === UNLIMITED ? 'Unlimited resale' : 'No resale',
  };
  if (typeof cents === 'string') values.usdCents = cents;
  return values;
}

export async function publishExistingEventListing(args: {
  eventId: bigint;
  details: EventDetails;
  types: readonly TicketLike[];
  ticketValue: (type: TicketLike) => Record<string, string>;
  publish: PublishFn;
}): Promise<'ok' | 'failed' | 'options-pending'> {
  if (!parseEventDetails(args.details)) return 'failed';
  if (!await args.publish('ev', args.eventId, args.details)) return 'failed';
  let allSaved = true;
  for (const type of args.types) {
    if (!await args.publish('tt', type.id, args.ticketValue(type))) allSaved = false;
  }
  return allSaved ? 'ok' : 'options-pending';
}

export type PublishMetaDeps = {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function pkBytes(pk: string): Uint8Array {
  return Uint8Array.from(pk.match(/../g)!.map((h) => parseInt(h, 16)));
}

export type PublishMetaResult = { ok: true } | ListingWriteFailure;

/** Sign and POST public details. After a first-time key registration, wait for the indexer before writing. */
export async function publishMetaResult(
  s: Session,
  run: ListingRun,
  kind: 'ev' | 'tt',
  id: bigint,
  v: Record<string, string>,
  deps: PublishMetaDeps = {},
): Promise<PublishMetaResult> {
  const request = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const k = await s.metaKey();
  if (!k || !s.contract) return { ok: false, error: 'Organizer signing is unavailable in this browser.' };
  const st = await s.state();
  if (!st?.events.some((e) => e.mine && e.isKey)) {
    const registered = await run('Register organizer key (one-time)', () => s.call('createEvent', [{ bytes: pkBytes(k.pk) }]));
    if (!registered) return { ok: false, error: 'The one-time organizer key registration did not finish. If 1AM asked for approval, approve it, then retry Save details. That does not create a new event or ticket types.' };
    for (let i = 0; i < KEY_WAIT_ATTEMPTS; i++) {
      await sleep(RETRY_DELAY_MS);
      const again = await s.state().catch(() => null);
      if (again?.events.some((e) => e.mine && e.isKey)) break;
    }
  }
  const ts = now();
  if (!Number.isSafeInteger(ts)) return { ok: false, error: 'The listing timestamp was invalid.' };
  const { pk, sig } = await s.signMeta(metaMessage(s.contract, kind, String(id), ts, v));
  const body = JSON.stringify({ c: s.contract, kind, id: String(id), v, pk, ts, sig });
  let last: ListingWriteFailure = { ok: false };
  for (let attempt = 0; attempt < PUBLISH_RETRY_ATTEMPTS; attempt++) {
    if (attempt) await sleep(RETRY_DELAY_MS);
    if (Math.abs((deps.now ?? Date.now)() - ts) > META_SKEW_MS) return { ok: false, error: 'The listing request expired. Retry Save details. Do not create the event or ticket types again.' };
    const response = await request('/meta', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-cloaktix-indexer': s.config.indexerUri },
      body,
    }).catch(() => null);
    if (response?.ok) return { ok: true };
    if (response?.status === 409 && attempt > 0) return { ok: true };
    const text = response ? await response.text().catch(() => '') : '';
    last = { ok: false, status: response?.status, error: text ? parseListingErrorBody(text) : undefined };
    if (!response || !INDEXER_RETRY_STATUSES.has(response.status)) {
      if (response) console.warn('meta publish refused', response.status, last.error ?? '');
      return last;
    }
  }
  return last;
}

export async function publishMeta(
  s: Session,
  run: ListingRun,
  kind: 'ev' | 'tt',
  id: bigint,
  v: Record<string, string>,
  deps: PublishMetaDeps = {},
): Promise<boolean> {
  return (await publishMetaResult(s, run, kind, id, v, deps)).ok;
}
