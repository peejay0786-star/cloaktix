/**
 * EGG-41 relay write authorization. Shared by the Durable Object (verifier) and the app (signer).
 *
 * Organizer writes: Ed25519 signature by the organizer's metadata key. The relay accepts it only when that key is
 * bound on-chain to the event's organizer: some EGG-40 event has organizer == events[eventId].organizer and
 * payout == pk (the same "key event" the public catalog uses). Each write carries a timestamp (5 min window) and a
 * random nonce the relay remembers, so a captured request cannot be replayed.
 * Door writes: P-256 signature by the staff device whose sha256(publicKey) is the deviceTag stored on-chain by
 * authorizeDoorKey. The on-chain door key (event, door, device, validity window, active) is checked on every entry.
 */
import { RELAY_PROTOCOL, asBuf, bytesToHex, hexToBytes, isHex, sha256Hex } from './relayProtocol.ts';

export const AUTH_WINDOW_MS = 5 * 60_000;
/** Import of entries recorded earlier (relay was down): allow a little clock skew into the future. */
export const FUTURE_SKEW_MS = 2 * 60_000;
export const SETTLEMENT_GATE = '99';

export type ChainDoorKey = { eventId: string; gateId: string; deviceTag: string; validFrom: number; validUntil: number; active: boolean };
/** validFrom / validUntil are seconds, as stored on-chain. */
export type DoorChainSnapshot = {
  events: Map<string, { organizer: string; payout: string }>;
  doorKeys: Map<string, ChainDoorKey>;
};
/** Reads the EGG-40 ledger. Must throw when the indexer cannot be reached or decoded (the relay then fails closed). */
export type ChainSource = (opts?: { fresh?: boolean }) => Promise<DoorChainSnapshot>;

export type OrgAuth = { pk: string; ts: number; nonce: string; sig: string };
export type OrgSigned<T> = { payload: T; auth: OrgAuth };
/** Signs a relay message with the organizer metadata key (Session.signMeta). */
export type OrgSigner = (message: string) => Promise<{ pk: string; sig: string }>;

export type OrgAction =
  | 'schedule' | 'mode' | 'organizer-crypto' | 'authorize-key' | 'import'
  | `revoke-key:${string}` | `import-missed:${string}`;

export async function orgMessage(contract: string, eventId: string, action: OrgAction, ts: number, nonce: string, payload: unknown): Promise<string> {
  const digest = await sha256Hex(new TextEncoder().encode(JSON.stringify(payload ?? null)));
  return [RELAY_PROTOCOL, 'org', contract.toLowerCase(), eventId, action, String(ts), nonce, digest].join('|');
}

export async function signOrgWrite<T>(signer: OrgSigner, contract: string, eventId: string, action: OrgAction, payload: T, now = Date.now()): Promise<OrgSigned<T>> {
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const { pk, sig } = await signer(await orgMessage(contract, eventId, action, now, nonce, payload));
  return { payload, auth: { pk, ts: now, nonce, sig } };
}

export function validOrgAuth(a: unknown): a is OrgAuth {
  const x = a as OrgAuth;
  return !!x && typeof x === 'object' && typeof x.pk === 'string' && isHex(x.pk, 32) && typeof x.sig === 'string' && isHex(x.sig, 64)
    && typeof x.nonce === 'string' && isHex(x.nonce, 16) && Number.isSafeInteger(x.ts);
}

export async function verifyEd25519(pkHex: string, message: string, sigHex: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('raw', asBuf(hexToBytes(pkHex)), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, asBuf(hexToBytes(sigHex)), asBuf(new TextEncoder().encode(message)));
  } catch { return false; }
}

/** Proof that the staff phone registering a public key holds its private key. */
export function registerMessage(contract: string, eventId: string, keyId: string, deviceTag: string, ts: number): Uint8Array {
  return new TextEncoder().encode([RELAY_PROTOCOL, 'register', contract.toLowerCase(), eventId, keyId.toLowerCase(), deviceTag.toLowerCase(), String(ts)].join('|'));
}
export async function signRegister(signKey: CryptoKey, contract: string, eventId: string, keyId: string, deviceTag: string, ts: number): Promise<string> {
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, asBuf(registerMessage(contract, eventId, keyId, deviceTag, ts))));
  return bytesToHex(sig);
}

/** Is `pk` the organizer key bound on-chain to the organizer of `eventId`? */
export function organizerKeyBound(snap: DoorChainSnapshot, eventId: string, pk: string): 'ok' | 'no-event' | 'not-bound' {
  const target = snap.events.get(eventId);
  if (!target) return 'no-event';
  const want = pk.toLowerCase();
  for (const e of snap.events.values()) if (e.organizer === target.organizer && e.payout === want) return 'ok';
  return 'not-bound';
}
