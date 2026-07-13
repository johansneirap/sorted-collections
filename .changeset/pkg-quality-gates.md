---
"sorted-collections": patch
---

Fix a real dual-package hazard found by adding `publint` and `@arethetypeswrong/cli`
to CI: the `exports` map shared a single `types` entry between the `import` and
`require` conditions, so a CJS consumer (`require('sorted-collections')`) under
`moduleResolution: "node16"/"nodenext"` would resolve types from the ESM-flavored
`.d.ts` instead of the CJS-flavored `.d.cts` tsup already builds — TypeScript calls
this "masquerading as ESM". Split into per-condition `types`/`default` pairs.

Also adds a `size-limit` budget (3 KB) on the ESM entry point, gating in CI against
silent bundle-size regressions like the minification one fixed in the previous release.
