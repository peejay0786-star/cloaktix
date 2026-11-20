/** Settle entries after doors close (DESIGN-18, spec 8): admitByDoor4 batches from the organizer's settlement key. */
import { useEffect, useRef, useState } from 'react';
import { PendingButton } from '../PendingButton';
import type { OrganizerDoorApi } from './api';
import type { Run } from './OrganizerDoors';
import {
  SETTLE_BATCH_SIZE, SETTLE_DEADLINE_WARN_MS, SETTLE_FAILURE_TEXT, approvalsLeft, batchesTotal, currentBatch, needsAttention, settledCount, settlementDone,
  type SettlePhase, type SettlementState,
} from './model';
import { useLikelyPhone, useSecondTick } from './shared';
import { dayTime, duration } from './time';

/** Desktop estimate per batch of 4 (k15 proof about 75 to 85 s plus the 1AM step), EGG40-FINAL 9.3. */
const DESKTOP_BATCH_MS = 90_000;
const PHONE_FACTOR = 3;
type Stop = 'pause' | 'stop' | null;

export function SettleEntries({ api, eventId, run, onBack }: { api: OrganizerDoorApi; eventId: bigint; run: Run; onBack(): void }) {
  const [state, setState] = useState<SettlementState | null>(null);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<SettlePhase>('idle');
  const [phaseAt, setPhaseAt] = useState(0);
  const [failedSend, setFailedSend] = useState(false);
  const [filter, setFilter] = useState(false);
  const stopRef = useRef<Stop>(null);
  const [stop, setStop] = useState<Stop>(null);
  const phone = useLikelyPhone();
  useSecondTick(running);

  useEffect(() => { let alive = true; void api.settlement(eventId).then(s => { if (alive) setState(s); }); return () => { alive = false; }; }, [api, eventId]);
  if (!state) return <section className="settle-page"><button type="button" className="nav-back" onClick={onBack}>← Back to Organize event</button><p role="status">Loading entries…</p></section>;

  const now = api.now();
  const deadline = state.keyUntil !== null && state.keyUntil - now < SETTLE_DEADLINE_WARN_MS;
  const keyExpired = state.keyUntil !== null && state.keyUntil <= now;
  const total = batchesTotal(state);
  const onPhase = (p: SettlePhase) => { setPhase(p); setPhaseAt(Date.now()); };
  const requestStop = (s: Exclude<Stop, null>) => { stopRef.current = s; setStop(s); };

  const start = async () => {
    if (running) return;
    stopRef.current = null; setStop(null); setFailedSend(false); setRunning(true);
    let current = state;
    try {
      while (!settlementDone(current) && !stopRef.current) {
        const batch = currentBatch(current);
        const next = await run(`Settle batch ${batch} of ${batchesTotal(current)}`, () => api.settleNextBatch(eventId, onPhase));
        if (!next) { setFailedSend(true); break; }
        current = next; setState(next);
      }
    } finally { setRunning(false); onPhase('idle'); }
    if (stopRef.current === 'stop') onBack();
  };

  const recorded = settledCount(state);
  const pct = state.total ? Math.round((recorded / state.total) * 100) : 0;
  const header = <>
    <button type="button" className="nav-back" onClick={onBack} disabled={running}>← Back to Organize event</button>
    <p className="kicker">Settle entries</p>
    {deadline && !settlementDone(state) && state.keyUntil !== null && <p className="door-alert danger" role="alert"><b>Settle before {dayTime(state.keyUntil)}</b></p>}
    {phone && <p className="note">Settling is much faster on a computer.</p>}
  </>;

  if (settlementDone(state)) {
    const notRecorded = state.total - recorded;
    return <section className="settle-page" aria-labelledby="settle-heading">{header}
      <h1 id="settle-heading">{recorded} entries recorded · {notRecorded} not recorded</h1>
      <p className="organizer-summary-stats"><span>Entered <b>{state.total}</b></span><span>Recorded on-chain <b>{recorded}</b></span></p>
      <Failures state={state} />
      <button type="button" className="primary" onClick={() => downloadReport(eventId, state)}>Download report</button>
    </section>;
  }

  const progress = <div className="settle-progress">
    <p className="settle-count"><b>{recorded} of {state.total}</b> recorded</p>
    <div className="capbar settle-bar" role="progressbar" aria-label="Entries recorded on-chain" aria-valuemin={0} aria-valuemax={state.total} aria-valuenow={recorded} aria-valuetext={`${recorded} of ${state.total} recorded`}><i style={{ width: `${pct}%` }} /></div>
    <p className="small muted">{approvalsLeft(state)} wallet approvals left</p>
  </div>;

  if (running) {
    const line = phase === 'proving' ? `Proving… ${clock(Date.now() - phaseAt)}`
      : phase === 'wallet' ? 'Approve in your wallet' : phase === 'network' ? 'Waiting for the network' : phase === 'retrying' ? 'Retrying one by one' : 'Preparing batch…';
    return <section className="settle-page" aria-labelledby="settle-heading">{header}
      <h1 id="settle-heading">Recording entries</h1>
      <div className="card settle-card">
        {progress}
        <p className="settle-batch" role="status" aria-live="polite"><span className="spin" aria-hidden="true" />Batch {currentBatch(state)} of {total} · {line}</p>
        <div className="row wrap">
          <PendingButton className="primary" pending pendingLabel={phase === 'wallet' ? 'Approve in your wallet…' : phase === 'network' ? 'Waiting for the network…' : 'Recording…'}>Record</PendingButton>
          <button type="button" disabled={!!stop} aria-pressed={stop === 'pause'} onClick={() => requestStop('pause')}>{stop === 'pause' ? 'Pausing after this batch' : 'Pause'}</button>
          <button type="button" className="ghost" disabled={!!stop} onClick={() => requestStop('stop')}>{stop === 'stop' ? 'Stopping after this batch' : 'Stop after this batch'}</button>
        </div>
        <p className="note">Keep this tab open. You can close it and resume later.</p>
      </div>
      <Failures state={state} filter={filter} onFilter={setFilter} />
    </section>;
  }

  const startDisabled = keyExpired || state.keyUntil === null || state.ready === 0;
  if (recorded > 0) return <section className="settle-page" aria-labelledby="settle-heading">{header}
    <h1 id="settle-heading">{recorded} of {state.total} recorded. Resume?</h1>
    <div className="card settle-card">
      {progress}
      {failedSend && <p className="warn" role="alert">Not sent. Retry</p>}
      <p className="small muted">Entries already on-chain are found by the indexer, not only by this browser.</p>
      <PendingButton className="primary big" disabled={startDisabled} onClick={() => void start()}>Resume</PendingButton>
      {keyExpired && <p className="warn" role="alert">{SETTLE_FAILURE_TEXT['key-expired']}</p>}
    </div>
    <Failures state={state} filter={filter} onFilter={setFilter} />
  </section>;

  const estimate = total * DESKTOP_BATCH_MS * (phone ? PHONE_FACTOR : 1);
  return <section className="settle-page" aria-labelledby="settle-heading">{header}
    <h1 id="settle-heading">{state.total} entries from {state.doorCount} doors</h1>
    <div className="card settle-card">
      <ul className="settle-summary">
        <li><b>{total}</b> wallet approvals ({SETTLE_BATCH_SIZE} entries each)</li>
        <li>About {duration(estimate)} on {phone ? 'this phone' : 'this computer'} <span className="muted">(estimate)</span></li>
        <li>
          <span className="tag ok">{state.ready} ready</span>{' '}
          {needsAttention(state) > 0 && <button type="button" className="link" aria-expanded={filter} onClick={() => setFilter(f => !f)}>{needsAttention(state)} need attention</button>}
        </li>
      </ul>
      {state.keyUntil === null && <p className="warn" role="alert">Create a settlement key in Door keys first.</p>}
      {keyExpired && <p className="warn" role="alert">{SETTLE_FAILURE_TEXT['key-expired']}</p>}
      <PendingButton className="primary big" disabled={startDisabled} onClick={() => void start()}>Start</PendingButton>
    </div>
    <Failures state={state} filter={filter} onFilter={setFilter} />
  </section>;
}

function Failures({ state, filter = true, onFilter }: { state: SettlementState; filter?: boolean; onFilter?: (v: boolean) => void }) {
  if (state.failures.length === 0) return null;
  return <section className="card settle-failures" aria-labelledby="settle-failures-heading">
    <div className="door-heading">
      <h2 id="settle-failures-heading">Needs attention</h2>
      {onFilter && <label className="check"><input type="checkbox" checked={filter} onChange={e => onFilter(e.target.checked)} />Show list</label>}
    </div>
    {filter && <div className="organizer-table-scroll"><table className="stats">
      <thead><tr><th scope="col">Ticket</th><th scope="col">Door</th><th scope="col">Reason</th></tr></thead>
      <tbody>{state.failures.map(f => <tr key={f.serial}><td>#{f.serial}</td><td>{f.doorName}</td><td>{SETTLE_FAILURE_TEXT[f.reason]}</td></tr>)}</tbody>
    </table></div>}
    {!filter && <p className="small muted">{state.failures.length} {state.failures.length === 1 ? 'entry' : 'entries'} could not be recorded.</p>}
  </section>;
}

const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Counts and failure reasons only: no keys, nonces, addresses or balances. */
function downloadReport(eventId: bigint, s: SettlementState) {
  const rows = [['event', 'entered', 'recorded_on_chain'], [String(eventId), String(s.total), String(settledCount(s))], [], ['ticket', 'door', 'reason'],
    ...s.failures.map(f => [f.serial, f.doorName, SETTLE_FAILURE_TEXT[f.reason]])];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `cloaktix-event-${eventId}-settlement.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
