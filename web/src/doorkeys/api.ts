/**
 * EGG-40 boundary: everything the UI needs from the relay (Durable Object per event) and the EGG-40 contract.
 * loadEgg40Api() returns the live API when VITE_EGG40_CONTRACT is set (placeholder until P-Jay deploys),
 * or the isolated mock when VITE_EGG40_MOCK=1. Otherwise it returns null and the UI says door keys are not available yet.
 */
import type {
  DoorEntryStats, DoorKeyRow, DoorMode, DoorSchedule, PairingRequest, RelayState,
  ScanOutcome, SettlePhase, SettlementState, StaffKeyState,
} from './model';

/** proving: in-tab ZK proof (no wallet prompt yet) -> wallet: 1AM prompt -> network: tx in flight -> relay: unlocking the staff phone. */
export type WalletPhase = 'proving' | 'wallet' | 'network' | 'relay';
export type DoorScheduleInput = { eventName: string; doorsOpenAt: number; doorsCloseAt: number; doors: Array<{ gateId?: string; name: string; ticketTypes?: string[] }> };
export type PairingPreview = { request: PairingRequest; doorName: string; fingerprint: string; validFrom: number; validUntil: number };
/** Staff-side key. The door secret stays inside the implementation (non-extractable WebCrypto); it is never part of this value. */
export type StaffKey = { request: PairingRequest; code: string; fingerprint: string; doorName: string; createdAt: number };

/** A refusal the user can act on. `message` is shown as is (spec copy). */
export class DoorKeyError extends Error {
  constructor(message: string) { super(message); this.name = 'DoorKeyError'; }
}

type Shared = {
  /** Clock used for every door-key rule. Live: Date.now(). */
  now(): number;
  /** Door schedule and door list, published by the organizer to the relay. Null when the event has no doors. */
  schedule(eventId: bigint): Promise<DoorSchedule | null>;
  relay(eventId: bigint): Promise<RelayState>;
};

/** Organizer device (wallet connected). Live: authorizeDoorKey, revokeDoorKey, admitByDoor4, admit via the session. */
export type OrganizerDoorApi = Shared & {
  contract(): string;
  /** Doors and door times (organizer-signed relay write). Door numbers already in use keep their gateId. Throws DoorKeyError. */
  setSchedule(eventId: bigint, input: DoorScheduleInput): Promise<void>;
  doorMode(eventId: bigint): Promise<DoorMode>;
  setDoorMode(eventId: bigint, mode: DoorMode): Promise<void>;
  keys(eventId: bigint): Promise<DoorKeyRow[]>;
  /** Checks a staff code and computes the fingerprint shown in O3. Throws DoorKeyError. */
  previewPairing(eventId: bigint, code: string, window: { from: number; until: number }): Promise<PairingPreview>;
  authorizeDoorKey(preview: PairingPreview, onPhase: (p: WalletPhase) => void): Promise<void>;
  createSettlementKey(eventId: bigint, onPhase: (p: WalletPhase) => void): Promise<void>;
  revokeDoorKey(eventId: bigint, keyId: string, onPhase: (p: WalletPhase) => void): Promise<void>;
  stats(eventId: bigint): Promise<DoorEntryStats[]>;
  importMissed(eventId: bigint, gateId: bigint): Promise<void>;
  settlement(eventId: bigint): Promise<SettlementState>;
  /** One admitByDoor4 batch; on failure the implementation replays its 4 entries one by one ('retrying'). */
  settleNextBatch(eventId: bigint, onPhase: (p: SettlePhase) => void): Promise<SettlementState>;
  /** Plan B: organizer admits on-chain with their own wallet, one approval per guest. */
  directAdmit(eventId: bigint, code: string, onPhase: (p: WalletPhase) => void): Promise<ScanOutcome>;
};

/** Staff phone, no wallet. Live: WebCrypto key pair + relay reservations + indexer reads. */
export type StaffDoorApi = Shared & {
  currentKey(eventId: bigint): Promise<StaffKey | null>;
  createKey(eventId: bigint, gateId: bigint): Promise<StaffKey>;
  keyState(key: StaffKey): Promise<StaffKeyState>;
  deleteKey(key: StaffKey): Promise<void>;
  scan(key: StaffKey, ticketCode: string): Promise<ScanOutcome>;
  localEntries(key: StaffKey): Promise<{ count: number; lastSentAt: number | null }>;
};

export type Egg40Api = { source: 'mock' | 'live'; organizer: OrganizerDoorApi; staff: StaffDoorApi };

let pending: Promise<Egg40Api | null> | null = null;
export function loadEgg40Api(): Promise<Egg40Api | null> {
  pending ??= import.meta.env.VITE_EGG40_MOCK === '1'
    ? import('../mocks/egg40').then(m => m.createMockEgg40Api())
    : import('../egg40/boot').then(m => m.bootLiveEgg40Api());
  return pending;
}
/** Test-only: drop the cached loader so a later call can pick a new env. */
export function resetEgg40ApiLoader() { pending = null; }
