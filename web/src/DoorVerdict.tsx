import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DoorVerdictCopy } from './mapDoorVerdict';

const AUTO_MS = 3000;

function vibrate(ms = 16) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}

export function DoorVerdict({
  ok,
  tone = ok ? 'ok' : 'invalid',
  title,
  subtitle,
  detail,
  meta,
  typeName,
  firstAdmittedAt,
  firstAdmittedDoor,
  recordingPending = false,
  doorLabel,
  onNext,
  autoReturn = ok,
}: DoorVerdictCopy & { doorLabel?: string; onNext: () => void; autoReturn?: boolean }) {
  const [held, setHeld] = useState(false);
  const holdRef = useRef(false);
  const shouldAuto = autoReturn && ok && tone === 'ok';

  useEffect(() => {
    vibrate(12);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('door-overlay-open');
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove('door-overlay-open');
    };
  }, []);

  useEffect(() => {
    if (!shouldAuto || held) return;
    const timer = window.setTimeout(() => {
      if (!holdRef.current) onNext();
    }, AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [shouldAuto, held, onNext]);

  const stay = () => {
    holdRef.current = true;
    setHeld(true);
  };

  const next = () => {
    holdRef.current = true;
    vibrate(16);
    onNext();
  };

  const cardType = typeName || (tone === 'ok' ? detail : '');
  const showCard = !!(cardType || doorLabel || meta || firstAdmittedAt || firstAdmittedDoor || recordingPending);

  const node = (
    <div
      className={`door-verdict ${tone}`}
      role="alert"
      onClick={(e) => {
        if (!shouldAuto || held) return;
        if ((e.target as HTMLElement).closest('button')) return;
        stay();
      }}
    >
      <div className={`door-verdict-mark ${tone}`} aria-hidden="true">
        {tone === 'ok' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : tone === 'used' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="8.25" />
            <path d="M7.2 7.2l9.6 9.6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        )}
      </div>
      <h2 className="door-verdict-title">{title}</h2>
      <p className="door-verdict-sub">{subtitle}</p>
      {showCard && (
        <div className="door-verdict-card">
          {cardType ? <p className="door-verdict-type">{cardType}</p> : null}
          {doorLabel ? <p className="door-verdict-row">{doorLabel}</p> : null}
          {meta ? <p className="door-verdict-row">{meta}</p> : null}
          {tone === 'used' && (firstAdmittedAt || firstAdmittedDoor) ? (
            <p className="door-verdict-first">
              First admitted
              {firstAdmittedDoor ? ` at ${firstAdmittedDoor}` : ''}
              {firstAdmittedAt ? ` · ${firstAdmittedAt}` : ''}
            </p>
          ) : null}
          {tone === 'invalid' && detail && detail !== cardType ? <p className="door-verdict-row">{detail}</p> : null}
          {recordingPending ? <p className="door-verdict-recording">Recording on-chain…</p> : null}
        </div>
      )}
      {tone === 'invalid' && detail && !showCard ? <p className="door-verdict-detail">{detail}</p> : null}
      <div className="door-verdict-next">
        {shouldAuto && !held && (
          <div className="door-verdict-auto">
            <span className="door-verdict-auto-track" aria-hidden="true"><span className="door-verdict-auto-bar" /></span>
            <p className="door-verdict-auto-copy">Returning to scanner</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); stay(); }}>Tap to stay</button>
          </div>
        )}
        {held && shouldAuto ? <p className="door-verdict-held">Staying on this result</p> : null}
        <button type="button" className="primary big wide" onClick={next}>Scan next</button>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
