# sorted-collections

## 1.0.3

### Patch Changes

- 69bdd0b: Fix a real dual-package hazard found by adding `publint` and `@arethetypeswrong/cli`
  to CI: the `exports` map shared a single `types` entry between the `import` and
  `require` conditions, so a CJS consumer (`require('sorted-collections')`) under
  `moduleResolution: "node16"/"nodenext"` would resolve types from the ESM-flavored
  `.d.ts` instead of the CJS-flavored `.d.cts` tsup already builds — TypeScript calls
  this "masquerading as ESM". Split into per-condition `types`/`default` pairs.

  Also adds a `size-limit` budget (3 KB) on the ESM entry point, gating in CI against
  silent bundle-size regressions like the minification one fixed in the previous release.

## 1.0.2

### Patch Changes

- 5d6b505: Enable build minification — the published bundle was never actually minified, and
  after adding `@example` blocks to the public API's TSDoc, the unminified comments were
  shipping straight into the runtime JS. Minifying strips them from the JS output (kept in
  `.d.ts` for editor tooling) and shrinks the gzipped bundle from ~3.6 KB to ~2 KB.

  Also adds `@example` usage snippets to every public method across `SortedList`,
  `SortedSet`, and `SortedMap`, so they show up in editor hover-docs and the generated API
  reference site.

## 1.0.1

### Patch Changes

- a259d4b: Point `package.json`'s `homepage` field at the new documentation site instead of the
  GitHub README.

## 1.0.0

### Major Changes

- 5d50b18: Initial release: `SortedList`, `SortedSet`, and `SortedMap` — zero-dependency sorted
  data structures for JavaScript/TypeScript, inspired by Python's `sortedcontainers`.
