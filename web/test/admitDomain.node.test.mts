import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { networkTagBytes, contractAddressStruct } from '../src/midnight/schema.ts';

const require = createRequire(import.meta.url);
const rtPath = require.resolve('@midnight-ntwrk/compact-runtime', { paths: ['/workspace/midnight-pass/cloaktix/web'] });
const { pureCircuits } = await import('../../contract/managed/cloaktix-v2/contract/index.js');

describe('admit domain binding helpers', () => {
  it('networkTagBytes matches pad-style 32 bytes', () => {
    const t = networkTagBytes('preview');
    assert.equal(t.length, 32);
    assert.equal(Buffer.from(t).toString('utf8').replace(/\0+$/, ''), 'preview');
  });

  it('different network or contract keys yield different commits', () => {
    const nonce = new Uint8Array(32).fill(7);
    const a = contractAddressStruct('11'.repeat(32));
    const b = contractAddressStruct('22'.repeat(32));
    const c1 = pureCircuits.admitCommitOf(networkTagBytes('undeployed'), pureCircuits.contractKeyOf(a), 1n, 1n, nonce);
    const c2 = pureCircuits.admitCommitOf(networkTagBytes('preview'), pureCircuits.contractKeyOf(a), 1n, 1n, nonce);
    const c3 = pureCircuits.admitCommitOf(networkTagBytes('undeployed'), pureCircuits.contractKeyOf(b), 1n, 1n, nonce);
    assert.notEqual(Buffer.from(c1).toString('hex'), Buffer.from(c2).toString('hex'));
    assert.notEqual(Buffer.from(c1).toString('hex'), Buffer.from(c3).toString('hex'));
  });
});
