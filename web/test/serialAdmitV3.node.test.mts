import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(`${tmpdir()}/cloaktix-serial-v3-`);
const mock = dir + '/circuits.cjs';
writeFileSync(mock, `exports.TicketStatusV3={owned:0};exports.pureCircuitsV3={contractKeyOf:address=>address.bytes,admitCommitOf:(...args)=>{globalThis.__commitInputs=args;return new Uint8Array(32).fill(7)}};`);
const sourcePath = root + 'src/midnight/serialAdmitV3.ts';
const source = readFileSync(sourcePath, 'utf8').replace("from './contract-v3'", `from ${JSON.stringify(mock)}`).replace(/from '([^']+)'/g, (match, specifier) => specifier.startsWith('.') ? `from ${JSON.stringify(new URL(specifier, 'file://' + sourcePath).pathname)}` : match);
writeFileSync(dir + '/adapter.ts', source);
buildSync({ entryPoints: [dir + '/adapter.ts'], bundle: true, nodePaths: [root + 'node_modules'], platform: 'node', format: 'cjs', logLevel: 'error', outfile: dir + '/adapter.cjs' });
const { registerSerialAdmitV3, admitSerialV3 } = require(dir + '/adapter.cjs');
const contract = 'ab'.repeat(32);
const nonce = 'cd'.repeat(32);
const qr = `cloaktix:admit:v2?net=preview&c=${contract}&s=4&e=1&n=${nonce}`;
const row = { serial: 4n, typeId: 2n, epoch: 1n, status: 0, hasAdmit: true };
function storage() {
  const entries = new Map();
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) };
}
function fixture() {
  (globalThis as any).localStorage = storage();
  const calls: any[] = [];
  const state = { schemaVersion: 3, tickets: [{ ...row }], ownedTickets: [{ ...row }] };
  const host = { networkId: 'preview', contract, state: async () => state, call: async (circuit: string, args: any[]) => { calls.push({ circuit, args }); return { txId: 'synthetic-confirmed' }; } };
  return { calls, state, host };
}

it('v3 missing-capability recovery uses schema-3 state and registerAdmit, never a second buy', async () => {
  const { calls, host } = fixture();
  const result = await registerSerialAdmitV3(host, 4n, { eventName: 'Midnight st-jean', eventDate: '2026-12-05', venue: 'Montréal', cover: '/events/custom.webp' });
  assert.equal(result.serial, 4n);
  assert.equal(result.cap.epoch, '1');
  assert.equal(result.cap.eventDate, '2026-12-05');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].circuit, 'registerAdmit');
  assert.deepEqual(calls[0].args, [4n, new Uint8Array(32).fill(7)]);
  const commit = (globalThis as any).__commitInputs;
  assert.equal(new TextDecoder().decode(commit[0]).replace(/\0/g, ''), 'preview');
  assert.deepEqual(commit[1], new Uint8Array(32).fill(0xab));
  assert.deepEqual(commit.slice(2, 4), [4n, 1n]);
  assert.equal(commit[4].length, 32);
});

it('v3 recovery refuses non-owned serials and never saves a capability on rejected registration', async () => {
  const { calls, host, state } = fixture();
  state.ownedTickets = [];
  await assert.rejects(registerSerialAdmitV3(host, 4n), /Not an owned/);
  assert.equal(calls.length, 0);
  state.ownedTickets = [{ ...row }];
  host.call = async () => { throw new Error('Rejected'); };
  await assert.rejects(registerSerialAdmitV3(host, 4n), /Rejected/);
  assert.equal((globalThis as any).localStorage.getItem('cloaktix.v2.admits.v1'), null);
});

it('v3 gate calls admit with the entrance nonce and rejects wrong domain/type/stale copies first', async () => {
  const { calls, host, state } = fixture();
  for (const invalid of [qr.replace('net=preview', 'net=other'), qr.replace(contract, 'ef'.repeat(32)), qr.replace('e=1', 'e=2')]) {
    assert.equal((await admitSerialV3(host, invalid, [2n])).ok, false);
  }
  assert.equal((await admitSerialV3(host, qr, [9n])).ok, false);
  state.tickets[0].status = 2;
  assert.equal((await admitSerialV3(host, qr, [2n])).ok, false);
  assert.equal(calls.length, 0);
  state.tickets[0].status = 0;
  assert.deepEqual(await admitSerialV3(host, qr, [2n]), { ok: true, serial: 4n, typeId: 2n, txId: 'synthetic-confirmed' });
  assert.deepEqual(calls[0], { circuit: 'admit', args: [4n, new Uint8Array(32).fill(0xcd)] });
});

it('Session dispatches only schema 3 to the new adapters, preserving v2-only guards', () => {
  const session = readFileSync(root + 'src/midnight/cloaktix.ts', 'utf8');
  assert.match(session, /if \(this.schema === 3\) return registerSerialAdmitV3\(this, serial, meta\)/);
  assert.match(session, /if \(this.schema === 3\) return admitSerialV3\(this, text, accepted\)/);
  assert.match(session, /if \(this.schema !== 2\) throw new Error\('registerAdmitOnly requires/);
  assert.match(session, /if \(this.schema !== 2\) throw new Error\('buyAndPrepareAdmit requires/);
});
