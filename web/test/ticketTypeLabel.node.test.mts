// CT-TIX-TYPE-LABEL: ticket type name on cards, detail, QR view, print and phone link.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { ticketTypeLabel, isPlaceholderTypeName, TICKET_TYPE_LABEL_MAX } from '../src/v2/ticketTypeLabel.ts';
import { savedTicketItems, ticketMetadata } from '../src/v2/ticketLibraryModel.ts';

const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const dir = mkdtempSync(`${tmpdir()}/cloaktix-type-label-`);
const src = (p: string) => JSON.stringify(new URL('../src/' + p, import.meta.url).pathname);
buildSync({ stdin: { contents: `import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};
import {TicketLibrary,TicketDetail} from ${src('v2/TicketLibrary.tsx')};
export {buildTicketPrintDocument} from ${src('v2/printTicket.ts')};
export {encodeAdmitFragmentPath,parseAdmitFromLocation} from ${src('v2/admitCodec.ts')};
export const list=(items)=>renderToStaticMarkup(React.createElement(TicketLibrary,{items}));
export const detail=(ticket)=>renderToStaticMarkup(React.createElement(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}}));`,
  resolveDir: new URL('../', import.meta.url).pathname, loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: dir + '/r.cjs' });
const ui = require(dir + '/r.cjs');

// Live event 1 shape: types 1 and 2 = "General admission" (duplicates), type 3 = "after party" 18+.
const meta: Record<string, string> = { '1': 'General admission', '2': 'General admission', '3': 'after party' };
const ttName = (id: bigint) => meta[String(id)] ?? `Ticket #${id}`; // App.tsx ttName fallback
const types = [{ id: 1n, adultOnly: false }, { id: 2n, adultOnly: false }, { id: 3n, adultOnly: true }, { id: 4n, adultOnly: false }];
const label = (id: bigint) => ticketTypeLabel(ttName(id), id, types.find((t) => t.id === id)!.adultOnly);
const cap = (serial: string, extra: Record<string, unknown> = {}) => ({ v: 2 as const, networkId: 'preview', contract: 'ab'.repeat(32), serial, epoch: '1', nonceHex: 'cd'.repeat(32), ...extra });

describe('label rules', () => {
  it('published names, duplicates read the same, 18+ badge, fallback "Ticket type #N"', () => {
    assert.equal(label(1n), 'General admission');
    assert.equal(label(2n), 'General admission');
    assert.equal(label(3n), 'after party · 18+');
    assert.equal(label(4n), 'Ticket type #4');
    assert.equal(ticketTypeLabel(undefined, undefined), 'Admission');
    assert.equal(ticketTypeLabel('VIP 18+', 9n, true), 'VIP 18+', 'no double badge');
  });
  it('old placeholders are treated as unpublished; long names are capped with the badge kept', () => {
    for (const n of ['Ticket #1', 'Ticket type #2', 'Admission', 'Ticket type #3 · 18+', '', '  ']) assert.equal(isPlaceholderTypeName(n), true, n);
    assert.equal(isPlaceholderTypeName('General admission'), false);
    const long = ticketTypeLabel('x'.repeat(200), 1n, true);
    assert.ok(long.length <= TICKET_TYPE_LABEL_MAX); assert.ok(long.endsWith('… · 18+'));
  });
  it('a saved real name beats an id-only fallback; a published name beats a saved one', () => {
    assert.equal(ticketMetadata({ ticketName: 'Ticket type #3 · 18+' }, { ticketName: 'after party · 18+' }).ticketName, 'after party · 18+');
    assert.equal(ticketMetadata({ ticketName: 'General admission' }, { ticketName: 'Ticket #2' }).ticketName, 'General admission');
    assert.equal(ticketMetadata({ ticketName: 'Ticket type #4' }, { ticketName: 'Ticket #4' }).ticketName, 'Ticket type #4');
  });
  it('saved (disconnected) tickets: legacy "Ticket #N" becomes "Ticket type #<typeId>", schema-2 caps without typeId still work', () => {
    const [a, b, c] = savedTicketItems([cap('5', { ticketName: 'Ticket #1', typeId: '1' }), cap('6'), cap('7', { ticketName: 'after party · 18+', typeId: '3' })] as any);
    assert.equal(a.ticketName, 'Ticket type #1');
    assert.equal(b.ticketName, 'Admission');
    assert.equal(c.ticketName, 'after party · 18+');
  });
});

describe('where it shows', () => {
  const item = (serial: string, ticketName: string) => ({ key: serial, serial, eventName: 'Test v3', ticketName, date: '2027-07-31', cover: '/art/neon-nights.webp', cap: cap(serial) });
  it('My tickets cards: event, ticket #, type (18+ badge), date, in that order', () => {
    const html = ui.list([item('5', 'General admission'), item('6', 'after party · 18+')]);
    const card = html.split('ticket-list-copy')[2];
    const order = ['Test v3', 'Ticket #6', 'after party', '18+', '2027-07-31', 'Open ticket'].map((t) => card.indexOf(t));
    assert.ok(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), JSON.stringify(order));
    assert.match(card, /<span class="tag age">18\+<\/span>/);
    assert.match(html, /General admission/);
    assert.match(html, /aria-label="Test v3, after party · 18\+, ticket 6, 2027-07-31"/);
  });
  it('opened ticket detail shows the type', () => {
    assert.match(ui.detail(item('6', 'after party · 18+')), /<span class="ticket-type-label">after party <span class="tag age">18\+<\/span><\/span> · Ticket #6/);
  });
  it('printed ticket and phone link carry the type; the phone label is capped at 48 characters', () => {
    assert.match(ui.buildTicketPrintDocument(cap('6', { eventName: 'Test v3', ticketName: 'after party · 18+' })), /<p>after party · 18\+<\/p>/);
    const path = ui.encodeAdmitFragmentPath(cap('6', { ticketName: 'after party · 18+' }));
    assert.equal(ui.parseAdmitFromLocation('#' + path.replace(/^#/, '')).ticketName, 'after party · 18+');
    const long = ui.parseAdmitFromLocation('#' + ui.encodeAdmitFragmentPath(cap('6', { ticketName: 'y'.repeat(300) })).replace(/^#/, '')).ticketName;
    assert.equal(long.length, 48);
  });
  it('My tickets wiring and the QR view use the label', () => {
    const gate = readFileSync(new URL('../src/v2/TicketsGateV2.tsx', import.meta.url), 'utf8');
    assert.equal((gate.match(/ticketTypeLabel\(ttName\(/g) ?? []).length, 3);
    const lib = readFileSync(new URL('../src/v2/TicketLibrary.tsx', import.meta.url), 'utf8');
    assert.match(lib, /<h2>Ticket #\{ticket\.serial\}<\/h2><p className="fq-type"><TypeLabel name=\{ticket\.ticketName\} \/><\/p>/);
  });
});
