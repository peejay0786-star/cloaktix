/** Schema-3 PurchaseButton inputs for an EventCard ticket row (NIGHT checkout only). */
export type V3PurchaseProps = { usdCents: bigint; mintKey: string };

export function v3PurchaseProps(args: {
  schema: number | undefined;
  networkId: string;
  contract: string | null;
  eventId: bigint;
  typeId: bigint;
  priceUsdCents: bigint;
}): V3PurchaseProps | null {
  if (args.schema !== 3 || !args.contract) return null;
  return {
    usdCents: args.priceUsdCents,
    mintKey: `${args.networkId}:${args.contract}:type:${args.typeId}`,
  };
}
