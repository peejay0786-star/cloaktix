import { useEffect, useRef, useState } from 'react';
import { getGateAdmitStore, type QueuedAdmit } from './midnight/gateAdmitStore';
import { commitQueuedAdmits, shouldAutoCommit, submitQueuedAdmit, type AdmitSubmitter, type CommitReport } from './midnight/instantAdmit';
import { PendingButton } from './PendingButton';

export function useAdmitQueue(contract: string | null | undefined) {
  const [items, setItems] = useState<QueuedAdmit[]>([]);
  const [pending, setPending] = useState(0);
  const [committing, setCommitting] = useState(false);
  const [report, setReport] = useState<string>('');
  const oldest = items[0]?.queuedAt ? Date.parse(items[0].queuedAt) : null;

  useEffect(() => {
    if (!contract) { setItems([]); setPending(0); return; }
    const store = getGateAdmitStore();
    const refresh = async () => {
      const list = await store.listQueue(contract);
      setItems(list);
      setPending(list.length);
    };
    void refresh();
    return store.subscribe(() => { void refresh(); });
  }, [contract]);

  const commit = async (submit: AdmitSubmitter) => {
    if (!contract || committing) return;
    setCommitting(true);
    setReport('');
    try {
      const result = await commitQueuedAdmits(getGateAdmitStore(), contract, submit);
      if (result.failed && result.ok) setReport(`Recorded ${result.ok}. ${result.failed} failed and will retry.`);
      else if (result.failed) setReport(`${result.failed} ${result.failed === 1 ? 'entry' : 'entries'} failed. They stay in the queue.`);
      else if (result.ok) setReport(`Recorded ${result.ok} ${result.ok === 1 ? 'entry' : 'entries'} on-chain.`);
      return result;
    } finally {
      setCommitting(false);
    }
  };

  return { items, pending, committing, report, setReport, oldest, commit, shouldAuto: shouldAutoCommit(pending, oldest) };
}

export function sessionAdmitSubmitter(call: (circuit: string, args: unknown[]) => Promise<{ txId: string }>): AdmitSubmitter {
  return (item) => submitQueuedAdmit(item, call);
}

export function AdmitQueueBar({
  pending,
  committing,
  report,
  failedCount,
  onCommit,
}: {
  pending: number;
  committing: boolean;
  report?: string;
  failedCount?: number;
  onCommit: () => void;
}) {
  if (pending <= 0 && !report) return null;
  const label = pending === 1 ? 'Record 1 entry' : `Record ${pending} entries`;
  return (
    <div className="card admit-queue" role="status">
      {pending > 0 ? (
        <>
          <p className="admit-queue-title"><b>{pending}</b> {pending === 1 ? 'entry' : 'entries'} waiting to be recorded</p>
          <p className="muted small">Each admit is its own on-chain transaction. This will ask 1AM {pending} {pending === 1 ? 'time' : 'times'}.</p>
        </>
      ) : null}
      {failedCount ? <p className="warn small">{failedCount} {failedCount === 1 ? 'entry needs' : 'entries need'} a retry.</p> : null}
      {report ? <p className="small">{report}</p> : null}
      {pending > 0 ? (
        <PendingButton type="button" className="primary" pending={committing} pendingLabel="Recording entries…" disabled={committing} onClick={onCommit}>
          {label}
        </PendingButton>
      ) : null}
    </div>
  );
}

export function useAutoCommit(enabled: boolean, run: () => void) {
  const ran = useRef(false);
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    if (!enabled) { ran.current = false; return; }
    if (ran.current) return;
    ran.current = true;
    runRef.current();
  }, [enabled]);
}

export type { CommitReport };
