import { useEffect, useRef, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
type Props = PropsWithChildren<{ label: string; onClose: () => void; className?: string }>;

export function Dialog({ label, onClose, className = 'modal', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const first = ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  const node = <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
    className={className} onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }} onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        event.currentTarget.focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }}>{children}</div>;
  // Portal to <body> so page stacking contexts (main/footer z-index, card transforms) can't paint over it.
  return typeof document !== 'undefined' && document.body ? createPortal(node, document.body) : node;
}
