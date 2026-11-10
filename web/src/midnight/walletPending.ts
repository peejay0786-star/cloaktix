/** Shared 1AM pending-queue handling for consecutive wallet transactions. */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function isPendingTxWalletError(error: unknown): boolean {
  const message = error && typeof error === 'object' && 'message' in error ? error.message : error;
  const msg = String(message).toLowerCase();
  return [
    'pending transaction',
    'already a pending',
    'transaction is pending',
    'another transaction',
    'already pending',
    'transaction is already pending',
    'dust sponsorship',
  ].some((wording) => msg.includes(wording));
}

export async function withPendingRetry<T>(
  label: string,
  fn: () => Promise<T>,
  onWait: (detail: string) => void,
  maxAttempts = 8,
): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isPendingTxWalletError(e) || attempt === maxAttempts) throw e;
      onWait(`${label}: wallet still has a pending transaction — waiting before retry (${attempt}/${maxAttempts})…`);
      await sleep(5_000 + attempt * 1_500);
    }
  }
  throw last;
}

