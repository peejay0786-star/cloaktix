/**
 * EGG-41b (2026-11-19, live bug): "Yes, approve with wallet" showed no 1AM prompt and no message.
 * - The proof is built in the tab first (about 17 s in node, often longer in a browser) while the button said
 *   "Approve in your wallet…": now it says "Building proof…" with a timer, and flips to the wallet prompt when the proof is done.
 * - Any failure only reached the page banner, which sits behind the dialog: now every wallet dialog shows it inline.
 * - A staff keyId above the Compact Field bound made authorizeDoorKey throw a type error before the wallet: now refused at Check code.
 */
import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { createLiveEgg40Api, memoryChain, STAFF_KEY_UNUSABLE } from '../src/egg40/live.ts';
import { createMemoryRelay } from '../src/egg40/memoryRelay.ts';
import { memoryKeyStore } from '../src/egg40/keyStore.ts';
import { setDoorKeyIdHex } from '../src/egg40/doorKeyId.ts';
import { sha256Hex } from '../src/egg40/relayProtocol.ts';
import { MAX_FIELD, keyIdFitsField, encodePairingCode, defaultKeyWindow } from '../src/doorkeys/model.ts';

const C = '7f6481e3bec6b778db7b5959837ab82a5ffe47468f56aab4bfc4bdc56830d372';
const H = 3_600_000;
const sched = (eventId = '1') => ({ eventId, eventName: 'Launch', doorsOpenAt: Date.now() + H, doorsCloseAt: Date.now() + 5 * H, doors: [{ gateId: '1', name: 'Main door', ticketTypes: [], typeIds: [] }] });

async function setup(opts: { call?: any; proofEvents?: any } = {}) {
  const relay = createMemoryRelay(C);
  await relay.putSchedule('1', sched() as any);
  const org = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain: memoryChain([]), call: opts.call, proofEvents: opts.proofEvents, sleep: async () => {} });
  const staff = await createLiveEgg40Api({ contract: C, relay, store: memoryKeyStore(), chain: memoryChain([]) });
  return { relay, org, staff };
}

describe('EGG-41b approve with wallet', () => {
  it('phases: Building proof, then Approve in your wallet when the in-tab proof is done, then unlocking the staff phone', async () => {
    const listeners = new Set<(e: { phase: 'start' | 'done' | 'error' }) => void>();
    const proofEvents = (l: any) => { listeners.add(l); return () => listeners.delete(l); };
    const phases: string[] = [];
    const call = async () => { for (const l of listeners) l({ phase: 'start' }); phases.push('(proof running)'); for (const l of listeners) l({ phase: 'done' }); phases.push('(wallet prompt)'); return { txId: 'tx' }; };
    const { org, staff } = await setup({ call, proofEvents });
    const key = await staff.staff.createKey(1n, 1n);
    const preview = await org.organizer.previewPairing(1n, key.code, defaultKeyWindow({ ...sched(), eventId: 1n, doors: [] } as any));
    await org.organizer.authorizeDoorKey(preview, p => phases.push(p));
    assert.deepEqual(phases, ['proving', '(proof running)', 'wallet', '(wallet prompt)', 'relay']);
    assert.equal(listeners.size, 0, 'proof listener removed after the call');
  });

  it('a failure before the wallet (no session, proof error) rejects with the reason; the listener is removed', async () => {
    const listeners = new Set<any>();
    const proofEvents = (l: any) => { listeners.add(l); return () => listeners.delete(l); };
    const { org, staff } = await setup({ call: async () => { throw new Error('In-tab ZKIR v3 proving failed for authorizeDoorKey: boom'); }, proofEvents });
    const key = await staff.staff.createKey(1n, 1n);
    const preview = await org.organizer.previewPairing(1n, key.code, defaultKeyWindow({ ...sched(), eventId: 1n, doors: [] } as any));
    const phases: string[] = [];
    await assert.rejects(org.organizer.authorizeDoorKey(preview, p => phases.push(p)), /proving failed/);
    assert.deepEqual(phases, ['proving']);
    assert.equal(listeners.size, 0);
  });

  it('refuses at Check code a staff keyId the contract cannot accept (above the Field bound)', async () => {
    const { org } = await setup({ call: async () => { throw new Error('wallet must not open'); } });
    const big = 'f'.repeat(64);
    assert.ok(BigInt('0x' + big) > MAX_FIELD && !keyIdFitsField(big) && keyIdFitsField('0'.repeat(63) + '1'));
    const code = encodePairingCode({ v: 1, contract: C, eventId: 1n, gateId: 1n, keyId: big, deviceTag: 'ab'.repeat(32) });
    await assert.rejects(org.organizer.previewPairing(1n, code, defaultKeyWindow({ ...sched(), eventId: 1n, doors: [] } as any)), (e: Error) => e.message === STAFF_KEY_UNUSABLE);
  });

  it('a staff phone never registers a keyId above the Field bound (SHA-256 fallback retries)', async () => {
    let n = 0;
    setDoorKeyIdHex(async (s) => (n++ < 3 ? 'f'.repeat(64) : sha256Hex(s).then(h => '0' + h.slice(1))));
    try {
      const { staff } = await setup();
      const key = await staff.staff.createKey(1n, 1n);
      assert.ok(keyIdFitsField(key.request.keyId));
      assert.ok(n >= 4);
    } finally { setDoorKeyIdHex((s) => sha256Hex(s)); }
  });
});

describe('EGG-41b dialog error and progress (OrganizerDoors helpers)', () => {
  const require = createRequire(new URL('../package.json', import.meta.url));
  const root = new URL('../', import.meta.url).pathname;
  const dir = mkdtempSync(root + '.egg41b-');
  after(() => rmSync(dir, { recursive: true, force: true }));
  const load = async () => {
    require('esbuild').buildSync({
      stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {walletAction,walletErrorText,WalletProgress,WALLET_BUSY_TEXT} from './src/doorkeys/OrganizerDoors';import {DoorKeyError} from './src/doorkeys/api';
export {walletAction,walletErrorText,WALLET_BUSY_TEXT,DoorKeyError}; export const progress=(phase)=>renderToStaticMarkup(React.createElement(WalletProgress,{phase}));`, resolveDir: root, loader: 'tsx' },
      bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', logLevel: 'silent',
      define: { 'import.meta.env': JSON.stringify({ VITE_NETWORK: 'preview' }) }, outfile: dir + '/h.mjs',
    });
    return import(dir + '/h.mjs');
  };
  // Same contract as App.run: logs + page banner, returns undefined on failure.
  const run = async (_label: string, f: () => Promise<any>) => { try { return await f(); } catch { return undefined; } };

  it('a failing wallet action shows its reason in the dialog, a busy gate says so, success returns the value', async () => {
    const h: any = await load();
    let msg = '';
    assert.equal(await h.walletAction(run, 'x', async () => { throw new h.DoorKeyError('Door key not on-chain yet. Retry in a few seconds.'); }, (m: string) => (msg = m)), undefined);
    assert.equal(msg, 'Door key not on-chain yet. Retry in a few seconds.');
    msg = '';
    await h.walletAction(run, 'x', async () => { throw new Error('Connect your organizer wallet (1AM) on this page first, then try again.'); }, (m: string) => (msg = m));
    assert.match(msg, /Connect your organizer wallet/);
    msg = '';
    const busyRun = async () => undefined; // actionGate busy: f never runs
    await h.walletAction(busyRun, 'x', async () => true, (m: string) => (msg = m));
    assert.equal(msg, h.WALLET_BUSY_TEXT);
    msg = '';
    assert.equal(await h.walletAction(run, 'x', async () => true, (m: string) => (msg = m)), true);
    assert.equal(msg, '');
  });

  it('progress line names the step: building the proof first, then the wallet', async () => {
    const h: any = await load();
    assert.match(h.progress('proving'), /Building the proof on this computer\. Your wallet opens after that/);
    assert.match(h.progress('wallet'), /approve the transaction there/);
    assert.match(h.progress('relay'), /staff phone unlocks/);
    assert.equal(h.progress(null), '');
  });
});
