/**
 * EGG-39: off-chain door verdict + durable admit queue.
 * Does not change the contract or session-v3 payment sequencing. Does not sign by itself.
 */
import { decodeAdmitQr, hexToBytes } from '../v2/admitCodec.ts';
/** Compact TicketStatus: owned=0, listed=1, consumed=2 (v2/v3/v4). */
const OWNED = 0;
const CONSUMED = 2;
import { doorAccepts } from './multiGate.ts';
import type { ContractState } from './viewTypes.ts';
import type { GateAdmitStore, QueuedAdmit } from './gateAdmitStore.ts';

export const COMMIT_THRESHOLD = 10;
export const COMMIT_INTERVAL_MS = 120_000;

export type InstantAdmitOk = {
  ok: true;
  serial: bigint;
  typeId: bigint;
  recordingPending: true;
  queued: number;
  doorLabel: string;
  at: string;
};
export type InstantAdmitFail = {
  ok: false;
  reason: string;
  firstAdmittedAt: string;
  firstAdmittedDoor: string;
};
export type InstantAdmitResult = InstantAdmitOk | InstantAdmitFail;

export type InstantAdmitInput = {
  store: GateAdmitStore;
  networkId: string;
  contract: string;
  schema: 2 | 3 | 4;
  text: string;
  state: ContractState | null;
  online: boolean;
  acceptedTypeIds?: bigint[];
  gateId?: bigint;
  doorLabel?: string;
};

const usedReason = (at: string, door: string) =>
  door ? `Already admitted at ${at} (${door})` : `Already admitted locally at ${at}`;

function refuse(reason: string, at = '', door = ''): InstantAdmitFail {
  return { ok: false, reason, firstAdmittedAt: at, firstAdmittedDoor: door };
}

export function evaluateSerialTicket(input: {
  networkId: string;
  contract: string;
  schema: 2 | 3 | 4;
  text: string;
  state: ContractState | null;
  online: boolean;
  acceptedTypeIds?: bigint[];
  gateId?: bigint;
}): InstantAdmitFail | { ok: true; serial: bigint; typeId: bigint; qrText: string } {
  const cap = decodeAdmitQr(input.text.trim());
  if (!cap) return refuse(input.schema === 2 ? 'Not a CloakTix admit v2 code' : 'Not a CloakTix admission QR');
  if (cap.networkId !== input.networkId) return refuse('Ticket is for another network');
  if (cap.contract !== input.contract) return refuse('Ticket is for another event contract');
  if (!input.online || !input.state) {
    return refuse('Online confirmation unavailable. No offline first admission is permitted.');
  }
  const state = input.state;
  if (state.schemaVersion !== input.schema) return refuse(`Expected serial ticket schema ${input.schema}`);
  const serial = BigInt(cap.serial);
  const row = state.tickets.find((ticket) => ticket.serial === serial);
  if (!row) return refuse('Serial not on this contract');

  if (input.schema === 2) {
    if (row.status === CONSUMED) return refuse('Ticket already consumed');
    if (row.status !== OWNED) return refuse('Ticket not in owned state (listed or other)');
    if (input.acceptedTypeIds && !input.acceptedTypeIds.includes(row.typeId)) {
      return refuse(`Wrong ticket type (#${row.typeId}) for this gate`);
    }
    return { ok: true, serial, typeId: row.typeId, qrText: input.text.trim() };
  }

  if (input.schema === 3) {
    if (row.status !== OWNED) {
      return refuse(row.status === CONSUMED ? 'Ticket already consumed' : 'Ticket is no longer in owned state');
    }
    if (input.acceptedTypeIds && !input.acceptedTypeIds.includes(row.typeId)) return refuse('Wrong ticket type for this gate');
    if (!row.hasAdmit || String(row.epoch) !== cap.epoch) return refuse('This ticket copy has been replaced');
    return { ok: true, serial, typeId: row.typeId, qrText: input.text.trim() };
  }

  if (state.schemaVersion !== 4) return refuse('Expected serial ticket schema 4');
  const gate = state.gates.find((g) => g.id === input.gateId);
  if (!gate || !gate.active || (!gate.mine && !gate.assigned)) {
    return refuse('Unauthorized or revoked staff, or inactive door');
  }
  if (row.status === CONSUMED) return refuse('Already used');
  if (row.status !== OWNED) return refuse('Replaced copy: ticket is not owned');
  const type = state.types.find((item) => item.id === row.typeId);
  if (!type || !doorAccepts(gate, type)) return refuse('Wrong ticket type for this door');
  if (!row.hasAdmit || String(row.epoch) !== cap.epoch) return refuse('Replaced copy');
  return { ok: true, serial, typeId: row.typeId, qrText: input.text.trim() };
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function instantAdmit(input: InstantAdmitInput): Promise<InstantAdmitResult> {
  const serialHint = (() => {
    const cap = decodeAdmitQr(input.text.trim());
    return cap?.serial ?? '';
  })();
  if (serialHint) {
    const used = await input.store.getUsed(input.contract, serialHint);
    if (used) return refuse(usedReason(formatTime(used.at), used.doorLabel), formatTime(used.at), used.doorLabel);
  }

  const evaluated = evaluateSerialTicket(input);
  if (!evaluated.ok) {
    if (/already used|already consumed|already admitted/i.test(evaluated.reason) && serialHint) {
      const used = await input.store.getUsed(input.contract, serialHint);
      if (used) return refuse(usedReason(formatTime(used.at), used.doorLabel), formatTime(used.at), used.doorLabel);
    }
    return evaluated;
  }

  const at = new Date().toISOString();
  const doorLabel = input.doorLabel ?? '';
  const claim = await input.store.claimUsed({
    contract: input.contract,
    serial: String(evaluated.serial),
    at,
    doorLabel,
    status: 'pending',
  });
  if (!claim.claimed) {
    return refuse(usedReason(formatTime(claim.entry.at), claim.entry.doorLabel), formatTime(claim.entry.at), claim.entry.doorLabel);
  }

  const item: QueuedAdmit = {
    id: newId(),
    contract: input.contract,
    schema: input.schema,
    serial: String(evaluated.serial),
    typeId: String(evaluated.typeId),
    qrText: evaluated.qrText,
    doorId: input.gateId != null ? String(input.gateId) : '',
    doorLabel,
    acceptedTypeIds: (input.acceptedTypeIds ?? []).map(String),
    queuedAt: at,
    attempts: 0,
    lastError: '',
  };
  await input.store.putQueue(item);
  const queued = await input.store.pendingCount(input.contract);
  return {
    ok: true,
    serial: evaluated.serial,
    typeId: evaluated.typeId,
    recordingPending: true,
    queued,
    doorLabel,
    at,
  };
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US');
  } catch {
    return iso;
  }
}

export type AdmitSubmitter = (item: QueuedAdmit) => Promise<{ txId: string }>;

export async function submitQueuedAdmit(item: QueuedAdmit, call: (circuit: string, args: unknown[]) => Promise<{ txId: string }>): Promise<{ txId: string }> {
  const cap = decodeAdmitQr(item.qrText);
  if (!cap) throw new Error('Not a CloakTix admission QR');
  const serial = BigInt(cap.serial);
  const nonce = hexToBytes(cap.nonceHex);
  if (item.schema === 4) return call('admit', [serial, nonce, BigInt(item.doorId)]);
  return call('admit', [serial, nonce]);
}

export type CommitReport = { id: string; serial: string; ok: boolean; txId?: string; error?: string };

export async function commitQueuedAdmits(
  store: GateAdmitStore,
  contract: string,
  submit: AdmitSubmitter,
  onEach?: (report: CommitReport, remaining: number) => void,
): Promise<{ ok: number; failed: number; reports: CommitReport[] }> {
  const items = await store.listQueue(contract);
  const reports: CommitReport[] = [];
  let ok = 0;
  let failed = 0;
  for (const item of items) {
    const next: QueuedAdmit = { ...item, attempts: item.attempts + 1 };
    try {
      const result = await submit(item);
      const used = await store.getUsed(contract, item.serial);
      if (used) await store.putUsed({ ...used, status: 'committed' });
      await store.removeQueue(item.id);
      ok += 1;
      const report = { id: item.id, serial: item.serial, ok: true as const, txId: result.txId };
      reports.push(report);
      onEach?.(report, items.length - reports.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/already (consumed|used|admitted)/i.test(message)) {
        const used = await store.getUsed(contract, item.serial);
        if (used) await store.putUsed({ ...used, status: 'committed' });
        await store.removeQueue(item.id);
        ok += 1;
        const report = { id: item.id, serial: item.serial, ok: true as const, txId: 'already-on-chain' };
        reports.push(report);
        onEach?.(report, items.length - reports.length);
        continue;
      }
      await store.putQueue({ ...next, lastError: message });
      const used = await store.getUsed(contract, item.serial);
      if (used) await store.putUsed({ ...used, status: 'failed' });
      failed += 1;
      const report = { id: item.id, serial: item.serial, ok: false as const, error: message };
      reports.push(report);
      onEach?.(report, items.length - reports.length);
    }
  }
  return { ok, failed, reports };
}

export function shouldAutoCommit(pending: number, queuedSinceMs: number | null, now = Date.now()): boolean {
  if (pending <= 0) return false;
  if (pending >= COMMIT_THRESHOLD) return true;
  return queuedSinceMs != null && now - queuedSinceMs >= COMMIT_INTERVAL_MS;
}
