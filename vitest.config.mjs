import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['e2e/**/*.test.ts'], environment: 'node', globals: true, testTimeout: 30 * 60_000, hookTimeout: 15 * 60_000, fileParallelism: false } });
