import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use jsdom for testing browser-like environment
    environment: 'node',

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Global test timeout (10 seconds)
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.{js,ts}',
        '.next/',
      ],
    },
  },

  // Resolve path aliases (same as tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
