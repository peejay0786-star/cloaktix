import { readContractState } from './contractStateRead';
import { PRIVATE_STATE_ID_V4, V4_LOCAL_ONLY } from './contract-v4';
import { stateV4, callV4 } from './session-v4';
import { registerSerialAdmitV4, admitSerialV4 } from './serialAdmitV4';
import { registerSerialAdmitV3, admitSerialV3 } from './serialAdmitV3';
import type { ContractState } from './viewTypes';
import { walletAdapters } from './walletAdapter';
// Browser-side CloakTix operations: deploy, circuit calls, ledger reads, gate verification.
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { CompiledCloakTix, PRIVATE_STATE_ID, ledger, pureCircuits, createPrivateState, FEE_BPS, balanceOfLocal } from './contract';
import type { AgeCredential } from '../../../contract/witnesses.js';
import { createProviders, indexerUris } from './providers';
import { resolveSchema, contractStorageKey, schemaIncompatibleMessage, type CloakSchema } from './schema';
import { detectOnChainSchema } from './detectSchema';
import * as v2 from './session-v2';
import { PRIVATE_STATE_ID_V2, createPrivateStateV2 } from './contract-v2';
import { PRIVATE_STATE_ID_V3, createPrivateStateV3, configuredRateV3Contract } from './contract-v3';
import * as v3 from './session-v3';
import { buyNightV3Multi } from './multiBuyV3';
import { loadV3DeployProgress } from './deployV3Plan';
import { parseCredential, ageStatusFor, assertCanProveAdult, AGE_CHANGED_EVENT } from './ageCredential';

/** A selected contract that is this device's own unfinished batched v3 deploy is resumed, not replaced. */
function isUnfinishedV3Deploy(networkId: string, contract: string): boolean {
  const p = loadV3DeployProgress(networkId);
  return !!p?.address && p.address.toLowerCase() === contract.toLowerCase() && p.status !== 'done';
}

export type Wallet = { name: string; icon?: string; rdns: string; dev?: boolean; connect(n: string): Promise<any> };
export function discoverWallets(): Wallet[] {
  return walletAdapters('midnight' in window ? window.midnight : undefined);
}
const hex = (u: Uint8Array) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));
// ---- 18+ age credential (test issuer "Passport stub"; Midnight Passport once it launches) ----
// Local dev: node web/passport-stub/server.mjs on :8798. Deployed preview: same-origin /passport/* served by the preview Worker.
const isLocalHost = typeof location !== 'undefined' && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
export const PASSPORT_STUB = (import.meta.env.VITE_PASSPORT_STUB as string) ?? (isLocalHost ? 'http://127.0.0.1:8798' : '/passport');
// Optional public key of the test issuer ("x,y" decimal), used if the issuer is unreachable at deploy time.
const PASSPORT_FALLBACK_PK = import.meta.env.VITE_PASSPORT_ISSUER_PK as string | undefined;
export const AGE_NOTE = 'Age verification will use Midnight Passport once it launches. Demo uses a test issuer.';
const pt = (p: any) => ({ x: BigInt(p.x), y: BigInt(p.y) });
// parseCredential lives in ./ageCredential (CT-AGE-CRED).
export async function stubIssuer(): Promise<{ x: bigint; y: bigint }> {
  const r = await fetch(`${PASSPORT_STUB}/issuer`).catch(() => null);
  if (r?.ok) try { return pt((await r.json()).publicKey); } catch { /* fall through */ }
  if (PASSPORT_FALLBACK_PK) {
    const [x, y] = PASSPORT_FALLBACK_PK.split(',');
    console.warn(`Passport test issuer not reachable at ${PASSPORT_STUB}/issuer; deploying with VITE_PASSPORT_ISSUER_PK.`);
    return pt({ x, y });
  }
  throw new Error(`Passport stub not reachable at ${PASSPORT_STUB} (run: node web/passport-stub/server.mjs)`);
}
export const nowAsOf = () => BigInt(Math.floor(Date.now() / 1000) - 120); // buyer-chosen time, slightly in the past

export const feeOf = (price: bigint, bps = FEE_BPS) => (price * bps) / 10000n;

export class Session {
  contract: string | null;
  config: any = null; // cached wallet configuration (no repeat getConfiguration calls)
  schema: CloakSchema = 1;
  private constructor(public api: any, public P: any, public networkId: string, public address: string, public sk: Uint8Array, public walletName: string) {
    this.schema = resolveSchema();
    const q = new URLSearchParams(location.search).get('contract');
    const ck = contractStorageKey(this.schema, networkId);
    if (q) localStorage.setItem(ck, q); // shared link stays selected for THIS schema only
    this.contract = q ?? localStorage.getItem(ck);
    // Never silently promote a legacy unscoped key into schema 2 or 3.
    // Ledger 9 (Preview reset 2026-11-07): the legacy unscoped ledger-8 address is never promoted; it is dead on the new chain.
    // Schema 3 uses the configured v3 deployment when no URL/local contract is selected.
    if (!this.contract && this.schema === 3) {
      const gated = configuredRateV3Contract(networkId);
      if (gated) { this.contract = gated; localStorage.setItem(ck, gated); }
    }
  }
  static async connect(w: Wallet, networkId: string) {
    const label = (x: string) => x === 'undeployed' ? 'Local devnet' : x.charAt(0).toUpperCase() + x.slice(1);
    let api: any;
    try { api = await w.connect(networkId); }
    catch (e: any) { throw new Error(`Switch ${w.name} to the ${label(networkId)} network, then try again (the wallet rejected connect('${networkId}'): ${String(e?.message ?? e)})`); }
    const status = await api.getConnectionStatus?.().catch(() => null);
    const cfg0 = await api.getConfiguration().catch(() => null);
    const walletNet = status?.networkId ?? cfg0?.networkId;
    if (walletNet && walletNet !== networkId) throw new Error(`Switch ${w.name} to the ${label(networkId)} network: the wallet is on '${walletNet}', this app runs on '${networkId}'`);
    // DApp Connector v4 hintUsage: lets the wallet ask for all permissions once at connect instead of per call (optional; ignored if unsupported).
    try { await api.hintUsage?.(['getConfiguration', 'getUnshieldedAddress', 'getShieldedAddresses', 'getUnshieldedBalances', 'getDustBalance', 'getProvingProvider', 'balanceUnsealedTransaction', 'submitTransaction', 'signData']); } catch { /* optional */ }
    let schema = resolveSchema();
    const explicitSchema = (() => { try { return new URLSearchParams(location.search).get('schema'); } catch { return null; } })();
    let { providers, config } = await createProviders(api, { schema });
    // Legacy-default share links may omit schema but carry a contract: detect v2/v3 and
    // bind the matching providers before constructing the session or reading its ledger.
    const urlContract = (() => { try { return new URLSearchParams(location.search).get('contract'); } catch { return null; } })();
    if (!explicitSchema && schema === 1 && urlContract) {
      const detected = await detectOnChainSchema(providers.publicDataProvider, urlContract);
      if (detected === 4 || detected === 3 || detected === 2) {
        schema = detected;
        ({ providers, config } = await createProviders(api, { schema }));
      }
    }
    const { unshieldedAddress } = await api.getUnshieldedAddress();
    // CloakTix identity = H(sk). sk cached in localStorage (demo: unencrypted). Sources, in order:
    // 1. an existing key on this device (legacy random keys keep working), 2. derived from the wallet if its signData is
    // deterministic (same wallet on any device = same tickets), 3. a random device key (move it with a transfer code).
    const key = skKey(config.networkId, unshieldedAddress);
    let skHex = localStorage.getItem(key);
    if (!skHex) {
      const d = await deriveFromWallet(api, config.networkId, unshieldedAddress).catch((e) => { console.warn('wallet-derived identity unavailable:', e?.message ?? e); return null; });
      skHex = d ?? hex(crypto.getRandomValues(new Uint8Array(32)));
      localStorage.setItem(key, skHex); localStorage.setItem(key + ':src', d ? 'wallet' : 'device');
    }
    const s = new Session(api, providers, config.networkId, unshieldedAddress, unhex(skHex), w.name); s.config = config;
    // Constructor re-reads resolveSchema(); retain an on-chain-detected upgrade and its schema-specific contract key.
    if ((schema === 4 || schema === 3 || schema === 2) && s.schema !== schema) {
      s.schema = schema;
      if (urlContract) {
        localStorage.setItem(contractStorageKey(schema, config.networkId), urlContract);
        s.contract = urlContract;
      }
    }
    s.idSource = (localStorage.getItem(key + ':src') as any) ?? 'device';
    const saved = localStorage.getItem(s.ageKey);
    s.age = saved ? parseCredential(JSON.parse(saved)) : null;
    if (s.schema === 4) {
      await providers.privateStateProvider.seed(PRIVATE_STATE_ID_V4, createPrivateStateV3(s.sk, s.age ?? undefined));
    } else if (s.schema === 3) {
      await providers.privateStateProvider.seed(PRIVATE_STATE_ID_V3, createPrivateStateV3(s.sk, s.age ?? undefined));
    } else if (s.schema === 2) {
      await providers.privateStateProvider.seed(PRIVATE_STATE_ID_V2, createPrivateStateV2(s.sk, s.age ?? undefined));
    } else {
      await providers.privateStateProvider.seed(PRIVATE_STATE_ID, createPrivateState(s.sk, s.age ?? undefined));
    }
    return s;
  }
  age: AgeCredential | null = null;
  idSource: 'wallet' | 'device' | 'imported' = 'device';
  // Transfer code = the identity secret itself: whoever has it can use these tickets. Shown only on request.
  // Metadata signing key (Ed25519), derived from sk; its public key is bound on-chain to H(sk) by createEvent(payout = pk).
  private mk?: Promise<{ priv: CryptoKey; pk: string } | null>;
  metaKey() {
    return (this.mk ??= (async () => {
      try {
        const te = new TextEncoder().encode('cloaktix:meta-key:v1:'); const buf = new Uint8Array(te.length + 32); buf.set(te); buf.set(this.sk, te.length);
        const seed = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
        const pkcs8 = new Uint8Array([...unhex('302e020100300506032b657004220420'), ...seed]);
        const priv = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign']);
        const x = (await crypto.subtle.exportKey('jwk', priv)).x!;
        return { priv, pk: hex(Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0))) };
      } catch (e) { console.warn('Ed25519 unavailable', e); return null; }
    })());
  }
  async signMeta(msg: string) { const k = await this.metaKey(); if (!k) throw new Error('This browser cannot sign (Ed25519 missing)');
    return { pk: k.pk, sig: hex(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, k.priv, new TextEncoder().encode(msg)))) }; }
  /** @deprecated CT-V1 removed from UI — do not expose in product flows. */
  transferCode() { return `cloaktix:key:v1:${this.networkId}:${hex(this.sk)}`; }
  /** @deprecated CT-V1 removed from UI — do not expose in product flows. */
  importTransferCode(code: string) {
    const m = code.trim().match(/^cloaktix:key:v1:([^:]+):([0-9a-f]{64})$/i);
    if (!m) throw new Error('Not a CloakTix transfer code');
    if (m[1] !== this.networkId) throw new Error(`This code is for ${m[1]}, not ${this.networkId}`);
    const k = skKey(this.networkId, this.address);
    if (hex(this.sk) !== m[2].toLowerCase()) localStorage.setItem(`${k}:prev:${Date.now()}`, hex(this.sk)); // keep the replaced key recoverable
    localStorage.setItem(k, m[2].toLowerCase()); localStorage.setItem(k + ':src', 'imported'); this.mk = undefined;
  }
  // Credential stays on this device (private state); the contract only learns "adult: yes".
  get ageKey() { return `cloaktix:age:${this.networkId}:${this.accountId}`; }
  get ageStatus(): 'none' | 'adult' | 'minor' {
    const st = ageStatusFor(this.age, nowAsOf());
    return st === 'untrusted' ? 'none' : st;
  }
  private ageChanged() { try { window.dispatchEvent(new Event(AGE_CHANGED_EVENT)); } catch { /* non-browser */ } }
  async getAgeCredential(birthdate: string) {
    const r = await fetch(`${PASSPORT_STUB}/issue`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ holder: this.accountId, birthdate }) }).catch(() => null);
    if (!r) throw new Error(`Passport stub not reachable at ${PASSPORT_STUB}`);
    const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Issuer error');
    this.age = parseCredential(j); localStorage.setItem(this.ageKey, JSON.stringify(j));
    await this.P.privateStateProvider.seed(
      this.schema === 4 ? PRIVATE_STATE_ID_V4 : this.schema === 3 ? PRIVATE_STATE_ID_V3 : this.schema === 2 ? PRIVATE_STATE_ID_V2 : PRIVATE_STATE_ID,
      (this.schema === 4 || this.schema === 3) ? createPrivateStateV3(this.sk, this.age) : this.schema === 2 ? createPrivateStateV2(this.sk, this.age) : createPrivateState(this.sk, this.age),
    );
    this.ageChanged();
  }
  async clearAgeCredential() {
    this.age = null; localStorage.removeItem(this.ageKey);
    await this.P.privateStateProvider.seed(
      this.schema === 4 ? PRIVATE_STATE_ID_V4 : this.schema === 3 ? PRIVATE_STATE_ID_V3 : this.schema === 2 ? PRIVATE_STATE_ID_V2 : PRIVATE_STATE_ID,
      (this.schema === 4 || this.schema === 3) ? createPrivateStateV3(this.sk) : this.schema === 2 ? createPrivateStateV2(this.sk) : createPrivateState(this.sk),
    );
    this.ageChanged();
  }
  get accountId() { return hex(pureCircuits.accountId(this.sk)); }
  userAddress(bech = this.address) { return { bytes: new Uint8Array(UnshieldedAddress.codec.decode(this.networkId, MidnightBech32m.parse(bech)).data) }; }
  setContract(a: string) { this.contract = a; localStorage.setItem(contractStorageKey(this.schema, this.networkId), a); }
  async deploy(feeAddressBech: string) {
    if (this.schema === 4) throw new Error(V4_LOCAL_ONLY);
    if (this.schema === 3) {
      const d = await v3.deployV3(this as any, feeAddressBech, stubIssuer, (this as any)._onDeployStep, { forceNew: !!this.contract && !isUnfinishedV3Deploy(this.networkId, this.contract) });
      this.setContract(d.address);
      return d;
    }
    if (this.schema === 2) {
      const d = await v2.deployV2(this as any, feeAddressBech, stubIssuer);
      this.setContract(d.address);
      return d;
    }
    const d: any = await deployContract(this.P, {
      compiledContract: CompiledCloakTix, privateStateId: PRIVATE_STATE_ID, initialPrivateState: createPrivateState(this.sk, this.age ?? undefined),
      args: ['ipfs://cloaktix/{id}', FEE_BPS, this.userAddress(feeAddressBech), pureCircuits.accountId(this.sk), await stubIssuer()],
    } as any);
    this.setContract(d.deployTxData.public.contractAddress);
    return { address: this.contract!, txId: d.deployTxData.public.txId as string };
  }
  async call(circuitId: string, args: any[]) {
    if (!this.contract) throw new Error('No CloakTix contract selected');
    assertCanProveAdult(circuitId, this.ageStatus); // CT-AGE-CRED: never reach the circuit without a usable credential
    if (this.schema === 4) return callV4(this, circuitId, args);
    if (this.schema === 3) {
      const r = await v3.callV3(this as any, circuitId, args);
      console.log(`[t] ${new Date().toISOString().slice(11, 23)} call ${circuitId} total ${r.ms} ms`);
      return r;
    }
    if (this.schema === 2) {
      if (circuitId === 'checkIn') throw new Error('v2 schema: checkIn removed. Use admit (organizer gate)');
      const r = await v2.callV2(this as any, circuitId, args);
      console.log(`[t] ${new Date().toISOString().slice(11, 23)} call ${circuitId} total ${r.ms} ms`);
      return r;
    }
    const t0 = performance.now();
    const r: any = await submitCallTx(this.P, { compiledContract: CompiledCloakTix, contractAddress: this.contract, privateStateId: PRIVATE_STATE_ID, circuitId, args } as any);
    console.log(`[t] ${new Date().toISOString().slice(11, 23)} call ${circuitId} total ${Math.round(performance.now() - t0)} ms`);
    return { txId: r.public.txId as string, result: r.private.result, ms: Math.round(performance.now() - t0) };
  }
  // On-chain ticket balances for this identity (so tickets show on any device that has the same identity).
  private async held(data: any, ids: bigint[]): Promise<Record<string, number> | null> {
    try { return Object.fromEntries(await Promise.all(ids.map(async (id) => [String(id), Number(await balanceOfLocal(this.contract!, data, this.sk, id))]))); }
    catch (e) { console.warn('balanceOf (local read) failed', e); return null; }
  }
  async state(): Promise<ContractState | null> {
    if (!this.contract) return null;
    if (this.schema === 4) return stateV4(this);
    if (this.schema === 3) {
      try {
        const st = await v3.stateV3(this as any);
        if (!st) return null;
        return st as any;
      } catch (e: any) {
        throw new Error(schemaIncompatibleMessage(3, String(e?.message ?? e)));
      }
    }
    if (this.schema === 2) {
      try {
        const st = await v2.stateV2(this as any);
        if (!st) return null;
        if (st.schemaVersion !== 2) throw new Error('ledger schemaVersion is not 2');
        return st;
      } catch (e: any) {
        throw new Error(schemaIncompatibleMessage(2, String(e?.message ?? e)));
      }
    }
    let cs: any;
    try { cs = await readContractState(this.P.publicDataProvider, this.contract); }
    catch (e: any) { throw new Error(schemaIncompatibleMessage(1, String(e?.message ?? e))); }
    if (!cs) return null;
    let L: ReturnType<typeof ledger>;
    try { L = ledger(cs.data); }
    catch (e: any) { throw new Error(schemaIncompatibleMessage(1, String(e?.message ?? e))); }
    if ((L as any).schemaVersion != null && Number((L as any).schemaVersion) === 2)
      throw new Error(schemaIncompatibleMessage(1, 'address is schema v2'));
    const mpk = (await this.metaKey())?.pk;
    return {
      schemaVersion: 1 as const,
      feeBps: L.feeBps,
      ageIssuer: L.ageIssuer as { x: bigint; y: bigint },
      events: [...L.events].map(([id, e]) => ({ id: id as bigint, mine: hex(e.organizer) === this.accountId, open: e.open as boolean, isKey: hex(e.payout.bytes) === mpk })).sort(byId),
      types: [...L.ticketTypes].map(([id, t]) => ({ id: id as bigint, ...t })).sort(byId),
      held: await this.held(cs.data, [...L.ticketTypes].map(([id]) => id)),
      checkIns: new Map([...L.checkIns].map(([p, t]) => [hex(p), t as bigint])) as Map<string, bigint>,
      listings: [...L.listings].map(([id, l]) => ({ id: id as bigint, mine: hex(l.seller) === this.accountId, typeId: l.typeId as bigint, price: l.price as bigint })).sort(byId),
    };
  }

  /** v2: buy + registerAdmit + package phone fragment (not sk). */
  buyAndPrepareAdmit(args: Parameters<typeof v2.buyAndPrepareAdmit>[1]) {
    if (this.schema !== 2) throw new Error('buyAndPrepareAdmit requires ?schema=2');
    return v2.buyAndPrepareAdmit(this as any, args);
  }
  /** CT-MULTI-BUY: 2..4 tickets of one type in one transaction (one 1AM approval). */
  buyNightV3Multi(args: Parameters<typeof buyNightV3Multi>[1]) {
    if (this.schema !== 3) throw new Error('buyNightV3Multi requires ?schema=3');
    return buyNightV3Multi(this as any, args);
  }
  buyNightV3(args: Parameters<typeof v3.buyNightV3>[1]) {
    if (this.schema !== 3) throw new Error('buyNightV3 requires ?schema=3');
    if (args.adult) assertCanProveAdult('buyTicketAdult', this.ageStatus); // before the rate quote and any proving
    return v3.buyNightV3(this as any, args);
  }
  registerAdmitOnly(serial: bigint, meta?: { ticketName?: string; eventName?: string; typeId?: string; eventDate?: string; venue?: string; cover?: string }) {
    if (this.schema === 4) return registerSerialAdmitV4(this, serial, meta);
    if (this.schema === 3) return registerSerialAdmitV3(this, serial, meta);
    if (this.schema !== 2) throw new Error('registerAdmitOnly requires ?schema=2');
    return v2.registerAdmitOnly(this as any, serial, meta);
  }
  admitAtDoor(text: string, gateId: bigint) {
    if (this.schema !== 4) throw new Error('Named doors require ?schema=4');
    return admitSerialV4(this, text, gateId);
  }
  admitAtGate(text: string, accepted: bigint[]) {
    if (this.schema === 3) return admitSerialV3(this, text, accepted);
    if (this.schema !== 2) throw new Error('admitAtGate requires ?schema=2');
    return v2.admitAtGate(this as any, text, accepted);
  }
}

const skKey = (net: string, addr: string) => `cloaktix:sk:${net}:${addr}`;
const sha256 = async (b: Uint8Array) => new Uint8Array(await crypto.subtle.digest('SHA-256', b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));
// Wallet-derived identity: sk = SHA-256(domain || signature over a fixed, domain-separated message).
// Only safe if the wallet's signData is deterministic (BIP-340 with aux randomness is not), so we sign twice and
// compare; if they differ we fall back to a device key. The signature never leaves this page.
export const identityMessage = (net: string, addr: string) =>
  `CloakTix ticket identity v1\nNetwork: ${net}\nAddress: ${addr}\n\nSign only on the CloakTix site. This recreates your ticket identity on your other devices. It does not move funds.`;
async function deriveFromWallet(api: any, net: string, addr: string): Promise<string | null> {
  if (typeof api.signData !== 'function') return null;
  const msg = identityMessage(net, addr);
  const sig = async () => { const r = await api.signData(msg, { encoding: 'text', keyType: 'unshielded' }); return String(r?.signature ?? ''); };
  const a = await sig(); if (!a) return null;
  const b = await sig(); if (a !== b) { console.warn('wallet signData is not deterministic: using a device key'); return null; }
  return hex(await sha256(new TextEncoder().encode(`cloaktix:identity:v1:${net}:${a}`)));
}

// ---- Single-use entry pass ----
// QR payload: cloaktix:pass:v1?c=<contract>&p=<passId hex32>&tx=<checkIn tx id>
export const newPassId = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const passIdBytes = (p: string) => unhex(p);
export const encodePass = (contract: string, passId: string, txId: string) => `cloaktix:pass:v1?c=${contract}&p=${passId}&tx=${txId}`;
export function decodePass(text: string) {
  const t = text.trim();
  if (!t.startsWith('cloaktix:pass:v1?')) return null;
  const q = new URLSearchParams(t.slice('cloaktix:pass:v1?'.length));
  const c = q.get('c'), p = q.get('p'), tx = q.get('tx');
  if (!c || !p || !tx || !/^[0-9a-f]{64}$/i.test(p)) return null;
  return { contract: c, passId: p.toLowerCase(), txId: tx };
}

// Gate-side record of admitted passes (second line of defence against showing the same QR twice).
const usedKey = (contract: string) => `cloaktix:gate:used:${contract}`;
export const gateUsed = (contract: string): Record<string, string> => JSON.parse(localStorage.getItem(usedKey(contract)) ?? '{}');
const markUsed = (contract: string, passId: string) =>
  localStorage.setItem(usedKey(contract), JSON.stringify({ ...gateUsed(contract), [passId]: new Date().toISOString() }));

export type Verdict = { ok: true; typeId: bigint; block: number; hash: string } | { ok: false; reason: string; typeId?: bigint };

// Gate: 1) the pass targets THIS contract, 2) the on-chain nullifier checkIns[passId] exists (ticket burned),
// 3) its ticket type is one the gate accepts, 4) the checkIn tx succeeded on the indexer, 5) not admitted before.
export async function verifyPass(s: Session, text: string, accepted: bigint[]): Promise<Verdict> {
  if (s.schema === 2) return { ok: false, reason: 'v2 schema: use admitAtGate (organizer), not checkIn verifyPass' };
  const pass = decodePass(text);
  if (!pass) return { ok: false, reason: 'Not a CloakTix pass code' };
  if (pass.contract !== s.contract) return { ok: false, reason: 'Pass issued for another CloakTix contract' };
  const used = gateUsed(pass.contract)[pass.passId];
  if (used) return { ok: false, reason: `Already admitted at ${new Date(used).toLocaleTimeString('en-US')} (single-use pass)` };
  const st = await s.state();
  const typeId = st?.checkIns.get(pass.passId);
  if (typeId === undefined) return { ok: false, reason: 'No on-chain check-in for this pass' };
  if (!accepted.includes(typeId)) return { ok: false, reason: `Wrong ticket type (#${typeId}) for this gate`, typeId };
  const indexerUri = indexerUris(s.config ?? await s.api.getConfiguration()).http;
  const query = `query($id: HexEncoded!){ transactions(offset:{identifier:$id}){ hash block{height timestamp}
    ... on RegularTransaction { transactionResult{status} contractActions{ address __typename ... on ContractCall{ entryPoint } } } } }`;
  const r = await fetch(indexerUri, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables: { id: pass.txId } }) });
  const tx = (await r.json()).data?.transactions?.[0];
  if (!tx) return { ok: false, reason: 'Check-in transaction not found on the indexer' };
  if (!(tx.contractActions ?? []).some((a: any) => a.address === pass.contract && a.entryPoint === 'checkIn'))
    return { ok: false, reason: 'Transaction is not a checkIn on this contract' };
  if (tx.transactionResult?.status !== 'SUCCESS') return { ok: false, reason: `Check-in rejected on-chain (${tx.transactionResult?.status})` };
  markUsed(pass.contract, pass.passId);
  return { ok: true, typeId, block: tx.block.height as number, hash: tx.hash as string };
}

function byId(a: { id: bigint }, b: { id: bigint }) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }
