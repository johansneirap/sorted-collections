# FAQ

## Why not a balanced tree?

Balanced trees (red-black, AVL) give `O(log n)` for everything, including positional
access, at the cost of per-node overhead (pointers, rebalancing) and poor cache
locality — each step down the tree is likely a cache miss. `sorted-collections` uses the
same "list of lists" (bucketed array) technique as Python's
[`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers): buckets of
roughly `√n` sorted elements, stored as contiguous arrays. Value-based lookups
(`has`/`get`/`add`/`set`) are `O(log n)` — same as a tree. Positional access
(`at`/`islice`) is `O(√n)` instead of `O(log n)` — the one place this trades a small
amount of speed for a much simpler, easier-to-audit implementation (see
[`src/internal/bucket-engine.ts`](https://github.com/johansneirap/sorted-collections/blob/main/src/internal/bucket-engine.ts)).
See [Benchmarks](/benchmarks) for what that trade-off looks like in real numbers.

## Is it safe for production?

The three structures have 100% test coverage (statements/branches/functions/lines),
including property-based tests ([`fast-check`](https://github.com/dubzzz/fast-check))
that generate thousands of random insert/remove sequences and diff the result against a
naive array+sort reference implementation on every operation, not just at the end. Zero
runtime dependencies means there's no transitive supply-chain surface beyond this
package itself.

## Why another sorted-collection package?

A few packages in this space exist on npm already, each covering part of what's here —
none cover all three structures (`SortedList`, `SortedSet`, `SortedMap`) with
reproducible benchmarks and full documentation together. `sorted-collections` aims to be
the complete, well-tested, TypeScript-first option, consumable equally well from plain
JavaScript.

## Why does a custom comparator throw a compile error if I forget it?

`number` and `string` have a natural order, so the comparator is optional for them.
Anything else — objects, especially — doesn't have one JavaScript can infer safely, so
TypeScript requires a comparator at the type level for any other `T`. This is enforced
via a conditional type on the constructor, not a runtime check — see
[Getting Started](/guide/getting-started#custom-comparators).

## Does `has`/`remove`/`delete` use reference identity?

No — always the comparator. Two different object instances that compare equal (return
`0`) are treated as the same element (for `SortedSet`) or the same key (for
`SortedMap`). This is true throughout: `SortedSet.add` is a no-op for a
comparator-equal value even if it's a different reference, and `SortedMap.get`/`has`/
`delete` match by comparator, not by which exact object you originally passed to `set`.
