/** Select the ledger schema, not a balance conversion. A configured v3 deployment defaults to schema 3; explicit legacy links remain supported. */
export type CloakSchema = 1 | 2 | 3 | 4;

function networkFromLocation(): string {
  try {
    return new URLSearchParams(location.search).get('network')
      ?? ((import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_NETWORK as string)
      ?? 'undeployed';
  } catch {
    return 'undeployed';
  }
}

function normalizedContract(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^0x/i, '').toLowerCase();
  return /^[0-9a-f]{64}$/.test(hex) ? hex : null;
}

export function resolveSchema(): CloakSchema {
  try {
    const explicit = new URLSearchParams(location.search).get('schema');
    // Explicit links always win, including old v1/v2 events on a configured v3 app.
    if (explicit === '4') return 4;
    if (explicit === '3') return 3;
    if (explicit === '2') return 2;
    if (explicit === '1') return 1;
  } catch { /* non-browser */ }
  const configuredSchema = import.meta.env?.VITE_CLOAKTIX_SCHEMA;
  if (configuredSchema === '3') return 3;
  if (configuredSchema === '2') return 2;
  // Keep the Vite environment read inline; importing contract-v3 would eagerly pull in compiled contracts/WASM.
  const configuredV3 = normalizedContract(typeof import.meta.env === 'undefined' ? undefined : import.meta.env.VITE_RATE_V3_CONTRACT);
  try {
    const contract = normalizedContract(new URLSearchParams(location.search).get('contract'));
    if (contract) {
      if (contract === configuredV3) return 3;
      const network = networkFromLocation();
      for (const schema of [4, 3, 2] as const) {
        if (normalizedContract(localStorage.getItem(contractStorageKey(schema, network))) === contract
          || normalizedContract(localStorage.getItem(`cloaktix:last-contract:s${schema}:${network}`)) === contract) return schema;
      }
    }
  } catch { /* Storage may be unavailable; the configured deployment still selects its schema. */ }
  // Preview is NIGHT-only v3 when a valid v3 address is baked. Unconfigured tests/dev retain v1.
  return configuredV3 ? 3 : 1;
}

/** Matches Compact pad(32, networkId) used as sealed networkTag at deploy. */
export function networkTagBytes(networkId: string): Uint8Array {
  const u = new Uint8Array(32);
  const enc = new TextEncoder().encode(networkId);
  u.set(enc.subarray(0, 32));
  return u;
}

export function contractAddressStruct(hexOrAddr: string): { bytes: Uint8Array } {
  const h = hexOrAddr.startsWith('0x') ? hexOrAddr.slice(2) : hexOrAddr;
  if (!/^[0-9a-fA-F]{64}$/.test(h)) throw new Error('Invalid contract address');
  return { bytes: Uint8Array.from(h.match(/../g)!.map((b) => parseInt(b, 16))) };
}

/** Namespace deployments by their ledger schema so legacy and serial-ticket contracts stay separate. */
export function contractStorageKey(schema: CloakSchema, networkId: string): string {
  // Ledger 9 (Preview reset 2026-11-07): new namespace so addresses from the old ledger 8 chain are never reused.
  return `cloaktix:l9:contract:s${schema}:${networkId}`;
}

export function schemaIncompatibleMessage(want: CloakSchema, detail?: string): string {
  const others = ([1, 2, 3, 4] as CloakSchema[]).filter((x) => x !== want).join(' or ?schema=');
  return (
    `This contract does not match schema v${want}. ` +
    `Open ?schema=${others} for your other tickets, or deploy a new schema v${want} contract from Organizer. ` +
    (detail ? `(${detail})` : '')
  ).trim();
}

export function isSchemaVersion2(v: unknown): boolean {
  return v === 2 || v === 2n || Number(v) === 2;
}
