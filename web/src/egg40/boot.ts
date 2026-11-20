import type { Egg40Api } from '../doorkeys/api.ts';
import { configuredEgg40Contract } from '../midnight/contract-egg40-meta.ts';
import { createLiveEgg40Api } from './live.ts';
import { createMemoryRelay } from './memoryRelay.ts';
import { createHttpRelay } from './httpRelay.ts';
import { setDoorKeyIdHex } from './doorKeyId.ts';
import { getEgg40OrgSigner, getEgg40SessionCall } from './sessionHost.ts';
import { onLocalProof } from '../midnight/localProver.ts';
import { indexerTicketChain, type ChainTicket } from './ticketChain.ts';

/** Public Preview indexer, reached through the app's same-origin /indexer proxy (allow-listed host). */
const PREVIEW_INDEXER = 'https://indexer.preview.midnight.network/api/v3/graphql';

function relayUrl(): string | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_EGG40_RELAY_URL;
  return env && env.trim() ? env.trim().replace(/\/+$/, '') : null;
}

/** Live API when this build points at the EGG-40 contract. Event 1 (no env, old contract) stays unavailable. */
export async function bootLiveEgg40Api(): Promise<Egg40Api | null> {
  const contract = configuredEgg40Contract();
  if (!contract) return null;
  try {
    const { pureCircuitsEgg40 } = await import('../midnight/contract-egg40.ts');
    setDoorKeyIdHex((secret) => (pureCircuitsEgg40.doorKeyIdOf(secret) as bigint).toString(16).padStart(64, '0'));
  } catch (e) { console.error('[CloakTix] door keys: contract code did not load, using SHA-256 key ids (staff keys only)', e); }
  // EGG-44: the door API needs the live tickets (scan, plan B check-in, settlement). Without it every ticket looked unknown.
  let decode: (hex: string) => ChainTicket[] = () => { throw new Error('EGG-40 ticket decoder did not load'); };
  try { decode = (await import('./chainDoorState.ts')).decodeTicketState; }
  catch (e) { console.error('[CloakTix] door scans: ticket decoder did not load', e); }
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};
  const origin = globalThis.location?.origin ?? '';
  const chain = indexerTicketChain({
    contract,
    indexerUrl: `${origin}/indexer?u=${encodeURIComponent(env.VITE_EGG40_INDEXER_URL?.trim() || PREVIEW_INDEXER)}`,
    metaUrl: `${origin}/meta?c=${contract}`,
    decode,
  });
  const url = relayUrl();
  const relay = url ? createHttpRelay(contract, url, fetch, { signer: getEgg40OrgSigner }) : createMemoryRelay(contract);
  return createLiveEgg40Api({
    contract,
    relay,
    chain,
    call: async (circuit, args, doorSk) => {
      const bound = getEgg40SessionCall();
      if (!bound) throw new Error('Connect your organizer wallet (1AM) on this page first, then try again.');
      return bound(circuit, args, doorSk);
    },
    proofEvents: (listener) => onLocalProof((e) => listener({ phase: e.phase })),
  });
}
