/** Build share / deep links that always carry schema + network (no silent v1 session on v2 contracts). */

export function buildEventShareUrl(args: {
  origin: string;
  eventId: string | number | bigint;
  contract: string;
  networkId: string;
  schema: 1 | 2 | 3 | 4;
  metaB64?: string;
}): string {
  const q = new URLSearchParams({ contract: args.contract, network: args.networkId, schema: String(args.schema) });
  if (args.metaB64) q.set('m', args.metaB64);
  return `${args.origin}/e/${args.eventId}?${q}`;
}
