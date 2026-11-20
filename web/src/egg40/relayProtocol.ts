/**
 * EGG-40 door relay protocol (Durable Object per event).
 * The relay sees serial, door, keyId, time, and an encrypted nonce. It never sees a QR secret in the clear,
 * so it cannot invent a settleable entry (EGG40-FINAL 9.2).
 */
export const RELAY_PROTOCOL = 'cloaktix-door-relay/v1';

export type DoorMode = 'walletless' | 'staff-wallet';
export type RelayDoor = { gateId: string; name: string; ticketTypes: string[]; typeIds: string[] };
export type RelaySchedule = { eventId: string; eventName: string; doorsOpenAt: number; doorsCloseAt: number; doors: RelayDoor[] };
export type AuthorizedKey = {
  keyId: string; deviceTag: string; publicKey: string; gateId: string;
  validFrom: number; validUntil: number; revoked: boolean; kind: 'staff' | 'settlement';
};
export type EncryptedNonce = { iv: string; ct: string; ephPub: string };
export type ReserveRequest = {
  serial: string; gateId: string; keyId: string; deviceTag: string; at: number;
  typeName: string; cipher: EncryptedNonce; prevHash: string; signature: string;
};
export type ReserveOk = { ok: true; serial: string; at: number; gateId: string };
export type ReserveUsed = { ok: false; reason: 'already-used'; serial: string; at: number; gateId: string; doorName: string };
export type ReserveFail = { ok: false; reason: string };
export type ReserveResult = ReserveOk | ReserveUsed | ReserveFail;
export type StoredEntry = ReserveRequest & { doorName: string; logHash: string };

const HEX = /^[0-9a-f]+$/i;
export function isHex(s: string, bytes?: number): boolean {
  if (!HEX.test(s) || s.length % 2) return false;
  return bytes == null || s.length === bytes * 2;
}
export function reserveSignPayload(contract: string, eventId: string, req: Omit<ReserveRequest, 'signature'>): Uint8Array {
  const body = [RELAY_PROTOCOL, 'reserve', contract, eventId, req.serial, req.gateId, req.keyId, req.deviceTag, String(req.at), req.typeName, req.cipher.iv, req.cipher.ct, req.cipher.ephPub, req.prevHash].join('|');
  return new TextEncoder().encode(body);
}
export async function entryLogHash(prevHash: string, serial: string, at: number, cipherCt: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(`cloaktix:door-log:v1|${prevHash}|${serial}|${at}|${cipherCt}`));
}
/** Copy into a standalone ArrayBuffer so WebCrypto typings accept the view. */
export function asBuf(u: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(u.byteLength);
  out.set(u);
  return out;
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', asBuf(data)));
  return [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/i, '');
  if (h.length % 2) throw new Error('odd hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function deviceTagOfPublicKey(publicKeyHex: string): Promise<string> {
  return sha256Hex(hexToBytes(publicKeyHex));
}
export async function importP256VerifyKey(publicKeyHex: string): Promise<CryptoKey> {
  const raw = hexToBytes(publicKeyHex);
  if (raw.length === 65 && raw[0] === 0x04) {
    return crypto.subtle.importKey('raw', asBuf(raw), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  }
  return crypto.subtle.importKey('spki', asBuf(raw), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
}
export async function verifyReserveSignature(publicKeyHex: string, payload: Uint8Array, signatureHex: string): Promise<boolean> {
  if (!isHex(signatureHex, 64)) return false;
  try {
    const key = await importP256VerifyKey(publicKeyHex);
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, asBuf(hexToBytes(signatureHex)), asBuf(payload));
  } catch { return false; }
}
