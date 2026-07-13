# Migrating from `Array` + manual `.sort()`

If you're already keeping something sorted by hand — pushing to an array and re-sorting,
or filtering it for range queries — here's the direct swap for each pattern.

## Keeping a list sorted

**Before:** push, then re-sort the whole array on every insert.

```ts
const scores: number[] = [];
scores.push(42);
scores.sort((a, b) => a - b);
scores.push(7);
scores.sort((a, b) => a - b); // re-sorting from scratch, every time
```

**After:**

```ts
import { SortedList } from 'sorted-collections';

const scores = new SortedList<number>();
scores.add(42);
scores.add(7); // O(√n) amortized — no full re-sort
```

## Membership checks

**Before:** `Array.prototype.includes` is a linear scan, `O(n)`, even on an
already-sorted array.

```ts
scores.includes(42); // O(n)
```

**After:** `has` does a binary search, `O(log n)`.

```ts
scores.has(42); // O(log n)
```

## Range queries ("everyone between X and Y")

**Before:** filtering the whole array.

```ts
scores.filter((s) => s >= 50 && s <= 100); // O(n), scans everything
```

**After:** `irange` locates both bounds by binary search and only walks the results
in between.

```ts
[...scores.irange(50, 100)]; // O(log n) to locate the bounds + O(k) for k results
```

## Deduplicated sorted collections

**Before:** a `Set` for uniqueness, plus `Array.from(set).sort()` whenever you need
the sorted order.

```ts
const tags = new Set<string>(['b', 'a', 'c']);
[...tags].sort(); // re-sorted on demand, every time you need order
```

**After:** always sorted, dedup happens on insert.

```ts
import { SortedSet } from 'sorted-collections';

const tags = new SortedSet<string>(['b', 'a', 'c']);
[...tags]; // already sorted — ['a', 'b', 'c']
```

## Sorted by key

**Before:** a plain object or `Map`, sorting `Object.entries()`/`Map` keys whenever
order matters.

```ts
const byPrice = new Map<number, string>();
byPrice.set(101.5, 'order-1');
[...byPrice.entries()].sort(([a], [b]) => a - b); // re-sorted on demand
```

**After:**

```ts
import { SortedMap } from 'sorted-collections';

const byPrice = new SortedMap<number, string>();
byPrice.set(101.5, 'order-1');
[...byPrice.entries()]; // already ordered by key
```

## Coming from another sorted-collection package

The core operations — `add`/`has`/`get`/`set`, ordered iteration, range queries via
`irange`/`islice` — cover what most sorted-container packages in this space offer.
Check the [API reference](/api/classes/SortedList) for exact method names and the
[complexity table](/api/) for what each operation costs.

## Next steps

- [Getting Started](/guide/getting-started)
- [Leaderboard with `SortedSet`](/guide/leaderboard)
- [Order book with `SortedMap`](/guide/order-book)
- [Benchmarks](/benchmarks)
