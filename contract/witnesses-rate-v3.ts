// Local witnesses for cloaktix-rate-v3 sketch (mirrors witnesses-v2).
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
export type JubjubPoint = { x: bigint; y: bigint };
export type AgeCredential = {
  claim: { holder: Uint8Array; adultFrom: bigint };
  proof: { issuerMethod: Uint8Array; createdAt: bigint; challengeHash: Uint8Array; publicKey: JubjubPoint; signature: { r: JubjubPoint; s: bigint } };
};
export type CloakPrivateState = { sk: Uint8Array; age?: AgeCredential | null };
const EMPTY = new Uint8Array(32);
const ZERO_POINT = { x: 0n, y: 1n };
const emptyAge = (): AgeCredential => ({
  claim: { holder: EMPTY, adultFrom: 0n },
  proof: {
    issuerMethod: EMPTY, createdAt: 0n, challengeHash: EMPTY, publicKey: ZERO_POINT,
    signature: { r: ZERO_POINT, s: 0n },
  },
});
export const witnesses = {
  wit_CloakSK({ privateState }: WitnessContext<unknown, CloakPrivateState>): [CloakPrivateState, Uint8Array] {
    return [privateState, privateState.sk];
  },
  wit_AgeCredential({ privateState }: WitnessContext<unknown, CloakPrivateState>): [CloakPrivateState, { is_some: boolean; value: AgeCredential }] {
    const age = privateState.age ?? null;
    return [privateState, age ? { is_some: true, value: age } : { is_some: false, value: emptyAge() }];
  },
};
