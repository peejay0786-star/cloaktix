import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

// Match existing UI tests: bundle real components and render with synthetic rates.
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(`${tmpdir()}/ct-buy-layout-`);
const entry = `import React from ${JSON.stringify(require.resolve('react'))};
import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};
import {PurchaseButton,CheckoutPanel} from './src/Checkout';
import {RatesContext} from './src/useRates';
const render=(component,props,state)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:state},React.createElement(component,props)));
export const buy=(props,state)=>render(PurchaseButton,{legacyNightPurchase:async()=>{throw new Error('render must not pay')},...props},state);
export const checkout=(props,state)=>render(CheckoutPanel,{onPay(){},...props},state);`;
buildSync({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', outfile: dir + '/render.cjs' });
const ui = require(dir + '/render.cjs');
rmSync(dir, { recursive: true });
const ready = { kind: 'ready', rates: { nightUsd: 0.038603, adaUsd: 0.5, asOf: Date.now() } };

function assertTrigger(html: string) {
  const buttons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)];
  assert.equal(buttons.length, 1, 'only the trigger is shown before opening checkout');
  assert.equal(buttons[0][1], 'Buy', 'button label contains no price or conversion');
  assert.match(html, /<div class="buy-action"><button[^>]*>Buy<\/button><span class="price">/, 'price is the immediate sibling below Buy');
  assert.doesNotMatch(html, /Checkout|Pay with NIGHT/);
}

it('USD-priced trigger shows only Buy, with fiat and two-decimal NIGHT below', () => {
  const html = ui.buy({ amount: 1928028001n, usdCents: 7443n }, ready);
  assertTrigger(html);
  assert.match(html, /<span>\$74\.43 USD<\/span><small>≈ 1928\.09 NIGHT<\/small>/);
  assert.doesNotMatch(html, /1928\.028001/);
});

it('legacy NIGHT/resale prices have compact estimates without changing checkout atom precision', () => {
  const amount = 1928028001n;
  const html = ui.buy({ amount }, ready);
  assertTrigger(html);
  assert.match(html, /<span>\$74\.43 USD<\/span><small>≈ 1928\.03 NIGHT<\/small>/);
  const checkout = ui.checkout({ amount }, ready);
  assert.match(checkout, /1928\.028001 NIGHT/);
  assert.match(checkout, /Pay with NIGHT on Midnight/);
});

it('small and free prices still show exactly two decimal places below Buy', () => {
  for (const [usdCents, expected] of [[39n, '10.10'], [0n, '0.00']]) {
    const html = ui.buy({ amount: 0n, usdCents }, ready);
    assertTrigger(html);
    assert.ok(html.includes(`≈ ${expected} NIGHT`));
  }
});

it('disabled Buy retains its label and sibling reference price', () => {
  const html = ui.buy({ amount: 10000000n, disabled: true }, ready);
  assertTrigger(html);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Buy<\/button>/);
  assert.match(html, /≈ 10\.00 NIGHT/);
});

it('missing rates keep unavailability outside Buy without inventing a conversion', () => {
  for (const props of [{ amount: 10000000n }, { amount: 0n, usdCents: 39n }]) {
    const html = ui.buy(props, { kind: 'unavailable' });
    assertTrigger(html);
    assert.match(html, /NIGHT rate unavailable/);
    assert.doesNotMatch(html, /≈/);
  }
});

it('USD checkout retains its quote warning and NIGHT payment action', () => {
  const html = ui.checkout({ amount: 0n, usdCents: 7443n }, ready);
  assert.match(html, /exact amount locked by a signed quote when you pay/);
  assert.match(html, /Pay with NIGHT on Midnight/);
});

it('scoped layout overrides event flex rows and global button wrapping', () => {
  const css = readFileSync(root + 'src/styles.css', 'utf8');
  assert.match(css, /\.buy-action,\s*\.card\.event \.ttype > \.buy-action \{[^}]*display: grid/);
  assert.match(css, /\.buy-action > button\.primary \{[^}]*white-space: nowrap; overflow-wrap: normal/);
  assert.match(css, /\.buy-action > \.price \{[^}]*color: var\(--mut\)/);
  assert.match(css, /@media \(max-width: 600px\) \{\s*\.ttype > \.buy-action \{ width: 100%/);
});
