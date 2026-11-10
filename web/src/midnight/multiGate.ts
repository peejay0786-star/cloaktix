/** Gate permissions/projection shared by session and UI; authoritative enforcement is Compact. */
import type { LedgerV4, GateInfo, GateStaffInfo, Admission } from './contract-v4';
export type GateRow = GateInfo & { id: bigint; mine: boolean; assigned: boolean; acceptedTypeIds: bigint[]; admittedCount: number; metadataKeys: string[] };
export type StaffRow = GateStaffInfo;
export type AdmissionRow = Admission & { serial: bigint };
export type MultiGateState = { gates: GateRow[]; gateStaff: StaffRow[]; admissions: AdmissionRow[]; staffOnly: boolean };
export type StaffId = string & { readonly __brand: 'CloakTixStaffId' };
export function isStaffId(input: string): input is StaffId { return /^[0-9a-f]{64}$/.test(input) && !/^0+$/.test(input); }
export function parseStaffId(value: string): StaffId {
  const id = value.trim().toLowerCase();
  if (!isStaffId(id)) throw new Error('Paste the 64-character public CloakTix Staff ID, not a wallet address or secret key.');
  return id;
}
export const hexId = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export function projectMultiGate(ledger: LedgerV4, accountId: string): MultiGateState {
  const staff = [...ledger.gateStaff].map(([, row]) => row);
  const admissions = [...ledger.admissions].map(([serial, row]) => ({ serial, ...row }));
  const rules = [...ledger.gateTypes].map(([, row]) => row);
  const events = [...ledger.events];
  const gates = [...ledger.gates].map(([id, row]) => {
    const organizer = ledger.events.lookup(row.eventId).organizer;
    const mine = hexId(organizer) === accountId;
    return { id, ...row, mine,
      assigned: staff.some(s => s.gateId === id && s.active && hexId(s.staffId) === accountId),
      acceptedTypeIds: rules.filter(rule => rule.gateId === id).map(rule => rule.typeId),
      admittedCount: admissions.filter(a => a.gateId === id).length,
      // Same organizer's on-chain metadata-key registration (existing /meta convention).
      // Only used to verify signed door labels locally. Never sent to /catalog or rendered.
      metadataKeys: events.filter(([, e]) => hexId(e.organizer) === hexId(organizer)).map(([, e]) => hexId(e.payout.bytes)),
    };
  });
  const account = Uint8Array.from(accountId.match(/../g) ?? [], byte => parseInt(byte, 16));
  return { gates, gateStaff: staff.filter(s => gates.some(g => g.id === s.gateId && g.mine)), admissions,
    staffOnly: account.length === 32 && ledger.staffAccounts.member(account) && !ledger.organizerAccounts.member(account) };
}
export function accessibleDoors(state: MultiGateState): GateRow[] { return state.gates.filter(g => g.active && (g.mine || g.assigned)); }
export function doorAccepts(gate: GateRow, type: { id: bigint; eventId: bigint }): boolean {
  return gate.eventId === type.eventId && (gate.typeCount === 0n || gate.acceptedTypeIds.includes(type.id));
}
