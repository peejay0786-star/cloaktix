/** Organizer-signed, device-local door labels. No server writes or public catalog changes.
 * Portable envelopes contain labels + metadata public key/signature, never staff IDs. */
import type { GateRow } from './multiGate';
type Envelope = { network: string; contract: string; gateId: string; name: string; ts: number; pk: string; sig: string };
const key = (network: string, contract: string, gateId: bigint) => `cloaktix:gate-name:v4:${network}:${contract}:${gateId}`;
const message = (e: Omit<Envelope, 'pk' | 'sig'>) => `cloaktix:gate-name:v4|${e.network}|${e.contract}|${e.gateId}|${e.ts}|${JSON.stringify(e.name)}`;
function parse(value: unknown): Envelope | null {
  if (!value || typeof value !== 'object') return null;
  if (!('network' in value && typeof value.network === 'string' && 'contract' in value && typeof value.contract === 'string' &&
    'gateId' in value && typeof value.gateId === 'string' && /^\d+$/.test(value.gateId) &&
    'name' in value && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 80 &&
    'ts' in value && typeof value.ts === 'number' && Number.isSafeInteger(value.ts) &&
    'pk' in value && typeof value.pk === 'string' && /^[0-9a-f]{64}$/.test(value.pk) &&
    'sig' in value && typeof value.sig === 'string' && /^[0-9a-f]{128}$/.test(value.sig))) return null;
  return { network: value.network, contract: value.contract, gateId: value.gateId, name: value.name, ts: value.ts, pk: value.pk, sig: value.sig };
}
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], byte => parseInt(byte, 16));
async function verified(e: Envelope, network: string, contract: string, gate: GateRow): Promise<boolean> {
  if (e.network !== network || e.contract !== contract || e.gateId !== String(gate.id) || !gate.metadataKeys.includes(e.pk)) return false;
  try {
    const pk = await crypto.subtle.importKey('raw', bytes(e.pk), 'Ed25519', false, ['verify']);
    return crypto.subtle.verify('Ed25519', pk, bytes(e.sig), new TextEncoder().encode(message(e)));
  } catch { return false; }
}
export async function loadGateName(network: string, contract: string, gate: GateRow): Promise<string> {
  try { const e = parse(JSON.parse(localStorage.getItem(key(network, contract, gate.id)) ?? 'null'));
    if (e && await verified(e, network, contract, gate)) return e.name;
  } catch { /* Storage/crypto unavailable: a chain-derived Door #id remains usable. */ }
  return `Door #${gate.id}`;
}
export async function saveGateName(host: { networkId: string; contract: string | null; signMeta(message: string): Promise<{ pk: string; sig: string }> }, gate: GateRow, name: string): Promise<void> {
  if (!gate.mine || !host.contract) throw new Error('Only the organizer may name a door.');
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) throw new Error('Door name must contain 1–80 characters.');
  const body = { network: host.networkId, contract: host.contract, gateId: String(gate.id), name: trimmed, ts: Date.now() };
  const envelope = { ...body, ...await host.signMeta(message(body)) };
  if (!await verified(envelope, host.networkId, host.contract, gate)) throw new Error('Register your organizer metadata key through event details before signing door names. Door creation is already confirmed; do not create it again.');
  localStorage.setItem(key(host.networkId, host.contract, gate.id), JSON.stringify(envelope));
}
export function exportGateNames(network: string, contract: string, gates: GateRow[]): string {
  return JSON.stringify(gates.flatMap(g => {
    try { const e = parse(JSON.parse(localStorage.getItem(key(network, contract, g.id)) ?? 'null')); return e ? [e] : []; } catch { return []; }
  }));
}
export async function importGateNames(raw: string, network: string, contract: string, gates: GateRow[]): Promise<void> {
  if (raw.length > 100000) throw new Error('Door labels file is too large.');
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values)) throw new Error('Paste the organizer-signed door labels JSON.');
  const pending: Envelope[] = [];
  for (const value of values) {
    const e = parse(value); const gate = e && gates.find(g => String(g.id) === e.gateId);
    if (!e || !gate || !await verified(e, network, contract, gate)) throw new Error('Invalid organizer signature or wrong door, contract or network.');
    const old = parse(JSON.parse(localStorage.getItem(key(network, contract, gate.id)) ?? 'null'));
    if (!old || !await verified(old, network, contract, gate) || old.ts <= e.ts) pending.push(e);
  }
  for (const e of pending) localStorage.setItem(key(network, contract, BigInt(e.gateId)), JSON.stringify(e));
}
