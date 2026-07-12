# sorted-collections

[![CI](https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml/badge.svg)](https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/sorted-collections.svg)](https://www.npmjs.com/package/sorted-collections)
[![license](https://img.shields.io/npm/l/sorted-collections.svg)](LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

`SortedList`, `SortedSet` and `SortedMap` for JavaScript/TypeScript — zero runtime
dependencies, inspired by Python's [`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers)
(~50M downloads/month).

> **Status: pre-release.** `SortedList`, `SortedSet`, and `SortedMap` are implemented
> and tested (100% coverage). Docs site and npm publish are still ahead of v1.0.

## Install

```bash
npm i sorted-collections
```

## Quick start

```ts
import { SortedList, SortedSet, SortedMap } from 'sorted-collections';

const scores = new SortedList<number>();
scores.add(42);
scores.add(7);
scores.add(99);
[...scores]; // [7, 42, 99]

const tags = new SortedSet<string>(['b', 'a', 'c']);
tags.has('b'); // true

const byPrice = new SortedMap<number, string>();
byPrice.set(101.5, 'order-1');
byPrice.set(99.75, 'order-2');
[...byPrice.keys()]; // [99.75, 101.5]
```

## Why not just `Array.sort()`, `Set`, or `Map`?

Native JS structures don't keep themselves ordered as you mutate them. Re-sorting an
array on every insert is O(n log n) repeated — fine for small datasets, expensive at
scale. `sorted-collections` keeps elements ordered incrementally using the same
"list of lists" (bucketed array) technique as Python's `sortedcontainers`, trading
tree-based overhead for cache-friendly locality.

## Comparison

| | `sorted-collections` | `Array` + manual sort | native `Set`/`Map` | [`sorted-containers`](https://www.npmjs.com/package/sorted-containers) (npm) | [`sortedkit`](https://www.npmjs.com/package/sortedkit) (npm) |
|---|---|---|---|---|---|
| `SortedList` | ✅ | — | — | ✅ (`SortedArray`) | ❌ |
| `SortedSet` | ✅ | — | ✅ unordered | ✅ | ✅ |
| `SortedMap` | ✅ | — | ✅ unordered | ✅ | ✅ |
| Ordered iteration | ✅ | manual | ❌ | ✅ | ✅ |
| Range queries (`irange`/`islice`) | ✅ | manual | ❌ | partial | ❌ |
| Zero dependencies | ✅ | ✅ | ✅ | ✅ | ✅ |
| npm downloads/month (mid-2026) | — | — | — | ~63 | ~159 |

## Benchmarks

Numbers below: Node v25, single run of `npm run bench` (script and full breakdown —
every size, every operation — in [`benchmarks/`](benchmarks/); reproduce locally, results
vary by machine). Ops/sec, higher is better.

**`SortedList` vs. `Array` + manual sort vs. `sorted-containers`**

| Operation | `SortedList` | `Array` (naive) | `sorted-containers` |
|---|---:|---:|---:|
| `add()`, one at a time, n=5,000 | 3,146/s | 12/s | 1,846/s |
| `has()`, n=100,000 | 20,224/s | 67/s | 18,995/s |
| `at(index)`, n=100,000 | 4,474/s | 758,064/s (native indexing) | 39,629/s |
| full iteration, n=100,000 | 1,114/s | 2,577/s | 2,578/s |

**`SortedSet` vs. native `Set` vs. `sorted-containers` vs. `sortedkit`**

| Operation | `SortedSet` | native `Set` | `sorted-containers` | `sortedkit` |
|---|---:|---:|---:|---:|
| `add()`, one at a time, n=5,000 | 2,092/s | 12,923/s | 1,847/s | 1,669/s |
| `has()`, n=100,000 | 20,121/s | 835,314/s | 19,232/s | 12,329/s |
| full iteration, n=100,000 | 1,117/s | 2,577/s | 2,580/s | 583/s |

**`SortedMap` vs. native `Map` vs. `sorted-containers` vs. `sortedkit`**

| Operation | `SortedMap` | native `Map` | `sorted-containers` | `sortedkit` |
|---|---:|---:|---:|---:|
| `set()`, one at a time, n=5,000 | 1,397/s | 7,056/s | 1,118/s | 1,893/s |
| `get()`, n=100,000 | 12,453/s | 834,080/s | 18,808/s | 12,378/s |
| full iteration, n=100,000 | 1,005/s | 2,473/s | 2,143/s | 330/s |

**Honest notes — when this library is (and isn't) the right call:**

- Native `Set`/`Map` numbers are a raw-speed reference only, not an apples-to-apples
  comparison: they don't keep anything sorted, don't offer `irange`/`at`/`bisectLeft`,
  and iterate in insertion order rather than sorted order. You pay for order; this is
  what that cost looks like next to not paying for it.
- `add()`/`set()` vs. the naive "array + resort" pattern is only run up to n=5,000 — that
  pattern is O(n² log n) and would take minutes at n=100,000. That collapse *is* the
  problem this library exists to fix, not an oversight in the benchmark.
- `at(index)` and full iteration are the one place `sorted-containers` wins clearly (up
  to ~9x on `at`). They maintain an index structure for O(log n) positional access; we
  deliberately don't, favoring the simpler "list of lists" technique with no extra
  bookkeeping (see [`src/internal/bucket-engine.ts`](src/internal/bucket-engine.ts)).
  `SortedList#at`/`#islice` are O(√n), documented as such — this is that trade-off
  showing up in real numbers, not a bug.
- `has()`/`get()` are competitive with both npm alternatives at every size tested (within
  ~20-30% either way, sometimes ahead).

## Documentation

Full docs (getting started, use-case guides, API reference, benchmarks) will be
published to GitHub Pages ahead of v1.0.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE)
