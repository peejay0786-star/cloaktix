/**
 * EGG-40 door keys: domain types and pure rules shared by the organizer and the staff phone.
 * No SDK, wallet or network imports. Timestamps are epoch milliseconds.
 * Walletless staff mode (DESIGN-18).
 */

/** `authorizeDoorKey` refuses windows longer than this (172 800 s, constant in the circuit). */
export const MAX_DOOR_KEY_MS = 48 * 60 * 60 * 1000;
/** Default window: doors open minus 1 h, doors close plus 24 h (capped at 48 h). */
export const KEY_LEAD_MS = 60 * 60 * 1000;
export const KEY_SETTLE_MARGIN_MS = 24 * 60 * 60 * 1000;
/** `admitByDoor4`: one wallet approval records four entries. */
export const SETTLE_BATCH_SIZE = 4;
/** Staff phone polls the indexer for approval this often. */
export const APPROVAL_POLL_MS = 6000;
export const APPROVAL_SLOW_MS = 10 * 60 * 1000;
/** Warnings: key expiring soon (staff) and settlement deadline (organizer). */
export const KEY_EXPIRING_SOON_MS = 30 * 60 * 1000;
export const SETTLE_DEADLINE_WARN_MS = 6 * 60 * 60 * 1000;

export type DoorMode = 'walletless' | 'staff-wallet';
export const DOOR_MODE_LABEL: Record<DoorMode, string> = { walletless: 'Walletless staff', 'staff-wallet': 'Staff wallet' };

export type Door = { gateId: bigint; name: string; ticketTypes: string[] };
export type DoorSchedule = { eventId: bigint; eventName: string; doorsOpenAt: number; doorsCloseAt: number; doors: Door[] };

export type DoorKeyKind = 'staff' | 'settlement';
export type DoorKeyRow = {
  keyId: string;
  kind: DoorKeyKind;
  gateId: bigint;
  doorName: string;
  fingerprint: string;
  validFrom: number;
  validUntil: number;
  revoked: boolean;
  /** Relay count; 0 for the settlement key. */
  entries: number;
};

export type RelayStatus = 'online' | 'offline' | 'syncing';
export type MissedEntries = { gateId: bigint; doorName: string; count: number };
export type RelayState = { status: RelayStatus; lastCopyAt: number | null; missed: MissedEntries[] };

export type DoorEntryStats = { gateId: bigint; doorName: string; entries: number; lastEntryAt: number | null };

/** What the staff phone shows in its QR. Public values only: never the door secret. */
export type PairingRequest = { v: 1; contract: string; eventId: bigint; gateId: bigint; keyId: string; deviceTag: string };

export type SettleFailureReason = 'already-recorded' | 'listed-after-entry' | 'ticket-changed' | 'key-expired' | 'unsigned-entry' | 'not-sent';
export const SETTLE_FAILURE_TEXT: Record<SettleFailureReason, string> = {
  'already-recorded': 'Already recorded (plan B or another device)',
  'listed-after-entry': 'Ticket was listed for resale after entry',
  'ticket-changed': 'Ticket changed after scan (resold or new QR)',
  'key-expired': 'Settlement key expired. Create a new one to continue.',
  'unsigned-entry': 'Entry not signed by an approved door: skipped',
  'not-sent': 'Not sent. Retry',
};
export type SettleFailure = { serial: string; doorName: string; reason: SettleFailureReason };
export type SettlePhase = 'idle' | 'proving' | 'wallet' | 'network' | 'retrying';
export type SettlementState = {
  total: number;
  doorCount: number;
  ready: number;
  recorded: number;
  failures: SettleFailure[];
  /** Settlement key end, or null when this device has none yet. */
  keyUntil: number | null;
};

export type ScanOutcome =
  | { kind: 'valid'; typeName: string }
  | { kind: 'already-used'; doorName: string; at: number }
  | { kind: 'wrong-door'; doorName: string }
  | { kind: 'wrong-event' }
  | { kind: 'replaced' }
  | { kind: 'listed' }
  | { kind: 'relay-offline' }
  /** EGG-45: the ticket checks out but this phone's door key window has not started; nothing recorded. */
  | { kind: 'key-not-yet-valid'; opensAt: number; typeName: string }
  | { kind: 'key-expired' }
  /** EGG-45: the relay refused for a reason that is not about the ticket (shown as-is, never "replaced"). */
  | { kind: 'refused'; reason: string };

export type StaffKeyState =
  | { state: 'pending' }
  | { state: 'approved'; validUntil: number; validFrom?: number }
  | { state: 'expired' }
  | { state: 'revoked' };

/** Already-recorded entries count as settled (spec 8, P3). */
export function settledCount(s: SettlementState): number {
  return s.recorded + s.failures.filter(f => f.reason === 'already-recorded').length;
}
export function batchCount(entries: number): number { return Math.ceil(Math.max(0, entries) / SETTLE_BATCH_SIZE); }
/** One approval per batch of four ready entries ("50 wallet approvals (4 entries each)"). */
export function batchesTotal(s: SettlementState): number { return batchCount(s.ready); }
export function currentBatch(s: SettlementState): number { return Math.min(batchesTotal(s), Math.floor(s.recorded / SETTLE_BATCH_SIZE) + 1); }
export function approvalsLeft(s: SettlementState): number { return batchCount(s.ready - s.recorded); }
export function settlementDone(s: SettlementState): boolean { return s.ready > 0 && s.recorded >= s.ready; }
export function needsAttention(s: SettlementState): number { return s.total - s.ready; }

export function doorsOpen(schedule: DoorSchedule | null, now: number): boolean { return !!schedule && now >= schedule.doorsOpenAt; }
export function doorsClosed(schedule: DoorSchedule | null, now: number): boolean { return !!schedule && now >= schedule.doorsCloseAt; }

export function defaultKeyWindow(schedule: DoorSchedule): { from: number; until: number } {
  const from = schedule.doorsOpenAt - KEY_LEAD_MS;
  return { from, until: Math.min(schedule.doorsCloseAt + KEY_SETTLE_MARGIN_MS, from + MAX_DOOR_KEY_MS) };
}
/** Mirrors the circuit guards so the wallet is never opened for a window the contract refuses. */
export function keyWindowError(from: number, until: number, now: number): string | null {
  if (!Number.isFinite(from) || !Number.isFinite(until)) return 'Choose both dates.';
  if (until <= from) return 'Valid until must be after Valid from.';
  if (until - from > MAX_DOOR_KEY_MS) return 'A door key can last 48 hours at most.';
  if (until <= now) return 'This time window has already ended.';
  return null;
}

/** Active keys first; expired keys are hidden behind "Show expired (n)". Revoked keys leave the list. */
export function splitKeys(rows: DoorKeyRow[], now: number): { active: DoorKeyRow[]; expired: DoorKeyRow[] } {
  const live = rows.filter(r => !r.revoked);
  const byDoor = (a: DoorKeyRow, b: DoorKeyRow) => (a.kind === b.kind ? Number(a.gateId - b.gateId) : a.kind === 'settlement' ? -1 : 1);
  return { active: live.filter(r => r.validUntil > now).sort(byDoor), expired: live.filter(r => r.validUntil <= now).sort(byDoor) };
}

// Pairing code: cloaktix:pair:v1?c=<contract>&e=<eventId>&g=<gateId>&k=<keyId>&d=<deviceTag>
const PAIR_PREFIX = 'cloaktix:pair:v1?';
const HEX64 = /^[0-9a-f]{64}$/;
/** Largest Compact Field value (BLS12-381 scalar field r - 1). A door keyId above it cannot be put on-chain. */
export const MAX_FIELD = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000000n;
export const keyIdFitsField = (hex: string) => HEX64.test(hex) && BigInt('0x' + hex) <= MAX_FIELD;
const UINT = /^(0|[1-9]\d{0,19})$/;
export function encodePairingCode(r: PairingRequest): string {
  return `${PAIR_PREFIX}${new URLSearchParams({ c: r.contract, e: String(r.eventId), g: String(r.gateId), k: r.keyId, d: r.deviceTag })}`;
}
export type PairingParse = { ok: true; request: PairingRequest } | { ok: false; error: 'Code not recognized.' | 'This code is for another event.' };
export function parsePairingCode(text: string, expected: { contract: string; eventId: bigint }): PairingParse {
  const raw = text.trim();
  if (!raw.startsWith(PAIR_PREFIX) || raw.length > 400) return { ok: false, error: 'Code not recognized.' };
  const q = new URLSearchParams(raw.slice(PAIR_PREFIX.length));
  const [c, e, g, k, d] = ['c', 'e', 'g', 'k', 'd'].map(n => q.get(n) ?? '');
  if (!HEX64.test(c) || !UINT.test(e) || !UINT.test(g) || g === '0' || !HEX64.test(k) || /^0+$/.test(k) || !HEX64.test(d)) return { ok: false, error: 'Code not recognized.' };
  if (c !== expected.contract || BigInt(e) !== expected.eventId) return { ok: false, error: 'This code is for another event.' };
  return { ok: true, request: { v: 1, contract: c, eventId: BigInt(e), gateId: BigInt(g), keyId: k, deviceTag: d } };
}

/** Base32 without 0/O/1/I, so a fingerprint read aloud cannot be misheard. */
export const FINGERPRINT_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
/** SHA-256(cloaktix:pair:v1 | contract | eventId | gateId | keyId | deviceTag | organizer key fingerprint), first 30 bits, "7KQ-4MD". */
export async function pairingFingerprint(r: PairingRequest, organizerKeyFingerprint: string): Promise<string> {
  const input = ['cloaktix:pair:v1', r.contract, String(r.eventId), String(r.gateId), r.keyId, r.deviceTag, organizerKeyFingerprint].join('|');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
  const bits = ((digest[0] << 22) | (digest[1] << 14) | (digest[2] << 6) | (digest[3] >> 2)) >>> 0;
  let out = '';
  for (let i = 5; i >= 0; i--) out += FINGERPRINT_ALPHABET[(bits >>> (i * 5)) & 31];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}
