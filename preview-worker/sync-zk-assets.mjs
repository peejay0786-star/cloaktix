// Copies EVERY key/zkir file for cloaktix (v1) and cloaktix-v2 into the preview dist.
// Files above the temporary-account 5 MiB per-asset cap are split into 4 MiB parts
// (<file>.part-NN); worker.js streams them back together at the original path.
// Writes zk-chunks.js (manifest) and zk-sha256.json (expected hashes of all files).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const CONTRACTS = [
  { name: 'cloaktix', src: '../contract/managed/cloaktix', dst: '../web-dist-app-preview/managed/cloaktix' },
  { name: 'cloaktix-v2', src: '../contract/managed/cloaktix-v2', dst: '../web-dist-app-preview/managed/cloaktix-v2' },
  { name: 'cloaktix-rate-v3', src: '../contract/managed/cloaktix-rate-v3', dst: '../web-dist-app-preview/managed/cloaktix-rate-v3' },
];
const LIMIT = 5 * 1024 * 1024 - 64 * 1024, PART = 4 * 1024 * 1024;
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const chunks = {}, hashes = {};

for (const { name, src, dst } of CONTRACTS) {
  if (!fs.existsSync(`${src}/contract/index.js`)) { console.error(`MISSING managed contract: ${src}`); process.exit(1); }
  // Ledger 9: schema 1/2 are code-only (compiled --skip-zk, no keys) and cannot deploy on the reset Preview chain.
  if (name !== 'cloaktix-rate-v3' && !fs.existsSync(`${src}/keys`)) { console.warn(`SKIP ${name}: code-only on ledger 9 (no keys)`); continue; }
  const idx = fs.readFileSync(`${src}/contract/index.js`, 'utf8');
  const circuits = [...idx.slice(idx.indexOf('this.impureCircuits = {')).split('}')[0].matchAll(/(\w+): this\.circuits\./g)].map((m) => m[1]);
  const missing = [];
  for (const c of circuits) for (const f of [`keys/${c}.prover`, `keys/${c}.verifier`, `zkir/${c}.bzkir`, `zkir/${c}.zkir`])
    if (!fs.existsSync(`${src}/${f}`)) missing.push(f);
  if (missing.length) { console.error(`MISSING in ${name}:`, missing); process.exit(1); }
  console.log(`${name} circuits (${circuits.length}):`, circuits.join(', '));
  // Midnight.js 5 FetchZkConfigProvider verifies compiler/contract-manifest.json (default verify: 'require').
  for (const dir of name === 'cloaktix-rate-v3' ? ['keys', 'zkir', 'compiler'] : ['keys', 'zkir']) {
    fs.mkdirSync(`${dst}/${dir}`, { recursive: true });
    for (const f of fs.readdirSync(`${dst}/${dir}`)) if (/\.part-\d+$/.test(f)) fs.rmSync(`${dst}/${dir}/${f}`);
    // Remove stale non-part files for circuits we no longer ship (keep only current SRC set)
    const wanted = new Set(fs.readdirSync(`${src}/${dir}`));
    for (const f of fs.readdirSync(`${dst}/${dir}`)) if (!wanted.has(f) && !/\.part-\d+$/.test(f)) fs.rmSync(`${dst}/${dir}/${f}`, { force: true });
    for (const f of fs.readdirSync(`${src}/${dir}`).sort()) {
      const buf = fs.readFileSync(`${src}/${dir}/${f}`), rel = `/managed/${name}/${dir}/${f}`, out = `${dst}/${dir}/${f}`;
      hashes[rel] = { size: buf.length, sha256: sha(buf) };
      if (buf.length <= LIMIT) { fs.writeFileSync(out, buf); continue; }
      fs.rmSync(out, { force: true });
      const parts = [];
      for (let i = 0, o = 0; o < buf.length; i++, o += PART) {
        const p = `${rel}.part-${String(i).padStart(2, '0')}`;
        fs.writeFileSync(`${dst}/${dir}/${path.basename(p)}`, buf.subarray(o, o + PART));
        parts.push(p);
      }
      chunks[rel] = { size: buf.length, sha256: hashes[rel].sha256, parts };
    }
  }
}
// CT-PROOF-IR: public BLS12-381 SRS (srs.midnight.network) for the in-tab ZKIR v3 prover, served same-origin
// (COEP require-corp + no CORS upstream). Hashes are pinned in web/src/midnight/zkirV3Protocol.ts.
{
  const pinned = Object.fromEntries([...fs.readFileSync('../web/src/midnight/zkirV3Protocol.ts', 'utf8').matchAll(/^\s*(\d+): '([0-9a-f]{64})',$/gm)].map((m) => [m[1], m[2]]));
  const src = '../contract/zk-params', dst = '../web-dist-app-preview/managed/zk-params';
  if (!Object.keys(pinned).length) { console.error('MISSING pinned zk-params hashes'); process.exit(1); }
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(dst)) fs.rmSync(`${dst}/${f}`, { force: true });
  for (const [k, want] of Object.entries(pinned)) {
    const name = `bls_midnight_2p${k}`, buf = fs.existsSync(`${src}/${name}`) ? fs.readFileSync(`${src}/${name}`) : null;
    if (!buf || sha(buf) !== want) { console.error(`zk-params ${name}: missing or sha256 mismatch (download it from https://srs.midnight.network/${name})`); process.exit(1); }
    const rel = `/managed/zk-params/${name}`;
    hashes[rel] = { size: buf.length, sha256: want };
    if (buf.length <= LIMIT) { fs.writeFileSync(`${dst}/${name}`, buf); continue; }
    const parts = [];
    for (let i = 0, o = 0; o < buf.length; i++, o += PART) {
      const p = `${rel}.part-${String(i).padStart(2, '0')}`;
      fs.writeFileSync(`${dst}/${path.basename(p)}`, buf.subarray(o, o + PART));
      parts.push(p);
    }
    chunks[rel] = { size: buf.length, sha256: want, parts };
  }
  console.log(`zk-params: k=${Object.keys(pinned).join(',')}`);
}
fs.writeFileSync('zk-chunks.js', `// Generated by sync-zk-assets.mjs — do not edit.\nexport const ZK_CHUNKS = ${JSON.stringify(chunks, null, 1)};\n`);
fs.writeFileSync('zk-sha256.json', JSON.stringify(hashes, null, 1));
const ver = sha(Buffer.from(JSON.stringify(hashes))).slice(0, 10);
fs.writeFileSync('zk-version.txt', ver + '\n');
console.log(`files: ${Object.keys(hashes).length}, chunked: ${Object.keys(chunks).length}`);
console.log(`zk version (content): ${ver}`);
