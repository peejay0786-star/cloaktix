import { encodeAdmitFragmentPath, isAdmitCapabilityV2, type AdmitCapabilityV2 } from './admitCodec.ts';

/** A navigation QR, not the gate payload. Capability stays exclusively in the fragment. */
export function buildPhoneTransferUrl({ origin, cap }: { origin: string; cap: AdmitCapabilityV2 }): string {
  if (!isAdmitCapabilityV2(cap)) throw new Error('Invalid phone ticket');
  const url = new URL('/', origin);
  if (url.protocol !== 'https:') throw new Error('Phone transfer requires HTTPS');
  url.searchParams.set('schema', '2');
  url.searchParams.set('network', cap.networkId);
  url.searchParams.set('contract', cap.contract);
  url.hash = encodeAdmitFragmentPath(cap);
  return url.toString();
}
