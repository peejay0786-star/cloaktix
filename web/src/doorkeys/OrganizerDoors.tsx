/** EGG-40 organizer side of Organize event: relay state, live entries, settle banner, Door keys (spec 5, 6, 7, 9, 10). */
import { useState } from 'react';
import { Dialog } from '../Dialog';
import { DoorVerdict } from '../DoorVerdict';
import { PendingButton } from '../PendingButton';
import { Qr, qrPngDataUrl } from '../Qr';
import { cameraScanSupported, Scanner } from '../Scanner';
import { DoorKeyError, type OrganizerDoorApi, type PairingPreview, type WalletPhase } from './api';
import { useEgg40Api, usePolled } from './hooks';
import {
  DOOR_MODE_LABEL, SETTLE_DEADLINE_WARN_MS, defaultKeyWindow, doorsClosed, doorsOpen, keyWindowError, settledCount, settlementDone, splitKeys,
  type DoorKeyRow, type DoorSchedule, type RelayState, type ScanOutcome, type SettlementState,
} from './model';
import { CopyButton, RelayPill, WALLET_PHASE_HINT, WALLET_PHASE_LABEL, scanVerdictCopy, useLikelyPhone, useSecondTick } from './shared';
import { errorChainText, humanizeTxError } from '../txError';
import { SettleEntries } from './SettleEntries';
import { clockTime, dayTime, fromLocalInput, toLocalInput, untilLabel } from './time';

export type Run = <T>(label: string, action: () => Promise<T>) => Promise<T | undefined>;
const RELAY_POLL_MS = 5000, KEYS_POLL_MS = 10000;

export function EventDoorsPanel({ eventId, eventName = '', ticketNames = [], run, onSettle }: { eventId: bigint; eventName?: string; ticketNames?: string[]; run: Run; onSettle(): void }) {
  const api = useEgg40Api();
  if (api === undefined) return null;
  if (api === null) return <section className="card door-keys" aria-labelledby="door-keys-heading">
    <h2 id="door-keys-heading">Door keys</h2>
    <p className="note">Door keys, walletless check-in and settlement need the EGG-40 contract. They are not available for this event yet.</p>
  </section>;
  return <EventDoors api={api.organizer} eventId={eventId} eventName={eventName} ticketNames={ticketNames} run={run} onSettle={onSettle} />;
}

/** Full settlement screen; Organize event shows it in place of its usual sections. */
export function SettleEntriesPanel({ eventId, run, onBack }: { eventId: bigint; run: Run; onBack(): void }) {
  const api = useEgg40Api();
  if (!api) return null;
  return <SettleEntries api={api.organizer} eventId={eventId} run={run} onBack={onBack} />;
}

function EventDoors({ api, eventId, eventName, ticketNames, run, onSettle }: { api: OrganizerDoorApi; eventId: bigint; eventName: string; ticketNames: string[]; run: Run; onSettle(): void }) {
  const schedulePoll = usePolled(() => api.schedule(eventId), 60000, [api, eventId]);
  const schedule = schedulePoll.value;
  const relay = usePolled(() => api.relay(eventId), RELAY_POLL_MS, [api, eventId]);
  const now = api.now();
  const closed = doorsClosed(schedule ?? null, now);
  const settlement = usePolled(closed ? () => api.settlement(eventId) : null, RELAY_POLL_MS, [api, eventId, closed]).value;
  if (schedule === undefined) return null;
  return <>
    {relay.value && <RelayBanner api={api} eventId={eventId} relay={relay.value} run={run} onChange={relay.reload} />}
    {settlement && !settlementDone(settlement) && <SettleBanner settlement={settlement} now={now} onOpen={onSettle} />}
    {schedule && doorsOpen(schedule, now) && <DoorStats api={api} eventId={eventId} relay={relay.value} settlement={settlement} />}
    <DoorSetup api={api} eventId={eventId} eventName={eventName} ticketNames={ticketNames} schedule={schedule} run={run} onSaved={schedulePoll.reload} />
    <DoorKeys api={api} eventId={eventId} schedule={schedule} run={run} />
  </>;
}

function RelayBanner({ api, eventId, relay, run, onChange }: { api: OrganizerDoorApi; eventId: bigint; relay: RelayState; run: Run; onChange(): void }) {
  const [importing, setImporting] = useState<bigint | null>(null);
  const [planB, setPlanB] = useState(false);
  if (relay.status === 'online') return null;
  if (relay.status === 'syncing') return <section className="door-alert info" aria-labelledby="relay-sync-heading">
    <h2 id="relay-sync-heading" role="status">{relay.missed.length ? 'Relay back online. Syncing phones…' : 'All doors synced'}</h2>
    {relay.missed.map(m => <div className="door-alert-row" key={String(m.gateId)}>
      <p>{m.doorName} has {m.count} {m.count === 1 ? 'entry' : 'entries'} the relay missed. Import?</p>
      <PendingButton className="primary" pending={importing === m.gateId} pendingLabel="Importing…" disabled={importing !== null} onClick={async () => {
        setImporting(m.gateId);
        try { await run(`Import ${m.doorName} entries`, () => api.importMissed(eventId, m.gateId)); onChange(); } finally { setImporting(null); }
      }}>Import</PendingButton>
    </div>)}
  </section>;
  return <section className="door-alert danger" aria-labelledby="relay-offline-heading">
    <div className="door-alert-text">
      <h2 id="relay-offline-heading" role="alert">Relay offline: switch to direct check-in</h2>
      <p>Staff phones refuse first entries until the relay is back. Admit guests at the organizer desk with your wallet, one approval per guest. Each guest takes about 40 s.</p>
      {relay.lastCopyAt !== null && <p className="small">Last relay copy: {clockTime(relay.lastCopyAt)}</p>}
    </div>
    <button type="button" className="primary" onClick={() => setPlanB(true)}>Direct check-in (plan B)</button>
    {planB && <DirectCheckIn api={api} eventId={eventId} run={run} onClose={() => setPlanB(false)} />}
  </section>;
}

/** Readable text for any wallet-action failure, shown next to the button that failed (the page banner can sit behind a dialog). */
export function walletErrorText(e: unknown): string {
  if (e instanceof DoorKeyError) return e.message;
  const m = humanizeTxError(errorChainText(e)).trim();
  return m || 'Something went wrong before the wallet opened. Try again; if it repeats, send the text shown here.';
}
export const WALLET_BUSY_TEXT = 'Another wallet action is already in progress. Wait for it to finish, then try again.';

/**
 * Runs a wallet action through the page's run() (logs, page banner) and also reports its failure locally.
 * Returns the result, or undefined after calling onError with a message (never silently).
 */
export async function walletAction<T>(run: Run, label: string, f: () => Promise<T>, onError: (message: string) => void): Promise<T | undefined> {
  let ran = false; let failed = false;
  const r = await run(label, async () => {
    ran = true;
    try { return await f(); } catch (e) { failed = true; onError(walletErrorText(e)); throw e; }
  });
  if (!ran) { onError(WALLET_BUSY_TEXT); return undefined; }
  if (failed) return undefined;
  if (r === undefined) onError('The wallet action did not finish. Check the message at the top of the page, then try again.');
  return r;
}

/** Busy line under a wallet button: what is happening now and for how long. */
export function WalletProgress({ phase }: { phase: WalletPhase | null }) {
  const [since, setSince] = useState<{ phase: WalletPhase | null; at: number }>({ phase: null, at: 0 });
  if (since.phase !== phase) setSince({ phase, at: Date.now() });
  useSecondTick(!!phase);
  if (!phase) return null;
  const secs = Math.max(0, Math.floor((Date.now() - since.at) / 1000));
  return <p className="small muted wallet-progress" role="status" aria-live="polite">
    <span className="spin" aria-hidden="true" />{WALLET_PHASE_HINT[phase]} <span className="mono">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
  </p>;
}

/** Plan B (DESIGN-15): the organizer scans and admits on-chain with their own wallet. */
function DirectCheckIn({ api, eventId, run, onClose }: { api: OrganizerDoorApi; eventId: bigint; run: Run; onClose(): void }) {
  const [camera, setCamera] = useState(cameraScanSupported());
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<WalletPhase | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [failure, setFailure] = useState('');
  const admit = async (ticket: string) => {
    if (phase || !ticket.trim()) return;
    setCamera(false); setPhase('proving'); setFailure('');
    try { const r = await walletAction(run, 'Direct check-in (plan B)', () => api.directAdmit(eventId, ticket.trim(), setPhase), setFailure); if (r) { setOutcome(r); setCode(''); } }
    finally { setPhase(null); }
  };
  if (outcome) return <DoorVerdict {...scanVerdictCopy(outcome)} meta={outcome.kind === 'valid' ? 'Admitted on-chain (plan B)' : scanVerdictCopy(outcome).meta} doorLabel="Organizer desk" autoReturn={false} onNext={() => setOutcome(null)} />;
  if (camera) return <Scanner title="Plan B check-in" onCode={c => void admit(c)} onClose={() => setCamera(false)} onPaste={() => setCamera(false)} />;
  return <Dialog label="Direct check-in (plan B)" onClose={() => { if (!phase) onClose(); }}><div className="card">
    <h3>Direct check-in (plan B)</h3>
    <p className="muted">Each guest takes about 40 s: a proof, then one wallet approval. The chain refuses a ticket that was already admitted.</p>
    <label>Ticket code<textarea value={code} onChange={e => setCode(e.target.value)} rows={3} spellCheck={false} autoComplete="off" disabled={!!phase} /></label>
    <div className="row wrap">
      <PendingButton className="primary" pending={!!phase} pendingLabel={phase ? WALLET_PHASE_LABEL[phase] : undefined} disabled={!code.trim()} onClick={() => void admit(code)}>Admit with wallet</PendingButton>
      {cameraScanSupported() && <button type="button" disabled={!!phase} onClick={() => setCamera(true)}>Scan ticket</button>}
      <button type="button" className="ghost" disabled={!!phase} onClick={onClose}>Close</button>
    </div>
    <WalletProgress phase={phase} />
    {failure && !phase && <p className="warn" role="alert">{failure}</p>}
  </div></Dialog>;
}

function SettleBanner({ settlement, now, onOpen }: { settlement: SettlementState; now: number; onOpen(): void }) {
  const left = settlement.total - settledCount(settlement);
  const deadline = settlement.keyUntil !== null && settlement.keyUntil - now < SETTLE_DEADLINE_WARN_MS;
  return <section className={`door-alert ${deadline ? 'danger' : 'accent'}`} aria-labelledby="settle-banner-heading">
    <div className="door-alert-text">
      <h2 id="settle-banner-heading">{left} entries to record on-chain</h2>
      {deadline && settlement.keyUntil !== null
        ? <p role="alert"><b>Settle before {dayTime(settlement.keyUntil)}</b>. After that, the settlement key expires.</p>
        : <p>Doors are closed. Record the night's entries with your settlement key, 4 per wallet approval.</p>}
    </div>
    <button type="button" className="primary" onClick={onOpen}>Settle entries</button>
  </section>;
}

function DoorStats({ api, eventId, relay, settlement }: { api: OrganizerDoorApi; eventId: bigint; relay?: RelayState; settlement?: SettlementState }) {
  const rows = usePolled(() => api.stats(eventId), RELAY_POLL_MS, [api, eventId]).value ?? [];
  const total = rows.reduce((n, r) => n + r.entries, 0);
  const max = Math.max(1, ...rows.map(r => r.entries));
  return <section className="card door-stats" aria-labelledby="door-stats-heading">
    <div className="door-heading"><h2 id="door-stats-heading">Entries</h2>{relay && <RelayPill status={relay.status} />}</div>
    <p className="organizer-summary-stats" aria-live="polite">
      <span><b>{total}</b> entered</span>
      {settlement && <span>Recorded on-chain <b>{settledCount(settlement)}</b></span>}
    </p>
    <ul className="door-stats-list">{rows.map(r => <li key={String(r.gateId)}>
      <div className="door-stats-line"><span className="door-stats-name">{r.doorName}</span><span className="door-stats-count">{r.entries}</span></div>
      <div className="capbar" aria-hidden="true"><i style={{ width: `${(r.entries / max) * 100}%` }} /></div>
      <small className="muted">{r.lastEntryAt === null ? 'No entries yet' : `Last entry ${clockTime(r.lastEntryAt)}`}</small>
    </li>)}</ul>
    <p className="small muted">{relay?.status === 'offline' && relay.lastCopyAt !== null ? `Counts from the last relay copy (${clockTime(relay.lastCopyAt)}).` : 'Live from the relay. Updates every 5 seconds.'}</p>
  </section>;
}

function DoorKeys({ api, eventId, schedule, run }: { api: OrganizerDoorApi; eventId: bigint; schedule: DoorSchedule | null; run: Run }) {
  const keys = usePolled(() => api.keys(eventId), KEYS_POLL_MS, [api, eventId]);
  const mode = usePolled(() => api.doorMode(eventId), 60000, [api, eventId]);
  const [adding, setAdding] = useState(false);
  const [revoking, setRevoking] = useState<DoorKeyRow | null>(null);
  const [recentlyRevoked, setRecentlyRevoked] = useState<string[]>([]);
  const [showExpired, setShowExpired] = useState(false);
  const [creating, setCreating] = useState<WalletPhase | null>(null);
  const [settleError, setSettleError] = useState('');
  const phone = useLikelyPhone();
  const now = api.now();
  const rows = keys.value ?? [];
  const { active, expired } = splitKeys(rows, now);
  const greyed = rows.filter(r => r.revoked && recentlyRevoked.includes(r.keyId));
  const settlementKey = active.find(r => r.kind === 'settlement');
  const [showStaffQr, setShowStaffQr] = useState(false);
  const staffLink = staffDoorLink(location.origin, eventId, api.contract());

  return <section className="card door-keys" aria-labelledby="door-keys-heading">
    <div className="door-keys-head">
      <h2 id="door-keys-heading">Door keys</h2>
      <label className="door-mode">Door mode
        <select value={mode.value ?? 'walletless'} onChange={e => { if (e.target.value === 'walletless') void api.setDoorMode(eventId, 'walletless').then(mode.reload); }}>
          <option value="walletless">{DOOR_MODE_LABEL.walletless}</option>
          <option value="staff-wallet" disabled>{DOOR_MODE_LABEL['staff-wallet']} (later)</option>
        </select>
      </label>
      <button type="button" className="primary" disabled={!schedule} onClick={() => setAdding(true)}>Add door key</button>
    </div>
    {!schedule && <p className="note">Set the doors and door times above (Doors and door times) before adding door keys. Without staff phones, scan tickets from the Check-in tab on this device.</p>}
    {schedule && <p className="small muted">Doors {dayTime(schedule.doorsOpenAt)} to {dayTime(schedule.doorsCloseAt)} · {schedule.doors.length} doors</p>}

    {schedule && (mode.value ?? 'walletless') === 'walletless' && <div className="settlement-key">
      <h3>Settlement key</h3>
      {settlementKey
        ? <p><span className="tag ok">Settlement key ready</span> <span>until {dayTime(settlementKey.validUntil)}</span></p>
        : <>
          <p className="muted">After doors close, this device records all entries on-chain.</p>
          {phone && <p className="note">Settling is much faster on a computer.</p>}
          <PendingButton className="primary" pending={!!creating} pendingLabel={creating ? WALLET_PHASE_LABEL[creating] : undefined} onClick={async () => {
            setCreating('proving'); setSettleError('');
            try { await walletAction(run, 'Create settlement key', async () => { await api.createSettlementKey(eventId, setCreating); return true; }, setSettleError); keys.reload(); } finally { setCreating(null); }
          }}>Create settlement key on this device</PendingButton>
          <WalletProgress phase={creating} />
          {settleError && !creating && <p className="warn" role="alert">{settleError}</p>}
        </>}
    </div>}

    {schedule && <div className="door-staff-link">
      <p><b>Staff phones</b> <span className="muted">open this link to set up a door scanner. No wallet needed.</span></p>
      <div className="row wrap"><code>{staffLink}</code><CopyButton text={staffLink} label="Copy link" />
        <button type="button" aria-expanded={showStaffQr} onClick={() => setShowStaffQr(v => !v)}>{showStaffQr ? 'Hide QR' : 'Show QR'}</button></div>
      {showStaffQr && <StaffLinkQr link={staffLink} eventId={eventId} />}
    </div>}

    {active.length + greyed.length === 0
      ? <p className="muted">No active door keys. Add one for each staff phone.</p>
      : <div className="organizer-table-scroll"><table className="stats door-key-table">
        <caption className="sr-only">Active door keys</caption>
        <thead><tr><th scope="col">Door</th><th scope="col">Device</th><th scope="col">Expires</th><th scope="col">Entries</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {active.map(k => <KeyRow key={k.keyId} k={k} now={now} onRevoke={() => setRevoking(k)} />)}
          {greyed.map(k => <KeyRow key={k.keyId} k={k} now={now} />)}
        </tbody>
      </table></div>}
    {expired.length > 0 && <>
      <button type="button" className="link" aria-expanded={showExpired} onClick={() => setShowExpired(v => !v)}>{showExpired ? 'Hide expired' : `Show expired (${expired.length})`}</button>
      {showExpired && <ul className="door-expired-list">{expired.map(k => <li key={k.keyId}><span>{k.doorName}</span><span>{deviceLabel(k)}</span><span className="tag">Expired</span></li>)}</ul>}
    </>}

    {adding && schedule && <AddDoorKey api={api} eventId={eventId} schedule={schedule} run={run} onClose={() => setAdding(false)} onAdded={keys.reload} />}
    {revoking && <RevokeKey api={api} eventId={eventId} row={revoking} run={run} onClose={() => setRevoking(null)} onRevoked={() => {
      const id = revoking.keyId;
      setRecentlyRevoked(ids => [...ids, id]); keys.reload();
      setTimeout(() => setRecentlyRevoked(ids => ids.filter(x => x !== id)), 5000);
    }} />}
  </section>;
}

const deviceLabel = (k: DoorKeyRow) => (k.kind === 'settlement' ? 'Settlement key (this device)' : `Staff phone · ${k.fingerprint}`);

function KeyRow({ k, now, onRevoke }: { k: DoorKeyRow; now: number; onRevoke?: () => void }) {
  return <tr className={k.revoked ? 'is-revoked' : undefined}>
    <td data-label="Door">{k.doorName}</td>
    <td data-label="Device">{deviceLabel(k)}</td>
    <td data-label="Expires">{dayTime(k.validUntil)} <span className="muted">({untilLabel(k.validUntil, now)})</span></td>
    <td data-label="Entries">{k.kind === 'settlement' ? <span className="muted">All doors</span> : k.entries}</td>
    <td className="door-key-action">{k.revoked ? <span className="tag">Revoked</span> : <button type="button" onClick={onRevoke} aria-label={`Revoke ${k.doorName} key ${k.fingerprint}`}>Revoke</button>}</td>
  </tr>;
}

function RevokeKey({ api, eventId, row, run, onClose, onRevoked }: { api: OrganizerDoorApi; eventId: bigint; row: DoorKeyRow; run: Run; onClose(): void; onRevoked(): void }) {
  const [phase, setPhase] = useState<WalletPhase | null>(null);
  const [failure, setFailure] = useState('');
  return <Dialog label="Revoke door key" onClose={() => { if (!phase) onClose(); }}><div className="card">
    <h3>{row.kind === 'settlement' ? 'Revoke settlement key' : `Revoke ${row.doorName} key`}</h3>
    <p className="muted">{row.kind === 'settlement'
      ? 'This device stops recording entries on-chain. You can create a new settlement key.'
      : 'Revoke this door key? The phone stops scanning within a minute. Its entries are kept and will still be settled.'}</p>
    <p className="fingerprint-inline">Fingerprint <b>{row.fingerprint}</b></p>
    <div className="row wrap">
      <PendingButton className="primary" pending={!!phase} pendingLabel={phase ? WALLET_PHASE_LABEL[phase] : undefined} onClick={async () => {
        setPhase('proving'); setFailure('');
        try { const done = await walletAction(run, `Revoke ${row.doorName} key`, async () => { await api.revokeDoorKey(eventId, row.keyId, setPhase); return true; }, setFailure); if (done) { onRevoked(); onClose(); } }
        finally { setPhase(null); }
      }}>Revoke with wallet</PendingButton>
      <button type="button" className="ghost" disabled={!!phase} onClick={onClose}>Cancel</button>
    </div>
    <WalletProgress phase={phase} />
    {failure && !phase && <p className="warn" role="alert">{failure}</p>}
  </div></Dialog>;
}

/** Doors and door times. Organizer-signed relay write; door numbers in use stay fixed. */
function DoorSetup({ api, eventId, eventName, ticketNames, schedule, run, onSaved }: { api: OrganizerDoorApi; eventId: bigint; eventName: string; ticketNames: string[]; schedule: DoorSchedule | null; run: Run; onSaved(): void }) {
  const [open, setOpen] = useState(false);
  return <section className="card door-setup" aria-labelledby="door-setup-heading">
    <div className="door-keys-head">
      <h2 id="door-setup-heading">Doors and door times</h2>
      <button type="button" className={schedule ? undefined : 'primary'} onClick={() => setOpen(true)}>{schedule ? 'Edit doors' : 'Set doors and door times'}</button>
    </div>
    {schedule
      ? <ul className="door-setup-list">{schedule.doors.map(d => <li key={String(d.gateId)}><b>{d.name}</b> <span className="muted">· {d.ticketTypes.length ? d.ticketTypes.join(', ') : 'all ticket types'}</span></li>)}</ul>
      : <p className="muted">Name each door and when doors open and close. Staff phones pick their door from this list.</p>}
    {schedule && <p className="small muted">Doors {dayTime(schedule.doorsOpenAt)} to {dayTime(schedule.doorsCloseAt)}</p>}
    {open && <DoorSetupForm api={api} eventId={eventId} eventName={eventName} ticketNames={ticketNames} schedule={schedule} run={run} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); onSaved(); }} />}
  </section>;
}

type DoorRow = { gateId?: string; name: string; types: string[] };
export function doorSetupError(rows: DoorRow[], openAt: number, closeAt: number): string | null {
  if (!Number.isFinite(openAt) || !Number.isFinite(closeAt)) return 'Choose when doors open and close.';
  if (closeAt <= openAt) return 'Doors close must be after doors open.';
  if (closeAt - openAt > 7 * 24 * 3_600_000) return 'Doors can stay open 7 days at most.';
  const named = rows.filter(r => r.name.trim());
  if (!named.length) return 'Add at least one door.';
  if (named.length > 20) return 'Add 20 doors at most.';
  if (named.some(r => r.name.trim().length > 60)) return 'Door names can be 60 characters at most.';
  const names = named.map(r => r.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return 'Each door needs a different name.';
  return null;
}

function DoorSetupForm({ api, eventId, eventName, ticketNames, schedule, run, onClose, onSaved }: { api: OrganizerDoorApi; eventId: bigint; eventName: string; ticketNames: string[]; schedule: DoorSchedule | null; run: Run; onClose(): void; onSaved(): void }) {
  const start = schedule?.doorsOpenAt ?? (() => { const d = new Date(api.now() + 24 * 3_600_000); d.setMinutes(0, 0, 0); return d.getTime(); })();
  const [openAt, setOpenAt] = useState(toLocalInput(start));
  const [closeAt, setCloseAt] = useState(toLocalInput(schedule?.doorsCloseAt ?? start + 6 * 3_600_000));
  const [rows, setRows] = useState<DoorRow[]>(schedule?.doors.length
    ? schedule.doors.map(d => ({ gateId: String(d.gateId), name: d.name, types: d.ticketTypes }))
    : [{ name: 'Main door', types: [] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const problem = doorSetupError(rows, fromLocalInput(openAt), fromLocalInput(closeAt));
  const set = (i: number, patch: Partial<DoorRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    setSaving(true); setError('');
    try {
      const ok = await run('Save doors', () => api.setSchedule(eventId, {
        eventName, doorsOpenAt: fromLocalInput(openAt), doorsCloseAt: fromLocalInput(closeAt),
        doors: rows.filter(r => r.name.trim()).map(r => ({ gateId: r.gateId, name: r.name.trim(), ticketTypes: r.types })),
      }).then(() => true));
      if (ok) onSaved(); else setError('Doors were not saved. Nothing changed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Doors were not saved.'); }
    finally { setSaving(false); }
  };
  return <Dialog label="Doors and door times" onClose={() => { if (!saving) onClose(); }}><div className="card door-setup-form">
    <h3>Doors and door times</h3>
    <div className="door-window">
      <label>Doors open<input type="datetime-local" value={openAt} onChange={e => setOpenAt(e.target.value)} /></label>
      <label>Doors close<input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} /></label>
    </div>
    {rows.map((r, i) => <div className="row wrap door-setup-row" key={r.gateId ?? `new-${i}`}>
      <label>Door name<input value={r.name} maxLength={60} onChange={e => set(i, { name: e.target.value })} /></label>
      {ticketNames.length > 1 && <fieldset className="door-setup-types"><legend>Accepts</legend>
        <label className="check"><input type="checkbox" checked={!r.types.length} onChange={() => set(i, { types: [] })} /> All ticket types</label>
        {ticketNames.map(t => <label className="check" key={t}><input type="checkbox" checked={r.types.includes(t)} onChange={e => set(i, { types: e.target.checked ? [...r.types, t] : r.types.filter(x => x !== t) })} /> {t}</label>)}
      </fieldset>}
      {!r.gateId && rows.length > 1 && <button type="button" className="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>}
    </div>)}
    {rows.length < 20 && <button type="button" className="ghost" onClick={() => setRows([...rows, { name: '', types: [] }])}>Add a door</button>}
    <p className="small muted">A staff phone at a door only admits the ticket types that door accepts. Saved doors keep their number, so they cannot be removed here.</p>
    {problem && <p className="warn" role="alert">{problem}</p>}
    {error && <p className="warn" role="alert">{error}</p>}
    <div className="row wrap">
      <PendingButton className="primary" pending={saving} pendingLabel="Saving doors…" disabled={!!problem} onClick={() => void save()}>Save doors</PendingButton>
      <button type="button" className="ghost" disabled={saving} onClick={onClose}>Cancel</button>
    </div>
    <p className="small muted">Saving signs a message with your organizer key. No wallet transaction, no fee.</p>
  </div></Dialog>;
}
type AddStep = { step: 'window' } | { step: 'code' } | { step: 'confirm'; preview: PairingPreview } | { step: 'done'; preview: PairingPreview };

/** O1 to O4. The wallet opens only after the fingerprints match. */
function AddDoorKey({ api, eventId, schedule, run, onClose, onAdded }: { api: OrganizerDoorApi; eventId: bigint; schedule: DoorSchedule; run: Run; onClose(): void; onAdded(): void }) {
  const initial = defaultKeyWindow(schedule);
  const [gateId, setGateId] = useState(String(schedule.doors[0]?.gateId ?? ''));
  const [from, setFrom] = useState(toLocalInput(initial.from));
  const [until, setUntil] = useState(toLocalInput(initial.until));
  const [state, setState] = useState<AddStep>({ step: 'window' });
  const [camera, setCamera] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [phase, setPhase] = useState<WalletPhase | null>(null);
  const keyWindow = { from: fromLocalInput(from), until: fromLocalInput(until) };
  const windowError = keyWindowError(keyWindow.from, keyWindow.until, api.now());
  const door = schedule.doors.find(d => String(d.gateId) === gateId);

  const check = async (text: string) => {
    setCamera(false); setChecking(true); setError('');
    try {
      const preview = await api.previewPairing(eventId, text, keyWindow);
      if (String(preview.request.gateId) !== gateId) throw new DoorKeyError(`This code is for ${preview.doorName}. Choose ${preview.doorName} above or ask the staff phone to set up again.`);
      setState({ step: 'confirm', preview });
    } catch (e) { setError(e instanceof DoorKeyError ? e.message : 'Code not recognized.'); }
    finally { setChecking(false); }
  };
  const busy = checking || !!phase;
  const close = () => { if (!busy) onClose(); };

  // The camera replaces the dialog (both portal to <body>; keeping them apart keeps Escape and focus scoped).
  if (camera) return <Scanner title="Scan staff phone" onCode={c => void check(c)} onClose={() => setCamera(false)} onPaste={() => setCamera(false)} />;
  return <Dialog label="Add door key" onClose={close}><div className="card add-door-key">
    {state.step === 'window' && <>
      <h3>Add door key</h3>
      <label>Door<select value={gateId} onChange={e => setGateId(e.target.value)}>{schedule.doors.map(d => <option key={String(d.gateId)} value={String(d.gateId)}>{d.name}</option>)}</select></label>
      {door && <p className="small muted door-types">Ticket types: {door.ticketTypes.length ? door.ticketTypes.join(', ') : 'all'}</p>}
      <div className="door-window">
        <label>Valid from<input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)} aria-invalid={!!windowError} aria-describedby="door-window-help" /></label>
        <label>Valid until<input type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} aria-invalid={!!windowError} aria-describedby="door-window-help" /></label>
      </div>
      <p id="door-window-help" className="small muted">Maximum 48 hours. Includes time to settle entries after doors close.</p>
      {windowError && <p className="warn" role="alert">{windowError}</p>}
      <div className="row wrap">
        <button type="button" className="primary" disabled={!!windowError || !door} onClick={() => { setState({ step: 'code' }); setCamera(cameraScanSupported()); }}>Scan staff phone</button>
        <button type="button" className="ghost" onClick={close}>Cancel</button>
      </div>
    </>}
    {state.step === 'code' && <>
      <h3>Scan staff phone</h3>
      <p className="muted">On the staff phone, open the staff link and choose {door?.name}. Then scan the code it shows.</p>
      <div className="row wrap">
        {cameraScanSupported() && <button type="button" className="primary" disabled={busy} onClick={() => setCamera(true)}>Scan the code on the staff phone</button>}
      </div>
      <label>Paste code instead<textarea rows={3} value={code} spellCheck={false} autoComplete="off" placeholder="cloaktix:pair:v1?…" onChange={e => { setCode(e.target.value); setError(''); }} aria-invalid={!!error} disabled={busy} /></label>
      {error && <p className="warn" role="alert">{error}</p>}
      <div className="row wrap">
        <PendingButton className={cameraScanSupported() ? undefined : 'primary'} pending={checking} pendingLabel="Checking code…" disabled={!code.trim()} onClick={() => void check(code)}>Check code</PendingButton>
        <button type="button" className="ghost" disabled={busy} onClick={() => setState({ step: 'window' })}>Back</button>
      </div>
    </>}
    {state.step === 'confirm' && <>
      <h3>Confirm door key</h3>
      <p>{state.preview.doorName} · until {dayTime(state.preview.validUntil)}</p>
      <p className="fingerprint-label">Fingerprint</p>
      <p className="fingerprint-big" aria-label={`Fingerprint ${state.preview.fingerprint.split('').join(' ')}`}>{state.preview.fingerprint}</p>
      <p><b>Does the staff phone show the same fingerprint?</b></p>
      <p className="small muted">If they differ, cancel. Never approve a code you did not scan from your own staff phone.</p>
      <div className="row wrap">
        <PendingButton className="primary" pending={!!phase} pendingLabel={phase ? WALLET_PHASE_LABEL[phase] : undefined} onClick={async () => {
          const preview = state.preview;
          setPhase('proving'); setError('');
          try { const done = await walletAction(run, `Add ${preview.doorName} key`, async () => { await api.authorizeDoorKey(preview, setPhase); return true; }, setError); if (done) { onAdded(); setState({ step: 'done', preview }); } }
          finally { setPhase(null); }
        }}>Yes, approve with wallet</PendingButton>
        <button type="button" className="ghost" disabled={!!phase} onClick={close}>No, cancel</button>
      </div>
      <WalletProgress phase={phase} />
      {error && !phase && <p className="warn" role="alert">{error}</p>}
      {!phase && !error && <p className="small muted">After you click, this computer builds a proof first (usually under a minute). 1AM asks for approval after that.</p>}
    </>}
    {state.step === 'done' && <>
      <h3>Door key added</h3>
      <p>Door key added. The staff phone will unlock in a few seconds.</p>
      <p className="small muted">{state.preview.doorName} · until {dayTime(state.preview.validUntil)} · Fingerprint {state.preview.fingerprint}</p>
      <button type="button" className="primary wide" onClick={onClose}>Done</button>
    </>}
  </div></Dialog>;
}

/** Public staff setup link: event id and contract address only. No door key, secret or token. */
export function staffDoorLink(origin: string, eventId: bigint, contract: string): string {
  return `${origin}/door?${new URLSearchParams({ event: String(eventId), contract })}`;
}

/** QR of the public staff link only. It never carries a door key or secret. */
export function StaffLinkQr({ link, eventId }: { link: string; eventId: bigint }) {
  return <figure className="staff-link-qr">
    <Qr text={link} size={220} label="QR code of the staff phone link" />
    <figcaption className="small muted">Scan with the staff phone camera</figcaption>
    <button type="button" onClick={() => {
      const url = qrPngDataUrl(link); if (!url) return;
      const a = document.createElement('a'); a.href = url; a.download = `cloaktix-staff-link-event-${eventId}.png`; a.click();
    }}>Download QR</button>
  </figure>;
}
