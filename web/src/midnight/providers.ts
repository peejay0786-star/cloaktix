// Browser providers (adapted from the midnight private-party/ui template).
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { dappConnectorProofProvider, dappConnectorWalletProviders } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/v9';
import { ZK_ASSETS_PATH } from './contract';
import { ZK_ASSETS_PATH_V2 } from './contract-v2';
import { ZK_ASSETS_PATH_V3 } from './contract-v3';
import type { CloakSchema } from './schema';
import { withCachingProver } from './keyMaterial';
import { sharedZkFetch } from './zkFetch.ts';
import { createCloakPrivateStateProvider } from './privateStateProvider';

// Default: the wallet's own indexer (DApp Connector getConfiguration()). Only build with VITE_INDEXER_PROXY=1 when the
// host really serves /indexer (local serve.mjs); the Workers preview does not, and a POST there returns 405.
export function indexerUris(config: { indexerUri?: string; indexerWsUri?: string }) {
  if (!import.meta.env.VITE_INDEXER_PROXY) {
    const http = config.indexerUri, ws = config.indexerWsUri;
    if (!http || !/^https?:\/\//.test(http) || !ws || !/^wss?:\/\//.test(ws))
      throw new Error(`Wallet configuration has no usable indexer URI (indexerUri=${String(http)}, indexerWsUri=${String(ws)}). Check the network/indexer settings in your wallet.`);
    // indexer.preprod.midnight.network is retired (410, no CORS => "Failed to fetch"): go through the preview's
    // same-origin /indexer proxy, which keeps the wallet's URI as the upstream (see preview-worker/worker.js).
    if (new URL(http).hostname === 'indexer.preprod.midnight.network') {
      const wsBase = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
      return { http: `${location.origin}/indexer?u=${encodeURIComponent(http)}`, ws: `${wsBase}/indexer/ws?u=${encodeURIComponent(ws)}` };
    }
    return { http, ws };
  }
  return { http: `${location.origin}/indexer`, ws: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/indexer/ws` };
}

/** Lifetime of a transaction built by Midnight.js 5 (the DApp Connector wallet may apply its own TTL). */
export const TX_TTL_SECONDS = 30 * 60;

export async function createProviders(api: ConnectedAPI, opts?: { schema?: CloakSchema }) {
  const schema: CloakSchema = opts?.schema ?? 1;
  const zkAssetsPath = schema === 4 ? 'local-only-no-v4-proving-keys' : schema === 3 ? ZK_ASSETS_PATH_V3 : schema === 2 ? ZK_ASSETS_PATH_V2 : ZK_ASSETS_PATH;
  const config = await api.getConfiguration();
  // Midnight.js 5: setNetworkId() is gone; network + tx TTL travel in providers.config (see below).
  // VITE_INDEXER_PROXY=1 : indexer via a same-origin proxy (key stays server-side); else the wallet's indexer.
  const idx = indexerUris(config);
  const publicDataProvider = indexerPublicDataProvider(idx.http, idx.ws, window.WebSocket as any);
  // CT-PROOF-SPEED: dedupe + Cache Storage for keys/zkir (hash-checked against the compiler manifest).
  const zkBase = new URL(zkAssetsPath, window.location.origin).toString();
  const zkConfigProvider = new FetchZkConfigProvider<string>(zkBase, { fetchFunc: sharedZkFetch(zkBase, fetch.bind(window)) as any });
  // Proving delegated to the wallet (getProvingProvider): the wallet proves in the browser, witnesses never leave the device.
  const proofProvider = dappConnectorProofProvider(withCachingProver(api), zkConfigProvider, CostModel.initialCostModel());
  // Midnight.js 5 wallet bridge: balances (wallet estimates fees against the ledger 9 fee floor) and submits
  // ledger 8 or ledger 9 transactions through the DApp Connector. No hard-coded fees.
  const { walletProvider, midnightProvider } = await dappConnectorWalletProviders(api as any);
  return {
    config,
    providers: {
      config: { networkId: config.networkId, ttlSeconds: TX_TTL_SECONDS },
      // Midnight.js 5: contract-scoped private state (forContract) + persisted signing keys.
      privateStateProvider: createCloakPrivateStateProvider({ networkId: config.networkId, storage: window.localStorage }), publicDataProvider, zkConfigProvider, proofProvider: await proofProvider,
      walletProvider, midnightProvider,
    } as any,
  };
}
