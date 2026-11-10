// DEMO / TEST-ONLY age-issuer key placeholder for the CloakTix Preview Worker.
// This file is not a real key. Copy it to passport-demo-key.js (gitignored)
// and set DEMO_ISSUER_SK_HEX to a locally generated Jubjub scalar (hex).
//
// From preview-worker/, after compact-runtime is installed (npm install here
// or in web/):
//
//   node --input-type=module -e \
//     "import { newIssuerSecret } from '../contract/age-credential.mjs'; \
//      console.log(newIssuerSecret().toString(16))"
//
// Do not commit passport-demo-key.js. A contract already deployed with a
// different issuer public key will reject credentials from a new key.
// Changing the issuer on a live contract requires an adminSet transaction
// signed by the contract admin. Do not rotate a deployed issuer lightly.
export const DEMO_ISSUER_SK_HEX = 'REPLACE_WITH_A_LOCALLY_GENERATED_JUBJUB_SCALAR_HEX';
