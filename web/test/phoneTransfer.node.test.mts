import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPhoneTransferUrl } from '../src/v2/phoneTransfer.ts';
import { encodeAdmitQr, parseAdmitFromLocation, decodeAdmitQr } from '../src/v2/admitCodec.ts';

const cap = { v: 2 as const, networkId: 'preview', contract: 'ab'.repeat(32), serial: '1', epoch: '1', nonceHex: 'cd'.repeat(32) };
it('actual transfer helper round-trips the walletless fragment without changing capability', () => {
  const before = JSON.stringify(cap);
  const link = buildPhoneTransferUrl({ origin: 'https://example.test/e/1?old=1', cap });
  const url = new URL(link);
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('schema'), '2');
  assert.equal(url.searchParams.get('network'), cap.networkId);
  assert.equal(url.searchParams.get('contract'), cap.contract);
  assert.equal(url.searchParams.has('n'), false);
  assert.equal(url.search.includes(cap.nonceHex), false);
  assert.deepEqual(parseAdmitFromLocation(url.hash), cap);
  assert.equal(JSON.stringify(cap), before);
  assert.equal(buildPhoneTransferUrl({ origin: 'https://example.test', cap }), link);
});
it('transfer camera URL is distinct from the unchanged gate QR', () => {
  const link = buildPhoneTransferUrl({ origin: 'https://example.test', cap });
  const gate = encodeAdmitQr(cap);
  assert.ok(link.startsWith('https://'));
  assert.ok(gate.startsWith('cloaktix:admit:v2?'));
  assert.equal(decodeAdmitQr(link), null);
  assert.deepEqual(decodeAdmitQr(gate), cap);
});
it('rejects non-HTTPS transfer origins', () => {
  assert.throws(() => buildPhoneTransferUrl({ origin: 'http://example.test', cap }), /HTTPS/);
});
