/** keyId for a door secret. Default is SHA-256 (tests / relay). Boot replaces this with Compact doorKeyIdOf when the managed contract is loaded. */
import { sha256Hex } from './relayProtocol.ts';

let impl: (secret: Uint8Array) => string | Promise<string> = (secret) => sha256Hex(secret);

export function setDoorKeyIdHex(fn: (secret: Uint8Array) => string | Promise<string>) { impl = fn; }

export async function doorKeyIdHex(doorSecret: Uint8Array): Promise<string> {
  return impl(doorSecret);
}
