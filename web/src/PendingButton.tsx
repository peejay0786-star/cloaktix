import { useState, type ButtonHTMLAttributes } from 'react';
import { PENDING_WALLET } from './pendingLabels';
export { PENDING_CREATE, PENDING_SAVE, PENDING_WALLET } from './pendingLabels';

export function PendingButton({
  pending = false,
  pendingLabel = PENDING_WALLET,
  children,
  disabled,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; pendingLabel?: string }) {
  const wait = !!pending;
  return <button
    {...props}
    type={type}
    className={[className, 'pending-button', wait ? 'is-pending' : ''].filter(Boolean).join(' ')}
    disabled={!!disabled || wait}
    aria-busy={wait || undefined}
  >
    {wait
      ? <span className="pending-button-face"><span className="spin" aria-hidden="true" /><span>{pendingLabel}</span></span>
      : children}
  </button>;
}

type Run = <T>(label: string, action: () => Promise<T>) => Promise<T | undefined>;

/** Wraps a wallet/network action that already goes through session run(). */
export function WalletPendingButton({
  run, label, action, children, disabled, pendingLabel = PENDING_WALLET, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  run: Run;
  label: string;
  action: () => Promise<unknown>;
  pendingLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  return <PendingButton
    {...props}
    pending={pending}
    pendingLabel={pendingLabel}
    disabled={disabled || pending}
    onClick={async () => {
      if (pending || disabled) return;
      setPending(true);
      try { await run(label, action); } finally { setPending(false); }
    }}
  >{children}</PendingButton>;
}
