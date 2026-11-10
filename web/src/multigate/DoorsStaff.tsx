import { useEffect, useState } from 'react';
import type { Session } from '../midnight/types';
import type { ContractState } from '../midnight/viewTypes';
import { hexId, parseStaffId, type GateRow } from '../midnight/multiGate';
import { loadGateName, saveGateName, exportGateNames, importGateNames } from '../midnight/gateNames';
import { PendingButton, PENDING_CREATE, PENDING_SAVE, PENDING_WALLET } from '../PendingButton';
export type StateV4 = Extract<ContractState, { schemaVersion: 4 }>;
type Run = <T>(label: string, action: () => Promise<T>) => Promise<T | undefined>;
export function useDoorNames(s: Session, gates: GateRow[], revision = 0) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    if (s.contract) void Promise.all(gates.map(async g => [String(g.id), await loadGateName(s.networkId, s.contract!, g)]))
      .then(entries => { if (alive) setNames(Object.fromEntries(entries)); });
    return () => { alive = false; };
  }, [s, gates, revision]);
  return (gateId: bigint) => names[String(gateId)] ?? `Door #${gateId}`;
}
export function StaffIdentity({ s, canEnroll = false }: { s: Session; canEnroll?: boolean }) {
  const [status, setStatus] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  return <section className="card staff-identity" aria-label="Your staff ID"><h3>Your staff ID</h3>
    <p className="muted">Use your own 1AM wallet. Give this public CloakTix account hash to the organizer, never your wallet address or a secret key.</p>
    <div className="row"><code>{s.accountId}</code><button onClick={() => void navigator.clipboard.writeText(s.accountId).then(() => setStatus('Staff ID copied'), () => setStatus('Copy unavailable. Select the Staff ID above.'))}>Copy Staff ID</button></div>
    {canEnroll && <><p className="note">Enable staff mode once before assignment. This account will be check-in-only; it cannot create events, even after revocation. An organizer cannot enroll you without your consent.</p><PendingButton pending={enrolling} pendingLabel={PENDING_WALLET} disabled={enrolling} onClick={async () => { if (enrolling) return; setEnrolling(true); try { await s.call('registerStaff', []); setStatus('Staff mode confirmed. Give your Staff ID to the organizer.'); } catch { setStatus('Schema 4 is local-only. Staff enrollment requires a separately authorized v4 deployment and proving keys.'); } finally { setEnrolling(false); } }}>Enable staff mode</PendingButton></>}
    {s.idSource === 'device' && <p className="note">This ID belongs to this browser identity. Keep this device connected for your shift; another device may have a different Staff ID.</p>}
    <p className="small" role="status">{status}</p></section>;
}
export function DoorLabels({ s, gates, onChange }: { s: Session; gates: GateRow[]; onChange(): void }) {
  const [text, setText] = useState(''); const [status, setStatus] = useState('');
  return <details className="door-labels"><summary>Signed door labels · this device</summary>
    <p className="small muted">Door permissions and counts are on-chain. Names are signed by the organizer and saved locally; paste the signed labels on another scanner. No staff IDs are included. Nothing is published.</p>
    <label>Signed labels JSON<textarea value={text} onChange={e => setText(e.target.value)} /></label><div className="row">
      {gates.some(g => g.mine) && <button onClick={() => { if (s.contract) setText(exportGateNames(s.networkId, s.contract, gates)); }}>Export labels</button>}
      <button disabled={!text} onClick={async () => { try { if (!s.contract) return; await importGateNames(text, s.networkId, s.contract, gates); onChange(); setStatus('Verified door labels saved.'); } catch { setStatus('Labels refused: check the organizer signature, door, contract and network.'); } }}>Import signed labels</button></div><p role="status">{status}</p></details>;
}
export function DoorsStaff({ s, st, eventId, run, ttName }: { s: Session; st: StateV4; eventId: bigint; run: Run; ttName(id: bigint): string }) {
  const [name, setName] = useState(''); const [pending, setPending] = useState('');
  const [revision, setRevision] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const gates = st.gates.filter(g => g.eventId === eventId && g.mine);
  const label = useDoorNames(s, st.gates, revision);
  if (!st.events.some(e => e.id === eventId && e.mine)) return null;
  const action = async (title: string, f: () => Promise<unknown>) => {
    if (pending) return;
    setPending(title);
    try { await run(title, f); } finally { setPending(''); }
  };
  return <section className="doors-staff"><h3>Doors &amp; staff</h3>
    <p className="note">Schema 4 · local implementation, not live. No v4 proving keys or deployed contract. Each scanner uses its own wallet; no offline admissions.</p>
    <div className="row"><label>Door name<input maxLength={80} placeholder="Main entrance" value={name} onChange={e => setName(e.target.value)} /></label>
      <PendingButton className="primary" pending={pending==='Create door'} pendingLabel={PENDING_CREATE} disabled={!!pending || !name.trim()} onClick={() => void action('Create door', async () => {
        const result = await s.call('addGate', [eventId]);
        if (typeof result.result !== 'bigint') throw new Error('Door created. Refresh its chain ID before naming it; do not create it again.');
        const current = await s.state();
        const gate = current?.schemaVersion === 4 && current.gates.find(g => g.id === result.result);
        setName('');
        if (!gate) throw new Error('Door created. Wait for state sync before naming it; do not create it again.');
        await saveGateName(s, gate, name); setRevision(n => n + 1);
      })}>Create door</PendingButton></div>
    {gates.length === 0 && <p className="muted">No doors yet. Create a door before assigning a scanner.</p>}
    {gates.map(g => <article className="door-card" key={String(g.id)}><div className="door-heading"><h4>{label(g.id)}</h4><span className="count">{g.admittedCount} admitted</span><span className="tag">{g.active ? 'Active' : 'Closed'}</span></div>
      <div className="row"><label>Display name<input maxLength={80} placeholder={label(g.id)} value={edits[String(g.id)] ?? ''} onChange={e => setEdits({ ...edits, [String(g.id)]: e.target.value })} /></label>
        <PendingButton pending={pending==='Sign door name locally'} pendingLabel={PENDING_SAVE} disabled={!!pending || !edits[String(g.id)]?.trim()} onClick={() => void action('Sign door name locally', async () => { await saveGateName(s, g, edits[String(g.id)]); setRevision(n => n + 1); })}>Save name</PendingButton>
        <PendingButton pending={pending===(g.active ? 'Close door' : 'Activate door')} pendingLabel={PENDING_WALLET} disabled={!!pending} onClick={() => void action(g.active ? 'Close door' : 'Activate door', () => s.call('setGateActive', [g.id, !g.active]))}>{g.active ? 'Close door' : 'Activate door'}</PendingButton></div>
      <p className="small">Accepts {g.typeCount === 0n ? 'all ticket types for this event' : 'selected ticket types only'}.</p>
      <p className="small muted">An empty allowlist accepts all types. Removing the last restriction restores all types; close the door to stop entry.</p>
      <fieldset disabled={!!pending}><legend>Ticket types allowed at this door</legend>{st.types.filter(t => t.eventId === eventId).map(t => <label className="check" key={String(t.id)}>
        <input type="checkbox" checked={g.acceptedTypeIds.includes(t.id)} onChange={e => {
          if (!e.target.checked && g.typeCount === 1n && !confirm('Removing the last restriction will allow every ticket type for this event. Continue?')) return;
          void action('Update door ticket rules', () => s.call('setGateType', [g.id, t.id, e.target.checked]));
        }} />{ttName(t.id)}{g.typeCount === 0n && ' (check to restrict to this type)'}</label>)}</fieldset>
      <p className="small muted">Staff must enable staff mode with their own wallet before assignment. Revocation is effective when confirmed on-chain.</p>
      <label>Add staff by public Staff ID<input spellCheck={false} autoComplete="off" maxLength={64} placeholder="64-character CloakTix account hash" value={inputs[String(g.id)] ?? ''} onChange={e => setInputs({ ...inputs, [String(g.id)]: e.target.value })} /></label>
      <PendingButton pending={pending==='Assign door staff'} pendingLabel={PENDING_WALLET} disabled={!!pending || !inputs[String(g.id)]?.trim()} onClick={() => void action('Assign door staff', async () => {
        const id = parseStaffId(inputs[String(g.id)] ?? '');
        const result = await s.call('addGateStaff', [g.id, Uint8Array.from(id.match(/../g) ?? [], byte => parseInt(byte, 16))]);
        setInputs({ ...inputs, [String(g.id)]: '' }); return result;
      })}>Add staff</PendingButton>
      <ul className="door-staff-list">{st.gateStaff.filter(staff => staff.gateId === g.id).map(staff => <li key={hexId(staff.staffId)}><span><code>{hexId(staff.staffId)}</code><small>{staff.active ? 'Authorized' : 'Revoked'}</small></span>
        <PendingButton pending={pending==='Revoke door staff'} pendingLabel={PENDING_WALLET} disabled={!!pending || !staff.active} onClick={() => void action('Revoke door staff', () => s.call('revokeGateStaff', [g.id, staff.staffId]))}>Revoke</PendingButton></li>)}</ul>
    </article>)}
    <DoorLabels s={s} gates={st.gates} onChange={() => setRevision(n => n + 1)} />
  </section>;
}
