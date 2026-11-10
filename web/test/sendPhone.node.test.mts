/** CT-SEND-PHONE: Send to phone with an uploaded (data: URL) event cover must not overflow the QR and crash. */
import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { encodeAdmitFragmentPath, parseAdmitFromLocation, encodeAdmitQr, isPortableCover } from '../src/v2/admitCodec.ts';
import { buildPhoneTransferUrl } from '../src/v2/phoneTransfer.ts';
import { QRCode, QRErrorCorrectLevel } from '../src/vendor/qrcode.js';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.send-phone-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://app.cloaktix.com', pathname: '/', search: '', hash: '#tickets' } });
Object.defineProperty(globalThis, 'window', { configurable: true, value: { innerWidth: 400 } });
const bigCover = 'data:image/jpeg;base64,' + 'A'.repeat(250_000);
const cap = { v: 2 as const, networkId: 'preview', contract: 'b9'.repeat(32), serial: '1', epoch: '1', nonceHex: 'ab'.repeat(32),
  eventName: 'Soirée réelle', ticketName: 'Général', eventDate: '2026-12-31', venue: 'Montréal', cover: bigCover };
const fits = (text: string) => { try { const q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(text); q.make(); return true; } catch { return false; } };

it('old fragment with an uploaded cover overflows the QR encoder (the live crash)', () => {
  const old = new URLSearchParams({ n: 'x', cover: bigCover }).toString();
  assert.throws(() => { const q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(old); q.make(); }, /code length overflow/);
});

it('phone link drops uploaded covers, keeps demo art, fits in a QR, and round-trips the capability', () => {
  const url = buildPhoneTransferUrl({ origin: 'https://app.cloaktix.com', cap });
  assert.ok(!url.includes('data%3Aimage') && !url.includes('data:image')); assert.ok(url.length < 1000, String(url.length)); assert.ok(fits(url));
  const back = parseAdmitFromLocation(new URL(url).hash)!;
  assert.equal(back.serial, '1'); assert.equal(back.nonceHex, 'ab'.repeat(32)); assert.equal(back.eventName, 'Soirée réelle'); assert.equal(back.cover, undefined);
  const demo = parseAdmitFromLocation(encodeAdmitFragmentPath({ ...cap, cover: '/art/quantum-club.webp' }))!;
  assert.equal(demo.cover, '/art/quantum-club.webp');
  assert.ok(fits(buildPhoneTransferUrl({ origin: 'https://app.cloaktix.com', cap: { ...cap, eventName: 'É'.repeat(80), venue: 'V'.repeat(120), ticketName: 'T'.repeat(80) } })));
  for (const c of ['//evil.example/x.png', 'https://x/y.png', 'javascript:alert(1)', bigCover]) assert.equal(isPortableCover(c), false, c);
});

it('Show QR and Print use the gate payload without metadata', () => {
  const qr = encodeAdmitQr(cap); assert.ok(!qr.includes('cover') && qr.length < 300 && fits(qr));
});

it('Send to phone dialog renders (SSR) with a 250 KB cover, and Qr degrades instead of throwing', async () => {
  buildSync({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {TransferTicket} from './src/v2/TransferTicket';import {Qr} from './src/Qr';
export const send=cap=>renderToStaticMarkup(React.createElement(TransferTicket,{cap,showPrint:false}));
export const qr=text=>renderToStaticMarkup(React.createElement(Qr,{text}));`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', outfile: dir + '/ui.mjs', logLevel: 'error' });
  const ui = await import(pathToFileURL(dir + '/ui.mjs').href);
  const html = ui.send(cap); assert.ok(html.includes('<svg class="qr"')); assert.ok(html.includes('Your ticket is ready'));
  const err = console.error; console.error = () => {};
  try { assert.ok(ui.qr('x'.repeat(10_000)).includes('too large to display')); } finally { console.error = err; }
});
