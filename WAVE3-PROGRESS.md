# Progress during Wave 3

A draft write-up of what CloakTix actually did during Midnight Buildathon Wave 3. Dates use America/Toronto. This is not a marketing page. It only records work that was implemented, published, or confirmed live.

CloakTix is a private ticketing app on Midnight Preview. Buyers pay in NIGHT, with prices shown in USD and a NIGHT equivalent. The wallet is 1AM. The live contract is `b92733389b1955c913dec004df708a12697df4a962ffab5dbde1e88f574ab04e`.

## Ledger 9 migration

On 6 November 2026, Midnight Preview was reset as a new chain. It relaunched on 7 November 2026 on ledger 9.1.0.1. Contracts, balances, and DUST registrations from the previous Preview chain were gone. Ledger 8 artifacts could no longer be submitted.

On 7 November 2026 the app and the rate-v3 contract were upgraded locally: Compact toolchain 0.36.0 (language 0.28.0), Midnight.js 5.0.0, compact-runtime 0.21.0, on-chain runtime v4, Compact.js 3.0.0, DApp Connector 4.1.0, and ZKIR v3. The rate-v3 contract was recompiled with new proving and verifier keys. Create-event form polish (cover compression, clearer validation, reachable error text) was kept with that upgrade.

On 9 November 2026, 09:19, the ledger 9 build was published to `cloaktix-app` (`app.cloaktix.com`), still behind Cloudflare Access, with no baked contract address yet. A follow-up the same morning fixed Midnight.js 5 private-state and ledger 9 runtime issues (`forContract` / signing-key handling) so a real deploy could proceed.

## Contract deploy and first event

Later on 9 November 2026, the owner deployed the rate-v3 contract from the upgraded app with 1AM. The new address is `b92733389b1955c913dec004df708a12697df4a962ffab5dbde1e88f574ab04e`. A read-only indexer check showed schema version 3, `feeBps` 300, unpaused, and all 13 operations present (`createEvent`, `addTicketType`, `setSalesOpen`, `buyTicket`, `buyTicketAdult`, `buyResale`, `buyResaleAdult`, `admit`, `registerAdmit`, `listForResale`, `adminSet`, plus the unused ADA buy circuits). That address was baked into the app and published at 10:22 the same day.

Event 1 was created on 2026-11-09 as the first real `createEvent` on this contract. A typeless on-chain entry (event 2) also exists. It is the one-time metadata-key registration, not a public event. The buyer catalog hides it.

The same day, a first ticket was bought on event 1 (serial 1, ticket type 2). A later Create event crash after a large cover image was diagnosed and published: base64url payload handling and the Organize event page were fixed so the real event could be managed without hitting the error boundary.

## In-tab ZKIR v3 prover

1AM 6.4.x proves v2 circuits. Compact 0.36.0, required for ledger 9, emits only ZKIR v3. After the new contract was live, Create event failed at the proof step for that reason. The chosen fix, shipped the same day, was for the app to prove its own circuits in a tab worker with the official ZKIR v3 WASM. 1AM still balances, pays DUST, and submits. No contract redeploy was needed. The 13 on-chain verifier keys already matched the compiled artifacts.

Artifact download and hashing were then cached (`cloaktix-zk-v1`) and prewarmed when the buyer clicks Buy, so the same prover key is not fetched four times per call. In-tab `buyTicket` proofs still take on the order of 30 to 40 seconds of WASM time. That is the floor until a multithreaded v3 prover is available.

Send to phone, which had crashed on a live ticket (CT-Error-T0NO6), was also fixed and republished that day.

## Multi-buy and error 227

Buyers asked to buy more than one ticket at a time. The first published design proved and submitted N separate `buyTicket` calls. A live attempt to buy 3 tickets failed in 1AM with error 227 (unshielded inputs are not disjoint): two intents spent the same NIGHT coin.

The fix, implemented and published on 9 November 2026, merges every `buyTicket` call into a single intent, in purchase order, before proving (`web/src/midnight/singleIntent.ts`). 1AM then sees one intent and one NIGHT input set. The purchase is all-or-nothing. Local ledger tests succeeded for quantities 2, 3, and 4. After that publish, a live 1AM test on version `037cd587` confirmed that the single-intent multi-buy is accepted (recorded at 17:25 America/Toronto on 2026-11-09).

18+ types stay on a single-ticket path. Multi-buy is offered on ordinary types, with a quantity cap of 4.

## CT-POLISH-3

After multi-buy worked live, three product fixes were implemented and published the same evening (live version `440531e4` at 20:01 America/Toronto):

1. Buyers no longer see the typeless key-registration entry. Events with no ticket types are hidden from the catalog, the Events grid, and `/e/:id`. Organizers still see their own events that simply have no types yet.
2. Exact duplicate ticket types on event 1 (two General admission types at the same price and rules) are collapsed in the buyer UI into one row with combined sold/capacity. Buys go to the lowest-id member that still has stock. Existing tickets keep their own type. Organize event still lists both, with a note, and adding a type with the same name is blocked.
3. The service worker no longer deletes the `cloaktix-zk-*` proof cache on activate, so a later visit does not re-download prover keys.

Those on-chain leftovers cannot be deleted without a new contract. They are hidden or merged in the UI only.

## Age credential and ticket type labels

On the evening of 9 November 2026, a live attempt to buy the 18+ "after party" type ($75, event 1) failed with "No age credential" because Buy was still offered before the demo credential had been issued. Nothing was submitted or spent.

The app was changed so an 18+ type shows an age step first: the buyer uses "Get demo age credential" on the Age check card (Passport stub issuer at `/passport/issuer` and `/passport/issue`). The contract checks the credential and learns only "adult: yes". A missing, minor, foreign, or untrusted credential blocks Buy with plain English, before any rate quote or proof. The live contract's `ageIssuer` matches the Worker's test issuer. This remains a demo issuer. Real verification later would be one `adminSet` signed by the contract admin, with no new contract.

Separately, each ticket now shows its ticket type name, and My tickets uses a two-column grid of square-ish cards (one column under 420 px). Type names appear once ticket-type details are loaded in a connected view.

Age credential, type labels, and the My tickets layout were published together after those local fixes.

## What was already in place before 9 November

Work earlier in Wave 3, including after the previous Preview chain, remains part of the product and was carried through the ledger 9 upgrade:

- Walletless catalog of organizer-published events
- Required organizer fields (name, date, place, description, cover) and the immutable NIGHT payout note
- An Organize event management page
- NIGHT-only checkout, USD prices with a NIGHT equivalent
- Home / Events / My tickets buyer navigation
- Print, show QR, and send to phone
- Multi-door (schema 4) designed and implemented locally, then left fail-closed, with no v4 contract on Preview

Coming Soon on `cloaktix.com` was left unchanged through these publishes. The logo was not modified.

## Honest leftover limits

- The age issuer is still the demo Passport stub.
- Multi-door remains fail-closed.
- Resale and check-in were not end-to-end verified with 1AM on contract `b92733` during this period.
- Payments are unshielded NIGHT (pseudonymous, not shielded).
- The app is a prototype and is not audited.
- In-tab proving is still tens of seconds per `buyTicket` proof.

This file is a draft for the Wave 3 progress write-up. It can be edited before any public submission.
