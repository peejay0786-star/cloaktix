/** CT-CREATE-CRASH: an event with an uploaded cover (data: URL, up to 300,000 chars) must not crash the share link render. */
import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { b64u, shareLinkEventMeta } from '../src/shareMeta.ts';
import { renderErrorCode } from '../src/errorCode.ts';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.create-crash-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'location', { configurable: true, value: { pathname: '/organizer', search: '?network=preview&schema=3', hash: '#organizer', origin: 'http://local.test' } });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });
const unb64u = (x: string) => new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
const bigCover = 'data:image/jpeg;base64,' + 'A'.repeat(299_000);
const contract = 'ab'.repeat(32);

it('old spread encoder overflows on a max-size cover; b64u round-trips it (UTF-8 too)', () => {
  const payload = JSON.stringify({ name: 'Soirée — 東京', cover: bigCover });
  assert.throws(() => btoa(String.fromCharCode(...new TextEncoder().encode(payload))), RangeError);
  assert.equal(unb64u(b64u(payload)), payload);
  assert.equal(unb64u(b64u('Soirée ✓')), 'Soirée ✓');
});

it('share-link meta drops uploaded covers, keeps demo paths, stays small', () => {
  const m = shareLinkEventMeta({ name: 'Soirée', date: '2026-12-31', venue: 'Montréal', description: 'x'.repeat(5000), cover: bigCover });
  assert.equal(m?.cover, undefined); assert.equal(m?.name, 'Soirée'); assert.equal(m?.description, undefined);
  assert.ok(JSON.stringify(m).length <= 2000);
  assert.equal(shareLinkEventMeta({ name: 'A', cover: '/art/quantum-club.webp' })?.cover, '/art/quantum-club.webp');
  assert.equal(shareLinkEventMeta(null), undefined);
});

it('organizer manage page renders the share link for an event with a max-size uploaded cover', () => {
  memory.set(`cloaktix:meta:${contract}:ev:1`, JSON.stringify({ name: 'Soirée réelle', date: '2026-12-31', venue: 'Montréal', description: 'Une vraie description.', cover: bigCover, demoArt: 'false' }));
  buildSync({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {OrganizerEvent} from './src/App';import {RatesContext} from './src/useRates';
export const manage=p=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(OrganizerEvent,{onBack(){},...p})));`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/ui.mjs', logLevel: 'error' });
  return import(pathToFileURL(dir + '/ui.mjs').href).then((ui) => {
    const s = { schema: 3, networkId: 'preview', contract, accountId: 'cd'.repeat(32), walletName: '1AM', idSource: 'wallet' };
    const st = { schemaVersion: 3, feeBps: 300n, networkTag: new Uint8Array(32), ageIssuer: { x: 0n, y: 0n }, events: [{ id: 1n, mine: true, open: true, isKey: false }, { id: 2n, mine: true, open: true, isKey: true }], types: [], tickets: [], ownedTickets: [], held: {}, checkIns: new Map(), listings: [] };
    const html = ui.manage({ s, st, run: async () => { throw new Error('no submit'); }, eventId: 1n });
    assert.ok(html.includes('Soirée réelle')); assert.ok(html.includes('Buyer share link'));
    const link = html.match(/value="(http:\/\/local\.test\/e\/1\?[^"]+)"/)?.[1]; assert.ok(link, 'share link rendered');
    assert.ok(link!.length < 4000, 'share link stays small: ' + link!.length);
    const m = JSON.parse(unb64u(new URL(link!.replace(/&amp;/g, '&')).searchParams.get('m')!));
    assert.equal(m.e.name, 'Soirée réelle'); assert.equal(m.e.cover, undefined);
  });
});

it('error boundary code is short and never contains the message', () => {
  const code = renderErrorCode(new RangeError('Maximum call stack size exceeded'));
  assert.match(code, /^CT-RangeError-[0-9A-Z]{1,5}$/); assert.ok(!code.includes('Maximum'));
});
