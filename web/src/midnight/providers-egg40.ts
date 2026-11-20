/**
 * EGG-40 providers. The session's providers are built for schema 3 and point their ZK config at the
 * live rate-v3 assets. EGG-40 shares circuit names with rate-v3 (createEvent, buyTicket, ...) but has
 * different keys, so deploys and calls on EGG-40 must read keys from the EGG-40 asset folder.
 * midnight-js deployContract reads verifier keys from providers.zkConfigProvider: with the v3 provider
 * it would install rate-v3 keys on the new contract.
 */
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/v9';
import { withCachingProver } from './keyMaterial';
import { sharedZkFetch } from './zkFetch.ts';
import { ZK_ASSETS_PATH_EGG40 } from './contract-egg40';

const cache = new WeakMap<object, Promise<any>>();

/** Same providers as the session, with the EGG-40 ZK config and a prover bound to it. */
export function egg40Providers(host: { P: any; api?: any }): Promise<any> {
  const api = (host as any).api;
  if (!api) throw new Error('EGG-40 needs a connected wallet');
  let p = cache.get(host.P);
  if (!p) {
    p = (async () => {
      const zkBase = new URL(ZK_ASSETS_PATH_EGG40, window.location.origin).toString();
      const zkConfigProvider = new FetchZkConfigProvider<string>(zkBase, { fetchFunc: sharedZkFetch(zkBase, fetch.bind(window)) as any });
      const proofProvider = await dappConnectorProofProvider(withCachingProver(api), zkConfigProvider, CostModel.initialCostModel());
      return { ...host.P, zkConfigProvider, proofProvider };
    })();
    cache.set(host.P, p);
  }
  return p;
}
