import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // sorted-map.ts is still an unimplemented stub (roadmap: SortedMap ships last).
      // Drop this exclusion once it has real logic + tests.
      exclude: ['src/index.ts', 'src/sorted-map.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
