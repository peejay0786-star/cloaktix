import path from 'node:path';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { createMetaHandler, stateQuery } from '../public-serve/serve.mjs';

const BRIDGE = `http://127.0.0.1:${process.env.BRIDGE_PORT ?? 8797}`;
// COOP/COEP : isolation cross-origin pour le prouveur WASM (SharedArrayBuffer).
const isolation = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' };
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [
    wasm(), // topLevelAwait disabled: SWC printSync mismatch; build.target esnext already emits native TLA
    // Same /meta store as public-serve/serve.mjs (devnet file: web/.meta-dev.json).
    { name: 'cloaktix-meta', configureServer(sv) { const h = createMetaHandler({ file: path.resolve(__dirname, '.meta-dev.json'), queryState: stateQuery(async (body) => (await fetch(process.env.DEV_INDEXER ?? 'http://127.0.0.1:8088/api/v4/graphql', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).json()) }); sv.middlewares.use((req, res, next) => (['/meta','/catalog'].includes(req.url?.split('?')[0] ?? '') ? h(req, res) : next())); } },
    nodePolyfills({ include: ['buffer', 'process', 'util', 'crypto', 'stream'], globals: { Buffer: true, process: true } }),
  ],
  resolve: {
    alias: {
      // Contract managed JS lives outside web/; force resolve into this package's node_modules.
      '@midnight-ntwrk/compact-runtime': path.resolve(__dirname, 'node_modules/@midnight-ntwrk/compact-runtime'),
      '@midnight-ntwrk/onchain-runtime-v3': path.resolve(__dirname, 'node_modules/@midnight-ntwrk/onchain-runtime-v3'),
      // CT-PSP-L9: ONE ledger-v9 wasm. midnight-js-protocol pins @midnightntwrk/ledger-v9 1.0.0 (nested copy) while
      // compact-js resolves ^1.0.0 to the hoisted 1.0.1. Two copies => Intent.addMaintenanceUpdate refuses compact-js's
      // MaintenanceUpdate ("expected instance of MaintenanceUpdate"), i.e. every verifier-key insert fails.
      '@midnightntwrk/ledger-v9': path.resolve(__dirname, 'node_modules/@midnight-ntwrk/midnight-js-protocol/node_modules/@midnightntwrk/ledger-v9'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/midnight-js-protocol',
    ],
  },
  server: {
    port: 5180, strictPort: true, host: '127.0.0.1', headers: isolation,
    fs: { allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../../examples')] },
    // Pont wallet de dev (devnet local uniquement) + fichiers publics du prouveur
    proxy: { '/devwallet': BRIDGE, '/zk': BRIDGE },
  },
  preview: { headers: isolation },
  // CT-PROOF-IR: the in-tab ZKIR v3 prover worker imports a .wasm module (ES worker + wasm plugin).
  worker: { format: 'es', plugins: () => [wasm()] },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        v3BatchSmoke: path.resolve(__dirname, 'v3-batch-smoke.html'),
      },
    },
  },
});
