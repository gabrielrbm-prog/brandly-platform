import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@brandly/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@brandly/core': path.resolve(__dirname, 'packages/core/src'),
      '@brandly/bonus-engine': path.resolve(__dirname, 'packages/bonus-engine/src'),
      '@brandly/api': path.resolve(__dirname, 'packages/api/src'),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
