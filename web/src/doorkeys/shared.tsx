import { useEffect, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import type { DoorVerdictCopy } from '../mapDoorVerdict';
import type { WalletPhase } from './api';
import type { RelayStatus, ScanOutcome } from './model';
import { clockTime, dayTime } from './time';

export const WALLET_PHASE_LABEL: Record<WalletPhase, string> = {
  proving: 'Building proof…', wallet: 'Approve in your wallet…', network: 'Waiting for the network…', relay: 'Unlocking the staff phone…',
};
/** Shown under a wallet button while it is busy, so a long proof never looks like a dead button. */
export const WALLET_PHASE_HINT: Record<WalletPhase, string> = {
  proving: 'Building the proof on this computer. Your wallet opens after that, usually within a minute. Keep this tab open.',
  wallet: 'Check your 1AM wallet: approve the transaction there.',
  network: 'Approved. Waiting for the transaction to land on Midnight.',
  relay: 'On-chain. Telling the relay so the staff phone unlocks (can take up to 30 s).',
};

export function RelayPill({ status }: { status: RelayStatus }) {
  const text = status === 'online' ? 'Relay online' : status === 'offline' ? 'Relay offline' : 'Relay syncing';
  return <span className={`relay-pill ${status}`}><span className="relay-dot" aria-hidden="true" />{text}</span>;
}

/** Copy button with an inline status (no toast, so nothing fixed-position is needed). */
export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [status, setStatus] = useState('');
  useEffect(() => { if (!status) return; const t = setTimeout(() => setStatus(''), 2500); return () => clearTimeout(t); }, [status]);
  return <span className="copy-inline">
    <button type="button" className={className} onClick={() => navigator.clipboard.writeText(text).then(() => setStatus('Copied'), () => setStatus('Copy unavailable. Select the code instead.'))}>{label}</button>
    <span className="small muted" role="status" aria-live="polite">{status}</span>
  </span>;
}

/**
 * Full-screen layer rendered into <body>. A position:fixed element inside `.card` (backdrop-filter) would be
 * positioned against the card, not the viewport (EGG-38). Same pattern as Scanner and DoorVerdict.
 */
export function FullScreen({ label, className = '', children }: PropsWithChildren<{ label: string; className?: string }>) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('door-overlay-open');
    return () => { document.body.style.overflow = prev; document.documentElement.classList.remove('door-overlay-open'); };
  }, []);
  const node = <div className={`door-fullscreen ${className}`} role="dialog" aria-modal="true" aria-label={label}>{children}</div>;
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

/** True on touch-first or narrow screens: settling should happen on a computer. */
export function useLikelyPhone(): boolean {
  const query = '(pointer: coarse), (max-width: 719px)';
  const [phone, setPhone] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia(query); const on = () => setPhone(m.matches);
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return phone;
}

/** Ticks once a second; for countdowns and the "Proving… 0:52" timer. */
export function useSecondTick(active = true): number {
  const [tick, setTick] = useState(0);
  useEffect(() => { if (!active) return; const t = setInterval(() => setTick(n => n + 1), 1000); return () => clearInterval(t); }, [active]);
  return tick;
}

/** Spec section 3 / 9 copy on the existing door verdict screen (tones from EGG-37). */
export function scanVerdictCopy(outcome: ScanOutcome): DoorVerdictCopy {
  const base = { detail: '', meta: '', typeName: '', firstAdmittedAt: '', firstAdmittedDoor: '', recordingPending: false };
  switch (outcome.kind) {
    case 'valid': return { ...base, ok: true, tone: 'ok', title: 'Valid', subtitle: 'Admit 1', detail: outcome.typeName, typeName: outcome.typeName, meta: 'Entry saved to the relay' };
    case 'already-used': return { ...base, ok: false, tone: 'used', title: 'Already used', subtitle: 'Do not admit', meta: `Entered at ${outcome.doorName} · ${clockTime(outcome.at)}` };
    case 'wrong-door': return { ...base, ok: false, tone: 'invalid', title: 'Wrong door', subtitle: 'Do not admit', detail: `This ticket enters at ${outcome.doorName}` };
    case 'wrong-event': return { ...base, ok: false, tone: 'invalid', title: 'Not for this event', subtitle: 'Do not admit' };
    case 'replaced': return { ...base, ok: false, tone: 'invalid', title: 'Not valid', subtitle: 'Do not admit', detail: 'This copy was replaced or is not a CloakTix ticket' };
    case 'listed': return { ...base, ok: false, tone: 'invalid', title: 'Not valid', subtitle: 'Do not admit', detail: 'Ticket is listed for resale' };
    case 'key-not-yet-valid': return { ...base, ok: false, tone: 'used', title: 'Door not open yet', subtitle: 'Do not admit yet', detail: `Ticket checks out (${outcome.typeName}). This phone records entries from ${dayTime(outcome.opensAt)}. Nothing was recorded.`, typeName: outcome.typeName };
    case 'key-expired': return { ...base, ok: false, tone: 'invalid', title: 'This door key has expired', subtitle: 'Do not admit', detail: 'Ask the organizer for a new door key. Nothing was recorded.' };
    case 'refused': return { ...base, ok: false, tone: 'invalid', title: "Can't record entry", subtitle: 'Send guests to the organizer desk', detail: `${outcome.reason}. Nothing was recorded.`.replace(/\.\. /, '. ') };
    case 'relay-offline': return { ...base, ok: false, tone: 'invalid', title: "Can't confirm entry right now", subtitle: 'Send guests to the organizer desk', detail: 'Relay offline. No first entry without the relay.' };
  }
}
