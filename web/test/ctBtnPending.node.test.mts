import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { after } from 'node:test';
import { listingSaveError, parseListingErrorBody } from '../src/catalog/listingErrors.ts';
import { PENDING_SAVE, PENDING_WALLET, PENDING_CREATE } from '../src/pendingLabels.ts';

const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname, dir = mkdtempSync(root + '.btn-pending-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
buildSync({
  stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {PendingButton, PENDING_SAVE, PENDING_WALLET} from './src/PendingButton';
import {EventEditForm} from './src/EventCreateForm';
import {CheckoutPanel} from './src/Checkout';
import {RatesContext} from './src/useRates';
const wrap=(node)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},node));
export const pending=(props)=>wrap(React.createElement(PendingButton,props,'Save details'));
export const edit=(props)=>wrap(React.createElement(EventEditForm,props));
export const pay=(props)=>wrap(React.createElement(CheckoutPanel,props));
`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/ui.mjs', logLevel: 'error',
});
const ui = await import(pathToFileURL(dir + '/ui.mjs').href);

describe('CT-BTN-PENDING shared pending button', () => {
  it('shows a spinner and pending label, and is disabled, while waiting', () => {
    const html = ui.pending({ className: 'primary', pending: true, pendingLabel: PENDING_SAVE });
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /class="spin"/);
    assert.match(html, /Saving…/);
    assert.doesNotMatch(html, />Save details</);
    const idle = ui.pending({ className: 'primary', pending: false });
    assert.doesNotMatch(idle, /aria-busy/);
    assert.match(idle, />Save details</);
    assert.doesNotMatch(idle, /Saving…/);
  });

  it('Edit details uses Saving… and keeps a thrown server message', () => {
    const details = { name: 'CloakTix Launch Night', date: '2026-12-12', venue: 'Montreal, QC', cover: '/art/neon-nights.webp', demoArt: 'true', description: 'A private launch night for CloakTix in Montreal. Buy with NIGHT on Midnight, then enter with a single-use pass.' };
    const html = ui.edit({ initial: details, onSubmit: async () => {}, onCancel() {} });
    assert.match(html, />Save details</);
    assert.match(readFileSync(new URL('../src/EventCreateForm.tsx', import.meta.url), 'utf8'), /PENDING_SAVE/);
    assert.match(readFileSync(new URL('../src/EventCreateForm.tsx', import.meta.url), 'utf8'), /e instanceof Error&&e\.message\?e\.message/);
  });

  it('checkout Pay uses Waiting for wallet… and does not change the idle Buy label', () => {
    const html = ui.pay({ amount: 0n, usdCents: 5000n, onPay() {}, busy: true });
    assert.match(html, /Waiting for wallet…/);
    assert.match(html, /aria-busy="true"/);
    const idle = ui.pay({ amount: 0n, usdCents: 5000n, onPay() {}, busy: false });
    assert.match(idle, /Pay with NIGHT on Midnight/);
    assert.doesNotMatch(idle, /Waiting for wallet…/);
    const app = readFileSync(new URL('../src/Checkout.tsx', import.meta.url), 'utf8');
    assert.match(app, /\{qty > 1 \? `Buy \$\{qty\}` : 'Buy'\}/);
    assert.doesNotMatch(app, /pending=\{busy\}[^}]*Buy/);
  });

  it('prefers-reduced-motion disables the spinner animation and labels have no em-dashes', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /\.pending-button \.spin, \.busy \.spin \{ animation: none;/);
    assert.equal(PENDING_SAVE, 'Saving…');
    assert.equal(PENDING_WALLET, 'Waiting for wallet…');
    assert.equal(PENDING_CREATE, 'Creating…');
    for (const label of [PENDING_SAVE, PENDING_WALLET, PENDING_CREATE]) assert.doesNotMatch(label, /[—–]/);
  });

  it('resale, transfer-prep, staff and check-in actions use the shared pending button', () => {
    const files = {
      app: readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'),
      tickets: readFileSync(new URL('../src/v2/TicketsGateV2.tsx', import.meta.url), 'utf8'),
      doors: readFileSync(new URL('../src/multigate/DoorsStaff.tsx', import.meta.url), 'utf8'),
      gate: readFileSync(new URL('../src/multigate/GateV4.tsx', import.meta.url), 'utf8'),
    };
    const uses = (source: string, label: string) => {
      const candidates = [
        source.lastIndexOf('>' + label + '<'),
        source.lastIndexOf('>' + label + '</'),
        source.lastIndexOf(" '" + label + "'"),
        source.lastIndexOf('\n            ' + label + '\n'),
      ].filter((i) => i >= 0);
      const at = candidates.length ? Math.max(...candidates) : -1;
      assert.ok(at >= 0, `missing button label ${label}`);
      const before = source.lastIndexOf('<PendingButton', at);
      const wallet = source.lastIndexOf('<WalletPendingButton', at);
      const closer = Math.max(before, wallet);
      assert.ok(closer >= 0, `${label} is not a shared pending button`);
      assert.ok(!source.slice(closer, at).includes('</'), `${label} pending tag was closed too early`);
    };
    uses(files.app, 'Withdraw');
    uses(files.app, 'Prepare my ticket');
    uses(files.app, 'Verify');
    uses(files.tickets, 'List for resale');
    uses(files.tickets, 'Prepare ticket');
    uses(files.tickets, 'Admit');
    uses(files.gate, 'Admit');
    uses(files.doors, 'Create door');
    uses(files.doors, 'Add staff');
    uses(files.doors, 'Enable staff mode');
    uses(files.doors, 'Save name');
    uses(files.doors, 'Revoke');
    assert.doesNotMatch(files.gate, /Awaiting confirmation/);
  });
});

describe('CT-CATALOG-SAVE-DETAILS error mapping', () => {
  it('maps /meta status codes to retry-safe messages and never asks to recreate types', () => {
    assert.match(listingSaveError({ ok: false, status: 400, error: 'Invalid or oversized metadata request.' }), /cover image is too large/);
    assert.match(listingSaveError({ ok: false, status: 403, error: 'Signing key is not registered to this organizer.' }), /one-time key registration/);
    assert.match(listingSaveError({ ok: false, status: 403, error: 'Invalid organizer signature.' }), /same browser/);
    assert.match(listingSaveError({ ok: false, status: 404, error: 'Event or ticket type is not indexed yet.' }), /Wait about a minute/);
    assert.match(listingSaveError({ ok: false, status: 503, error: 'Catalog unavailable. No purchase was made.' }), /unavailable right now/);
    for (const status of [400, 403, 404, 503, 507, undefined]) {
      const message = listingSaveError({ ok: false, status, error: 'x' });
      assert.doesNotMatch(message, /add a ticket type again|create the event again and add/i);
      assert.doesNotMatch(message, /[—–]/);
    }
    assert.equal(parseListingErrorBody('{"error":"Signing key is not registered to this organizer."}'), 'Signing key is not registered to this organizer.');
  });
});
