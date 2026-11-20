/**
 * EGG-44 (2026-11-19, live bug): an approved staff phone scanned Launch Night ticket #1 and showed "Not for this event".
 * Root cause: the live app built the EGG-40 door API without a chain view, so evaluate() found no ticket for any serial
 * and returned wrong-event. Same for plan B check-in and settlement. Fixture = the real EGG-40 state with ticket #1
 * (indexer read 2026-11-19 ~20:45 ET, public on-chain data).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import { register } from 'node:module';
import { createLiveEgg40Api, memoryChain } from '../src/egg40/live.ts';
import { createMemoryRelay } from '../src/egg40/memoryRelay.ts';
import { memoryKeyStore } from '../src/egg40/keyStore.ts';
import { indexerTicketChain } from '../src/egg40/ticketChain.ts';
import { encodeAdmitQr } from '../src/v2/admitCodec.ts';
import { defaultKeyWindow } from '../src/doorkeys/model.ts';

const RT = new URL('../node_modules/@midnight-ntwrk/compact-runtime/dist/index.js', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnight-ntwrk/compact-runtime') return { url: ${JSON.stringify(RT)}, shortCircuit: true };
  return n(s, c); }`));
const { decodeTicketState } = await import('../src/egg40/chainDoorState.ts');

const C = '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372';
const V3 = 'b92733389b1955c913dec004df708a12697df4a962ffab5dbde1e88f574ab04e';
const STATE_FILE = new URL('./fixtures/egg40-ticket1-state.hex', import.meta.url);
const HAS_STATE = fs.existsSync(STATE_FILE);
const STATE = HAS_STATE ? fs.readFileSync(STATE_FILE, 'utf8').trim() : '';
const META = { tt: { '1': { name: 'General admission' }, '2': { name: 'After party' } } };
const H = 3_600_000;
const qr = (serial: string, contract = C, epoch = '1') => encodeAdmitQr({ v: 2, networkId: 'preview', contract, serial, epoch, nonceHex: 'ab'.repeat(32) });

function liveChain(state = { down: false, reads: 0 }) {
  const fetcher = (async (url: string) => {
    state.reads++;
    if (state.down) throw new TypeError('Failed to fetch');
    if (String(url).includes('/meta')) return Response.json(META);
    return Response.json({ data: { contractAction: { state: STATE } } });
  }) as typeof fetch;
  return { state, chain: indexerTicketChain({ contract: C, indexerUrl: 'https://app.test/indexer?u=x', metaUrl: 'https://app.test/meta?c=' + C, decode: decodeTicketState, fetcher, ttlMs: 0, minFreshMs: 0 }) };
}

async function approvedStaff(chain: any, call = async () => ({ txId: 'tx' })) {
  const relay = createMemoryRelay(C);
  await relay.putSchedule('1', { eventId: '1', eventName: 'CloakTix Launch Night', doorsOpenAt: Date.now() - H, doorsCloseAt: Date.now() + 3 * H, doors: [{ gateId: '1', name: 'Main door', ticketTypes: [], typeIds: [] }] } as any);
  const org = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain, call, sleep: async () => {} });
  const staff = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain });
  const key = await staff.staff.createKey(1n, 1n);
  const s = await staff.staff.schedule(1n);
  const preview = await org.organizer.previewPairing(1n, key.code, defaultKeyWindow(s!));
  await org.organizer.authorizeDoorKey(preview, () => {});
  return { org, staff, key };
}

describe('EGG-44 real Launch Night state', { skip: !HAS_STATE && 'needs a local snapshot of the live contract state (not published: it holds on-chain addresses)' }, () => {
  it('ticket #1 is General admission of event 1, unused, admit epoch 1 (the QR it carries)', () => {
    const t = decodeTicketState(STATE).find(x => x.serial === '1');
    assert.deepEqual(t, { serial: '1', typeId: '1', eventId: '1', status: 0, hasAdmit: true, epoch: '1' });
  });

  it('REPRO: without a chain view (the live app before EGG-44) the scan could never be valid', async () => {
    const { staff, key } = await approvedStaff(memoryChain([]));
    assert.equal((await staff.staff.scan(key, qr('1'))).kind, 'wrong-event');
  });

  it('FIX: the staff phone admits ticket #1 once, then says Already used', async () => {
    const { chain } = liveChain();
    const { staff, key } = await approvedStaff(chain);
    const first = await staff.staff.scan(key, qr('1'));
    assert.deepEqual(first, { kind: 'valid', typeName: 'General admission' });
    assert.equal((await staff.staff.scan(key, qr('1'))).kind, 'already-used');
  });

  it('still refuses what is really not for this event: unknown serial, other contract (Test v3), replaced epoch', async () => {
    const { chain } = liveChain();
    const { staff, key } = await approvedStaff(chain);
    assert.equal((await staff.staff.scan(key, qr('99'))).kind, 'wrong-event');
    assert.equal((await staff.staff.scan(key, qr('1', V3))).kind, 'wrong-event');
    assert.equal((await staff.staff.scan(key, qr('1', C, '0'))).kind, 'replaced');
  });

  it('fails closed when the tickets cannot be read: "Can\'t confirm entry", nothing recorded', async () => {
    const lc = liveChain();
    const { staff, key } = await approvedStaff(lc.chain);
    lc.state.down = true;
    assert.equal((await staff.staff.scan(key, qr('1'))).kind, 'relay-offline');
    lc.state.down = false;
    assert.equal((await staff.staff.scan(key, qr('1'))).kind, 'valid', 'not consumed by the failed attempt');
  });

  it('plan B check-in on the organizer device admits ticket #1 on-chain (admit circuit)', async () => {
    const { chain } = liveChain();
    const calls: string[] = [];
    const relay = createMemoryRelay(C);
    const org = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain, call: async (c) => { calls.push(c); return { txId: 'tx' }; } });
    assert.deepEqual(await org.organizer.directAdmit(1n, qr('1'), () => {}), { kind: 'valid', typeName: 'General admission' });
    assert.deepEqual(calls, ['admit']);
  });
});

describe('EGG-44 live wiring', () => {
  it('the live boot gives the door API a ticket view (same-origin indexer proxy + catalog names)', () => {
    const src = fs.readFileSync(new URL('../src/egg40/boot.ts', import.meta.url), 'utf8');
    assert.match(src, /indexerTicketChain\(\{/);
    assert.match(src, /createLiveEgg40Api\(\{\s*contract,\s*relay,\s*chain,/);
    assert.match(src, /\/indexer\?u=/);
  });
});

describe('EGG-44 buy steps in Checkout (UI only)', async () => {
  const { createRequire } = await import('node:module');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const require = createRequire(new URL('../package.json', import.meta.url));
  const root = new URL('../', import.meta.url).pathname;
  const dir = mkdtempSync(root + '.egg44-');
  const { after } = await import('node:test');
  after(() => rmSync(dir, { recursive: true, force: true }));
  require('esbuild').buildSync({
    stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {CheckoutPanel,buyStepAfter,buyErrorText,BUY_STEP_LABEL} from './src/Checkout';import {RatesContext} from './src/useRates';
export {buyStepAfter,buyErrorText,BUY_STEP_LABEL};
export const panel=(p)=>renderToStaticMarkup(React.createElement(CheckoutPanel,{amount:0n,usdCents:5000n,onPay(){},...p}));`, resolveDir: root, loader: 'tsx' },
    bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', logLevel: 'silent',
    define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/c.mjs',
  });
  const h: any = await import(dir + '/c.mjs');

  it('steps follow the in-tab prover: preparing -> proving on start -> wallet on done', () => {
    assert.equal(h.buyStepAfter('preparing', { phase: 'start' }), 'proving');
    assert.equal(h.buyStepAfter('proving', { phase: 'done' }), 'wallet');
    assert.equal(h.buyStepAfter('wallet', { phase: 'error' }), 'wallet');
  });

  it('while paying, Checkout shows the step with a timer and the button names it; the error shows inside the dialog after', () => {
    const busy = h.panel({ busy: true, buyStep: { step: 'proving', since: Date.now() - 12_000 } });
    assert.match(busy, /Building proof…/);
    assert.match(busy, /1AM opens after that/);
    assert.match(busy, /0:1[12]/);
    const failed = h.panel({ busy: false, error: 'Wallet refused the transaction.' });
    assert.match(failed, /role="alert"[^>]*>Wallet refused the transaction\./);
    assert.match(h.buyErrorText(new Error('x')), /x|purchase did not finish/);
  });

  it('App: a failed single purchase is rethrown to Checkout, never only to the page banner or an alert()', () => {
    const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /if \(!r\) throw failure \?\? new Error\(ran \? 'The purchase did not finish/);
    assert.doesNotMatch(app, /alert\(String\(err\?\.message \?\? err\)\)/);
  });
});

describe('EGG-44 settlement key (found while re-running EGG-40 tests)', () => {
  it('Create settlement key draws a new secret when the key id exceeds the Field bound instead of failing at random', () => {
    const src = fs.readFileSync(new URL('../src/egg40/live.ts', import.meta.url), 'utf8');
    const body = src.slice(src.indexOf('async createSettlementKey'), src.indexOf("await phase(onPhase, 'relay')", src.indexOf('async createSettlementKey')));
    assert.match(body, /for \(let i = 0; i < 32 && !keyIdFitsField\(keyId\); i\+\+\)/);
  });
});
