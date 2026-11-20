import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(root + '.egg40-deploy-card-');
after(() => rmSync(dir, { recursive: true, force: true }));
const build = (env: Record<string, string>, out: string) => buildSync({
  stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {Egg40DeployCard} from './src/App';
export const card=()=>renderToStaticMarkup(React.createElement(Egg40DeployCard,{s:{address:'x',deployEgg40(){throw new Error('render must not deploy')}},run:async()=>{throw new Error('render must not run')}}));`, resolveDir: root, loader: 'tsx' },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview', ...env }) }, outfile: out,
});
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'location', { configurable: true, value: { search: '?schema=3&deploy=egg40', hash: '', pathname: '/organizer', origin: 'https://example.test', hostname: 'example.test' } });
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) } });
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null, setItem() {} } });

it('shows the 6-step EGG-40 deploy button when no EGG-40 contract is configured', async () => {
  build({}, dir + '/a.mjs');
  const html = (await import(dir + '/a.mjs')).card();
  assert.match(html, /Deploy EGG-40 \(6 steps\)/);
  assert.match(html, /does <b>not<\/b> touch the current contract or Test v3/);
  assert.doesNotMatch(html, /already uses/);
});
it('refuses a second deploy once VITE_EGG40_CONTRACT is set', async () => {
  build({ VITE_EGG40_CONTRACT: 'ab'.repeat(32) }, dir + '/b.mjs');
  const html = (await import(dir + '/b.mjs')).card();
  assert.match(html, /already uses EGG-40 contract/);
  assert.doesNotMatch(html, /Deploy EGG-40 \(/);
});
