/** Real generated Compact circuit simulation. No network, proofs, deployment, or real identities. */
import { it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomBytes, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const rt = await import(pathToFileURL(require.resolve('@midnight-ntwrk/compact-runtime')).href);
const { Contract, ledger, pureCircuits, TicketStatus } = await import('../../contract/generated-rate-v4/contract/index.js');
const { newIssuerSecret, issuerPublicKey } = await import('../../contract/age-credential.mjs');
const { newRateSignerSecret, rateSignerPublicKey, signRateQuote } = await import('../../contract/rate-quote.mjs');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(root + '.ct-multigate-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
async function bundle(name: string, contents: string, env: object = {}) {
  const out = dir + '/' + name + '.mjs';
  buildSync({ stdin: { contents, resolveDir: root }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic',
    define: { 'import.meta.env': JSON.stringify(env) }, nodePaths: [root + 'node_modules'], logLevel: 'error', outfile: out });
  return import(pathToFileURL(out).href);
}
const api = await bundle('api', `export * from './src/midnight/multiGate';export * from './src/midnight/serialAdmitV4';export * from './src/midnight/session-v4';export * from './src/midnight/gateNames';export * from './src/v2/serialTicketSchema';export * from './src/midnight/schema';export * from './src/midnight/detectSchema';`);
const schema = await bundle('schema-baked', `export * from './src/midnight/schema';`, { VITE_NETWORK: 'preview', VITE_RATE_V3_CONTRACT: 'ab'.repeat(32) });
const now = Math.floor(Date.now() / 1000), NOW = BigInt(now), EMPTY = new Uint8Array(32);
const sk = { org: randomBytes(32), staff: randomBytes(32), staff2: randomBytes(32), buyer: randomBytes(32), outsider: randomBytes(32) };
type Who = keyof typeof sk;
const id = (who: Who) => pureCircuits.accountId(sk[who]);
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const network = new Uint8Array(32); network.set(Buffer.from('preview'));
const rateSK = newRateSignerSecret(), issuer = issuerPublicKey(newIssuerSecret());
let who: Who = 'org';
const contract = new Contract({ wit_CloakSK: ctx => [ctx.privateState, sk[who]], wit_AgeCredential: ctx => [ctx.privateState, { is_some: false, value: undefined }] });
let state: any, zswap: any, address: string, event: bigint, ga: bigint, vip: bigint, main: bigint, side: bigint;
function call(user: Who, circuit: string, ...args: unknown[]) {
  who = user;
  const result = contract.circuits[circuit](rt.createCircuitContext(address, zswap, state, {}, undefined, undefined, now), ...args);
  state = result.context.currentQueryContext.state; return result.result;
}
const L = () => ledger(state);
function buy(type = ga) {
  const quote = signRateQuote({ signerSk: rateSK, atomsPerUsdCent: 2n, issuedAt: NOW, expiresAt: NOW + 180n,
    networkTag: network, contractKey: pureCircuits.contractKeyOf({ bytes: Buffer.from(address, 'hex') }) });
  const paid = L().ticketTypes.lookup(type).priceUsdCents * quote.atomsPerUsdCent;
  const serial = call('buyer', 'buyTicket', type, EMPTY, paid, paid * 300n / 10000n, quote, NOW);
  const nonce = randomBytes(32);
  call('buyer', 'registerAdmit', serial, pureCircuits.admitCommitOf(network, pureCircuits.contractKeyOf({ bytes: Buffer.from(address, 'hex') }), serial, 1n, nonce));
  return { serial, nonce, qr: `cloaktix:admit:v2?net=preview&c=${address}&s=${serial}&e=1&n=${hex(nonce)}` };
}
const sessionState = (user: Who) => api.stateV4({ contract: address, accountId: hex(id(user)), metaKey: async () => null,
  P: { publicDataProvider: { queryContractState: async () => ({ data: state }) } } });
function host(user: Who) { return { networkId: 'preview', contract: address, state: () => sessionState(user),
  call: async (circuit: string, args: unknown[]) => { call(user, circuit, ...args); return { txId: 'simulated-confirmed-not-live' }; } }; }
beforeEach(() => {
  const init = contract.initialState(rt.createConstructorContext({}, '0'.repeat(64)), 300n, { bytes: randomBytes(32) }, id('org'), issuer,
    rateSignerPublicKey(rateSK), network, 180n, 100n, 600n);
  state = init.currentContractState.data; zswap = init.currentZswapLocalState; address = rt.sampleContractAddress();
  event = call('org', 'createEvent', { bytes: randomBytes(32) });
  ga = call('org', 'addTicketType', event, 1000n, 100n, 0, 1200n, false);
  vip = call('org', 'addTicketType', event, 5000n, 100n, 0, 6000n, false);
  main = call('org', 'addGate', event); side = call('org', 'addGate', event);
  call('staff', 'registerStaff'); call('staff2', 'registerStaff');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { search: '?network=preview', hash: '', pathname: '/organizer', origin: 'http://local.test' } });
});
it('organizer creates gates and delegates staff; other identities cannot edit gates', () => {
  assert.equal(L().schemaVersion, 4n); assert.notEqual(main, side);
  assert.throws(() => call('org', 'addGateStaff', main, id('outsider')), /enable staff mode/);
  assert.equal(L().staffAccounts.member(id('outsider')), false);
  call('org', 'addGateStaff', main, id('staff'));
  assert.equal(L().gateStaff.lookup(pureCircuits.gateStaffKey(main, id('staff'))).active, true);
  for (const [circuit, args] of [['addGate', [event]], ['setGateActive', [main, false]], ['setGateType', [main, ga, true]], ['addGateStaff', [main, id('staff2')]], ['revokeGateStaff', [main, id('staff')]]]) assert.throws(() => call('staff', circuit, ...args), /Not organizer/);
});
it('assigned staff admits and chain records gate + staff, without buyer identity in the UI projection', async () => {
  call('org', 'addGateStaff', main, id('staff')); const ticket = buy();
  assert.equal((await api.admitSerialV4(host('staff'), ticket.qr, main)).ok, true);
  assert.equal(L().tickets.lookup(ticket.serial).status, TicketStatus.consumed);
  const admission = L().admissions.lookup(ticket.serial);
  assert.equal(admission.gateId, main); assert.equal(hex(admission.admittedBy), hex(id('staff')));
  const projected = await sessionState('staff');
  assert.equal(projected.gates.find(g => g.id === main).admittedCount, 1);
  assert.equal('owner' in projected.tickets[0], false); assert.equal(projected.gateStaff.length, 0);
  assert.equal(projected.staffOnly, true); assert.deepEqual(api.accessibleDoors(projected).map(g => g.id), [main]);
});
it('staff cannot admit at another gate; revoked staff cannot admit and revocation is chain-authoritative', async () => {
  call('org', 'addGateStaff', main, id('staff')); const ticket = buy();
  assert.throws(() => call('staff', 'admit', ticket.serial, ticket.nonce, side), /Unauthorized/);
  assert.equal((await api.admitSerialV4(host('staff'), ticket.qr, side)).ok, false);
  call('org', 'revokeGateStaff', main, id('staff'));
  assert.throws(() => call('staff', 'admit', ticket.serial, ticket.nonce, main), /Revoked/);
  assert.equal((await api.admitSerialV4(host('staff'), ticket.qr, main)).ok, false);
  assert.equal(L().tickets.lookup(ticket.serial).status, TicketStatus.owned);
});
it('staff cannot createEvent, addTicketType, setSalesOpen or self-promote even after revocation', () => {
  call('org', 'addGateStaff', main, id('staff'));
  assert.throws(() => call('staff', 'createEvent', { bytes: randomBytes(32) }), /Staff cannot create/);
  assert.throws(() => call('staff', 'addTicketType', event, 1n, 10n, 0, 1n, false), /Not organizer/);
  assert.throws(() => call('staff', 'setSalesOpen', event, false), /Not organizer/);
  call('org', 'revokeGateStaff', main, id('staff'));
  assert.throws(() => call('staff', 'createEvent', { bytes: randomBytes(32) }), /Staff cannot create/);
});
it('empty allowlist accepts event types; nonempty restricts; wrong event refused; updates are idempotent', () => {
  call('org', 'addGateStaff', main, id('staff')); const general = buy(ga), premium = buy(vip);
  call('staff', 'admit', general.serial, general.nonce, main);
  call('org', 'setGateType', main, ga, true); call('org', 'setGateType', main, ga, true);
  assert.equal(L().gates.lookup(main).typeCount, 1n);
  assert.throws(() => call('staff', 'admit', premium.serial, premium.nonce, main), /Wrong ticket type/);
  const other = call('org', 'createEvent', { bytes: randomBytes(32) });
  const otherType = call('org', 'addTicketType', other, 1n, 10n, 0, 1n, false);
  assert.throws(() => call('org', 'setGateType', main, otherType, true), /Wrong event/);
  const foreign = buy(otherType); assert.throws(() => call('org', 'admit', foreign.serial, foreign.nonce, main), /Wrong event/);
  call('org', 'setGateType', main, ga, false); call('org', 'setGateType', main, ga, false);
  assert.equal(L().gates.lookup(main).typeCount, 0n); call('staff', 'admit', premium.serial, premium.nonce, main);
});
it('concurrent doors have one winner; second door refuses consumed ticket; organizer still admits', async () => {
  call('org', 'addGateStaff', main, id('staff')); call('org', 'addGateStaff', side, id('staff2')); const ticket = buy();
  const results = await Promise.all([api.admitSerialV4(host('staff'), ticket.qr, main), api.admitSerialV4(host('staff2'), ticket.qr, side)]);
  assert.equal(results.filter(r => r.ok).length, 1); assert.equal([...L().admissions].length, 1);
  assert.throws(() => call('org', 'admit', ticket.serial, ticket.nonce, side), /Already used/);
  const fresh = buy(); call('org', 'admit', fresh.serial, fresh.nonce, side);
  assert.equal(L().admissions.lookup(fresh.serial).gateId, side);
});
it('inactive gates, replaced nonce/epoch, bad QR, wrong network/contract refuse without consumption', async () => {
  call('org', 'addGateStaff', main, id('staff')); const ticket = buy();
  call('org', 'setGateActive', main, false); assert.throws(() => call('org', 'admit', ticket.serial, ticket.nonce, main), /inactive/);
  call('org', 'setGateActive', main, true);
  for (const qr of ['not a qr', ticket.qr.replace('net=preview', 'net=other'), ticket.qr.replace(address, 'ab'.repeat(32)), ticket.qr.replace('e=1', 'e=9')]) assert.equal((await api.admitSerialV4(host('staff'), qr, main)).ok, false);
  call('buyer', 'registerAdmit', ticket.serial, pureCircuits.admitCommitOf(network, pureCircuits.contractKeyOf({ bytes: Buffer.from(address, 'hex') }), ticket.serial, 1n, randomBytes(32)));
  assert.equal((await api.admitSerialV4(host('staff'), ticket.qr, main)).ok, false);
  assert.equal(L().tickets.lookup(ticket.serial).status, TicketStatus.owned);
});
it('existing organizer keeps rights after being assigned staff', async () => {
  call('org', 'addGateStaff', main, id('org')); assert.ok(call('org', 'createEvent', { bytes: randomBytes(32) }) > event);
  assert.equal((await sessionState('org')).staffOnly, false);
});
it('real v4 decoder detects 4, failed decode returns null rather than guessing v1', async () => {
  assert.equal(await api.detectOnChainSchema({ queryContractState: async () => ({ data: state }) }, address), 4);
  assert.equal(await api.detectOnChainSchema({ queryContractState: async () => ({ data: 'invalid' }) }, address), null);
  assert.equal(await api.detectOnChainSchema({ queryContractState: async () => null }, address), null);
});
it('serial routing supports 4; baked v3 remains default; explicit schema links always win', () => {
  assert.equal(api.schemaUsesSerialTickets({ schema: 4 }, null), true); assert.equal(api.schemaUsesSerialTickets({}, { schemaVersion: 4n }), true);
  assert.equal(schema.resolveSchema(), 3);
  for (const version of [1, 2, 3, 4]) { globalThis.location.search = `?network=preview&schema=${version}`; assert.equal(schema.resolveSchema(), version); }
  globalThis.location.search = '?network=preview'; assert.equal(schema.resolveSchema(), 3);
});
it('Staff ID parsing accepts only nonzero CloakTix account hashes, not addresses/key URI formats', () => {
  assert.equal(api.parseStaffId('AB'.repeat(32)), 'ab'.repeat(32));
  for (const value of ['addr_test1x', 'mn_addr_preview1x', '0'.repeat(64), 'cloaktix:key:v1:preview:' + 'ab'.repeat(32)]) assert.throws(() => api.parseStaffId(value), /Staff ID/);
});
it('signed local labels verify on-chain organizer key and reject tampering or wrong domain/signer', async () => {
  const pair = generateKeyPairSync('ed25519'); const pk = pair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
  call('org', 'createEvent', { bytes: Buffer.from(pk, 'hex') });
  const gate = (await sessionState('org')).gates.find(g => g.id === main);
  const signer = { networkId: 'preview', contract: address, signMeta: async (message: string) => ({ pk, sig: sign(null, Buffer.from(message), pair.privateKey).toString('hex') }) };
  await api.saveGateName(signer, gate, 'Main entrance'); assert.equal(await api.loadGateName('preview', address, gate), 'Main entrance');
  const exported = api.exportGateNames('preview', address, [gate]); assert.equal(JSON.parse(exported)[0].name, 'Main entrance');
  for (const [raw, net, addr, gates] of [[exported.replace('Main entrance', 'Forged'), 'preview', address, [gate]], [exported, 'other', address, [gate]], [exported, 'preview', 'aa'.repeat(32), [gate]], [exported, 'preview', address, [{ ...gate, metadataKeys: ['ab'.repeat(32)] }]]]) await assert.rejects(api.importGateNames(raw, net, addr, gates), /signature/);
});
it('v4 call and deploy paths fail closed without v4 keys instead of submitting v3 circuits', async () => {
  await assert.rejects(api.callV4({}, 'admit', []), /local contract sketch/);
  const source = readFileSync(root + 'src/midnight/cloaktix.ts', 'utf8');
  assert.match(source, /if \(this.schema === 4\) throw new Error\(V4_LOCAL_ONLY\)/);
  assert.match(source, /if \(this.schema === 4\) return callV4\(this, circuitId, args\)/);
  assert.match(source, /detected === 4 \|\| detected === 3 \|\| detected === 2/);
  assert.match(source, /schema === 4 \|\| schema === 3 \|\| schema === 2/);
});
Object.defineProperty(globalThis, 'location', { configurable: true, value: { search: '?network=preview', hash: '', pathname: '/organizer', origin: 'http://local.test' } });
const ui = await bundle('ui', `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {Organizer,OrganizerEvent} from './src/App';import {GateV4} from './src/multigate/GateV4';import {RatesContext} from './src/useRates';
const names={evName:()=> 'Sample event',ttName:(_,id)=>'Type '+id};
export const organizer=(s,st)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(Organizer,{s,st,run:()=>{throw new Error('Render must not submit');}})));
export const manage=(s,st)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:{kind:'ready',rates:{nightUsd:0.05,asOf:Date.now()}}},React.createElement(OrganizerEvent,{s,st,eventId:st.events.find(e=>e.mine&&!e.isKey).id,onBack(){},run:()=>{throw new Error('Render must not submit');}})));
export const gate=(s,st)=>renderToStaticMarkup(React.createElement(GateV4,{s,st,...names}));`);
it('actual staff-only organizer render hides organizer controls; Check-in locks to assigned door only', async () => {
  call('org', 'addGateStaff', main, id('staff'));
  const s = { ...host('staff'), schema: 4, accountId: hex(id('staff')), idSource: 'wallet' };
  const st = await sessionState('staff');
  const html = ui.organizer(s, st);
  assert.match(html, /Your staff ID|Check-in/); assert.match(html, /Assigned door · locked/);
  assert.doesNotMatch(html, /Create an event|Add a ticket type|Close sales|Deploy schema|NIGHT payout|<select/);
  assert.doesNotMatch(html, new RegExp(hex(id('buyer'))));
});
it('organizer Check-in includes own doors; multiply assigned staff sees only assigned active doors', async () => {
  const org = { ...host('org'), schema: 4, accountId: hex(id('org')), idSource: 'wallet' };
  const orgHtml = ui.gate(org, await sessionState('org'));
  assert.match(orgHtml, /<select/); assert.match(orgHtml, new RegExp(`Door #${side}`));
  call('org', 'addGateStaff', main, id('staff')); call('org', 'addGateStaff', side, id('staff'));
  const staff = { ...host('staff'), schema: 4, accountId: hex(id('staff')), idSource: 'wallet' };
  assert.match(ui.gate(staff, await sessionState('staff')), /<select/);
  call('org', 'setGateActive', side, false);
  assert.doesNotMatch(ui.gate(staff, await sessionState('staff')), /<select/);
});
it('organizer multigate section renders per-door chain counts, not buyer wallets', async () => {
  const ticket = buy(); call('org', 'admit', ticket.serial, ticket.nonce, main);
  const s = { ...host('org'), schema: 4, accountId: hex(id('org')), idSource: 'wallet' };
  const html = ui.manage(s, await sessionState('org'));
  assert.match(html, /Doors &amp; staff/); assert.match(html, /1 admitted/);
  assert.doesNotMatch(html, new RegExp(hex(id('buyer'))));
});
