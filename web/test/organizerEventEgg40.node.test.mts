/** EGG-40 manage page: no stale schema-4 Doors note (Door keys live in the EGG-40 panel). Same harness as organizerEvent. */
import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { organizerEventFromLocation, organizerEventHref, ownedOrganizerEvent, organizerEventStats } from '../src/organizer/eventRoute.ts';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.organizer-event-egg40-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'location', { configurable: true, value: { pathname: '/organizer', search: '?network=preview&schema=3', hash: '#organizer', origin: 'http://local.test' } });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });
buildSync({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {Organizer,OrganizerEvent,OrganizeEventButton} from './src/App';import {RatesContext} from './src/useRates';
const render=(C,props)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(C,props)));
export const list=props=>render(Organizer,props);
export const manage=props=>render(OrganizerEvent,{onBack(){},...props});
export const button=(props)=>OrganizeEventButton(props);
`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview', VITE_EGG40_CONTRACT: 'ab'.repeat(32) }) }, outfile: dir + '/ui.mjs', logLevel: 'error' });
const ui = await import(pathToFileURL(dir + '/ui.mjs').href);
const contract = 'ab'.repeat(32);
const session = (schema = 3) => ({ schema, networkId: 'preview', contract, accountId: 'cd'.repeat(32), walletName: 'Test wallet', idSource: 'wallet' });
const type = (id: bigint, eventId: bigint) => ({ id, eventId, price: 1000n, maxResale: 1200n, fee: 0n, sold: 3n, supply: 25n, adultOnly: false, resale: 0 });
function state(schemaVersion = 3) {
  const ticketType = type(1n, 1n), otherType = type(2n, 2n);
  return { schemaVersion, events: [{ id: 1n, mine: true, isKey: false, open: true }, { id: 2n, mine: true, isKey: false, open: false }, { id: 3n, mine: false, isKey: false, open: true }],
    types: [ticketType, otherType], tickets: [{ serial: 1n, typeId: 1n, status: 2, mine: false, hasAdmit: false, epoch: 1n, listingId: 0n }], ownedTickets: [], networkTag: new Uint8Array(32), listings: [], held: {}, checkIns: new Map(), feeBps: 300n, ageIssuer: { x: 0n, y: 0n },
    gates: [{ id: 11n, eventId: 1n, active: true, typeCount: 0n, mine: true, assigned: false, acceptedTypeIds: [], admittedCount: 1, metadataKeys: [] }, { id: 22n, eventId: 2n, active: true, typeCount: 0n, mine: true, assigned: false, acceptedTypeIds: [], admittedCount: 0, metadataKeys: [] }], gateStaff: [], admissions: [], staffOnly: false };
}
for (const [id, name] of [[1, 'Midnight Summit — Montréal'], [2, 'Other own event'], [3, 'Not owned event']]) memory.set(`cloaktix:meta:${contract}:ev:${id}`, JSON.stringify({ name, date: '2026-12-05', venue: 'Sample venue', description: 'Illustrative description.', cover: '/art/quantum-club.webp' }));
memory.set(`cloaktix:meta:${contract}:tt:1`, JSON.stringify({ name: 'This event type' }));
memory.set(`cloaktix:meta:${contract}:tt:2`, JSON.stringify({ name: 'Other event type' }));
const props = (schema = 3) => ({ s: session(schema), st: state(schema), run: async () => { throw new Error('Rendering must never submit'); } });
it('EGG-40 event page drops the schema-4 Doors & staff note; other v3 contracts keep it', () => {
  const html = ui.manage({ ...props(), eventId: 1n });
  assert.ok(html.includes('Add a ticket type'));
  assert.ok(!html.includes('separate schema-4 contract'));
  const other = ui.manage({ ...props(), s: { ...session(), contract: 'cd'.repeat(32) }, eventId: 1n });
  assert.ok(other.includes('Event not available') || other.includes('separate schema-4 contract'));
});
