export type ParsedAmount =
  | { kind: 'valid'; amount: bigint }
  | { kind: 'invalid'; message: string };

/** Six-decimal parsing: never round through Number or accept negative/NaN values. */
export function parseNight(text: string): ParsedAmount {
  const value = text.trim().replace(/[\s,]/g, '');
  if (!/^\d+(?:\.\d{0,6})?$/.test(value)) {
    return { kind: 'invalid', message: 'Enter a NIGHT amount of 0 or more, with at most 6 decimals.' };
  }
  const [whole, fraction = ''] = value.split('.');
  const amount = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (amount > 18_446_744_073_709_551_615n) {
    return { kind: 'invalid', message: 'Amount exceeds the supported range.' };
  }
  return { kind: 'valid', amount };
}

export function requireNight(text: string): bigint {
  const result = parseNight(text);
  if (result.kind === 'invalid') throw new Error(result.message);
  return result.amount;
}
