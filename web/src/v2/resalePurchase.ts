import type { AdmitCapabilityV2 } from './admitCodec.ts';

type OwnedRow = { serial: bigint; epoch: bigint; typeId: bigint };
type Host = {
  state(): Promise<{ ownedTickets?: OwnedRow[] } | null>;
  call(circuit: string, args: bigint[]): Promise<{ txId: string }>;
  registerAdmitOnly(serial: bigint, names: { ticketName: string; eventName: string }): Promise<{ cap: AdmitCapabilityV2; admitTxId: string }>;
};
export type ResaleReceipt = { serial: bigint; typeId: bigint; expectedEpoch: bigint; buyTxId: string; ticketName: string; eventName: string };
export type ResaleOutcome =
  | { kind: 'ready'; receipt: ResaleReceipt; cap: AdmitCapabilityV2; txId: string }
  | { kind: 'needs-prepare'; receipt: ResaleReceipt; error: string; txId: string };

/** Retry only preparation. A purchase must already be confirmed; never calls buyResale. */
export async function preparePurchasedResale(host: Host, receipt: ResaleReceipt): Promise<ResaleOutcome> {
  try {
    const state = await host.state();
    const row = state?.ownedTickets?.find((t) => t.serial === receipt.serial);
    if (!row || row.typeId !== receipt.typeId || row.epoch !== receipt.expectedEpoch) {
      throw new Error('Waiting for confirmed ownership. Retry preparation once the ticket is visible.');
    }
    const prepared = await host.registerAdmitOnly(receipt.serial, {ticketName:receipt.ticketName,eventName:receipt.eventName});
    // Only expose the capability after registerAdmitOnly confirms the registration.
    return {kind:'ready',receipt,cap:prepared.cap,txId:prepared.admitTxId};
  } catch (error: unknown) {
    return {kind:'needs-prepare',receipt,error:error instanceof Error ? error.message : 'Ticket preparation failed.',txId:receipt.buyTxId};
  }
}

/** Two intentional transactions: purchase then prepare; there is no atomic activation. */
export async function buyResaleAndPrepare(host: Host, args: {
  listingId: bigint; serial: bigint; typeId: bigint; listedEpoch: bigint;
  adult: boolean; asOf: bigint; ticketName: string; eventName: string;
}): Promise<ResaleOutcome> {
  const buy = await host.call(args.adult ? 'buyResaleAdult' : 'buyResale', args.adult ? [args.listingId,args.asOf] : [args.listingId]);
  const receipt: ResaleReceipt = {serial:args.serial,typeId:args.typeId,expectedEpoch:args.listedEpoch+1n,buyTxId:buy.txId,ticketName:args.ticketName,eventName:args.eventName};
  return preparePurchasedResale(host, receipt);
}
