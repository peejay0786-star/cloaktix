import type { AdmitCapabilityV2 } from './admitCodec.ts';

/** A saved nonce is usable only for the live owned serial and epoch. Never prepares or rotates. */
export function matchingPreparedTicket<T extends AdmitCapabilityV2>(tickets: T[], row: { serial: bigint; epoch: bigint; hasAdmit: boolean }): T | undefined {
  if (!row.hasAdmit) return undefined;
  return tickets.find((ticket) => ticket.serial === String(row.serial) && ticket.epoch === String(row.epoch));
}
