---
"sorted-collections": minor
---

Bulk-construct `SortedList`, `SortedSet`, and `SortedMap` from an iterable in one pass
instead of inserting elements one at a time. Constructing from an existing iterable now
sorts once and cuts the result directly into buckets, rather than paying the O(√n)
amortized cost of `add()`/`set()` per element — up to 3x faster at n=1,000,000. Also adds
`SortedList.from`, `SortedSet.from`, and `SortedMap.from` static factories, paralleling
`Array.from`.

No breaking changes: constructor signatures, dedup semantics (`SortedSet` keeps the first
occurrence of duplicates, `SortedMap` keeps the last — matching `new Map()`), and all
other public APIs are unchanged.
