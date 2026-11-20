/**
 * Staff / organizer WebCrypto for EGG-40.
 * P-256 keys are non-extractable. Door secrets never leave the device and are never sent to the relay.
 * Nonces are encrypted to the organizer with ECDH P-256 + AES-GCM.
 */
import { asBuf, bytesToHex, hexToBytes, sha256Hex, reserveSignPayload, type EncryptedNonce, type ReserveRequest } from './relayProtocol.ts';
import { pairingFingerprint, type PairingRequest } from '../doorkeys/model.ts';

const ECDH: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };
const ECDSA: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };

export async function generateNonExtractableP256(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDSA, false, ['sign']);
}
export async function generateNonExtractableEcdh(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
}
export async function exportPublicKeyRaw(key: CryptoKey): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
}
export async function deviceTagFromPublicKey(publicKeyHex: string): Promise<string> {
  return sha256Hex(hexToBytes(publicKeyHex));
}
export async function organizerKeyFingerprint(publicKeyHex: string): Promise<string> {
  return sha256Hex(hexToBytes(publicKeyHex));
}
export async function realPairingFingerprint(request: PairingRequest, organizerPublicKeyHex: string): Promise<string> {
  return pairingFingerprint(request, await organizerKeyFingerprint(organizerPublicKeyHex));
}
export function randomDoorSecret(): Uint8Array {
  const sk = new Uint8Array(32); crypto.getRandomValues(sk); return sk;
}
export async function signReserve(signKey: CryptoKey, contract: string, eventId: string, req: Omit<ReserveRequest, 'signature'>): Promise<string> {
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, asBuf(reserveSignPayload(contract, eventId, req))));
  return bytesToHex(sig);
}
export async function encryptNonceForOrganizer(nonce: Uint8Array, organizerPublicKeyHex: string): Promise<EncryptedNonce> {
  const pair = await crypto.subtle.generateKey(ECDH, false, ['deriveBits']);
  const peer = await importEcdhPublic(organizerPublicKeyHex);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, pair.privateKey, 256);
  const aesKey = await crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, asBuf(nonce)));
  return { iv: bytesToHex(iv), ct: bytesToHex(ct), ephPub: await exportPublicKeyRaw(pair.publicKey) };
}
export async function decryptNonceFromStaff(cipher: EncryptedNonce, organizerPrivate: CryptoKey): Promise<Uint8Array> {
  const peer = await importEcdhPublic(cipher.ephPub);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, organizerPrivate, 256);
  const aesKey = await crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['decrypt']);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: asBuf(hexToBytes(cipher.iv)) }, aesKey, asBuf(hexToBytes(cipher.ct))));
}
async function importEcdhPublic(publicKeyHex: string): Promise<CryptoKey> {
  const raw = hexToBytes(publicKeyHex);
  if (raw.length === 65 && raw[0] === 0x04) return crypto.subtle.importKey('raw', asBuf(raw), ECDH, false, []);
  return crypto.subtle.importKey('spki', asBuf(raw), ECDH, false, []);
}
export { hexToBytes, bytesToHex, sha256Hex };
