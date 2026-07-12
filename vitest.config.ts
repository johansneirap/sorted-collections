import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // sorted-set.ts/sorted-map.ts are still unimplemented stubs (roadmap: SortedList
      // ships first). Drop this exclusion once they have real logic + tests.
      exclude: ['src/index.ts', 'src/sorted-set.ts', 'src/sorted-map.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
