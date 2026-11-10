import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  bytesToHex,
  decodeAdmitQr,
  encodeAdmitFragmentPath,
  encodeAdmitQr,
  hexToBytes,
  isAdmitCapabilityV2,
  parseAdmitFromLocation,
  randomNonce32,
} from '../src/v2/admitCodec.ts';

describe('admitCodec v2', () => {
  it('round-trips QR and fragment without Number truncation', () => {
    const nonce = randomNonce32();
    const cap = {
      v: 2 as const,
      networkId: 'preview',
      contract: '9d619577dab1e2f219eca5634af4578265e54f15cc3c41347e0bb3dc5259bb26',
      serial: '340282366920938463463374607431768211455', // max-ish uint128 decimal
      epoch: '3',
      nonceHex: bytesToHex(nonce),
    };
    assert.equal(isAdmitCapabilityV2(cap), true);
    const qr = encodeAdmitQr(cap);
    assert.equal(decodeAdmitQr(qr)?.serial, cap.serial);
    assert.equal(decodeAdmitQr(qr)?.nonceHex, cap.nonceHex);
    const frag = encodeAdmitFragmentPath(cap);
    assert.equal(parseAdmitFromLocation(frag)?.epoch, '3');
    assert.deepEqual(hexToBytes(cap.nonceHex), nonce);
  });

  it('rejects v1 pass QR and malformed', () => {
    assert.equal(decodeAdmitQr('cloaktix:pass:v1?c=x&p=aa&tx=1'), null);
    assert.equal(isAdmitCapabilityV2({ v: 1, serial: '1' }), false);
    assert.equal(isAdmitCapabilityV2({ v: 2, networkId: 'p', contract: 'c', serial: '1e3', epoch: '1', nonceHex: '00'.repeat(32) }), false);
  });
});
