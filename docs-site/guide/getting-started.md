# Getting Started

`sorted-collections` gives JavaScript/TypeScript three data structures that keep
themselves sorted as you mutate them, with zero runtime dependencies:

- **[`SortedList`](/api/classes/SortedList)** — a list that keeps insertion order sorted automatically.
- **[`SortedSet`](/api/classes/SortedSet)** — a sorted set with no duplicates, plus set-theory operations.
- **[`SortedMap`](/api/classes/SortedMap)** — a dictionary ordered by key.

All three are backed by the same "list of lists" (bucketed array) technique Python's
[`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers) uses, and
work equally well from plain JavaScript or TypeScript.

## Prerequisites

Node.js `^20.19.0` or `>=22.12.0`.

## Installation

::: code-group

```sh [npm]
npm i sorted-collections
```

```sh [pnpm]
pnpm add sorted-collections
```

```sh [yarn]
yarn add sorted-collections
```

:::

## First example of each

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

## Building from an existing iterable

Passing an iterable to the constructor builds in bulk — sorts once, then cuts directly
into buckets — rather than inserting one element at a time. `SortedList.from`,
`SortedSet.from`, and `SortedMap.from` are equivalent sugar, paralleling `Array.from`:

```ts
const scores = SortedList.from([42, 7, 99]); // same as new SortedList([42, 7, 99])
const tags = SortedSet.from(['b', 'a', 'c', 'a']); // dedupes: ['a', 'b', 'c']
```

See [Benchmarks](/benchmarks) for what bulk construction is worth at scale.

## Custom comparators

Without a comparator, elements sort by natural order for `number` and `string`. Any
other type requires one — TypeScript enforces this at compile time:

```ts
interface Person {
  name: string;
  age: number;
}

// Compile error without a comparator: Person isn't naturally orderable.
const byAge = new SortedList<Person>([], {
  comparator: (a, b) => a.age - b.age,
});
```

`has`/`remove`/`delete` on all three structures compare by the comparator, not
reference identity — two different object instances that compare equal are treated
as the same element/key.

## Range queries

`irange` (by value) and `islice` (by position) work the same way across all three
structures:

```ts
// Everyone scoring between 50 and 100, inclusive:
[...scores.irange(50, 100)];

// Order book: every order priced at 100 or less:
[...byPrice.irange(undefined, 100)];

// First three entries by position:
[...scores.islice(0, 3)];
```

## Next steps

- [Leaderboard with `SortedSet`](/guide/leaderboard)
- [Order book with `SortedMap`](/guide/order-book)
- [Scheduling with `SortedList`](/guide/scheduling)
- [Migrating from Array + sort()](/guide/migration)
- [Full API reference](/api/classes/SortedList)
- [Benchmarks](/benchmarks)
