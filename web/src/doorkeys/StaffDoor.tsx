/**
 * Walletless staff phone (DESIGN-18, spec 2, 3, 9): choose a door, pair with the organizer, scan.
 * Route: /door?event=<id>&contract=<hex>. No wallet, no transaction, no wallet prompt on this screen.
 * The door secret never appears here: StaffKey only carries the public pairing values.
 */
import { useEffect, useState } from 'react';
import { DoorVerdict } from '../DoorVerdict';
import { PendingButton } from '../PendingButton';
import { Qr } from '../Qr';
import { cameraScanSupported, Scanner } from '../Scanner';
import type { StaffDoorApi, StaffKey } from './api';
import { useEgg40Api, usePolled } from './hooks';
import { APPROVAL_POLL_MS, APPROVAL_SLOW_MS, KEY_EXPIRING_SOON_MS, type DoorSchedule, type RelayState, type ScanOutcome } from './model';
import { CopyButton, FullScreen, RelayPill, scanVerdictCopy, useSecondTick } from './shared';
import { clockTime, dayTime, duration } from './time';

function eventFromLocation(): bigint | null {
  const raw = new URLSearchParams(location.search).get('event');
  return raw && /^[1-9]\d{0,19}$/.test(raw) ? BigInt(raw) : null;
}

export function StaffDoorApp() {
  const api = useEgg40Api();
  const eventId = eventFromLocation();
  return <div className="app staff-door">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="top">
      <a className="brand" href="/"><img src="/brand/cloaktix_lockup_transparent_on-dark.svg" alt="CloakTix" /></a>
      <div className="right"><span className="tag">Door scanner</span></div>
    </header>
    <main id="main">
      {api === undefined ? <p role="status">Loading…</p>
        : api === null ? <section className="card empty"><h3>Door scanner not available yet</h3><p className="muted">Walletless door scanning needs the EGG-40 contract and the CloakTix relay. Use Check-in in the organizer space for now.</p></section>
          : eventId === null ? <section className="card empty"><h3>Open the staff link</h3><p className="muted">Ask the organizer for the staff link from Organize event › Door keys.</p></section>
            : <StaffDoor api={api.staff} eventId={eventId} />}
    </main>
  </div>;
}

function StaffDoor({ api, eventId }: { api: StaffDoorApi; eventId: bigint }) {
  const schedule = usePolled(() => api.schedule(eventId), 60000, [api, eventId]).value;
  const keyQuery = usePolled(() => api.currentKey(eventId), 60000, [api, eventId]);
  const key = keyQuery.value;
  if (schedule === undefined || key === undefined) return <p role="status">Loading door…</p>;
  if (schedule === null) return <section className="card empty"><h3>No doors for this event</h3><p className="muted">The organizer has not set up doors for this event yet.</p></section>;
  if (key === null) return <ChooseDoor api={api} schedule={schedule} onCreated={keyQuery.reload} />;
  return <PairedDoor api={api} schedule={schedule} staffKey={key} onDeleted={keyQuery.reload} />;
}

/** S1 */
function ChooseDoor({ api, schedule, onCreated }: { api: StaffDoorApi; schedule: DoorSchedule; onCreated(): void }) {
  const [gateId, setGateId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  return <section className="staff-setup" aria-labelledby="staff-setup-heading">
    <p className="kicker">{schedule.eventName}</p>
    <h1 id="staff-setup-heading">Set up this phone as a door scanner</h1>
    <fieldset className="door-choices">
      <legend>Choose your door</legend>
      {schedule.doors.map(d => <label key={String(d.gateId)} className={`door-choice${gateId === String(d.gateId) ? ' on' : ''}`}>
        <input type="radio" name="door" value={String(d.gateId)} checked={gateId === String(d.gateId)} onChange={() => setGateId(String(d.gateId))} />
        <span><b>{d.name}</b><small>{d.ticketTypes.join(', ')}</small></span>
      </label>)}
    </fieldset>
    <p className="note">This phone will create its own door key. It never leaves this phone.</p>
    {error && <p className="warn" role="alert">{error}</p>}
    <PendingButton className="primary big wide" pending={creating} pendingLabel="Creating door key…" disabled={!gateId} onClick={async () => {
      setCreating(true); setError('');
      try { await api.createKey(schedule.eventId, BigInt(gateId)); onCreated(); }
      catch { setError('Could not create a door key on this phone. Check that the browser allows secure storage, then try again.'); }
      finally { setCreating(false); }
    }}>Use this door</PendingButton>
  </section>;
}

function PairedDoor({ api, schedule, staffKey, onDeleted }: { api: StaffDoorApi; schedule: DoorSchedule; staffKey: StaffKey; onDeleted(): void }) {
  const status = usePolled(() => api.keyState(staffKey), APPROVAL_POLL_MS, [api, staffKey.request.keyId]).value;
  const relay = usePolled(() => api.relay(schedule.eventId), 5000, [api, schedule.eventId]).value;
  const [started, setStarted] = useState(false);
  const remove = async () => { await api.deleteKey(staffKey); onDeleted(); };
  if (!status) return <p role="status">Checking door key…</p>;
  if (status.state === 'pending') return <WaitingApproval api={api} staffKey={staffKey} onCancel={remove} />;
  if (status.state === 'expired') return <LockedKey title="This door key has expired" text="Ask the organizer for a new key." action="Set up again" onAction={remove} />;
  if (status.state === 'revoked') return <LockedKey title="This door key was revoked by the organizer" text="This phone can no longer scan for this event." action="Delete key from this phone" onAction={remove} />;
  if (!started) return <section className="card staff-approved" aria-labelledby="staff-approved-heading">
    <span className="staff-approved-mark" aria-hidden="true">✓</span>
    <h1 id="staff-approved-heading">Approved for {staffKey.doorName} · {status.validFrom && status.validFrom > api.now() ? <>from {dayTime(status.validFrom)} </> : null}until {dayTime(status.validUntil)}</h1>
    {status.validFrom && status.validFrom > api.now()
      ? <p className="note" role="status">This key starts at {dayTime(status.validFrom)}. Before then a scan only checks the ticket and records nothing.</p>
      : null}
    <p className="muted">No wallet needed on this phone.</p>
    <button type="button" className="primary big wide" onClick={() => setStarted(true)}>Start scanning</button>
  </section>;
  return <DoorScanner api={api} staffKey={staffKey} validUntil={status.validUntil} validFrom={status.validFrom} relay={relay} onDelete={remove} />;
}

/** S2: full-screen pairing QR, portaled out of any backdrop-filter container. */
function WaitingApproval({ api, staffKey, onCancel }: { api: StaffDoorApi; staffKey: StaffKey; onCancel(): void }) {
  useSecondTick();
  const slow = api.now() - staffKey.createdAt >= APPROVAL_SLOW_MS;
  const [confirmCancel, setConfirmCancel] = useState(false);
  return <FullScreen label="Waiting for organizer approval" className="pair-screen">
    <div className="pair-inner">
      <h1>Waiting for organizer approval</h1>
      <p className="muted">{staffKey.doorName}. Show this code to the organizer.</p>
      <div className="pair-qr"><Qr text={staffKey.code} size={260} /></div>
      <p className="pair-fingerprint">Fingerprint <b>{staffKey.fingerprint}</b></p>
      <details className="pair-fallback">
        <summary>Can't scan? Copy code</summary>
        <code className="pair-code">{staffKey.code}</code>
        <CopyButton text={staffKey.code} />
      </details>
      <p className="pair-status" role="status" aria-live="polite"><span className="spin" aria-hidden="true" />Checking for approval…</p>
      {slow && <p className="note">Still waiting. Ask the organizer to scan this code in Organize event › Door keys.</p>}
      {confirmCancel
        ? <div className="row wrap pair-cancel"><span>Delete this door key?</span><button type="button" onClick={onCancel}>Delete key</button><button type="button" className="ghost" onClick={() => setConfirmCancel(false)}>Keep waiting</button></div>
        : <button type="button" className="link" onClick={() => setConfirmCancel(true)}>Cancel and delete this key</button>}
    </div>
  </FullScreen>;
}

function LockedKey({ title, text, action, onAction }: { title: string; text: string; action: string; onAction(): void }) {
  return <FullScreen label={title} className="key-locked">
    <div className="pair-inner">
      <span className="key-locked-mark" aria-hidden="true">!</span>
      <h1>{title}</h1>
      <p className="muted">{text}</p>
      <button type="button" className="primary big wide" onClick={onAction}>{action}</button>
    </div>
  </FullScreen>;
}

function DoorScanner({ api, staffKey, validUntil, validFrom, relay, onDelete }: { api: StaffDoorApi; staffKey: StaffKey; validUntil: number; validFrom?: number; relay?: RelayState; onDelete(): void }) {
  useSecondTick();
  const [camera, setCamera] = useState(false);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const local = usePolled(() => api.localEntries(staffKey), 5000, [api, staffKey.request.keyId, outcome]).value;
  const left = validUntil - api.now();
  const online = relay?.status === 'online';
  useEffect(() => { if (outcome) setCamera(false); }, [outcome]);
  const scan = async (ticket: string) => {
    if (checking || !ticket.trim()) return;
    setChecking(true);
    try { setOutcome(await api.scan(staffKey, ticket)); } catch { setOutcome({ kind: 'relay-offline' }); } finally { setChecking(false); setCode(''); }
  };
  if (outcome) return <DoorVerdict {...scanVerdictCopy(outcome)} doorLabel={staffKey.doorName} onNext={() => { setOutcome(null); if (cameraScanSupported()) setCamera(true); }} />;
  if (camera) return <Scanner title={staffKey.doorName} doorLabel={online ? 'Relay online' : 'Relay offline'} admittedCount={local?.count} onCode={c => void scan(c)} onClose={() => setCamera(false)} onPaste={() => setCamera(false)} />;
  return <section className="door-scanner" aria-labelledby="door-scanner-heading">
    <div className={`door-statusbar${online ? '' : ' offline'}`}>
      <span><b>{staffKey.doorName}</b></span>
      <span>{validFrom && validFrom > api.now() ? <>Key starts {dayTime(validFrom)}</> : <>Key expires in {duration(left)}</>}</span>
      {relay && <RelayPill status={relay.status} />}
    </div>
    {left <= KEY_EXPIRING_SOON_MS && <p className="door-alert warning" role="status">Key expires at {clockTime(validUntil)}</p>}
    <h1 id="door-scanner-heading" className="sr-only">Door scanner</h1>
    {!online && <section className="door-alert danger door-offline" role="alert">
      <h2>Can't confirm entry right now</h2>
      <p>Send guests to the organizer desk.</p>
      <p className="small">Relay offline. Tickets already on this phone's list still show Already used.</p>
    </section>}
    <div className="card door-scan-card">
      {cameraScanSupported() && <button type="button" className="primary big wide" onClick={() => setCamera(true)}>Scan ticket</button>}
      <label>Ticket code<textarea rows={2} value={code} spellCheck={false} autoComplete="off" onChange={e => setCode(e.target.value)} /></label>
      <PendingButton className={cameraScanSupported() ? 'wide' : 'primary big wide'} pending={checking} pendingLabel="Checking…" disabled={!code.trim()} onClick={() => void scan(code)}>Check ticket</PendingButton>
      <p className="small muted">No wallet on this phone. Entries go to the relay; the organizer records them on-chain after doors close.</p>
    </div>
    <details className="card door-menu">
      <summary>Phone menu</summary>
      <dl className="door-menu-list">
        <div><dt>Entries on this phone</dt><dd>{local ? local.count : '…'}</dd></div>
        <div><dt>Last sent to the relay</dt><dd>{local?.lastSentAt ? clockTime(local.lastSentAt) : 'Not yet'}</dd></div>
        <div><dt>Fingerprint</dt><dd>{staffKey.fingerprint}</dd></div>
      </dl>
      {confirmDelete
        ? <div className="row wrap"><span>Delete the door key from this phone? It stops scanning.</span><button type="button" onClick={onDelete}>Delete key</button><button type="button" className="ghost" onClick={() => setConfirmDelete(false)}>Keep key</button></div>
        : <button type="button" onClick={() => setConfirmDelete(true)}>Delete door key</button>}
    </details>
  </section>;
}
