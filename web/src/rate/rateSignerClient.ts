/**
 * Client for the CloakTix rate-signer Worker (signed USD→NIGHT quotes).
 * Never sees or needs RATE_SIGNER_SK; only parses public signatures.
 */
import type { RateQuoteArg, SignatureArg } from '../midnight/circuitArgs';

export const DEFAULT_RATE_SIGNER_URL = 'https://cloaktix-rate-signer-preview.peejay0786.workers.dev';

export function rateSignerBase(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return (env?.VITE_RATE_SIGNER_URL || DEFAULT_RATE_SIGNER_URL).replace(/\/+$/, '');
}

export type SignedQuote = { quote: RateQuoteArg; nightUsd: number; adaUsd: number };

export function parseSignature(raw: unknown): SignatureArg {
  const sig = raw as { r?: { x?: unknown; y?: unknown }; s?: unknown } | null;
  if (!sig?.r || sig.r.x == null || sig.r.y == null || sig.s == null) throw new Error('Malformed signature from rate signer');
  return { r: { x: BigInt(String(sig.r.x)), y: BigInt(String(sig.r.y)) }, s: BigInt(String(sig.s)) };
}

/** Parse /quote response; refuses unsigned drafts (never mint on an unsigned rate). */
export function parseSignedQuote(data: any): SignedQuote {
  if (!data?.ok) throw new Error(`Rate quote unavailable: ${data?.reason ?? 'unknown error'}`);
  if (!data.signed || !data.signature) throw new Error('Rate quote is not signed — refusing to buy. Try again in a moment.');
  return {
    quote: {
      atomsPerUsdCent: BigInt(String(data.atomsPerUsdCent)),
      issuedAt: BigInt(data.issuedAt),
      expiresAt: BigInt(data.expiresAt),
      signature: parseSignature(data.signature),
    },
    nightUsd: Number(data.nightUsd),
    adaUsd: Number(data.adaUsd),
  };
}

export async function fetchSignedRateQuote(args: { networkTagHex: string; contractKeyHex: string; fetcher?: typeof fetch }): Promise<SignedQuote> {
  const f = args.fetcher ?? fetch;
  const u = new URL(`${rateSignerBase()}/quote`);
  u.searchParams.set('networkTag', args.networkTagHex);
  u.searchParams.set('contractKey', args.contractKeyHex);
  const res = await f(u.toString(), { credentials: 'omit' });
  let data: any = null;
  try { data = await res.json(); } catch { throw new Error(`Rate signer HTTP ${res.status}`); }
  return parseSignedQuote(data);
}

