import { humanizeAgeError } from './midnight/ageCredential.ts';
/**
 * Flatten an error and its `cause` chain into one line. Midnight.js 5 wraps wallet failures in
 * ProviderFailedError and puts the wallet's own (already redacted) message on `cause`.
 */
export function errorChainText(e: unknown, maxDepth = 5): string {
  const parts: string[] = [];
  let cur: any = e;
  for (let i = 0; cur != null && i <= maxDepth; i++) {
    const msg = cur instanceof Error || typeof cur?.message === 'string' ? String(cur.message) : String(cur);
    const code = typeof cur?.code === 'string' ? `[${cur.code}] ` : '';
    if (msg && !parts.some((p) => p.includes(msg))) parts.push(code + msg);
    cur = cur?.cause;
  }
  return parts.join(' <- cause: ');
}

/** Turn raw wallet/SDK/contract errors into short English UI copy. Raw text belongs in the activity log only. */
export function humanizeTxError(raw: string): string {
  // Midnight.js 5 / Wallet SDK 2 era errors (ledger 9 Preview since 2026-11-07).
  if (/EraMismatchError|ledger8-transaction-on-ledger9-network|unknown-artifact-runtime-version|ProtocolVersionMismatchError/.test(raw))
    return 'This transaction was built for the old Midnight ledger (8). Preview now runs ledger 9: reload the app and make sure your wallet is up to date, then try again.';
  if (/No public state found at contract address|ContractNotFoundError/.test(raw))
    return 'This contract does not exist on the current Midnight Preview chain (Preview was reset to ledger 9 on 2026-11-07). A new CloakTix contract must be deployed first.';
  // 1AM DUST / sponsorship failures (wallet message arrives on ProviderFailedError.cause).
  if (/already pending|PENDING_TRANSACTION/i.test(raw))
    return 'Your wallet already has a transaction pending. Wait for it to confirm or expire, then try again.';
  if (/DUST sponsorship|SponsorshipFailed|couldn.t cover this transaction.s fee/i.test(raw))
    return 'The wallet\'s DUST sponsorship could not pay this transaction\'s fee. Turn off DUST sponsorship in your wallet settings (your own DUST will pay), then try again.';
  if (/Not enough DUST|INSUFFICIENT_DUST|No spendable DUST|DUST state is (not ready|behind)|insufficient[^\n]*dust|could not balance dust|isn.t spendable yet/i.test(raw))
    return 'Not enough spendable DUST to pay this transaction\'s fee. In your wallet, register your tNIGHT for DUST generation and wait for DUST to build up, then try again.';
  const age = humanizeAgeError(raw); // CT-AGE-CRED
  if (age) return age;
  const fa = raw.match(/failed assert: ([^\n'"]+)/);
  if (fa) return `Refused by the contract: ${fa[1].trim()}`;
  if (/FailFallible/.test(raw)) {
    const circuit = raw.match(/"circuitId"\s*:\s*"([^"]+)"/)?.[1];
    const what = circuit && /^buyTicket/.test(circuit) ? 'purchase' : 'action';
    return `Your wallet signed, but the contract rejected the ${what} on-chain. ` +
      (what === 'purchase' ? 'No ticket was minted and the ticket payment was not applied. ' : 'Nothing was changed. ') +
      'Do not pay again from a different screen; see Activity for details.';
  }
  if (/FailEntirely/.test(raw)) return 'The network rejected the transaction. Nothing was applied; you can try again.';
  // Never put raw wasm/JSON blobs in the banner.
  if (/_wbg_ptr|^\s*\{/.test(raw)) return 'The transaction failed. See Activity for details.';
  return raw;
}
