// SPDX-License-Identifier: Apache-2.0
// The secret key stays in the user's local private state; only H(sk) appears on-chain.
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from './managed/cloaktix/contract/index.js';

// age: optional 18+ credential (see age-credential.mjs). It never leaves the prover.
export type JubjubPoint = { x: bigint; y: bigint };
export type AgeCredential = {
  claim: { holder: Uint8Array; adultFrom: bigint };
  proof: { issuerMethod: Uint8Array; createdAt: bigint; challengeHash: Uint8Array; publicKey: JubjubPoint; signature: { r: JubjubPoint; s: bigint } };
};
export type CloakPrivateState = { sk: Uint8Array; age?: AgeCredential };
export const createPrivateState = (sk: Uint8Array, age?: AgeCredential): CloakPrivateState => (age ? { sk, age } : { sk });

// Placeholder used when no credential is held (is_some = false makes 18+ purchases fail).
// The circuit always evaluates the age check, so this must be a well-formed credential: it is a valid
// signature by a throwaway key (discarded), for holder 0x00..00, adultFrom = max (never adult).
const h = (x: string) => Uint8Array.from(x.match(/../g)!.map((b) => parseInt(b, 16)));
const NO_CREDENTIAL: AgeCredential = {
  claim: { holder: new Uint8Array(32), adultFrom: 18446744073709551615n },
  proof: {
    issuerMethod: h('636c6f616b7469783a70617373706f72742d73747562236b65792d3100000000'), createdAt: 0n, challengeHash: new Uint8Array(32),
    publicKey: { x: 8753936120210130367113005353189060115489902607078026087517057563491166454165n, y: 45450282897192758515244399096431182369164875147436629843198669205457875813759n },
    signature: {
      r: { x: 725939171581082087201224381538893331781234423093890994299371219444391293941n, y: 44819509509887581123996769068327021080379603086843589186208181673127674977265n },
      s: 5853952376788584010418431608723227523706966163121854756166586538759889041591n,
    },
  },
};
type Ctx = WitnessContext<Ledger, CloakPrivateState>;
export const witnesses = {
  wit_CloakSK: ({ privateState }: Ctx): [CloakPrivateState, Uint8Array] => [privateState, privateState.sk],
  wit_AgeCredential: ({ privateState }: Ctx): [CloakPrivateState, { is_some: boolean; value: AgeCredential }] =>
    [privateState, privateState.age ? { is_some: true, value: privateState.age } : { is_some: false, value: NO_CREDENTIAL }],
  // required by the OZ MultiToken module (no exported circuit uses it)
  wit_MultiTokenSK: ({ privateState }: Ctx): [CloakPrivateState, Uint8Array] => [privateState, privateState.sk],
};
