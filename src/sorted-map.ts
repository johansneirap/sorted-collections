import { BucketEngine } from './internal/bucket-engine.js';
import { SortedSet } from './sorted-set.js';
import type { Comparator, ComparatorArg, SortedOptions } from './types.js';

function defaultKeyComparator<K>(a: K, b: K): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const left = String(a);
  const right = String(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function comparatorArgs<T>(comparator: Comparator<T>): ComparatorArg<T> {
  return [{ comparator }] as unknown as ComparatorArg<T>;
}

/** Collapses adjacent equal-key runs (by `comparator`) to their last element — same "later wins" semantics as `new Map()`. */
function dedupeKeepingLast<T>(sorted: T[], comparator: Comparator<T>): T[] {
  const result: T[] = [];
  for (const value of sorted) {
    if (result.length > 0 && comparator(result[result.length - 1] as T, value) === 0) {
      result[result.length - 1] = value;
    } else {
      result.push(value);
    }
  }
  return result;
}

/**
 * A dictionary ordered by key.
 *
 * Uses the internal {@link BucketEngine} directly (on `[K, V]` tuples, with a
 * comparator that only looks at the key) rather than composing over
 * `SortedList`'s public API. Two reasons: `set` needs the engine's O(log n)
 * in-place replace-or-insert (`SortedList#bisectLeft` + `#at` would pay for a
 * positional index it doesn't need), and `get`/`has`/`delete` use the `*By`
 * lookup methods with a closure over the bare key — that compares the key
 * only once per candidate (not twice, since the search side needs no
 * `entry[0]` unwrapping) and avoids allocating a throwaway `[key, undefined]`
 * search tuple per call.
 *
 * @example
 * ```ts
 * const byPrice = new SortedMap<number, string>([[101.5, 'order-1'], [99.75, 'order-2']]);
 * [...byPrice.keys()]; // [99.75, 101.5]
 * ```
 */
export class SortedMap<K, V> implements Iterable<[K, V]> {
  private readonly engine: BucketEngine<[K, V]>;
  private readonly keyComparator: Comparator<K>;

  /**
   * @example
   * ```ts
   * new SortedMap<number, string>(); // empty
   * new SortedMap<number, string>([[2, 'b'], [1, 'a']]); // ordered by key: 1, 2
   * ```
   */
  constructor(entries?: Iterable<[K, V]>, ...options: ComparatorArg<K>) {
    const opts = options[0] as SortedOptions<K> | undefined;
    this.keyComparator = opts?.comparator ?? (defaultKeyComparator as Comparator<K>);
    const entryComparator: Comparator<[K, V]> = (a, b) => this.keyComparator(a[0], b[0]);
    const sorted = entries ? Array.from(entries).sort(entryComparator) : [];
    const deduped = dedupeKeepingLast(sorted, entryComparator);
    this.engine = BucketEngine.fromSorted(deduped, entryComparator);
  }

  /**
   * @example
   * ```ts
   * SortedMap.from([[2, 'b'], [1, 'a']]); // same as new SortedMap([[2, 'b'], [1, 'a']])
   * ```
   */
  static from<K, V>(entries: Iterable<[K, V]>, ...options: ComparatorArg<K>): SortedMap<K, V> {
    return new SortedMap<K, V>(entries, ...options);
  }

  /**
   * O(log n) to locate + O(1) to replace in place, or O(√n) amortized to insert.
   *
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>();
   * byPrice.set(101.5, 'order-1');
   * byPrice.set(101.5, 'order-1-updated'); // overwrites, doesn't grow size
   * ```
   */
  set(key: K, value: V): void {
    this.engine.set([key, value]);
  }

  /**
   * O(log n): binary search for the bucket, then binary search within it.
   *
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[101.5, 'order-1']]);
   * byPrice.get(101.5); // 'order-1'
   * byPrice.get(1); // undefined
   * ```
   */
  get(key: K): V | undefined {
    return this.engine.findBy((entry) => this.keyComparator(entry[0], key))?.[1];
  }

  /**
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[101.5, 'order-1']]);
   * byPrice.delete(101.5); // true
   * byPrice.delete(101.5); // false — already gone
   * ```
   */
  delete(key: K): boolean {
    return this.engine.removeBy((entry) => this.keyComparator(entry[0], key));
  }

  /**
   * @example
   * ```ts
   * new SortedMap<number, string>([[1, 'a']]).has(1); // true
   * ```
   */
  has(key: K): boolean {
    return this.engine.hasBy((entry) => this.keyComparator(entry[0], key));
  }

  /**
   * A snapshot `SortedSet` of the current keys — not a live view.
   *
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[2, 'b'], [1, 'a']]);
   * [...byPrice.keys()]; // [1, 2]
   * ```
   */
  keys(): SortedSet<K> {
    return new SortedSet<K>(this.keysGenerator(), ...comparatorArgs(this.keyComparator));
  }

  private *keysGenerator(): Generator<K> {
    for (const [key] of this.engine) {
      yield key;
    }
  }

  /**
   * @example
   * ```ts
   * [...new SortedMap<number, string>([[2, 'b'], [1, 'a']]).values()]; // ['a', 'b']
   * ```
   */
  *values(): IterableIterator<V> {
    for (const [, value] of this.engine) {
      yield value;
    }
  }

  /**
   * @example
   * ```ts
   * [...new SortedMap<number, string>([[2, 'b'], [1, 'a']]).entries()]; // [[1, 'a'], [2, 'b']]
   * ```
   */
  entries(): IterableIterator<[K, V]> {
    return this.engine[Symbol.iterator]();
  }

  /**
   * Iterates `[key, value]` pairs with keys in `[minKey, maxKey]`.
   *
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[95, 'a'], [100, 'b'], [105, 'c']]);
   * [...byPrice.irange(95, 100)]; // [[95, 'a'], [100, 'b']]
   * ```
   */
  irange(minKey?: K, maxKey?: K): IterableIterator<[K, V]> {
    const min = minKey === undefined ? undefined : ([minKey, undefined as unknown as V] as [K, V]);
    const max = maxKey === undefined ? undefined : ([maxKey, undefined as unknown as V] as [K, V]);
    return this.engine.irange(min, max);
  }

  /**
   * O(√n). Entry at ordinal position `index` in key order.
   *
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[2, 'b'], [1, 'a']]);
   * byPrice.at(0); // [1, 'a']
   * ```
   */
  at(index: number): [K, V] | undefined {
    return this.engine.at(index);
  }

  /**
   * @example
   * ```ts
   * new SortedMap<number, string>([[1, 'a'], [2, 'b']]).size; // 2
   * ```
   */
  get size(): number {
    return this.engine.length;
  }

  /**
   * @example
   * ```ts
   * const byPrice = new SortedMap<number, string>([[1, 'a']]);
   * byPrice.clear();
   * byPrice.size; // 0
   * ```
   */
  clear(): void {
    this.engine.clear();
  }

  /**
   * @example
   * ```ts
   * for (const [key, value] of new SortedMap([[2, 'b'], [1, 'a']])) {
   *   console.log(key, value); // 1 'a', then 2 'b'
   * }
   * ```
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.engine[Symbol.iterator]();
  }
}
