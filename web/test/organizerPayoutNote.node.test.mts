/** Read-only organizer payout display and privacy regression tests. All addresses are fake sentinels. */
import { it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { publicEventMeta } from '../src/payoutAddresses.ts';
import { saveOrganizerPayouts } from '../src/organizerPayoutStore.ts';
const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.payout-note-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
const memory = new Map<string, string>(), reads: string[] = [];
let unavailable = false;
Object.defineProperty(globalThis, 'location', { configurable: true, value: { pathname: '/organizer', search: '?network=preview&schema=3', hash: '#organizer', origin: 'http://local.test' } });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => { reads.push(key); if (unavailable) throw new Error('Storage unavailable'); return memory.get(key) ?? null; }, setItem: (key: string, value: string) => memory.set(key, value) } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });
await build({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {OrganizerEvent,EventCard,EventPage} from './src/App';
import {EventCreateForm,EventEditForm} from './src/EventCreateForm';
import {PublicEventDetail} from './src/catalog/PublicCatalog';
import {SavedPhoneTickets} from './src/v2/SavedPhoneTickets';
import {RatesContext} from './src/useRates';
const render=(C,props)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(C,props)));
export const create=()=>render(EventCreateForm,{network:'preview',onSubmit(){throw new Error('Render must not submit')}});
export const edit=initial=>render(EventEditForm,{initial,onSubmit(){throw new Error('Render must not submit')},onCancel(){}});
export const manage=props=>render(OrganizerEvent,{onBack(){},...props});
export const buyer=props=>render(EventPage,{bump(){},openTickets(){},...props});
export const card=props=>render(EventCard,{bump(){},e:props.st.events[0],...props});
export const publicDetail=event=>render(PublicEventDetail,{event,onConnect(){}});
export const tickets=()=>render(SavedPhoneTickets,{onConnect(){},onBrowseEvents(){}});
`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/ui.mjs', logLevel: 'error', plugins: [{ name: 'test-private-buyer-view', setup(build: { onLoad(options: {filter: RegExp}, callback: (args: {path: string}) => object): void }) {
  build.onLoad({ filter: /\/src\/App\.tsx$/ }, args => ({ contents: readFileSync(args.path, 'utf8') + '\nexport { EventPage };\n', loader: 'tsx', resolveDir: root + 'src' }));
} }] });
const ui = await import(pathToFileURL(dir + '/ui.mjs').href);
const contract = 'ab'.repeat(32);
const sampleOne = 'mn_addr_preview1_SAMPLE_ONLY_EVENT_ONE_NOT_A_REAL_ADDRESS';
const sampleTwo = 'mn_addr_preview1_SAMPLE_ONLY_EVENT_TWO_NOT_A_REAL_ADDRESS';
const details = { name: 'Midnight Summit — Montréal', date: '2026-12-05', venue: 'Sample venue', cover: '/art/quantum-club.webp', description: 'Illustrative test event only.', demoArt: 'true' };
const session = (schema = 3) => ({ schema, networkId: 'preview', contract, accountId: 'cd'.repeat(32), walletName: 'Test wallet', idSource: 'wallet' });
function state(schemaVersion = 3) {
  return { schemaVersion, events: [{ id: 1n, mine: true, isKey: false, open: true }, { id: 2n, mine: true, isKey: false, open: true }],
    types: [{ id: 1n, eventId: 1n, price: 1000n, maxResale: 1200n, fee: 0n, sold: 3n, supply: 25n, adultOnly: false, resale: 0 }],
    tickets: [], ownedTickets: [], networkTag: new Uint8Array(32), listings: [], held: {}, checkIns: new Map(), feeBps: 300n, ageIssuer: { x: 0n, y: 0n }, gates: [], gateStaff: [], admissions: [], staffOnly: false };
}
const props = (schema = 3) => ({ s: session(schema), st: state(schema), eventId: 1n, id: 1n, run: async () => { throw new Error('Rendering must never submit'); } });
beforeEach(() => {
  memory.clear(); reads.length = 0; unavailable = false;
  memory.set(`cloaktix:meta:${contract}:ev:1`, JSON.stringify(details));
  memory.set(`cloaktix:meta:${contract}:ev:2`, JSON.stringify({ ...details, name: 'Other illustrative event' }));
});
it('creation visibly warns that the required Midnight address receives event payments and is immutable', () => {
  const html = ui.create();
  for (const text of ['This address will receive NIGHT payments for this event.', 'It cannot be changed after the event is created.', 'Check it carefully before creating the event.', 'role="note"', 'aria-describedby="night-payout-permanent night-payout-help night-payout-err"', 'NIGHT payout address on Midnight']) assert.ok(html.includes(text), 'Missing creation payout warning/accessibility');
  assert.ok(/aria-label="NIGHT payout address on Midnight"[^>]*required=""/.test(html));
});
it('Edit details has no payout field or payout-edit capability', () => {
  const html = ui.edit(details);
  assert.ok(!html.includes('NIGHT payout')); assert.ok(!html.includes('nightPayout'));
  assert.ok(html.includes('Save details'));
});
it('schema 3 and 4 management display only the selected event’s organizer-private saved address', () => {
  saveOrganizerPayouts('preview', contract, '1', { nightPayout: sampleOne });
  saveOrganizerPayouts('preview', contract, '2', { nightPayout: sampleTwo });
  for (const schema of [3, 4]) {
    const html = ui.manage(props(schema));
    assert.ok(html.includes('<h2 id="organizer-payout-heading">NIGHT payout</h2>'));
    assert.ok(html.includes(sampleOne)); assert.ok(!html.includes(sampleTwo));
    assert.ok(html.includes('class="organizer-payout-address"'));
    assert.ok(html.includes('This address was set at creation. NIGHT payments for this event go here. It cannot be changed.'));
    const payoutSection = html.split('<section class="card organizer-payout"')[1]?.split('</section>')[0] ?? '';
    assert.ok(!payoutSection.includes('<input')); assert.ok(!payoutSection.includes('<button'));
  }
  const other = ui.manage({ ...props(), eventId: 2n });
  assert.ok(other.includes(sampleTwo)); assert.ok(!other.includes(sampleOne));
});
it('missing record never guesses an address from other events, contracts or on-chain payout bytes', () => {
  saveOrganizerPayouts('preview', contract, '2', { nightPayout: sampleTwo });
  saveOrganizerPayouts('preview', 'ef'.repeat(32), '1', { nightPayout: sampleOne });
  const data = props();
  data.st.events[0] = { ...data.st.events[0], payout: { bytes: new Uint8Array(32).fill(7) } };
  const html = ui.manage(data);
  assert.ok(html.includes('The NIGHT payout address was set at creation and cannot be changed. It is not saved on this device.'));
  assert.ok(!html.includes(sampleOne)); assert.ok(!html.includes(sampleTwo));
  assert.ok(!html.includes('class="organizer-payout-address"')); assert.ok(!html.includes('mn_addr'));
});
it('unavailable private storage renders the missing-record note, never a guessed address or crash', () => {
  unavailable = true;
  try { assert.ok(ui.manage(props()).includes('It is not saved on this device.')); }
  finally { unavailable = false; }
});
it('staff-only and non-owner identities cannot view or read this payout record', () => {
  saveOrganizerPayouts('preview', contract, '1', { nightPayout: sampleOne });
  const staffProps = props(4); staffProps.st.staffOnly = true;
  reads.length = 0; const staffHtml = ui.manage(staffProps);
  assert.ok(!staffHtml.includes(sampleOne)); assert.ok(!staffHtml.includes('class="card organizer-payout"'));
  assert.ok(!reads.some(key => key.startsWith('cloaktix:org-payout:')));
  const other = props(4); other.st.events[0].mine = false;
  reads.length = 0; const otherHtml = ui.manage(other);
  assert.ok(!otherHtml.includes(sampleOne)); assert.ok(!otherHtml.includes('class="card organizer-payout"'));
  assert.ok(!reads.some(key => key.startsWith('cloaktix:org-payout:')));
});
it('publicEventMeta still strips payout fields; buyer views and tickets never read/display the private store', () => {
  const publicMeta = publicEventMeta({ ...details, nightPayout: sampleOne, adaPayout: 'FAKE_PRIVATE_SENTINEL' });
  assert.equal('nightPayout' in publicMeta, false); assert.equal('adaPayout' in publicMeta, false);
  saveOrganizerPayouts('preview', contract, '1', { nightPayout: sampleOne });
  reads.length = 0;
  const buyerProps = props(); buyerProps.st.events[0].mine = false;
  const views = [ui.buyer(buyerProps), ui.card(buyerProps), ui.publicDetail({ ...details, id: '1', publishedAt: 0, tickets: [] }), ui.tickets()];
  for (const html of views) {
    assert.ok(!html.includes(sampleOne)); assert.ok(!html.includes('nightPayout')); assert.ok(!html.includes('organizer-payout'));
  }
  assert.ok(!reads.some(key => key.startsWith('cloaktix:org-payout:')));
});
it('organizer buyer-share URLs do not include the private payout, including encoded metadata', () => {
  saveOrganizerPayouts('preview', contract, '1', { nightPayout: sampleOne });
  const html = ui.manage(props());
  const share = html.split('<summary>Buyer share link</summary>')[1]?.split('</details>')[0] ?? '';
  assert.ok(share.length > 0); assert.ok(!share.includes(sampleOne)); assert.ok(!share.includes('nightPayout'));
  for (const [, rawHref] of share.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(rawHref.replaceAll('&amp;', '&'), 'http://local.test');
    const metadata = url.searchParams.get('m');
    if (metadata) {
      const decoded = Buffer.from(metadata, 'base64url').toString('utf8');
      assert.ok(!decoded.includes(sampleOne)); assert.ok(!decoded.includes('nightPayout'));
    }
  }
});
