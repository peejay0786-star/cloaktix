import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  addTicketTypeArgs,
  addTicketTypeCircuitArity,
  listForResaleArgs,
  listForResaleCircuitArity,
} from '../src/midnight/circuitArgs.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const payout = { bytes: new Uint8Array(32) };

it('v3 addTicketType is 6 circuit args: no fee, price is USD cents', () => {
  const args = addTicketTypeArgs(3, {
    eventId: 1n,
    priceUnits: 2500n, // $25.00
    feeAtoms: 999n, // must be ignored
    supply: 100n,
    resale: 0,
    maxResaleUnits: 3000n,
    adultOnly: false,
  });
  assert.equal(args.length, addTicketTypeCircuitArity(3));
  assert.equal(args.length, 6);
  assert.deepEqual(args, [1n, 2500n, 100n, 0, 3000n, false]);
  // The bug P-Jay hit: App used to pass 7 (with fee) → Compact said expected 7 received 8
  const buggyV2Shape = [1n, 2500n, 999n, 100n, 0, 3000n, false];
  assert.notEqual(buggyV2Shape.length, addTicketTypeCircuitArity(3));
  assert.equal(buggyV2Shape.length, 7);
});

it('v1/v2 addTicketType keeps fee as 2nd price companion (7 circuit args)', () => {
  for (const schema of [1, 2] as const) {
    const args = addTicketTypeArgs(schema, {
      eventId: 1n,
      priceUnits: 10_000_000n,
      feeAtoms: 300_000n,
      supply: 50n,
      resale: 2,
      maxResaleUnits: 0n,
      adultOnly: true,
    });
    assert.equal(args.length, 7);
    assert.deepEqual(args, [1n, 10_000_000n, 300_000n, 50n, 2, 0n, true]);
  }
});

it('v3 listForResale drops fee (3 circuit args, USD cents)', () => {
  const args = listForResaleArgs(3, {
    serialOrTypeId: 9n,
    priceUnits: 1200n,
    feeAtoms: 1n,
    payout,
  });
  assert.equal(args.length, listForResaleCircuitArity(3));
  assert.deepEqual(args, [9n, 1200n, payout]);
});

it('v1/v2 listForResale keeps fee (4 circuit args)', () => {
  const args = listForResaleArgs(2, {
    serialOrTypeId: 9n,
    priceUnits: 5_000_000n,
    feeAtoms: 150_000n,
    payout,
  });
  assert.equal(args.length, 4);
  assert.deepEqual(args, [9n, 5_000_000n, 150_000n, payout]);
});

it('managed cloaktix-rate-v3 wrapper still expects 7 TS args (context + 6) for addTicketType', () => {
  const js = readFileSync(join(root, 'contract/managed/cloaktix-rate-v3/contract/index.js'), 'utf8');
  assert.match(js, /addTicketType: expected 7 arguments \(as invoked from Typescript\)/);
  // Deployed Preview artifacts shipped in web-dist must match (same arity string).
  const dist = readFileSync(
    join(root, 'web-dist-app-preview/managed/cloaktix-rate-v3/contract/index.js'),
    'utf8',
  );
  assert.match(dist, /addTicketType: expected 7 arguments \(as invoked from Typescript\)/);
  // v2 still expects 8 — regression guard so we do not "fix" by swapping wrappers.
  const v2 = readFileSync(join(root, 'contract/managed/cloaktix-v2/contract/index.js'), 'utf8');
  assert.match(v2, /addTicketType: expected 8 arguments \(as invoked from Typescript\)/);
});

it('deployed contract-info lists priceUsdCents not fee for addTicketType', () => {
  const info = JSON.parse(
    readFileSync(join(root, 'web-dist-app-preview/managed/cloaktix-rate-v3/compiler/contract-info.json'), 'utf8'),
  );
  const circuit = info.circuits.find((c: { name: string }) => c.name === 'addTicketType');
  assert.ok(circuit);
  const names = circuit.arguments.map((a: { name: string }) => a.name);
  assert.deepEqual(names, [
    'eventId',
    'priceUsdCents',
    'supply',
    'resale',
    'maxResaleUsdCents',
    'adultOnly',
  ]);
  assert.equal(names.includes('fee'), false);
});
