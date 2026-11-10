import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(`${tmpdir()}/cloaktix-unify-`);
const hooks = dir + '/hooks.cjs';
writeFileSync(hooks, `let slots=[],cursor=0;exports.begin=()=>{cursor=0};exports.reset=()=>{slots=[];cursor=0};exports.useState=(initial)=>{const id=cursor++;if(!(id in slots))slots[id]=initial;return [slots[id],value=>{slots[id]=typeof value==='function'?value(slots[id]):value}]};`);
// Only replace the library's state hooks. Exercise the actual component event handlers
// without a DOM install or wallet; existing print/transfer tests cover browser side effects.
const entry = `import React from ${JSON.stringify(require.resolve('react'))};
import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};
import {TicketLibrary,TicketDetail} from './src/v2/TicketLibrary';
import {SavedPhoneTickets} from './src/v2/SavedPhoneTickets';
import * as hooks from ${JSON.stringify(hooks)};
export * from './src/v2/serialTicketSchema';
export * from './src/v2/ticketLibraryModel';
export * from './src/v2/prepareAdmit';
export * from './src/v2/admitCodec';
export const reset=hooks.reset;
export const tree=props=>{hooks.begin();return TicketLibrary(props)};
export const detailTree=props=>TicketDetail(props);
export const list=items=>renderToStaticMarkup(React.createElement(TicketLibrary,{items}));
export const detail=ticket=>renderToStaticMarkup(React.createElement(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}}));
export const saved=props=>SavedPhoneTickets(props);`;
// buildSync cannot run plugins; rewrite only the TicketLibrary import in a temporary copy,
// retaining every component body and importing its remaining real dependencies unchanged.
const libraryPath = root + 'src/v2/TicketLibrary.tsx';
const original = readFileSync(libraryPath, 'utf8');
const library = dir + '/TicketLibrary.tsx';
writeFileSync(library, original.replace("from 'react'", `from ${JSON.stringify(hooks)}`).replace(/from '([^']+)'/g, (match, specifier) => specifier.startsWith('.') ? `from ${JSON.stringify(new URL(specifier, 'file://' + libraryPath).pathname)}` : match));
const actualEntry = entry.replace("'./src/v2/TicketLibrary'", JSON.stringify(library));
buildSync({ stdin: { contents: actualEntry, resolveDir: root, loader: 'tsx' }, bundle: true, nodePaths: [root + 'node_modules'], platform: 'node', format: 'cjs', jsx: 'automatic', outfile: dir + '/ui.cjs' });
const ui = require(dir + '/ui.cjs');
const cap = { v: 2, networkId: 'preview', contract: 'ab'.repeat(32), serial: '4', epoch: '1', nonceHex: 'cd'.repeat(32), eventName: 'Midnight st-jean', ticketName: 'General admission' };
const item = { key: 'preview:synthetic:4', serial: '4', eventName: cap.eventName, ticketName: cap.ticketName, cap };
function elements(node: any): any[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [node, ...elements(node.props.children)];
}
function memoryStorage() {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) };
}

it('schema 2/3/4 use serial display routing, without broadening v2 transaction routing', () => {
  for (const schema of [2, 3, 4]) assert.equal(ui.schemaUsesSerialTickets({ schema }, null), true);
  for (const schema of [1, 0]) assert.equal(ui.schemaUsesSerialTickets({ schema }, null), false);
  assert.equal(ui.schemaUsesSerialTickets({}, { schemaVersion: 3n }), true);
  assert.equal(ui.schemaUsesSerialTickets({ schema: 1 }, { schemaVersion: 3n }), true);
  assert.equal(ui.schemaUsesSerialTickets({ schema: 1 }, { schemaVersion: 2 }), true);
  assert.equal(ui.schemaUsesSerialTickets({ schema: 1 }, { schemaVersion: 1 }), false);
  assert.equal(ui.schemaUsesSerialTickets({}, null), false);
  const app = readFileSync(root + 'src/App.tsx', 'utf8');
  for (const tab of ['tickets', 'gate']) assert.ok(app.includes(`tab === '${tab}' && (schemaUsesSerialTickets(s, st)`));
  assert.match(app, /if \(schemaIsV2\(s, st\)\) \{ await buyResale/);
  assert.match(app, /if \(schemaIsV2\(s, st\)\) \{\s+const r = await buyTicketV2Flow/);
  const tickets = readFileSync(root + 'src/v2/TicketsGateV2.tsx', 'utf8');
  assert.match(tickets, /serialResaleArgs\(s.schema, serial, quote/);
  assert.match(tickets, /resalePriceUnits\(s.schema,parsedPrice\)>type.maxResale/);
});

it('v3 resale passes serial, USD cents, payout only and never evaluates the NIGHT fee', () => {
  const payout = { bytes: new Uint8Array(32) };
  const quote = { cents: 1234n, atoms: 9876543210n };
  assert.deepEqual(ui.serialResaleArgs(3, 4n, quote, payout, () => { throw new Error('v3 must not calculate a fee'); }), [4n, 1234n, payout]);
  assert.deepEqual(ui.serialResaleArgs(2, 4n, quote, payout, (atoms: bigint) => atoms / 100n), [4n, quote.atoms, quote.atoms / 100n, payout]);
  assert.equal(ui.resalePriceUnits(3, quote), 1234n);
  assert.equal(ui.centsInput(1234n), '12.34');
});

it('one card per serial opens the real detail and exposes print, QR, phone and owned resale controls', () => {
  ui.reset();
  const props = { items: [item, { ...item, key: 'other', serial: '3' }], controls: () => 'Resale options' };
  const list = ui.tree(props);
  const cards = elements(list).filter((element) => element.props.className === 'card ticket-list-card');
  assert.equal(cards.length, 2);
  cards[0].props.onClick();
  const detailElement = elements(ui.tree(props)).find((element) => typeof element.type === 'function' && element.type.name === 'TicketDetail');
  assert.ok(detailElement);
  const detail = ui.detailTree(detailElement.props);
  const actions = elements(detail).filter((element) => element.type === 'button');
  assert.deepEqual(actions.map((element) => element.props.children), ['Print ticket', 'Show QR', 'Send to phone']);
  assert.ok(actions.every((element) => !element.props.disabled));
  assert.equal(detailElement.props.controls, 'Resale options');
  (globalThis as any).window = { innerWidth: 1000 };
  actions[1].props.onClick();
  assert.ok(elements(ui.tree(props)).some((element) => element.props.label === 'Admission ticket'));
  actions[2].props.onClick();
  assert.ok(elements(ui.tree(props)).some((element) => element.props.label === 'Send ticket to phone'));
  delete (globalThis as any).window;
});

it('disconnected saved tickets use the same detail, with connect-to-resell rather than a fake listing', () => {
  (globalThis as any).localStorage = memoryStorage();
  ui.packageAdmitCapability(cap);
  let connections = 0;
  const saved = ui.saved({ onConnect: () => connections++ });
  ui.reset();
  const props = saved.props;
  const card = elements(ui.tree(props)).find((element) => element.props.className === 'card ticket-list-card');
  card.props.onClick();
  const detail = elements(ui.tree(props)).find((element) => typeof element.type === 'function' && element.type.name === 'TicketDetail');
  const controls = elements(detail.props.controls);
  const connect = controls.find((element) => element.type === 'button');
  assert.equal(connect.props.children, 'Connect to resell');
  assert.ok(!controls.some((element) => element.props.children === 'List for resale'));
  connect.props.onClick();
  assert.equal(connections, 1);
  const actions = elements(ui.detailTree(detail.props)).filter((element) => element.type === 'button' && ['Print ticket', 'Show QR', 'Send to phone'].includes(element.props.children));
  assert.equal(actions.length, 3);
  assert.ok(actions.every((element) => !element.props.disabled));
});

it('missing dates are omitted in list/detail, real covers survive, and card opening is discoverable', () => {
  ui.reset();
  for (const html of [ui.list([item]), ui.detail(item)]) { assert.ok(!html.includes('Date unavailable')); assert.ok(!html.includes('<p></p>')); assert.ok(!html.includes('<span class="muted"></span>')); }
  const html = ui.list([{ ...item, date: '2026-12-05', cover: '/events/st-jean.webp' }]);
  assert.ok(html.includes('2026-12-05'));
  assert.ok(html.includes('src="/events/st-jean.webp"'));
  assert.ok(html.includes('Open ticket &amp; options'));
  assert.ok(html.includes('st‑jean'));
  const css = readFileSync(root + 'src/styles.css', 'utf8');
  assert.match(css, /\.tix-page \{ width: 100%; max-width: 520px/);
  assert.match(css, /grid-template-columns:minmax\(0,32%\) minmax\(0,1fr\)/);
});

it('saved names/dates/covers override generic fallbacks and persist through phone transfer', () => {
  (globalThis as any).localStorage = memoryStorage();
  const saved = { eventName: 'Midnight st-jean', ticketName: 'VIP', date: '2026-12-05', venue: 'Montréal', cover: '/events/custom.webp' };
  assert.deepEqual(ui.ticketMetadata({ eventName: 'Event #1', ticketName: 'Ticket #1' }, saved), saved);
  assert.equal(ui.ticketMetadata({ eventName: 'New event name' }, saved).eventName, 'New event name');
  const prepared = ui.packageAdmitCapability({ ...cap, typeId: '2', eventDate: saved.date, venue: saved.venue, cover: saved.cover });
  assert.equal(prepared.saved.eventDate, saved.date);
  const enriched = ui.saveAdmitDetails(prepared.cap, {});
  assert.equal(enriched.typeId, '2');
  assert.equal(enriched.cover, saved.cover);
  const parsed = ui.parseAdmitFromLocation(ui.encodeAdmitFragmentPath(enriched));
  assert.equal(parsed.eventDate, saved.date);
  assert.equal(parsed.venue, saved.venue);
  assert.equal(parsed.cover, saved.cover);
  assert.equal(parsed.nonceHex, cap.nonceHex);
  const list = ui.savedTicketItems([enriched]);
  assert.equal(list[0].date, saved.date);
  assert.equal(list[0].cover, saved.cover);
});
