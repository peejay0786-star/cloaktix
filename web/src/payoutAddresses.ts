/** Network-aware payout address validation. Organizer-only; never render to buyers. */

export type NetworkKind = 'preview' | 'preprod' | 'undeployed' | 'mainnet' | string;

const BECH32 = /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/i;

export type AddressCheck =
  | { kind: 'valid'; normalized: string }
  | { kind: 'invalid'; message: string };

function nightPrefix(network: NetworkKind): string {
  if (network === 'mainnet') return 'mn_addr1';
  if (network === 'preview' || network === 'preprod' || network === 'undeployed') return `mn_addr_${network}1`;
  // Unknown networks: require explicit network tag in the address.
  return `mn_addr_${network}1`;
}

export function validateNightPayout(text: string, network: NetworkKind): AddressCheck {
  const normalized = text.trim();
  if (!normalized) return { kind: 'invalid', message: 'NIGHT payout address is required.' };
  if (/^(addr1|addr_test1)/i.test(normalized)) {
    return { kind: 'invalid', message: 'This is a Cardano address. Enter your Midnight (mn_addr…) address.' };
  }
  if (/mn_shield-addr|mn_dust_/i.test(normalized)) {
    return { kind: 'invalid', message: 'Use an unshielded Midnight address (mn_addr…), not shielded or DUST.' };
  }
  const prefix = nightPrefix(network);
  if (!normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
    return { kind: 'invalid', message: `NIGHT address must start with ${prefix} on ${network}.` };
  }
  const rest = normalized.slice(prefix.length);
  if (rest.length < 10 || !BECH32.test(rest)) {
    return { kind: 'invalid', message: 'NIGHT address format looks incomplete or invalid.' };
  }
  return { kind: 'valid', normalized };
}

/** Strip any accidental payout fields before buyer-facing metadata is shown or published. */
export function publicEventMeta<T extends Record<string, unknown>>(meta: T): Omit<T, 'nightPayout' | 'adaPayout' | 'payoutNight' | 'payoutAda'> {
  const { nightPayout: _n, adaPayout: _a, payoutNight: _pn, payoutAda: _pa, ...rest } = meta as T & Record<string, unknown>;
  return rest as Omit<T, 'nightPayout' | 'adaPayout' | 'payoutNight' | 'payoutAda'>;
}
