/**
 * CloakTix v2 admit capability encoding.
 * Phone-safe: no wallet, no sk. Prefer URL fragment so the nonce never hits server logs.
 * Not forwarding-proof: first successful on-chain admit wins if the nonce is copied.
 */

export type AdmitCapabilityV2 = {
  v: 2;
  ticketName?: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  cover?: string;
  networkId: string;
  contract: string;
  serial: string; // decimal string of Uint128 — never JS Number
  epoch: string;
  nonceHex: string; // 32 bytes hex
};

const NONCE_RE = /^[0-9a-f]{64}$/i;
const DEC_RE = /^[0-9]+$/;

export function isAdmitCapabilityV2(x: unknown): x is AdmitCapabilityV2 {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === 2 &&
    typeof o.networkId === 'string' &&
    typeof o.contract === 'string' &&
    typeof o.serial === 'string' &&
    DEC_RE.test(o.serial) &&
    typeof o.epoch === 'string' &&
    DEC_RE.test(o.epoch) &&
    typeof o.nonceHex === 'string' &&
    NONCE_RE.test(o.nonceHex)
  );
}

/** Custom-scheme QR for dedicated scanners. */
export function encodeAdmitQr(cap: AdmitCapabilityV2): string {
  const q = new URLSearchParams({
    net: cap.networkId,
    c: cap.contract,
    s: cap.serial,
    e: cap.epoch,
    n: cap.nonceHex.toLowerCase(),
  });
  return `cloaktix:admit:v2?${q.toString()}`;
}

export function decodeAdmitQr(text: string): AdmitCapabilityV2 | null {
  const t = text.trim();
  if (!t.startsWith('cloaktix:admit:v2?')) return null;
  const q = new URLSearchParams(t.slice('cloaktix:admit:v2?'.length));
  const cap = {
    v: 2 as const,
    networkId: q.get('net') ?? '',
    contract: q.get('c') ?? '',
    serial: q.get('s') ?? '',
    epoch: q.get('e') ?? '',
    nonceHex: (q.get('n') ?? '').toLowerCase(),
  };
  return isAdmitCapabilityV2(cap) ? cap : null;
}

const FRAGMENT_LABEL_MAX = 120;
const TICKET_NAME_MAX = 48; // = TICKET_TYPE_LABEL_MAX
/** Only short same-origin paths (bundled demo art) are portable in a phone link or QR. */
export function isPortableCover(cover: string): boolean {
  return cover.length <= 200 && /^\/[A-Za-z0-9/_.-]+$/.test(cover) && !cover.startsWith('//');
}

/**
 * Prefer this for phone handoff: fragment never sent to the origin server.
 * Example: https://app.cloaktix.com/#/v2/admit?net=…&c=…&s=…&e=…&n=…
 */
export function encodeAdmitFragmentPath(cap: AdmitCapabilityV2): string {
  const q = new URLSearchParams({
    net: cap.networkId,
    c: cap.contract,
    s: cap.serial,
    e: cap.epoch,
    n: cap.nonceHex.toLowerCase(),
  });
  // CT-SEND-PHONE: the fragment is drawn as a QR (max about 2.3 KB). Text labels are capped and only a short
  // same-origin cover path travels; uploaded covers (data: URLs up to 300 KB) stay on the organizer's catalog.
  const label = (v: string | undefined) => (v ? v.slice(0, FRAGMENT_LABEL_MAX) : '');
  if (cap.ticketName) q.set('ticketName', cap.ticketName.slice(0, TICKET_NAME_MAX)); // CT-TIX-TYPE-LABEL: type name stays short
  if (cap.eventName) q.set('eventName', label(cap.eventName));
  for (const key of ['eventDate', 'venue'] as const) { if (cap[key]) q.set(key, label(cap[key])); }
  if (cap.cover && isPortableCover(cap.cover)) q.set('cover', cap.cover);
  return `#/v2/admit?${q.toString()}`;
}

export function parseAdmitFromLocation(hash: string): AdmitCapabilityV2 | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!h.startsWith('/v2/admit')) return null;
  const qi = h.indexOf('?');
  if (qi < 0) return null;
  const q = new URLSearchParams(h.slice(qi + 1));
  const cap = {
    v: 2 as const,
    networkId: q.get('net') ?? '',
    contract: q.get('c') ?? '',
    serial: q.get('s') ?? '',
    epoch: q.get('e') ?? '',
    nonceHex: (q.get('n') ?? '').toLowerCase(),
  };
  const ticketName = q.get('ticketName');
  const eventName = q.get('eventName');
  const metadata = Object.fromEntries(['eventDate', 'venue', 'cover'].flatMap((key) => { const value = q.get(key); return value ? [[key, value]] : []; }));
  return isAdmitCapabilityV2(cap) ? { ...cap, ...metadata, ...(ticketName ? { ticketName } : {}), ...(eventName ? { eventName } : {}) } : null;
}

export function randomNonce32(): Uint8Array {
  const out = new Uint8Array(32);
  crypto.getRandomValues(out);
  return out;
}

export function bytesToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.toLowerCase();
  if (!NONCE_RE.test(h)) throw new Error('bad hex');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
