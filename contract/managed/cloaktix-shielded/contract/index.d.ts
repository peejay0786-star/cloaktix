import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type EventInfo = { organizer: Uint8Array;
                          payout: ZswapCoinPublicKey;
                          open: boolean
                        };

export type TicketType = { eventId: bigint;
                           price: bigint;
                           fee: bigint;
                           supply: bigint;
                           sold: bigint;
                           maxResale: bigint
                         };

export type Listing = { seller: Uint8Array;
                        typeId: bigint;
                        price: bigint;
                        fee: bigint
                      };

export type ContractAddress = { bytes: Uint8Array };

export type Either<A, B> = { is_left: boolean; left: A; right: B };

export type Maybe<T> = { is_some: boolean; value: T };

export type UserAddress = { bytes: Uint8Array };

export type ZswapCoinPublicKey = { bytes: Uint8Array };

export type ShieldedCoinInfo = { nonce: Uint8Array;
                                 color: Uint8Array;
                                 value: bigint
                               };

export type QualifiedShieldedCoinInfo = { nonce: Uint8Array;
                                          color: Uint8Array;
                                          value: bigint;
                                          mt_index: bigint
                                        };

export type Witnesses<PS> = {
  wit_CloakSK(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  wrap(context: __compactRuntime.CircuitContext<PS>,
       amount_0: bigint,
       nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unwrap(context: __compactRuntime.CircuitContext<PS>,
         coin_0: ShieldedCoinInfo,
         to_0: UserAddress): __compactRuntime.CircuitResults<PS, []>;
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: ZswapCoinPublicKey): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                maxResale_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                typeId_0: bigint,
                price_0: bigint,
                fee_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>,
            listingId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  claimProceeds(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelListing(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, typeId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  wrap(context: __compactRuntime.CircuitContext<PS>,
       amount_0: bigint,
       nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unwrap(context: __compactRuntime.CircuitContext<PS>,
         coin_0: ShieldedCoinInfo,
         to_0: UserAddress): __compactRuntime.CircuitResults<PS, []>;
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: ZswapCoinPublicKey): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                maxResale_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                typeId_0: bigint,
                price_0: bigint,
                fee_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>,
            listingId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  claimProceeds(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelListing(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, typeId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  accountId(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  wrap(context: __compactRuntime.CircuitContext<PS>,
       amount_0: bigint,
       nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unwrap(context: __compactRuntime.CircuitContext<PS>,
         coin_0: ShieldedCoinInfo,
         to_0: UserAddress): __compactRuntime.CircuitResults<PS, []>;
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: ZswapCoinPublicKey): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                maxResale_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                typeId_0: bigint,
                price_0: bigint,
                fee_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>,
            listingId_0: bigint,
            feeCoin_0: ShieldedCoinInfo,
            restCoin_0: ShieldedCoinInfo): __compactRuntime.CircuitResults<PS, []>;
  claimProceeds(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  cancelListing(context: __compactRuntime.CircuitContext<PS>,
                listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, typeId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  accountId(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly feeBps: bigint;
  readonly feeKey: ZswapCoinPublicKey;
  events: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): EventInfo;
    [Symbol.iterator](): Iterator<[bigint, EventInfo]>
  };
  ticketTypes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): TicketType;
    [Symbol.iterator](): Iterator<[bigint, TicketType]>
  };
  listings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Listing;
    [Symbol.iterator](): Iterator<[bigint, Listing]>
  };
  proceeds: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): QualifiedShieldedCoinInfo;
    [Symbol.iterator](): Iterator<[bigint, QualifiedShieldedCoinInfo]>
  };
  soldListings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  readonly eventCount: bigint;
  readonly typeCount: bigint;
  readonly listingCount: bigint;
  readonly wrapped: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               uri__0: string,
               feeBps__0: bigint,
               feeKey__0: ZswapCoinPublicKey): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
