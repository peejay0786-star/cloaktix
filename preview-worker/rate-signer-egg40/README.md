# EGG-40 rate signer TTL (local only)

Nothing in this folder is a secret, a key, or a deployable worker.

The live Preview rate-v3 contract (maxQuoteAge 180) and its running signer stay at 180 seconds until P-Jay switches both together.

The EGG-40 contract will be deployed with maxQuoteAge 300 (allowed range 60-600). The signer that serves that contract must issue quotes with TTL_SEC = 300 in the same change. Do not rotate the signer key. Do not change Access.

When going live, P-Jay sets TTL_SEC = 300 on the signer and deploys the new contract with maxQuoteAge 300. This folder is only the documented local value (ttl.mjs) so the wiring can be tested without touching the unreleased live signer.
