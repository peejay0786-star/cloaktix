import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['test/**/*.sim.test.mjs'], environment: 'node' } });
