import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buyerCatalog } from '../src/catalog/buyerView.ts';
import { parseEventDetails } from '../src/catalog/model.ts';
import {
  eventListedInCatalog,
  publishExistingEventListing,
  publishMeta,
  ticketListingValues,
  INDEXER_RETRY_STATUSES,
  KEY_WAIT_ATTEMPTS,
  PUBLISH_RETRY_ATTEMPTS,
} from '../src/catalog/listingPublish.ts';

const details = {
  name: 'CloakTix Launch Night',
  date: '2026-12-12',
  venue: 'Montreal, QC',
  cover: '/art/neon-nights.webp',
  demoArt: 'true',
  description: 'A private launch night for CloakTix in Montreal. Buy with NIGHT on Midnight, then enter with a single-use pass. General admission is open to everyone. The after party is 18+ and asks only for a proof of age, not a birthdate.',
};
const contract = 'ab'.repeat(32);
const ev = (id: string, tickets: { id: string; name: string; usdCents?: string; resaleSummary: string }[]) => ({
  id, ...details, publishedAt: 1, tickets,
});

describe('CT-CATALOG-WALLETLESS: existing event can be listed without recreating it', () => {
  it('does not list an on-chain event until public details and ticket options are published', () => {
    const empty = buyerCatalog({ source: 'organizer-published', contract, events: [] });
    assert.equal(empty.events.length, 0);
    assert.equal(eventListedInCatalog(empty, 1n), false);
    const detailsOnly = buyerCatalog({ source: 'organizer-published', contract, events: [ev('1', [])] });
    assert.equal(detailsOnly.events.length, 0, 'buyer catalog hides events with no ticket options');
    const listed = buyerCatalog({ source: 'organizer-published', contract, events: [ev('1', [{ id: '3', name: 'General admission', usdCents: '5000', resaleSummary: 'Capped resale, maximum $75.00 USD' }])] });
    assert.equal(eventListedInCatalog(listed, 1n), true);
    assert.equal(listed.events[0].name, 'CloakTix Launch Night');
  });

  it('publishes existing event details and ticket options without calling createEvent', async () => {
    const writes: string[] = [];
    const types = [
      { id: 3n, eventId: 1n, price: 5000n, resale: 0, maxResale: 7500n },
      { id: 4n, eventId: 1n, price: 7500n, resale: 1, maxResale: 0n },
    ];
    const result = await publishExistingEventListing({
      eventId: 1n,
      details,
      types,
      ticketValue: (type) => ticketListingValues(3, type, type.id === 3n ? 'General admission' : 'After party'),
      publish: async (kind, id, values) => { writes.push(`${kind}:${id}:${values.name}`); return true; },
    });
    assert.equal(result, 'ok');
    assert.deepEqual(writes, ['ev:1:CloakTix Launch Night', 'tt:3:General admission', 'tt:4:After party']);
    assert.equal(ticketListingValues(3, types[0], 'General admission').usdCents, '5000');
    assert.match(ticketListingValues(3, types[0], 'General admission').resaleSummary, /Capped resale, maximum \$75\.00 USD/);
    assert.equal(ticketListingValues(3, types[1], 'After party').resaleSummary, 'Unlimited resale');
  });

  it('stops without writing ticket options if event details are rejected', async () => {
    const writes: string[] = [];
    const result = await publishExistingEventListing({
      eventId: 1n,
      details: { ...details, name: 'Event #1' },
      types: [{ id: 3n, eventId: 1n, price: 5000n, resale: 0, maxResale: 7500n }],
      ticketValue: (type) => ticketListingValues(3, type, 'General admission'),
      publish: async (kind, id) => { writes.push(`${kind}:${id}`); return true; },
    });
    assert.equal(result, 'failed');
    assert.deepEqual(writes, []);
  });

  it('reports options-pending when ticket option writes fail after a successful event write', async () => {
    const result = await publishExistingEventListing({
      eventId: 1n,
      details,
      types: [{ id: 3n, eventId: 1n, price: 5000n, resale: 0, maxResale: 7500n }],
      ticketValue: (type) => ticketListingValues(3, type, 'General admission'),
      publish: async (kind) => kind === 'ev',
    });
    assert.equal(result, 'options-pending');
  });

  it('waits for the key-registration event to be indexed, then retries 403/404/503 catalog writes', async () => {
    assert.deepEqual([...INDEXER_RETRY_STATUSES].sort((a, b) => a - b), [403, 404, 503]);
    let stateReads = 0;
    const posts: number[] = [];
    const sleeps: number[] = [];
    const session = {
      contract,
      config: { indexerUri: 'https://indexer.example.test' },
      metaKey: async () => ({ pk: 'aa'.repeat(32) }),
      state: async () => {
        stateReads += 1;
        return { events: stateReads >= 3 ? [{ mine: true, isKey: true }] : [{ mine: true, isKey: false }] };
      },
      call: async () => ({ result: 2n }),
      signMeta: async () => ({ pk: 'aa'.repeat(32), sig: 'bb'.repeat(64) }),
    };
    const runs: string[] = [];
    const responses = [404, 403, 201];
    const ok = await publishMeta(
      session as never,
      async (label, action) => { runs.push(label); return action(); },
      'ev',
      1n,
      details,
      {
        sleep: async (ms) => { sleeps.push(ms); },
        now: () => 1_700_000_000_000,
        fetch: async () => {
          const status = responses.shift() ?? 500;
          posts.push(status);
          return new Response(status === 201 ? '{"ok":true}' : '{"error":"not indexed"}', { status });
        },
      },
    );
    assert.equal(ok, true);
    assert.deepEqual(runs, ['Register organizer key (one-time)']);
    assert.ok(stateReads >= 3);
    assert.deepEqual(posts, [404, 403, 201]);
    assert.ok(sleeps.length >= 2);
    assert.ok(sleeps.length < KEY_WAIT_ATTEMPTS + PUBLISH_RETRY_ATTEMPTS);
    assert.equal(PUBLISH_RETRY_ATTEMPTS, 4);
    assert.ok(sleeps.every((ms) => ms === 1500));
  });

  it('wires Organize event to a publish button and does not auto-submit', () => {
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /function PublicListingPanel/);
    assert.match(app, /Publish to public catalog/);
    assert.match(app, /<PublicListingPanel s=\{s\} st=\{st\} run=\{run\} eventId=\{eventId\} \/>/);
    assert.match(app, /This does not create a new event and does not change existing tickets/);
    assert.doesNotMatch(app, /void publish\(\);/);
    assert.match(app, /onClick=\{\(\) => void publish\(\)\}/);
  });

  it('accepts the Launch Night kit copy and rejects em-dashes in new listing copy', () => {
    assert.ok(parseEventDetails(details));
    assert.doesNotMatch(details.description, /[—–]/);
    const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    const start = app.indexOf('function PublicListingPanel');
    const end = app.indexOf('export function OrganizeEventButton');
    assert.ok(start >= 0 && end > start);
    assert.doesNotMatch(app.slice(start, end), /[—–]/);
  });
});
