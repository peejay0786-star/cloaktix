import { listForResaleArgs } from '../midnight/circuitArgs.ts';
import type { CloakSchema } from '../midnight/schema';

/** Display routing only; v2-only transaction callers keep schemaIsV2. */
export function schemaUsesSerialTickets(session: { schema?: number }, state?: { schemaVersion?: unknown } | null): boolean {
  const sessionVersion = Number(session.schema);
  const stateVersion = Number(state?.schemaVersion);
  return sessionVersion === 2 || sessionVersion === 3 || sessionVersion === 4 || stateVersion === 2 || stateVersion === 3 || stateVersion === 4;
}
export function resalePriceUnits(schema: CloakSchema, quote: { cents: bigint; atoms: bigint }): bigint {
  return (schema === 3 || schema === 4) ? quote.cents : quote.atoms;
}
export function serialResaleArgs(schema: CloakSchema, serial: bigint, quote: { cents: bigint; atoms: bigint }, payout: { bytes: Uint8Array }, feeOf: (atoms: bigint) => bigint): unknown[] {
  return listForResaleArgs(schema, { serialOrTypeId: serial, priceUnits: resalePriceUnits(schema, quote), feeAtoms: (schema === 3 || schema === 4) ? 0n : feeOf(quote.atoms), payout });
}
export function centsInput(cents: bigint): string {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}
