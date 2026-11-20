import { useEffect, useRef, useState } from 'react';
import type { Session } from '../midnight/types';
import type { ContractState } from '../midnight/viewTypes';
import type { AdmitVerdict } from '../midnight/session-v2';
import type { InstantAdmitResult } from '../midnight/instantAdmit';
import { accessibleDoors } from '../midnight/multiGate';
import { cameraScanSupported, Scanner } from '../Scanner';
import { DoorVerdict } from '../DoorVerdict';
import { doorVerdictCopy } from '../mapDoorVerdict';
import { PendingButton } from '../PendingButton';
import { AdmitQueueBar, sessionAdmitSubmitter, useAdmitQueue, useAutoCommit } from '../AdmitQueue';
import { instantAdmit } from '../midnight/instantAdmit';
import { getGateAdmitStore } from '../midnight/gateAdmitStore';
import { DoorLabels, StaffIdentity, useDoorNames, type StateV4 } from './DoorsStaff';
export function GateV4({ s, st, evName, ttName }: { s: Session; st: ContractState | null; evName(s: Session, id: bigint): string; ttName(s: Session, id: bigint): string }) {
  const [current, setCurrent] = useState<StateV4 | null>(st?.schemaVersion === 4 ? st : null);
  const [selected, setSelected] = useState(''); const [code, setCode] = useState('');
  const [verdict, setVerdict] = useState<InstantAdmitResult | AdmitVerdict | null>(null);
  const [busy, setBusy] = useState(false); const scanLock = useRef(false);
  const [camera, setCamera] = useState(false); const [online, setOnline] = useState(false);
  const [revision, setRevision] = useState(0); const [camMsg, setCamMsg] = useState<string | null>(null);
  const queue = useAdmitQueue(s.contract);
  const generation = useRef(0);
  useEffect(() => {
    let alive = true; let refreshing = false;
    const refresh = async () => {
      if (refreshing) return; refreshing = true;
      const requestGeneration = generation.current;
      try {
        const state = await s.state();
        if (alive && requestGeneration === generation.current) {
          setOnline(state?.schemaVersion === 4);
          setCurrent(state?.schemaVersion === 4 ? state : null);
        }
      } catch { if (alive) setOnline(false); }
      finally { refreshing = false; }
    };
    void refresh(); const timer = setInterval(() => void refresh(), 4000);
    return () => { alive = false; clearInterval(timer); };
  }, [s]);
  const gates = current?.gates ?? [];
  const label = useDoorNames(s, gates, revision);
  const doors = current ? accessibleDoors(current) : [];
  useEffect(() => { if (!selected && doors.length) setSelected(String(doors[0].id)); }, [selected, doors]);
  // Never fall back to a different door after a selected door was revoked.
  const chosen = selected || (doors.length > 0 ? String(doors[0].id) : '');
  const door = doors.find(g => String(g.id) === chosen);
  const verify = async (text = code) => {
    if (scanLock.current || !door) return;
    scanLock.current = true; setBusy(true); setVerdict(null); generation.current += 1;
    try {
      if (!s.contract) throw new Error('Select an event contract.');
      const result = await instantAdmit({
        store: getGateAdmitStore(),
        networkId: s.networkId,
        contract: s.contract,
        schema: 4,
        text,
        state: current,
        online,
        gateId: door.id,
        doorLabel: label(door.id),
      });
      setVerdict(result); setCode('');
    } catch { setVerdict({ ok: false, reason: 'Online confirmation unavailable. No offline first admission is permitted.' }); }
    finally { generation.current += 1; scanLock.current = false; setBusy(false); }
  };
  const flushQueue = () => { void queue.commit(sessionAdmitSubmitter((circuit, args) => s.call(circuit, args))); };
  useAutoCommit(queue.shouldAuto && !queue.committing, flushQueue);
  return <><h2>Check-in</h2><StaffIdentity s={s} canEnroll={!!current && !current.staffOnly && !current.events.some(e => e.mine)} />
    <p className="note">Schema 4 · local implementation, not live. No offline first admission: the door must read current chain state. After that check, the ticket is reserved in a shared used-list and the on-chain <code>admit</code> is recorded later in a batch. A pending recording is not yet the durable chain record.</p>
    <section className="card gate multigate-checkin"><div className="door-heading"><h3>{door ? label(door.id) : 'Your assigned doors'}</h3><span className="tag">{online ? 'State refresh · every 4 s' : 'No fresh chain state'}</span></div>
      {(doors.length > 1 || (!!chosen && !door && doors.length > 0)) ? <label>Door<select disabled={busy} value={chosen} onChange={e => { setSelected(e.target.value); setVerdict(null); }}>{!door && <option value={chosen}>Selected door no longer authorized</option>}{doors.map(g => <option value={String(g.id)} key={String(g.id)}>{label(g.id)}: {evName(s, g.eventId)}</option>)}</select></label>
        : door && <p className="door-locked">{door.mine ? 'Organizer door' : 'Assigned door · locked'} · {evName(s, door.eventId)}</p>}
      {!door && <p role="status" className="warn">No authorized active door selected. Ask the organizer to assign your Staff ID, or select another assigned door.</p>}
      {door && <><p><span className="count">{door.admittedCount} admitted</span> <span className="small muted">{online ? 'From chain records, not this device' : 'Last known count, connection lost'}</span></p>
        <p className="small muted">Accepts {door.typeCount === 0n ? 'all ticket types for this event' : door.acceptedTypeIds.map(id => ttName(s, id)).join(', ')}.</p></>}
      <p className="muted">Scan a <code>cloaktix:admit:v2</code> code. Use your own 1AM wallet to record queued entries. If the camera is unavailable, paste the ticket code.</p>
      <label>Ticket code<input autoComplete="off" spellCheck={false} type="password" placeholder="Paste ticket code" value={code} onChange={e => setCode(e.target.value)} disabled={busy} /></label>
      <div className="row"><PendingButton className="primary" pending={busy} pendingLabel="Checking…" disabled={busy || !door || !code} onClick={() => void verify()}>Admit</PendingButton><button disabled={busy || !door} onClick={() => { if (cameraScanSupported()) { setCamera(true); setCamMsg(null); } else setCamMsg('Camera scanning is not available in this browser. Paste the code instead.'); }}>Scan</button></div>
      {camMsg && <p className="warn small">{camMsg}</p>}
      {camera && <Scanner title={door ? evName(s, door.eventId) : 'Check-in'} doorLabel={door ? label(door.id) : undefined} admittedCount={door ? Number(door.admittedCount) : undefined} pendingCount={queue.pending} onClose={() => setCamera(false)} onPaste={() => { setCamera(false); setCamMsg('Paste the ticket code in the field above.'); }} onCode={text => { setCamera(false); void verify(text); }} />}
      {verdict && (() => { const v = doorVerdictCopy({ ok: verdict.ok, reason: verdict.ok ? undefined : verdict.reason, typeName: verdict.ok ? ttName(s, verdict.typeId) : undefined, meta: verdict.ok ? `serial ${String(verdict.serial)}` : '', firstAdmittedAt: !verdict.ok && 'firstAdmittedAt' in verdict ? verdict.firstAdmittedAt : undefined, firstAdmittedDoor: !verdict.ok && 'firstAdmittedDoor' in verdict ? verdict.firstAdmittedDoor : undefined, recordingPending: !!verdict.ok && 'recordingPending' in verdict && !!verdict.recordingPending }); return <DoorVerdict {...v} doorLabel={door ? label(door.id) : undefined} onNext={() => setVerdict(null)} />; })()}
    <AdmitQueueBar pending={queue.pending} committing={queue.committing} report={queue.report} failedCount={queue.items.filter(item => item.lastError).length} onCommit={flushQueue} />
    </section>
    <DoorLabels s={s} gates={gates} onChange={() => setRevision(n => n + 1)} />
  </>;
}
