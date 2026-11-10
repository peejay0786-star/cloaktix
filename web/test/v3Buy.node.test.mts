import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buyTicketV3Call, V3_BUY_CIRCUIT_ARITY, v3NightAmounts, nowInWindow, addTicketTypeArgs,
} from '../src/midnight/circuitArgs.ts';
import { parseSignedQuote } from '../src/rate/rateSignerClient.ts';
import { v3PurchaseProps } from '../src/v3/purchaseProps.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const managedRoots = ['contract/managed/cloaktix-rate-v3', 'web-dist-app-preview/managed/cloaktix-rate-v3'];
const sig = { r: { x: 1n, y: 2n }, s: 3n };
const quote = { atomsPerUsdCent: 2000n, issuedAt: 100n, expiresAt: 280n, signature: sig };
const attestation = { typeId: 1n, buyer: new Uint8Array(32), txHash: new Uint8Array(32).fill(1), priceUsdCents: 2500n, lovelacePaid: 1n, issuedAt: 1n, expiresAt: 2n, signature: sig };
const commit = new Uint8Array(32);

function wrapperExpected(rootDir: string, circuit: string): number {
  const js = readFileSync(join(root, rootDir, 'contract/index.js'), 'utf8');
  const m = js.match(new RegExp(`'${circuit}: expected (\\d+) argument`)) ?? js.match(new RegExp(`${circuit}: expected (\\d+) arg`));
  assert.ok(m, `no arity string for ${circuit} in ${rootDir}`);
  return Number(m[1]);
}
function infoArgs(rootDir: string, circuit: string): string[] {
  const info = JSON.parse(readFileSync(join(root, rootDir, 'compiler/contract-info.json'), 'utf8'));
  return info.circuits.find((c: any) => c.name === circuit).arguments.map((a: any) => a.name);
}

it('v3 buyTicket / buyTicketAdult arg vectors match deployed wrappers (+1 CircuitContext)', () => {
  const plain = buyTicketV3Call({ typeId: 1n, admitCommit: commit, nightPaid: 5n, fee: 0n, quote, now: 150n });
  const adult = buyTicketV3Call({ typeId: 1n, admitCommit: commit, nightPaid: 5n, fee: 0n, quote, now: 150n, asOf: 9n });
  assert.equal(plain.circuit, 'buyTicket');
  assert.equal(adult.circuit, 'buyTicketAdult');
  assert.deepEqual(plain.args, [1n, commit, 5n, 0n, quote, 150n]);
  assert.deepEqual(adult.args, [1n, commit, 5n, 0n, quote, 150n, 9n]);
  for (const r of managedRoots) {
    assert.equal(wrapperExpected(r, 'buyTicket'), plain.args.length + 1);
    assert.equal(wrapperExpected(r, 'buyTicketAdult'), adult.args.length + 1);
    assert.deepEqual(infoArgs(r, 'buyTicket'), ['typeId', 'admitCommit', 'nightPaid', 'fee', 'q', 'now']);
    assert.deepEqual(infoArgs(r, 'buyTicketAdult'), ['typeId', 'admitCommit', 'nightPaid', 'fee', 'q', 'now', 'asOf']);
  }
  assert.equal(plain.args.length, V3_BUY_CIRCUIT_ARITY.buyTicket);
  assert.equal(adult.args.length, V3_BUY_CIRCUIT_ARITY.buyTicketAdult);
});

it('v3 addTicketType fix still 6 args (no fee) and matches wrapper', () => {
  const args = addTicketTypeArgs(3, { eventId: 1n, priceUnits: 2500n, feeAtoms: 9n, supply: 10n, resale: 0, maxResaleUnits: 0n, adultOnly: false });
  for (const r of managedRoots) assert.equal(wrapperExpected(r, 'addTicketType'), args.length + 1);
});

it('NIGHT amounts satisfy deployed checkFee + assertCoversUsd for 300 bps', () => {
  const feeBps = 300n, slippage = 100n;
  for (const [cents, rate] of [[2500n, 2000n], [1n, 7n], [99999n, 123457n]] as const) {
    const { nightPaid: p, fee: f } = v3NightAmounts(cents, rate, feeBps);
    assert.ok(f * 10000n <= p * feeBps && p * feeBps < (f + 1n) * 10000n, 'checkFee');
    assert.ok(p * 10000n >= cents * rate * (10000n - slippage), 'covers USD');
    assert.ok(p >= f);
  }
  assert.throws(() => v3NightAmounts(100n, 0n, 300n));
});

it('rate quote: unsigned is refused, signed parses to circuit RateQuote', () => {
  assert.throws(() => parseSignedQuote({ ok: true, signed: false, signature: null, atomsPerUsdCent: '1', issuedAt: 1, expiresAt: 2 }), /not signed/);
  const q = parseSignedQuote({ ok: true, signed: true, atomsPerUsdCent: '2000', issuedAt: 10, expiresAt: 190, nightUsd: 0.05, adaUsd: 0.5,
    signature: { r: { x: '0x0a', y: '0x0b' }, s: '0x0c' } });
  assert.deepEqual(q.quote, { atomsPerUsdCent: 2000n, issuedAt: 10n, expiresAt: 190n, signature: { r: { x: 10n, y: 11n }, s: 12n } });
  assert.equal(nowInWindow(10n, 190n, 5n), 10n);
  assert.throws(() => nowInWindow(10n, 190n, 191n), /expired/);
});


it('schema 3 PurchaseButton gets USD cents + mintKey only (no organizer ADA); schema 2 does not', () => {
  const p3 = v3PurchaseProps({ schema: 3, networkId: 'preview', contract: 'c', eventId: 1n, typeId: 2n, priceUsdCents: 2500n });
  assert.deepEqual(p3, { usdCents: 2500n, mintKey: 'preview:c:type:2' });
  assert.equal(v3PurchaseProps({ schema: 2, networkId: 'preview', contract: 'c', eventId: 1n, typeId: 2n, priceUsdCents: 1n }), null);
});

it('EventCard wires schema 3 NIGHT only; v2 branch unchanged; no ADA mint path', () => {
  const app = readFileSync(join(root, 'web/src/App.tsx'), 'utf8');
  const card = app.slice(app.indexOf('export function EventCard'), app.indexOf('const shareUrl'));
  assert.match(card, /v3PurchaseProps\(/);
  assert.match(card, /buyNightV3/);
  assert.doesNotMatch(card, /organizerAda|adaMint|buyAdaV3|mintTicketAfterAdaPayment/);
  assert.match(card, /if \(schemaIsV2\(s, st\)\) \{\s*const r = await buyTicketV2Flow/);
  assert.ok(card.indexOf('if (v3)') < card.indexOf('schemaIsV2(s, st)'), 'v3 branch before v1 fallback');
  assert.match(app, /<EventCard s=\{s\} st=\{st\} run=\{run\} bump=\{bump\} e=\{e\} onBought/);
  const checkout = readFileSync(join(root, 'web/src/Checkout.tsx'), 'utf8');
  assert.match(checkout, /Pay with NIGHT on Midnight/);
  assert.doesNotMatch(checkout, /Pay with ADA|ADA on Cardano|fetchAdaFeeStatus|payAdaOnPreview|koios|\.\/ada\//i);
});
