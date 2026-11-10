// SPDX-License-Identifier: Apache-2.0
// "Passport stub": a LOCAL TEST age-credential issuer for the CloakTix demo. Not Midnight Passport.
// Age verification will use Midnight Passport once it launches. Demo uses a test issuer.
//   GET  /issuer -> { name, method, publicKey: {x, y} }
//   POST /issue  { holder: <CloakTix account id hex32>, birthdate: "YYYY-MM-DD" } -> signed AgeCredential (JSON)
// The birthdate is only used to compute adultFrom (= 18th birthday, unix s); it is not stored or logged.
// The issuer secret lives in a box file (.secrets/passport-stub.key, mode 600), never in the browser.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { newIssuerSecret, issuerPublicKey, signAgeCredential, adultFromBirthdate, credentialToJson, ISSUER_METHOD } from '../../contract/age-credential.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const keyFile = process.env.PASSPORT_STUB_KEY ?? path.join(root, '.secrets/passport-stub.key');
if (!fs.existsSync(keyFile)) {
  fs.mkdirSync(path.dirname(keyFile), { recursive: true, mode: 0o700 });
  fs.writeFileSync(keyFile, newIssuerSecret().toString(16) + '\n', { mode: 0o600 });
}
const issuerSk = BigInt('0x' + fs.readFileSync(keyFile, 'utf8').trim());
const pk = issuerPublicKey(issuerSk);
const PORT = Number(process.env.PASSPORT_STUB_PORT ?? 8798);

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
  res.end(JSON.stringify(body));
};
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/issuer')
    return send(res, 200, { name: 'CloakTix Passport stub (test issuer)', method: Buffer.from(ISSUER_METHOD).toString('hex'), publicKey: { x: String(pk.x), y: String(pk.y) } });
  if (req.method === 'POST' && req.url === '/issue') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 4096) req.destroy(); });
    req.on('end', () => {
      try {
        const { holder, birthdate } = JSON.parse(raw);
        if (!/^[0-9a-f]{64}$/i.test(holder ?? '')) throw new Error('holder must be a 32-byte hex account id');
        const adultFrom = adultFromBirthdate(String(birthdate));
        const cred = signAgeCredential({ issuerSk, holder: Uint8Array.from(Buffer.from(holder, 'hex')), adultFrom });
        console.log(`issued credential for ${holder.slice(0, 8)}…`); // no birthdate in logs
        send(res, 200, credentialToJson(cred));
      } catch (e) { send(res, 400, { error: String(e.message ?? e) }); }
    });
    return;
  }
  send(res, 404, { error: 'not found' });
}).listen(PORT, '127.0.0.1', () => console.log(`Passport stub (test issuer) on http://127.0.0.1:${PORT}`));
