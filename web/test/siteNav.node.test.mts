import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';

const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(root + '.site-nav-test-');
const bundle = dir + '/render.mjs';
// Render the actual App and EventCard, not a mirror of their routing/badge logic.
buildSync({
  stdin: { contents: `import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {App,HomeScreen,EventCard,Events,DisconnectedEvents} from './src/App';
import {PublicEventDetail,TicketTrust,PurchaseNextSteps} from './src/catalog/PublicCatalog';
import {EventCreateForm,EventEditForm} from './src/EventCreateForm';
import {RatesContext} from './src/useRates';
const render=(Component,props)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(Component,props)));
export const app=()=>render(App,{});
export const published=catalog=>render(DisconnectedEvents,{onConnect(){},initialCatalog:{kind:'ready',catalog}});
export const publicDetail=event=>render(PublicEventDetail,{event,onConnect(){}});
export const create=initial=>render(EventCreateForm,{network:'preview',initial,onSubmit(){throw new Error('render must not create')}});
export const edit=initial=>render(EventEditForm,{initial,onSubmit:async()=>{},onCancel(){}});
export const trust=()=>render(TicketTrust,{});
export const next=()=>render(PurchaseNextSteps,{});
export const catalog=(s,st)=>render(Events,{s,st,run:async()=>{throw new Error('render must not pay')},bump(){},openEvent(){}});
export const home=props=>render(HomeScreen,{onBrowseEvents(){},onTickets(){},savedCount:0,...props});
export const event=(s,st)=>render(EventCard,{s,st,e:st.events[0],run:async()=>{throw new Error('render must not pay')},bump(){}});`, resolveDir: root, loader: 'tsx' },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: bundle,
});
after(() => rmSync(dir, { recursive: true, force: true }));
const store = new Map<string, string>();
let renderId = 0;
async function page(hash = '', pathname = '/', search = '?network=preview') {
  store.clear();
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { search, hash, pathname, origin: 'https://example.test', hostname: 'example.test' } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });
  return import(`file://${bundle}?page=${++renderId}`);
}
const contract = 'ab'.repeat(32);
const session = { schema: 2, contract, networkId: 'preview' };
const ticketType = { id: 1n, eventId: 1n, price: 10_000_000n, supply: 100n, sold: 1n, resale: 0, maxResale: 12_000_000n, adultOnly: false };
function state(open: boolean, types = [ticketType]) {
  return { schemaVersion: 2, events: [{ id: 1n, mine: false, open, isKey: false }], types, listings: [], held: {}, checkIns: new Map() };
}
function eventMeta(value: object) { store.set(`cloaktix:meta:${contract}:ev:1`, JSON.stringify(value)); }

it('buyer navigation always includes Home, Events, My tickets in that order', async () => {
  for (const hash of ['', '#home', '#events', '#tickets']) {
    const html = (await page(hash)).app();
    const nav = html.match(/<nav aria-label="Main navigation">(.*?)<\/nav>/)?.[1];
    assert.ok(nav);
    assert.deepEqual([...nav.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]), ['Home', 'Events', 'My tickets']);
    assert.match(html, /class="brand" href="\/#home"/);
    assert.equal([...html.matchAll(/id="main"/g)].length, 1);
  }
});
it('default and explicit disconnected Home render the product story, not catalog', async () => {
  for (const hash of ['', '#home']) {
    const html = (await page(hash)).app();
    assert.match(html, /class="home-page"/);
    assert.match(html, /Private tickets on <em>Midnight<\/em>/);
    assert.match(html, /How CloakTix works/);
    assert.match(html, /aria-current="page"[^>]*>Home/);
    assert.doesNotMatch(html, /Connect to see available events/);
  }
});
it('disconnected Events stays a catalog page with an honest connect prompt, never HomeScreen', async () => {
  const html = (await page('#events')).app();
  assert.match(html, /<h2>Events<\/h2>/);
  assert.match(html, /Pay with NIGHT on Midnight. Your wallet stays private./);
  assert.match(html, /Connect to see available events/);
  assert.match(html, /aria-current="page"[^>]*>Events/);
  assert.doesNotMatch(html, /class="home-page"|How CloakTix works|Private tickets on <em>/);
});
it('My tickets remains separate from Home and has no install block', async () => {
  const html = (await page('#tickets')).app();
  assert.match(html, /My tickets/);
  assert.doesNotMatch(html, /class="home-page"|Install CloakTix on your phone/);
});
it('event deep links retain event detail, back to Events and My tickets', async () => {
  const html = (await page('', '/e/1', `?network=preview&schema=2&contract=${contract}`)).app();
  assert.match(html, /← Back to events/);
  assert.match(html, /Event #1/);
  assert.match(html, /Connect wallet to buy/);
  assert.match(html, /My tickets/);
  assert.doesNotMatch(html, /class="home-page"|Tickets on sale/);
});
it('organizer navigation remains My events and Check-in, with Events exit', async () => {
  const html = (await page('', '/organizer')).app();
  const nav = html.match(/<nav aria-label="Organizer navigation">(.*?)<\/nav>/)?.[1];
  assert.ok(nav);
  assert.deepEqual([...nav.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1]), ['My events', 'Check-in']);
  assert.match(html, /href="\/\?network=preview#events"[^>]*>← Events/);
});
it('connected Home has Browse events and My tickets, no redundant Connect wallet', async () => {
  const html = (await page()).home({ connected: true });
  assert.match(html, />Browse events<\/button>/);
  assert.match(html, />My tickets<\/button>/);
  assert.doesNotMatch(html, /Connect wallet/);
  assert.match(html, /Demo artwork/);
  assert.match(html, /Artwork preview · not events for sale/);
  assert.doesNotMatch(html, /On sale/);
});
it('EventCard omits missing date and venue instead of displaying dashes', async () => {
  const ui = await page();
  for (const metadata of [{}, {date: '', venue: '  '}, {date: '—', venue: '—'}]) {
    eventMeta(metadata);
    const html = ui.event(session, state(true));
    assert.doesNotMatch(html, /—|Date unavailable/);
    assert.doesNotMatch(html, /<p class="muted">/);
  }
});
it('EventCard shows only supplied metadata, with no leading or trailing separator', async () => {
  const ui = await page();
  for (const [metadata, expected] of [
    [{date: '2026-12-05'}, '2026-12-05'],
    [{venue: 'Montréal'}, 'Montréal'],
    [{date: '2026-12-05', venue: 'Montréal'}, '2026-12-05 · Montréal'],
  ]) {
    eventMeta(metadata);
    assert.ok(ui.event(session, state(true)).includes(`<p class="muted">${expected}</p>`));
  }
});
it('open event without ticket types is not misleadingly marked On sale', async () => {
  const ui = await page();
  const html = ui.event(session, state(true, []));
  assert.match(html, /No tickets yet/);
  assert.match(html, /No tickets on sale yet/);
  assert.doesNotMatch(html, /On sale/);
});
it('sale badge still reflects open and closed events with ticket types', async () => {
  const ui = await page();
  assert.match(ui.event(session, state(true)), />On sale<\/span>/);
  const html = ui.event(session, state(false));
  assert.match(html, />Closed<\/span>/);
  assert.doesNotMatch(html, /On sale/);
});
it('fallback event names and demo-art disclosure are preserved', async () => {
  const ui = await page();
  const html = ui.event(session, state(true));
  assert.match(html, /Event #1/);
  assert.match(html, /Ticket #1/);
  assert.match(html, /Demo art/);
});
it('EventCard Buy label remains alone with price as a sibling underneath', async () => {
  const html = (await page()).event(session, state(true));
  assert.match(html, /<div class="buy-action"><button[^>]*>Buy<\/button><span class="price">/);
  assert.match(html, /≈ 10\.00 NIGHT/);
});

it('Home gallery uses all six existing demo images with an explicit non-sale caption', async () => {
  const html = (await page()).home({ connected: false });
  const gallery = html.match(/<figure class="home-art"[\s\S]*?<\/figure>/)?.[0];
  assert.ok(gallery);
  const images = [...gallery.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(images, ['/art/neon-nights.webp', '/art/quantum-club.webp', '/art/signal-room.webp', '/art/glass-choir.webp', '/art/dust-garden.webp', '/art/redacted-live.webp']);
  assert.match(html, /class="home-mosaic"/);
  assert.match(html, /<figcaption[^>]*>Artwork preview · not events for sale<\/figcaption>/);
  assert.doesNotMatch(html, />Buy<\/button>|On sale/);
});
it('Home keeps a numbered Buy, Keep or resell, Enter sequence ahead of secondary installation help', async () => {
  const html = (await page()).home({ connected: false });
  assert.deepEqual([...html.matchAll(/class="step-label">([^<]+)</g)].map((m) => m[1]), ['Buy', 'Keep or resell', 'Enter']);
  assert.deepEqual([...html.matchAll(/class="step-number"[^>]*>([^<]+)</g)].map((m) => m[1]), ['01', '02', '03']);
  assert.ok(html.indexOf('Install CloakTix on your phone') > html.indexOf('Show your single-use pass'));
  assert.match(html, /<details class="card devices install-help">/);
});
it('disconnected catalog feels complete without fabricating listings, prices or purchase actions', async () => {
  const html = (await page('#events')).app();
  assert.match(html, /Ticket catalog/);
  assert.match(html, /Before you buy/);
  assert.match(html, /No purchase is made when you connect/);
  assert.match(html, /No live events are shown until you connect/);
  assert.match(html, /Demo artwork · not a live listing/);
  assert.match(html, /aria-label="Buying steps"/);
  assert.doesNotMatch(html, /class="card event"|class="buy-action"|>Buy<\/button>/);
});

it('the real connected catalog renders a full-width grid without merging same-named events', async () => {
  const ui = await page();
  eventMeta({name:'Same title · Preview'});
  store.set(`cloaktix:meta:${contract}:ev:2`, JSON.stringify({name:'Same title · Preview'}));
  const st = state(true);
  st.events.push({id:2n,mine:false,open:true,isKey:false});
  (st.types as any[]).push({...ticketType,id:2n,eventId:2n});
  const html = ui.catalog(session, st);
  assert.match(html, /class="events-catalog"/);
  assert.match(html, /class="grid catalog-grid"/);
  assert.equal([...html.matchAll(/class="card event"/g)].length, 2);
  assert.equal([...html.matchAll(/<h3>Same title · Preview<\/h3>/g)].length, 2);
  // CT-POLISH-3: an event with no ticket types (e.g. the organizer key registration) is not shown to buyers.
  st.events.push({id:3n,mine:false,open:true,isKey:false});
  assert.equal([...ui.catalog(session, st).matchAll(/class="card event"/g)].length, 2);
  assert.match(html, /<div class="buy-action"><button[^>]*>Buy<\/button><span class="price">/);
});
it('catalog layout uses equal fluid columns and stacks on smaller viewports', () => {
  const css = readFileSync(root + 'src/styles.css', 'utf8');
  assert.match(css, /\.grid\.catalog-grid, \.grid\.catalog-resale-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.grid\.catalog-grid, \.grid\.catalog-resale-grid \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
});
it('how-it-works steps have decorative art crops, preserving their meaning and no purchase controls', async () => {
  const html = (await page()).home({connected:false});
  assert.equal([...html.matchAll(/class="step-art" aria-hidden="true"/g)].length, 3);
  assert.match(html, /Prices are shown in USD with a NIGHT estimate/);
  assert.match(html, /Print, show a QR or send a prepared pass to your phone/);
  assert.match(html, /The gate verifies your ticket without seeing your wallet address/);
  assert.doesNotMatch(html, />Buy<\/button>/);
});

it('catalog keeps every event for odd and even counts and groups cover/details without changing Buy', async () => {
  const ui = await page();
  for (const count of [1, 2, 3, 4, 5]) {
    const st = state(true);
    st.events = Array.from({length:count}, (_, index) => ({id:BigInt(index + 1),mine:false,open:true,isKey:false}));
    st.types = st.events.map((e) => ({...ticketType,id:e.id,eventId:e.id})) as any;
    const html = ui.catalog(session, st);
    assert.equal([...html.matchAll(/class="card event"/g)].length, count);
    assert.equal([...html.matchAll(/class="event-content"/g)].length, count);
    assert.match(html, /class="cover"/);
    assert.match(html, /<div class="buy-action"><button[^>]*>Buy<\/button><span class="price">/);
    st.events.push({id:99n,mine:false,open:true,isKey:false});
    assert.equal([...ui.catalog(session, st).matchAll(/class="card event"/g)].length, count, 'typeless event hidden');
  }
});
it('only odd-count catalogs feature the first card across the full grid, with a mobile stack', () => {
  const css = readFileSync(root + 'src/styles.css', 'utf8');
  assert.match(css, /\.catalog-grid > \.card\.event:first-child:nth-last-child\(odd\) \{[^}]*grid-column: 1 \/ -1;[^}]*display: grid;[^}]*grid-template-columns: minmax\(0, 1\.12fr\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 760px\) \{\s*\.catalog-grid > \.card\.event:first-child:nth-last-child\(odd\) \{ display: block/);
  assert.doesNotMatch(css, /\.catalog-grid > \.card\.event:first-child \{[^}]*grid-column: 1 \/ -1/);
});
it('ticket presentation is a 2-column grid of cover-on-top cards (1 column under 420px) with a clear options invitation', () => {
  const css = readFileSync(root + 'src/styles.css', 'utf8');
  assert.match(css, /\.tix-page \{ max-width: 1040px; \}/);
  // CT-TIX-TYPE-LABEL (P-Jay t2367u): last rules win.
  assert.match(css, /\.tix-page \.ticket-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.tix-page \.ticket-list-card \{ display: flex; flex-direction: column;/);
  assert.match(css, /\.tix-page \.ticket-list-card \.ticket-cover \{[^}]*aspect-ratio: 4 \/ 3/);
  assert.match(css, /@media \(max-width: 419px\) \{\s*\.tix-page \.ticket-list \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.tix-page \.ticket-open \{[^}]*border: 1px solid[^}]*border-radius: 999px/);
});

const publishedEvent = {id:'1',name:'Midnight Summit · Preview',date:'2026-12-05',venue:'Preview venue',cover:'/art/quantum-club.webp',demoArt:'true',description:'Organizer-provided preview description for this test only.',publishedAt:1700000000000,tickets:[{id:'1',name:'General admission · Preview',usdCents:'2500',resaleSummary:'No resale'}]};
it('disconnected Events renders organizer-published prices and Connect to buy, never PurchaseButton', async () => {
  const html=(await page()).published({source:'organizer-published',contract,events:[publishedEvent]});
  assert.match(html,/Midnight Summit · Preview/);assert.match(html,/\$25\.00 USD · published price/);
  assert.match(html,/Connect to buy/);assert.match(html,/Prices and availability are confirmed after connection/);
  assert.match(html,/No purchase is made when you connect/);assert.match(html,/Demo art/);
  assert.doesNotMatch(html,/class="buy-action"|>Buy<\/button>|On sale|Connect to see available events/);
});
it('public event detail explains the event, private pass, resale and wallet requirement', async () => {
  const html=(await page()).publicDetail(publishedEvent);
  assert.match(html,/Organizer-provided preview description/);assert.match(html,/Resale rules/);assert.match(html,/No resale/);
  assert.match(html,/private single-use pass/);assert.match(html,/My tickets/);assert.match(html,/Connect to buy/);
  assert.doesNotMatch(html,/class="buy-action"|>Buy<\/button>/);
});
it('organizer create and edit expose required real details and description, not implicit demo art', async () => {
  const ui=await page();const html=ui.create({});
  for(const label of ['Name','Date','Venue','Short description','Cover image · required'])assert.ok(html.includes(label));
  assert.match(html,/<textarea[^>]*required/);assert.match(html,/Demo artwork 1 · labeled Demo art/);
  assert.match(html,/<button[^>]*disabled=""[^>]*>Create event/);
  assert.match(ui.edit({}),/<button[^>]*disabled=""[^>]*>Save details/);
  assert.doesNotMatch(html,/value="Midnight Summit/);
});
it('trust and success guidance always point to My tickets and NIGHT on Midnight only', async () => {
  const ui=await page();const trust=ui.trust();
  assert.match(trust,/NIGHT on Midnight is the only payment method/);assert.match(trust,/After payment, open My tickets/);
  assert.match(ui.home({connected:true}),/After payment, open My tickets/);
  assert.match(ui.next(),/Find your ticket in My tickets/);assert.match(ui.next(),/do not buy again/);
});

it('public catalog event links preserve explicit network/schema and use read-only default lookup',async()=>{
 const ui=await page('events','/','?network=preview&schema=3');
 const contract='ab'.repeat(32);const html=ui.published({source:'organizer-published',contract,events:[{id:'7',name:'Midnight Summit · Preview',date:'2026-12-05',venue:'Preview venue',cover:'/art/quantum-club.webp',demoArt:'true',description:'Preview-only description for a test listing.',publishedAt:Date.now(),tickets:[]}]});
 assert.match(html,/href="\/e\/7\?[^"]*schema=3/);assert.match(html,/network=preview/);assert.match(html,/Connect to buy/);
 const source=readFileSync(root+'src/App.tsx','utf8');assert.match(source,/resolveCatalogContractHint\(\): string \| null \{ return resolveContractHint\(\) \|\| configuredRateV3Contract\(NETWORK\); \}/);
 const walletDefaults=readFileSync(root+'src/midnight/schema.ts','utf8');assert.match(walletDefaults,/return 1;/);
});
it('CT-POLISH-3: identical ticket types render as one buyer option with combined stock', async () => {
  const ui = await page();
  eventMeta({name:'Polish event'});
  for (const id of ['1', '2']) store.set(`cloaktix:meta:${contract}:tt:${id}`, JSON.stringify({name:'General admission'}));
  const st = state(true, [{...ticketType,id:2n,sold:1n}, {...ticketType,id:1n,sold:3n}] as any);
  const html = ui.catalog(session, st);
  assert.equal([...html.matchAll(/class="ttype"/g)].length, 1);
  assert.match(html, /<b>General admission<\/b>/);
  assert.match(html, /4\/200 sold/);
  store.set(`cloaktix:meta:${contract}:tt:2`, JSON.stringify({name:'Balcony'}));
  assert.equal([...ui.catalog(session, st).matchAll(/class="ttype"/g)].length, 2);
});
it('CT-AGE-CRED: an 18+ ticket shows the age step instead of Buy until a trusted adult credential is held', async () => {
  const ui = await page();
  eventMeta({name:'Age event'});
  const issuer = { x: 7n, y: 9n };
  const st: any = { ...state(true, [{...ticketType, adultOnly: true}] as any), ageIssuer: issuer };
  const none = ui.catalog(session, st);
  assert.match(none, /id="age-check"/);
  assert.match(none, /class="buy-action age-gate"/);
  assert.match(none, /This is an 18\+ ticket\. Get your age credential first/);
  assert.doesNotMatch(none, /<button[^>]*>Buy<\/button>/);
  const adult = { ...session, age: { claim: { holder: new Uint8Array(32), adultFrom: 0n }, proof: { publicKey: issuer } } };
  const ok = ui.catalog(adult, st);
  assert.doesNotMatch(ok, /age-gate/);
  assert.match(ok, /<div class="buy-action"><button[^>]*>Buy<\/button>/);
  const other = { ...session, age: { claim: { holder: new Uint8Array(32), adultFrom: 0n }, proof: { publicKey: { x: 1n, y: 2n } } } };
  assert.match(ui.catalog(other, st), /issuer this event does not trust/);
  const minor = { ...session, age: { claim: { holder: new Uint8Array(32), adultFrom: 99999999999n }, proof: { publicKey: issuer } } };
  assert.match(ui.catalog(minor, st), /under 18/);
});
