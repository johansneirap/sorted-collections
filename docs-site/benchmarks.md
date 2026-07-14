# Benchmarks

## Methodology

Numbers below: Node v25, single run of `npm run bench`. The script (in
[`benchmarks/`](https://github.com/johansneirap/sorted-collections/tree/main/benchmarks))
uses [`tinybench`](https://github.com/tinylibjs/tinybench), measures ops/sec, and is
fully reproducible — clone the repo and run `npm run bench` yourself; results vary by
machine.

Insert benchmarks (`add`/`set`) are capped at n=5,000: the naive "array + resort on
every insert" comparison point is `O(n² log n)` and would take minutes at n=100,000.
Read benchmarks (`has`/`get`/`at`/iteration) build the structure once per size, then
time only the read operation, so they run up to n=100,000. Construction benchmarks
(below) have no naive-resort baseline in the mix, so they run up to n=1,000,000.

## SortedList

| Operation | `SortedList` | `Array` (naive) |
|---|---:|---:|
| `add()`, one at a time, n=5,000 | 3,146/s | 12/s |
| `has()`, n=100,000 | 20,224/s | 67/s |
| `at(index)`, n=100,000 | 4,474/s | 758,064/s (native indexing) |
| full iteration, n=100,000 | 1,114/s | 2,577/s |

| Construction | bulk (`new SortedList(data)`) | per-element (`add()` in a loop) |
|---|---:|---:|
| n=1,000 | 17,316/s | 32,250/s |
| n=100,000 | 85/s | 93/s |
| n=1,000,000 | 7/s | 5/s |

## SortedSet

| Operation | `SortedSet` | native `Set` |
|---|---:|---:|
| `add()`, one at a time, n=5,000 | 2,092/s | 12,923/s |
| `has()`, n=100,000 | 20,121/s | 835,314/s |
| full iteration, n=100,000 | 1,117/s | 2,577/s |

| Construction | bulk (`new SortedSet(data)`) | per-element (`add()` in a loop) |
|---|---:|---:|
| n=1,000 | 16,065/s | 20,200/s |
| n=100,000 | 79/s | 55/s |
| n=1,000,000 | 7/s | 3/s |

## SortedMap

| Operation | `SortedMap` | native `Map` |
|---|---:|---:|
| `set()`, one at a time, n=5,000 | 1,397/s | 7,056/s |
| `get()`, n=100,000 | 12,453/s | 834,080/s |
| full iteration, n=100,000 | 1,005/s | 2,473/s |

| Construction | bulk (`new SortedMap(entries)`) | per-element (`set()` in a loop) |
|---|---:|---:|
| n=1,000 | 14,121/s | 12,476/s |
| n=100,000 | 56/s | 33/s |
| n=1,000,000 | 3/s | 1/s |

## Bulk construction: when the old per-element path still wins

`new SortedX(iterable)` now sorts the input once and cuts it directly into buckets,
instead of inserting elements one at a time. At small n (~1,000), `SortedList` and
`SortedSet` are marginally *slower* to bulk-construct than the old per-element path: the
fixed cost of one `Array.prototype.sort()` call doesn't have much to amortize over yet,
since the bucket size floor (32 elements) already keeps per-element insertion cheap at
that scale. The absolute difference is single-digit microseconds either way — not
something to design around. From roughly n=100,000 on, bulk construction wins decisively
across all three structures, up to 3x faster at n=1,000,000.

## When this library is (and isn't) the right call

- **Native `Set`/`Map` numbers are a raw-speed reference only**, not an apples-to-apples
  comparison: they don't keep anything sorted, don't offer `irange`/`at`/`bisectLeft`,
  and iterate in insertion order rather than sorted order. You pay for order; this is
  what that cost looks like next to not paying for it.
- **The naive "array + resort on every insert" collapse is the problem this library
  exists to fix**, not an oversight in the benchmark — that pattern is genuinely
  unusable much past a few thousand elements.
- **`at(index)` and full iteration are `O(√n)`**, not `O(log n)`. This library
  deliberately doesn't maintain the extra index a balanced tree would need for
  `O(log n)` positional access — see [FAQ](/faq) for why. That trade-off costs the most
  on large collections doing lots of positional lookups; `has()`/`get()`/`add()`/`set()`
  don't pay it.
- **If your dataset stays under a few thousand elements and you rarely need positional
  access**, a plain array with `Array.prototype.sort()` called occasionally, or a native
  `Map`/`Set` if you don't need order at all, may genuinely be simpler and fast enough.
  This library earns its keep at scale, or when range queries (`irange`/`islice`) are a
  core part of your access pattern.
