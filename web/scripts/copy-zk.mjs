// Copies the compiled ZK keys and zkir into public/ (served to the page for in-browser proving).
import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../../contract/managed/cloaktix');
const dst = path.resolve(here, '../public/managed/cloaktix');
rmSync(dst, { recursive: true, force: true });
for (const d of ['keys', 'zkir']) cpSync(path.join(src, d), path.join(dst, d), { recursive: true });
console.log('[copy-zk] ok ->', dst);
