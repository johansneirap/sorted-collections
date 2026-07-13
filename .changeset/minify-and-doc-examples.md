---
"sorted-collections": patch
---

Enable build minification — the published bundle was never actually minified, and
after adding `@example` blocks to the public API's TSDoc, the unminified comments were
shipping straight into the runtime JS. Minifying strips them from the JS output (kept in
`.d.ts` for editor tooling) and shrinks the gzipped bundle from ~3.6 KB to ~2 KB.

Also adds `@example` usage snippets to every public method across `SortedList`,
`SortedSet`, and `SortedMap`, so they show up in editor hover-docs and the generated API
reference site.
