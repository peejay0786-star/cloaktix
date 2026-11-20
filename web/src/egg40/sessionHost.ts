/** Bound by Session when the selected contract is the EGG-40 address. No compact-js import. */
import type { CallFn } from './live.ts';

let bound: CallFn | null = null;
export function bindEgg40SessionCall(fn: CallFn | null) { bound = fn; }
export function getEgg40SessionCall(): CallFn | null { return bound; }

/** Organizer metadata-key signer (Session.signMeta), bound with the call. Relay organizer writes are signed with it. */
let signer: ((message: string) => Promise<{ pk: string; sig: string }>) | null = null;
export function bindEgg40OrgSigner(fn: typeof signer) { signer = fn; }
export function getEgg40OrgSigner() { return signer; }
