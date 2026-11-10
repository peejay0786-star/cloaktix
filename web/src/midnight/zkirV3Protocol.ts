// CT-PROOF-IR: shared types/constants for the in-tab ZKIR v3 prover (no WASM import here: safe for the main thread and node tests).
export type KeyMaterial = { proverKey: Uint8Array; verifierKey: Uint8Array; ir: Uint8Array };
export type LocalProveRequest = {
  id: number; op: 'check' | 'prove'; preimage: Uint8Array; keyLocation: string; km: KeyMaterial; binding?: bigint; paramsBase: string;
} | { id: number; op: 'warm'; ks: number[]; paramsBase: string };
export type LocalProveResponse =
  | { id: number; ok: true; check?: (bigint | undefined)[]; proof?: Uint8Array; warmed?: number[] }
  | { id: number; ok: false; error: string };

// Public BLS12-381 SRS from https://srs.midnight.network/ (same bytes as the files bundled in 1AM 6.4.10), served
// same-origin under /managed/zk-params/ by sync-zk-assets.mjs. rate-v3 circuits need k = 13..16.
const PARAMS_SHA256: Record<number, string> = {
  10: '46b2290933cbed4c378889e4ba971f1a92888331ffb09466acd4ff61a1e2cb42',
  11: '9901589d7956ff58be0d85569b2f455b77b58c3758026ffb5bbe4807000b96d1',
  12: 'ef08eb3fcf62df8f72c515cffa027e681808b530cb016eea104115545ef6d5c8',
  13: 'd3324910969c4cc54143b8045b649e5c3a4bd5fb7b8f85fe1b770f640ce1c803',
  14: 'fc253016885ec830e97808c9ec920bb5cab5c21af590380a6cb5eb0538e2b244',
  15: '724c7c3d779148bb113c7ee9c034b2f27db16e6bdf315fde90105a9bad00b1de',
  16: '09c877216d6589b370263e18af40a030a901b41a7a7c37ef58c9901db41f05c6',
};
export const paramsSha256 = (k: number): string | undefined => PARAMS_SHA256[k];
export const PARAMS_K = Object.keys(PARAMS_SHA256).map(Number);

const V3_TAG = new TextEncoder().encode('midnight:ir-source[v3');
/** True when a binary ZKIR (.bzkir) carries the ZKIR v3 tag that Compact 0.36 emits. */
export function isZkirV3(ir: Uint8Array): boolean {
  if (ir.length < V3_TAG.length) return false;
  for (let i = 0; i < V3_TAG.length; i++) if (ir[i] !== V3_TAG[i]) return false;
  return true;
}

/** CT-PROOF-SPEED: k of each rate-v3 circuit (zkir-v3 compile, 2026-11-09), used to prefetch the right SRS file. */
export const RATE_V3_K: Record<string, number> = {
  createEvent: 13, addTicketType: 13, setSalesOpen: 13, listForResale: 13, registerAdmit: 13, adminSet: 13,
  buyTicket: 14, admit: 14, buyTicketAdult: 15, buyResale: 15, buyResaleAdult: 15, buyTicketAda: 15, buyTicketAdaAdult: 16,
};
