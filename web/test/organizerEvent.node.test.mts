/** Real route helpers and real organizer React views. No wallet actions or network requests. */
import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { organizerEventFromLocation, organizerEventHref, ownedOrganizerEvent, organizerEventStats } from '../src/organizer/eventRoute.ts';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.organizer-event-test-');
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
`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/ui.mjs', logLevel: 'error' });
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
it('manage deep links stay separate from buyer routes and retain schema/contract/network on reload', () => {
  for (const schema of [3, 4]) {
    const href = organizerEventHref({ search: '?m=private-share&start=tickets', eventId: 1n, contract, networkId: 'preview', schema });
    const url = new URL(href, 'http://local.test');
    assert.equal(organizerEventFromLocation(url), 1n); assert.equal(url.pathname, '/organizer');
    assert.equal(url.searchParams.get('schema'), String(schema)); assert.equal(url.searchParams.get('contract'), contract);
    assert.equal(url.searchParams.get('network'), 'preview'); assert.equal(url.searchParams.has('m'), false); assert.equal(url.searchParams.has('start'), false);
  }
  assert.equal(organizerEventFromLocation({ pathname: '/e/1', search: '?event=1', hash: '' }), null);
  assert.equal(organizerEventFromLocation({ pathname: '/organizer', search: '?event=1', hash: '#gate' }), null);
});
it('invalid, zero, negative, overflow or unknown event routes cannot authorize management', () => {
  for (const value of ['0', '-1', 'x', '1.2', '01', '18446744073709551616', '9'.repeat(100)]) assert.equal(organizerEventFromLocation({ pathname: '/organizer', search: '?event=' + value, hash: '#organizer' }), null);
  assert.equal(ownedOrganizerEvent(state(), 3n), undefined); assert.equal(ownedOrganizerEvent(state(), 999n), undefined);
  assert.equal(ownedOrganizerEvent({ ...state(4), staffOnly: true }, 1n), undefined);
  const back = new URL(organizerEventHref({ search: '?schema=3&event=1&network=preview', eventId: null }), 'http://local.test');
  assert.equal(back.searchParams.has('event'), false); assert.equal(back.searchParams.get('schema'), '3');
});
it('summary cards have Organize event, own events only, short stats and no embedded Doors panel', () => {
  for (const schema of [3, 4]) {
    const html = ui.list(props(schema));
    assert.ok(html.includes('Midnight Summit — Montréal')); assert.ok(html.includes('Other own event'));
    assert.ok(!html.includes('Not owned event')); assert.equal(html.split('>Organize event</button>').length - 1, 2);
    assert.ok(html.includes('3 / 25 sold')); assert.ok(html.includes('Sales closed'));
    assert.ok(!html.includes('class="doors-staff"')); assert.ok(!html.includes('<h3>Add a ticket type</h3>'));
  }
});
it('schema 3 management is scoped to one event and keeps current edit/sales/share/type tools', () => {
  const html = ui.manage({ ...props(), eventId: 1n });
  for (const text of ['← Back to My events', 'Midnight Summit — Montréal', 'Illustrative description.', 'Edit details', 'Close sales', 'Public catalog listing', 'Publish to public catalog', 'Buyer share link', 'Add a ticket type', 'Tickets &amp; capacity', 'This event type']) assert.ok(html.includes(text), 'Missing event management section: ' + text);
  assert.ok(!html.includes('Other own event')); assert.ok(!html.includes('Other event type'));
  assert.ok(!html.includes('<label>Event<select')); assert.ok(!html.includes('class="doors-staff"'));
  assert.ok(html.includes('Doors &amp; staff requires a separate schema-4 contract'));
  assert.ok(!html.includes('Deploy schema')); assert.ok(!html.includes('>Buy<'));
});
it('schema 4 moves only this event’s Doors & staff onto manage page and keeps submissions disabled', () => {
  const html = ui.manage({ ...props(4), eventId: 1n });
  assert.ok(html.includes('class="doors-staff"')); assert.ok(html.includes('Door #11')); assert.ok(!html.includes('Door #22'));
  assert.ok(html.includes('disabled="" title="Schema 4 is local-only">Edit details'));
  assert.ok(html.includes('disabled="">Close sales')); assert.ok(html.includes('class="event-type-fields" disabled=""'));
  assert.ok(!html.includes('Other own event')); assert.ok(!html.includes('Other event type'));
});
it('unknown/not-owned management returns to My events and never exposes the target event’s controls', () => {
  for (const eventId of [3n, 999n]) {
    const html = ui.manage({ ...props(), eventId });
    assert.ok(html.includes('Event not available for this organizer')); assert.ok(html.includes('<h2>My events</h2>'));
    assert.ok(!html.includes('organizer-event-page')); assert.ok(!html.includes('Not owned event'));
  }
});
it('staff-only identity cannot see Organize event or event-management controls on either route', () => {
  const st = { ...state(4), staffOnly: true, events: state(4).events.map(e => ({ ...e, mine: false })), gates: [] };
  for (const html of [ui.list({ ...props(4), st }), ui.manage({ ...props(4), st, eventId: 1n })]) {
    assert.ok(html.includes('Check-in')); assert.ok(html.includes('Your staff ID'));
    for (const text of ['Organize event', 'Create an event', 'Add a ticket type', 'Edit details', 'Close sales', 'Deploy schema']) assert.ok(!html.includes(text), 'Staff must not see: ' + text);
  }
});
it('Organize event button passes the exact event ID without submitting a transaction', () => {
  const ids: bigint[] = [];
  const element = ui.button({ s: session(), eventId: 2n, onOrganize: (id: bigint) => ids.push(id) });
  element.props.onClick(); assert.deepEqual(ids, [2n]);
  const source = readFileSync(root + 'src/App.tsx', 'utf8');
  assert.ok(source.includes('<OrganizeEventButton s={s} eventId={created} onOrganize={onOrganize} />'));
  assert.ok(source.includes('setManagedEvent(organizerEventFromLocation(location))'));
  assert.ok(source.includes("setManagedEvent(null);\n    setTab0(t)"));
});
it('short stats are event-scoped and count consumed serials even when v3 checkIns is empty', () => {
  assert.deepEqual(organizerEventStats(state(), 1n), { types: [type(1n, 1n)], sold: 3n, capacity: 25n, admitted: 1 });
  assert.equal(organizerEventStats(state(), 2n).admitted, 0);
});
// Exercise the app's actual navigation closures, not a second implementation of their behavior.
const appSource = readFileSync(root + 'src/App.tsx', 'utf8');
const navStart = appSource.indexOf('  const setTab = (t: Tab) => {');
const navEnd = appSource.indexOf('  const [busy, setBusy]', navStart);
const restoreStart = appSource.indexOf('    const restorePage = () => {');
const restoreEnd = appSource.indexOf("    window.addEventListener('popstate', restorePage)", restoreStart);
assert.ok(navStart > 0 && navEnd > navStart && restoreStart > 0 && restoreEnd > restoreStart);
buildSync({ stdin: { contents: `import {organizerEventFromLocation,organizerEventHref,ownedOrganizerEvent} from './src/organizer/eventRoute';
import {buildEventShareUrl} from './src/v2/shareLinks';
export async function execute(s,initialState,href,actions){
let location=new URL(href,'http://local.test'),st=initialState,evRoute=null,managedEvent=organizerEventFromLocation(location),org=location.pathname==='/organizer',tab='organizer';const visits=[];
const history={pushState:(_,__,href)=>{location=new URL(href,location.origin);visits.push(location.pathname+location.search+location.hash);}};
const setEvRoute=value=>evRoute=value,setManagedEvent=value=>managedEvent=value,setOrg=value=>org=value,setTab0=value=>tab=value,setSt=value=>st=value;
const NETWORK='preview',resolveContractHint=()=>s.contract,configuredRateV3Contract=()=>null,resolveSchema=()=>s.schema;
${appSource.slice(navStart, navEnd)}
${appSource.slice(restoreStart, restoreEnd)}
for(const action of actions){if(action.kind==='manage')await openOrganizerEvent(BigInt(action.id));else if(action.kind==='tab')setTab(action.tab);else if(action.kind==='buyer')openEventPage(BigInt(action.id));else if(action.kind==='restore'){location=new URL(action.href,location.origin);restorePage();}}
return {href:location.pathname+location.search+location.hash,managedEvent,evRoute,org,tab,visits};
}`, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', logLevel: 'error', outfile: dir + '/navigation.mjs' });
const navigation = await import(pathToFileURL(dir + '/navigation.mjs').href);
it('actual My events → manage → Back navigation preserves context and clears the selected event', async () => {
  const result = await navigation.execute(session(), state(), '/organizer?schema=3&network=preview', [{ kind: 'manage', id: 1 }, { kind: 'tab', tab: 'organizer' }]);
  assert.ok(result.visits[0].includes('event=1')); assert.equal(result.visits.length, 2);
  assert.equal(result.managedEvent, null); assert.equal(result.evRoute, null); assert.equal(result.org, true);
  assert.equal(new URL(result.href, 'http://local.test').searchParams.has('event'), false);
});
it('actual refresh/popstate restoration selects organizer event, while buyer Back to events stays a buyer route', async () => {
  const restored = await navigation.execute(session(), state(), '/', [{ kind: 'restore', href: '/organizer?schema=3&event=2#organizer' }]);
  assert.equal(restored.managedEvent, 2n); assert.equal(restored.org, true); assert.equal(restored.tab, 'organizer');
  const buyer = await navigation.execute(session(), state(), '/organizer?schema=3&event=1#organizer', [{ kind: 'buyer', id: 1 }, { kind: 'tab', tab: 'events' }]);
  assert.ok(buyer.visits[0].startsWith('/e/1?')); assert.equal(buyer.org, false); assert.equal(buyer.tab, 'events');
  assert.equal(buyer.managedEvent, null); assert.equal(buyer.evRoute, null);
});
it('actual creation-success navigation can refresh ownership before opening, but not-owned IDs never navigate', async () => {
  const fresh = { ...session(), state: async () => state() };
  const success = await navigation.execute(fresh, null, '/organizer?schema=3', [{ kind: 'manage', id: 1 }]);
  assert.equal(success.managedEvent, 1n);
  const refused = await navigation.execute(fresh, state(), '/organizer?schema=3', [{ kind: 'manage', id: 3 }]);
  assert.equal(refused.visits.length, 0); assert.equal(refused.managedEvent, null);
});
