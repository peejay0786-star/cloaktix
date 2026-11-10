import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { parseListingType, plainDashes } from '../src/catalog/model.ts';

// CT-UI-NITS (2026-11-10): one NIGHT line in checkout, readable 18+ row, no em-dash in buyer copy.
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(`${tmpdir()}/ct-ui-nits-`);
const entry = `import React from ${JSON.stringify(require.resolve('react'))};
import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};
import {CheckoutPanel} from './src/Checkout';
import {RatesContext} from './src/useRates';
const render=(component,props,state)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:state},React.createElement(component,props)));
export const checkout=(props,state)=>render(CheckoutPanel,{onPay(){},...props},state);`;
buildSync({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env.VITE_NETWORK': '"preview"' }, outfile: dir + '/render.cjs', logLevel: 'silent' });
const ui = require(dir + '/render.cjs');
rmSync(dir, { recursive: true });
const ready = { kind: 'ready', rates: { nightUsd: 0.042, adaUsd: 0.5, asOf: Date.now() } };

it('single-ticket USD checkout shows the NIGHT estimate once', () => {
  const html = ui.checkout({ amount: 0n, usdCents: 7500n }, ready);
  assert.equal((html.match(/NIGHT \(exact amount|≈ [\d.]+ NIGHT/g) ?? []).length, 1);
  assert.match(html, /\$75\.00 USD/);
});

it('market data links carry the readable class', () => {
  const html = ui.checkout({ amount: 0n, usdCents: 7500n }, ready);
  assert.match(html, /class="small muted market-data">Market data: <a /);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.market-data a \{ color: var\(--acc3\)/);
});

it('18+ age gate is a bounded flex item so the type name keeps its width', () => {
  assert.match(readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'), /<div className="buy-action age-gate">/);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.card\.event \.ttype > \.buy-action\.age-gate \{ flex: 0 1 17rem; min-width: 0;/);
  assert.match(css, /\.card\.event \.ttype > \.ticket-type-details \{ flex: 1 1 9rem; min-width: 7\.5rem; \}/);
});

it('published resale summaries are shown without an em-dash', () => {
  assert.equal(plainDashes('Capped resale — maximum $75.00 USD'), 'Capped resale, maximum $75.00 USD');
  assert.equal(parseListingType({ id: '1', name: 'General admission', usdCents: '5000', resaleSummary: 'Capped resale — maximum $75.00 USD' })?.resaleSummary, 'Capped resale, maximum $75.00 USD');
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  for (const copy of ['Capped resale —', 'capped resale —', 'single-use pass —']) assert.ok(!app.includes(copy), copy);
});
