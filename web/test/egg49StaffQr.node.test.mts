/**
 * EGG-49: Door keys card, "Show QR" for the staff phone link.
 * The QR is drawn in the browser by the vendored encoder (no network) and encodes only the public staff link
 * (event id + contract address). This test decodes the rendered QR with zxing-wasm and checks it equals the link.
 */
import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { readBarcodes } from 'zxing-wasm/reader';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const C = '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372';
const dir = mkdtempSync(root + '.egg49-');
after(() => rmSync(dir, { recursive: true, force: true }));
const out = `${dir}/m.mjs`;
require('esbuild').buildSync({
  stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {staffDoorLink,StaffLinkQr} from './src/doorkeys/OrganizerDoors';
export {staffDoorLink}; export const render=(link)=>renderToStaticMarkup(React.createElement(StaffLinkQr,{link,eventId:1n}));`, resolveDir: root, loader: 'tsx' },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', logLevel: 'silent',
  define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: out,
});
const m: any = await import(out);

/** Rasterize the SVG path (one "Mx yh1v1h-1z" square per dark module) at 8 px per module. */
async function decodeSvg(svg: string): Promise<string[]> {
  const n = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)![1]); const s = 8, w = n * s;
  const data = new Uint8ClampedArray(w * w * 4).fill(255);
  for (const [, xs, ys] of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const x0 = Number(xs) * s, y0 = Number(ys) * s;
    for (let y = y0; y < y0 + s; y++) for (let x = x0; x < x0 + s; x++) { const i = (y * w + x) * 4; data[i] = data[i + 1] = data[i + 2] = 10; }
  }
  return (await readBarcodes({ data, width: w, height: w, colorSpace: 'srgb' } as any, { formats: ['QRCode'] })).map(r => r.text);
}

describe('EGG-49 staff link QR', () => {
  const link = m.staffDoorLink('https://app.cloaktix.com', 1n, C);
  it('the staff link carries only the event id and the contract address', () => {
    assert.equal(link, `https://app.cloaktix.com/door?event=1&contract=${C}`);
    assert.deepEqual([...new URL(link).searchParams.keys()], ['event', 'contract']);
  });
  it('the rendered QR decodes to exactly the staff link, dark on white with a quiet zone, 220 px, with caption and download', async () => {
    const html = m.render(link);
    assert.match(html, /width="220" height="220"/);
    assert.match(html, /<rect[^>]*fill="#FFFFFF"/);
    assert.match(html, /<path[^>]*fill="#0A0A0A"/);
    assert.match(html, /M4 4h1v1h-1z/, 'first finder module sits 4 modules in (white quiet zone)');
    assert.match(html, /Scan with the staff phone camera/);
    assert.match(html, />Download QR</);
    assert.doesNotMatch(html, /—/);
    assert.deepEqual(await decodeSvg(html), [link]);
  });
  it('the Door keys card passes only staffLink to the QR, behind a Show QR toggle', () => {
    const src = readFileSync(`${root}src/doorkeys/OrganizerDoors.tsx`, 'utf8');
    assert.match(src, /<StaffLinkQr link=\{staffLink\} eventId=\{eventId\} \/>/);
    assert.match(src, /\{showStaffQr \? 'Hide QR' : 'Show QR'\}/);
    assert.match(src, /const staffLink = staffDoorLink\(location\.origin, eventId, api\.contract\(\)\);/);
    const qr = readFileSync(`${root}src/Qr.tsx`, 'utf8');
    assert.doesNotMatch(qr, /fetch\(|https?:\/\//, 'QR is drawn locally, no network');
  });
});
