// SPDX-License-Identifier: Apache-2.0
// Port of web/passport-stub/server.mjs + contract/age-credential.mjs for the PREVIEW Worker (same origin, /passport/*).
// TEST age-credential issuer for the CloakTix demo. Not Midnight Passport.
//   GET  /passport/issuer -> { name, method, publicKey: {x, y} }
//   POST /passport/issue  { holder: <account id hex32>, birthdate: "YYYY-MM-DD" } -> signed AgeCredential (JSON)
// The birthdate only yields adultFrom (18th birthday, unix s); it is neither stored nor logged.
import * as rt from '@midnight-ntwrk/compact-runtime';
import { pureCircuits } from '../contract/managed/cloaktix/contract/index.js';
import { DEMO_ISSUER_SK_HEX } from './passport-demo-key.js';

const JUBJUB_ORDER = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;
const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => Uint8Array.from(s.match(/../g).map((h) => parseInt(h, 16)));
const randScalar = () => {
  const b = crypto.getRandomValues(new Uint8Array(64));
  return (BigInt('0x' + hex(b)) % (JUBJUB_ORDER - 1n)) + 1n;
};
const tag32 = (s) => { const u = new Uint8Array(32); u.set(new TextEncoder().encode(s).slice(0, 32)); return u; };
const ISSUER_METHOD = tag32('cloaktix:passport-stub#key-1');
const issuerSk = BigInt('0x' + DEMO_ISSUER_SK_HEX);
const pk = rt.ecMulGenerator(issuerSk);

function adultFromBirthdate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) throw new Error('Birthdate must be YYYY-MM-DD');
  return BigInt(Math.floor(Date.UTC(y + 18, m - 1, d) / 1000));
}
function signAgeCredential(holder, adultFrom) {
  const createdAt = BigInt(Math.floor(Date.now() / 1000));
  const challengeHash = new Uint8Array(32);
  const claim = { holder, adultFrom };
  for (;;) { // compact-runtime rejects scalars >= the Jubjub order in ecMul: resample until c < order
    const k = randScalar();
    const r = rt.ecMulGenerator(k);
    const c = pureCircuits.ageChallenge(claim, ISSUER_METHOD, createdAt, challengeHash, pk, r);
    if (c >= JUBJUB_ORDER) continue;
    const s = (k + c * issuerSk) % JUBJUB_ORDER;
    return {
      claim: { holder: hex(holder), adultFrom: String(adultFrom) },
      proof: { issuerMethod: hex(ISSUER_METHOD), createdAt: String(createdAt), challengeHash: hex(challengeHash),
        publicKey: { x: String(pk.x), y: String(pk.y) },
        signature: { r: { x: String(r.x), y: String(r.y) }, s: String(s) } },
    };
  }
}

export async function handlePassport(request, sub, baseHeaders) {
  const send = (code, body) => {
    const h = new Headers(baseHeaders);
    h.set('Content-Type', 'application/json'); h.set('Cache-Control', 'no-store');
    return new Response(code === 204 ? null : JSON.stringify(body), { status: code, headers: h });
  };
  if (request.method === 'OPTIONS') return send(204);
  if (request.method === 'GET' && sub === '/issuer')
    return send(200, { name: 'CloakTix Passport stub (test issuer, preview)', method: hex(ISSUER_METHOD), publicKey: { x: String(pk.x), y: String(pk.y) } });
  if (request.method === 'POST' && sub === '/issue') {
    try {
      const raw = await request.text();
      if (raw.length > 4096) throw new Error('body too large');
      const { holder, birthdate } = JSON.parse(raw);
      if (!/^[0-9a-f]{64}$/i.test(holder ?? '')) throw new Error('holder must be a 32-byte hex account id');
      const cred = signAgeCredential(unhex(holder.toLowerCase()), adultFromBirthdate(birthdate));
      console.log(`issued credential for ${holder.slice(0, 8)}…`); // no birthdate in logs
      return send(200, cred);
    } catch (e) { return send(400, { error: String(e?.message ?? e) }); }
  }
  return send(404, { error: 'not found' });
}
