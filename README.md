# sorted-collections

[![CI](https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml/badge.svg)](https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/sorted-collections.svg)](https://www.npmjs.com/package/sorted-collections)
[![license](https://img.shields.io/npm/l/sorted-collections.svg)](LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

`SortedList`, `SortedSet` and `SortedMap` for JavaScript/TypeScript — zero runtime
dependencies, inspired by Python's [`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers)
(~50M downloads/month).

> **Status: pre-release.** `SortedList` is implemented and tested; `SortedSet` and
> `SortedMap` are still in progress. The API below reflects the target design for v1.0.

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

*Benchmark numbers (throughput vs. the alternatives above) are planned ahead of v1.0.
This table will be replaced with real numbers once they're in.*

## Documentation

Full docs (getting started, use-case guides, API reference, benchmarks) will be
published to GitHub Pages ahead of v1.0.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE)
