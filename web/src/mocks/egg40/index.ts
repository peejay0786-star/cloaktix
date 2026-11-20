/**
 * EGG-40 MOCK. Fictional relay + contract data for local design review only.
 *
 * - Loaded only when the app is built or served with VITE_EGG40_MOCK=1 (see doorkeys/api.ts). Without the flag,
 *   Vite drops this module from the bundle: no mock code or data reaches the real path.
 * - Nothing here signs, opens a wallet, touches the network or stores a secret. "Wallet" and "network"
 *   phases are timers. Ids, codes and the contract value are made up (repeated hex patterns).
 * - Pick a scene with ?egg40=<scene> (list in SCENES). Default: "doors".
 * - To remove: delete src/mocks/egg40/ and the VITE_EGG40_MOCK branch in doorkeys/api.ts.
 */
import { DoorKeyError, type Egg40Api, type OrganizerDoorApi, type PairingPreview, type StaffDoorApi, type StaffKey, type WalletPhase } from '../../doorkeys/api';
import {
  encodePairingCode, pairingFingerprint, parsePairingCode, keyWindowError, SETTLE_BATCH_SIZE,
  type DoorKeyRow, type DoorMode, type DoorSchedule, type RelayState, type ScanOutcome, type SettlePhase, type SettlementState, type StaffKeyState,
} from '../../doorkeys/model';

const SCENES = ['presale', 'doors', 'offline', 'back', 'closed', 'settling', 'resume', 'done', 'deadline',
  'staff-setup', 'staff-pending', 'staff-slow', 'staff-approved', 'staff-scan', 'staff-offline', 'staff-expiring', 'staff-expired', 'staff-revoked'] as const;
type Scene = typeof SCENES[number];

const MOCK_CONTRACT = 'e4'.repeat(32);
const MOCK_ORG_KEY_FP = 'mock-organizer-encryption-key';
const EVENT_ID = 3n;
// CloakTix Launch Night, Montreal, Sat 2026-12-12. Doors 7:00 PM to 2:00 AM (America/Toronto, UTC-5).
const at = (iso: string) => Date.parse(iso);
const DOORS_OPEN = at('2026-12-12T19:00:00-05:00');
const DOORS_CLOSE = at('2026-12-13T02:00:00-05:00');
const SCENE_NOW: Record<Scene, number> = {
  presale: at('2026-12-10T14:00:00-05:00'),
  doors: at('2026-12-12T21:47:00-05:00'), offline: at('2026-12-12T22:03:00-05:00'), back: at('2026-12-12T22:09:00-05:00'),
  closed: at('2026-12-13T02:20:00-05:00'), settling: at('2026-12-13T03:05:00-05:00'), resume: at('2026-12-13T09:30:00-05:00'),
  done: at('2026-12-13T04:40:00-05:00'), deadline: at('2026-12-13T13:30:00-05:00'),
  'staff-setup': at('2026-12-12T18:20:00-05:00'), 'staff-pending': at('2026-12-12T18:24:00-05:00'), 'staff-slow': at('2026-12-12T18:35:00-05:00'),
  'staff-approved': at('2026-12-12T18:40:00-05:00'), 'staff-scan': at('2026-12-12T21:48:00-05:00'), 'staff-offline': at('2026-12-12T22:03:00-05:00'),
  'staff-expiring': at('2026-12-13T02:35:00-05:00'), 'staff-expired': at('2026-12-13T03:10:00-05:00'), 'staff-revoked': at('2026-12-12T23:15:00-05:00'),
};

const DOORS = [
  { gateId: 1n, name: 'Door 1', ticketTypes: ['General admission'] },
  { gateId: 2n, name: 'Door 2', ticketTypes: ['General admission', 'Early bird'] },
  { gateId: 3n, name: 'VIP door', ticketTypes: ['VIP'] },
];
const SCHEDULE: DoorSchedule = { eventId: EVENT_ID, eventName: 'CloakTix Launch Night', doorsOpenAt: DOORS_OPEN, doorsCloseAt: DOORS_CLOSE, doors: DOORS };
const hex = (n: number) => n.toString(16).padStart(2, '0').repeat(32);
const KEY_FROM = at('2026-12-12T18:00:00-05:00'), KEY_UNTIL = at('2026-12-13T03:00:00-05:00');
const SETTLE_FROM = at('2026-12-12T19:00:00-05:00'), SETTLE_UNTIL = at('2026-12-13T19:00:00-05:00');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const walletStep = async (onPhase: (p: WalletPhase) => void) => { onPhase('wallet'); await sleep(1800); onPhase('network'); await sleep(1600); };

function sceneFromLocation(): Scene {
  const raw = new URLSearchParams(location.search).get('egg40') ?? 'doors';
  return (SCENES as readonly string[]).includes(raw) ? raw as Scene : 'doors';
}

export function createMockEgg40Api(): Egg40Api {
  const scene = sceneFromLocation();
  const base = SCENE_NOW[scene];
  const startedAt = Date.now();
  const now = () => base + (Date.now() - startedAt);
  const after = (iso: string) => base >= at(iso);

  let mode: DoorMode = 'walletless';
  const keys: DoorKeyRow[] = [
    { keyId: hex(0x11), kind: 'staff', gateId: 1n, doorName: 'Door 1', fingerprint: '7KQ-4MD', validFrom: KEY_FROM, validUntil: KEY_UNTIL, revoked: false, entries: 0 },
    { keyId: hex(0x22), kind: 'staff', gateId: 2n, doorName: 'Door 2', fingerprint: 'R9X-2HB', validFrom: KEY_FROM, validUntil: KEY_UNTIL, revoked: false, entries: 0 },
    { keyId: hex(0x33), kind: 'staff', gateId: 3n, doorName: 'VIP door', fingerprint: 'C4T-W8N', validFrom: KEY_FROM, validUntil: KEY_UNTIL, revoked: false, entries: 0 },
    { keyId: hex(0x44), kind: 'staff', gateId: 1n, doorName: 'Door 1', fingerprint: 'P6J-3SZ', validFrom: at('2026-12-10T10:00:00-05:00'), validUntil: at('2026-12-10T22:00:00-05:00'), revoked: false, entries: 0 },
  ];
  if (scene !== 'presale') keys.unshift({ keyId: hex(0x99), kind: 'settlement', gateId: 99n, doorName: 'Settlement', fingerprint: 'M2D-8VE', validFrom: SETTLE_FROM, validUntil: SETTLE_UNTIL, revoked: false, entries: 0 });

  // Entries by door at "now": linear arrivals after doors open, 200 in total by close.
  const doorShare = [0.46, 0.38, 0.16];
  const entriesAt = (t: number) => t < DOORS_OPEN ? 0 : Math.round(200 * Math.min(1, (t - DOORS_OPEN) / (DOORS_CLOSE - DOORS_OPEN - 3_600_000)));
  const stats = () => {
    const total = entriesAt(now());
    let left = total;
    return DOORS.map((d, i) => {
      const n = i === DOORS.length - 1 ? left : Math.round(total * doorShare[i]);
      left -= n;
      return { gateId: d.gateId, doorName: d.name, entries: n, lastEntryAt: n ? Math.min(now(), DOORS_CLOSE) - (i + 1) * 47_000 : null };
    });
  };
  const relayState = (): RelayState => scene === 'offline' || scene === 'staff-offline'
    ? { status: 'offline', lastCopyAt: at('2026-12-12T21:58:00-05:00'), missed: [] }
    : scene === 'back' ? { status: 'syncing', lastCopyAt: at('2026-12-12T22:09:00-05:00'), missed: [{ gateId: 2n, doorName: 'Door 2', count: 3 }] }
      : { status: 'online', lastCopyAt: now() - 9000, missed: [] };
  let relay = relayState();

  const failures: SettlementState['failures'] = [
    { serial: '118', doorName: 'Door 2', reason: 'listed-after-entry' },
    { serial: '147', doorName: 'Door 1', reason: 'ticket-changed' },
  ];
  const settlement: SettlementState = {
    total: 200, doorCount: 3, ready: 198,
    recorded: scene === 'settling' || scene === 'resume' ? 36 : scene === 'done' ? 198 : 0,
    failures, keyUntil: SETTLE_UNTIL,
  };

  const organizer: OrganizerDoorApi = {
    now,
    contract: () => MOCK_CONTRACT,
    schedule: async id => (id === EVENT_ID ? SCHEDULE : null),
    setSchedule: async () => { /* mock: the scripted schedule stays */ },
    relay: async () => relay,
    doorMode: async () => mode,
    setDoorMode: async (_id, m) => { mode = m; },
    keys: async () => keys.map(k => ({ ...k, entries: k.kind === 'staff' && k.validUntil > DOORS_OPEN ? stats().find(s => s.gateId === k.gateId)?.entries ?? 0 : 0 })),
    previewPairing: async (eventId, code, window): Promise<PairingPreview> => {
      const parsed = parsePairingCode(code, { contract: MOCK_CONTRACT, eventId });
      if (!parsed.ok) throw new DoorKeyError(parsed.error);
      if (keys.some(k => k.keyId === parsed.request.keyId)) throw new DoorKeyError('This code was already used. Ask the staff phone to set up again.');
      const windowError = keyWindowError(window.from, window.until, now());
      if (windowError) throw new DoorKeyError(windowError);
      const door = DOORS.find(d => d.gateId === parsed.request.gateId);
      if (!door) throw new DoorKeyError('Code not recognized.');
      return { request: parsed.request, doorName: door.name, fingerprint: await pairingFingerprint(parsed.request, MOCK_ORG_KEY_FP), validFrom: window.from, validUntil: window.until };
    },
    authorizeDoorKey: async (p, onPhase) => {
      await walletStep(onPhase);
      keys.push({ keyId: p.request.keyId, kind: 'staff', gateId: p.request.gateId, doorName: p.doorName, fingerprint: p.fingerprint, validFrom: p.validFrom, validUntil: p.validUntil, revoked: false, entries: 0 });
    },
    createSettlementKey: async (_id, onPhase) => {
      await walletStep(onPhase);
      keys.unshift({ keyId: hex(0x98), kind: 'settlement', gateId: 99n, doorName: 'Settlement', fingerprint: 'M2D-8VE', validFrom: now(), validUntil: Math.min(now() + 48 * 3_600_000, DOORS_CLOSE + 24 * 3_600_000), revoked: false, entries: 0 });
    },
    revokeDoorKey: async (_id, keyId, onPhase) => {
      await walletStep(onPhase);
      const k = keys.find(row => row.keyId === keyId);
      if (k) k.revoked = true;
    },
    stats: async () => stats(),
    importMissed: async (_id, gateId) => { await sleep(900); relay = { ...relay, status: 'online', missed: relay.missed.filter(m => m.gateId !== gateId) }; },
    settlement: async () => ({ ...settlement, failures: [...settlement.failures] }),
    settleNextBatch: async (_id, onPhase: (p: SettlePhase) => void) => {
      onPhase('proving'); await sleep(2600);
      onPhase('wallet'); await sleep(1400);
      onPhase('network'); await sleep(1200);
      settlement.recorded = Math.min(settlement.ready, settlement.recorded + SETTLE_BATCH_SIZE);
      onPhase('idle');
      return { ...settlement, failures: [...settlement.failures] };
    },
    directAdmit: async (_id, code, onPhase) => {
      await walletStep(onPhase);
      return /used/i.test(code) ? { kind: 'already-used', doorName: 'Door 2', at: at('2026-12-12T21:41:00-05:00') } : { kind: 'valid', typeName: 'General admission' };
    },
  };

  // Staff phone. The pairing values are public; the mock never creates a door secret at all.
  const staffKey = (gateId: bigint, createdAt: number): StaffKey => {
    const request = { v: 1 as const, contract: MOCK_CONTRACT, eventId: EVENT_ID, gateId, keyId: hex(0x5a), deviceTag: hex(0xd7) };
    return { request, code: encodePairingCode(request), fingerprint: '7KQ-4MD', doorName: DOORS.find(d => d.gateId === gateId)?.name ?? `Door ${gateId}`, createdAt };
  };
  let current: StaffKey | null = scene === 'staff-setup' ? null
    : staffKey(1n, scene === 'staff-slow' ? base - 11 * 60_000 : base - 60_000);
  void pairingFingerprint(staffKey(1n, 0).request, MOCK_ORG_KEY_FP).then(fp => { if (current) current = { ...current, fingerprint: fp }; });
  const staffState = (): StaffKeyState => {
    if (scene === 'staff-pending' || scene === 'staff-slow' || scene === 'staff-setup') return { state: 'pending' };
    if (scene === 'staff-revoked') return { state: 'revoked' };
    if (scene === 'staff-expired' || after('2026-12-13T03:00:00-05:00')) return { state: 'expired' };
    return { state: 'approved', validUntil: KEY_UNTIL };
  };
  const local = new Map<string, number>([['cloaktix:admit:v2?mock=used', at('2026-12-12T21:41:00-05:00')]]);
  const staff: StaffDoorApi = {
    now,
    schedule: organizer.schedule,
    relay: async () => relay,
    currentKey: async () => current,
    createKey: async (_id, gateId) => { await sleep(500); current = staffKey(gateId, now()); return current; },
    keyState: async () => staffState(),
    deleteKey: async () => { current = null; },
    scan: async (_key, code): Promise<ScanOutcome> => {
      await sleep(250);
      const seen = local.get(code.trim());
      if (seen) return { kind: 'already-used', doorName: 'Door 2', at: seen };
      if (relay.status !== 'online') return { kind: 'relay-offline' };
      if (/wrong-door/.test(code)) return { kind: 'wrong-door', doorName: 'Door 2' };
      if (/other-event/.test(code)) return { kind: 'wrong-event' };
      if (/listed/.test(code)) return { kind: 'listed' };
      if (!code.startsWith('cloaktix:admit:v2?')) return { kind: 'replaced' };
      local.set(code.trim(), now());
      return { kind: 'valid', typeName: 'General admission' };
    },
    localEntries: async () => ({ count: 84 + local.size - 1, lastSentAt: relay.status === 'online' ? now() - 4000 : at('2026-12-12T21:58:00-05:00') }),
  };
  return { source: 'mock', organizer, staff };
}
