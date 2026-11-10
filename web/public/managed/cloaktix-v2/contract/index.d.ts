import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum ResaleMode { capped = 0, unlimited = 1, none = 2 }

export enum TicketStatus { owned = 0, listed = 1, consumed = 2 }

export type AgeClaim = { holder: Uint8Array; adultFrom: bigint };

export type AgeSignature = { r: __compactRuntime.JubjubPoint; s: bigint };

export type AgeProof = { issuerMethod: Uint8Array;
                         createdAt: bigint;
                         challengeHash: Uint8Array;
                         publicKey: __compactRuntime.JubjubPoint;
                         signature: AgeSignature
                       };

export type AgeCredential = { claim: AgeClaim; proof: AgeProof };

export type EventInfo = { organizer: Uint8Array;
                          payout: UserAddress;
                          open: boolean
                        };

export type TicketType = { eventId: bigint;
                           price: bigint;
                           fee: bigint;
                           supply: bigint;
                           sold: bigint;
                           resale: ResaleMode;
                           maxResale: bigint;
                           adultOnly: boolean
                         };

export type Ticket = { typeId: bigint;
                       owner: Uint8Array;
                       status: TicketStatus;
                       epoch: bigint;
                       hasAdmit: boolean;
                       admitCommit: Uint8Array;
                       listingId: bigint
                     };

export type Listing = { seller: Uint8Array;
                        payout: UserAddress;
                        serial: bigint;
                        typeId: bigint;
                        price: bigint;
                        fee: bigint
                      };

export type AdmitMaterial = { tag: Uint8Array;
                              networkTag: Uint8Array;
                              contractKey: Uint8Array;
                              serial: bigint;
                              epoch: bigint;
                              nonce: Uint8Array
                            };

export type ContractAddress = { bytes: Uint8Array };

export type Either<A, B> = { is_left: boolean; left: A; right: B };

export type Maybe<T> = { is_some: boolean; value: T };

export type UserAddress = { bytes: Uint8Array };

export type Witnesses<PS> = {
  wit_CloakSK(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  wit_AgeCredential(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Maybe<AgeCredential>];
}

export type ImpureCircuits<PS> = {
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                resale_0: ResaleMode,
                maxResale_0: bigint,
                adultOnly_0: boolean): __compactRuntime.CircuitResults<PS, bigint>;
  setSalesOpen(context: __compactRuntime.CircuitContext<PS>,
               eventId_0: bigint,
               open_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            admitCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicketAdult(context: __compactRuntime.CircuitContext<PS>,
                 typeId_0: bigint,
                 admitCommit_0: Uint8Array,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  registerAdmit(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>, listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  buyResaleAdult(context: __compactRuntime.CircuitContext<PS>,
                 listingId_0: bigint,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  admit(context: __compactRuntime.CircuitContext<PS>,
        serial_0: bigint,
        nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, serial_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  adminSet(context: __compactRuntime.CircuitContext<PS>,
           paused__0: boolean,
           newIssuer_0: Maybe<__compactRuntime.JubjubPoint>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                resale_0: ResaleMode,
                maxResale_0: bigint,
                adultOnly_0: boolean): __compactRuntime.CircuitResults<PS, bigint>;
  setSalesOpen(context: __compactRuntime.CircuitContext<PS>,
               eventId_0: bigint,
               open_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            admitCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicketAdult(context: __compactRuntime.CircuitContext<PS>,
                 typeId_0: bigint,
                 admitCommit_0: Uint8Array,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  registerAdmit(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>, listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  buyResaleAdult(context: __compactRuntime.CircuitContext<PS>,
                 listingId_0: bigint,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  admit(context: __compactRuntime.CircuitContext<PS>,
        serial_0: bigint,
        nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, serial_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  adminSet(context: __compactRuntime.CircuitContext<PS>,
           paused__0: boolean,
           newIssuer_0: Maybe<__compactRuntime.JubjubPoint>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  accountId(sk_0: Uint8Array): Uint8Array;
  ageChallenge(claim_0: AgeClaim,
               issuerMethod_0: Uint8Array,
               createdAt_0: bigint,
               challengeHash_0: Uint8Array,
               publicKey_0: __compactRuntime.JubjubPoint,
               r_0: __compactRuntime.JubjubPoint): bigint;
  contractKeyOf(addr_0: ContractAddress): Uint8Array;
  admitCommitOf(networkTag__0: Uint8Array,
                contractKey_0: Uint8Array,
                serial_0: bigint,
                epoch_0: bigint,
                nonce_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  accountId(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  ageChallenge(context: __compactRuntime.CircuitContext<PS>,
               claim_0: AgeClaim,
               issuerMethod_0: Uint8Array,
               createdAt_0: bigint,
               challengeHash_0: Uint8Array,
               publicKey_0: __compactRuntime.JubjubPoint,
               r_0: __compactRuntime.JubjubPoint): __compactRuntime.CircuitResults<PS, bigint>;
  contractKeyOf(context: __compactRuntime.CircuitContext<PS>,
                addr_0: ContractAddress): __compactRuntime.CircuitResults<PS, Uint8Array>;
  admitCommitOf(context: __compactRuntime.CircuitContext<PS>,
                networkTag__0: Uint8Array,
                contractKey_0: Uint8Array,
                serial_0: bigint,
                epoch_0: bigint,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  createEvent(context: __compactRuntime.CircuitContext<PS>,
              payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  addTicketType(context: __compactRuntime.CircuitContext<PS>,
                eventId_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                supply_0: bigint,
                resale_0: ResaleMode,
                maxResale_0: bigint,
                adultOnly_0: boolean): __compactRuntime.CircuitResults<PS, bigint>;
  setSalesOpen(context: __compactRuntime.CircuitContext<PS>,
               eventId_0: bigint,
               open_0: boolean): __compactRuntime.CircuitResults<PS, []>;
  buyTicket(context: __compactRuntime.CircuitContext<PS>,
            typeId_0: bigint,
            admitCommit_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  buyTicketAdult(context: __compactRuntime.CircuitContext<PS>,
                 typeId_0: bigint,
                 admitCommit_0: Uint8Array,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, bigint>;
  registerAdmit(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                commit_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  listForResale(context: __compactRuntime.CircuitContext<PS>,
                serial_0: bigint,
                price_0: bigint,
                fee_0: bigint,
                payout_0: UserAddress): __compactRuntime.CircuitResults<PS, bigint>;
  buyResale(context: __compactRuntime.CircuitContext<PS>, listingId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  buyResaleAdult(context: __compactRuntime.CircuitContext<PS>,
                 listingId_0: bigint,
                 asOf_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  admit(context: __compactRuntime.CircuitContext<PS>,
        serial_0: bigint,
        nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveHolder(context: __compactRuntime.CircuitContext<PS>, serial_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  adminSet(context: __compactRuntime.CircuitContext<PS>,
           paused__0: boolean,
           newIssuer_0: Maybe<__compactRuntime.JubjubPoint>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly schemaVersion: bigint;
  readonly networkTag: Uint8Array;
  readonly feeBps: bigint;
  readonly feeAddress: UserAddress;
  readonly admin: Uint8Array;
  readonly paused: boolean;
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
  tickets: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Ticket;
    [Symbol.iterator](): Iterator<[bigint, Ticket]>
  };
  listings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Listing;
    [Symbol.iterator](): Iterator<[bigint, Listing]>
  };
  readonly eventCount: bigint;
  readonly typeCount: bigint;
  readonly serialCount: bigint;
  readonly listingCount: bigint;
  readonly ageIssuer: __compactRuntime.JubjubPoint;
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
               feeBps__0: bigint,
               feeAddress__0: UserAddress,
               admin__0: Uint8Array,
               ageIssuer__0: __compactRuntime.JubjubPoint,
               networkTag__0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
