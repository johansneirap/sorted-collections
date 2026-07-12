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
 */
export class SortedMap<K, V> implements Iterable<[K, V]> {
  private readonly engine: BucketEngine<[K, V]>;
  private readonly keyComparator: Comparator<K>;

  constructor(entries?: Iterable<[K, V]>, ...options: ComparatorArg<K>) {
    const opts = options[0] as SortedOptions<K> | undefined;
    this.keyComparator = opts?.comparator ?? (defaultKeyComparator as Comparator<K>);
    const entryComparator: Comparator<[K, V]> = (a, b) => this.keyComparator(a[0], b[0]);
    this.engine = new BucketEngine<[K, V]>(entryComparator);
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  /** O(log n) to locate + O(1) to replace in place, or O(√n) amortized to insert. */
  set(key: K, value: V): void {
    this.engine.set([key, value]);
  }

  /** O(log n): binary search for the bucket, then binary search within it. */
  get(key: K): V | undefined {
    return this.engine.findBy((entry) => this.keyComparator(entry[0], key))?.[1];
  }

  delete(key: K): boolean {
    return this.engine.removeBy((entry) => this.keyComparator(entry[0], key));
  }

  has(key: K): boolean {
    return this.engine.hasBy((entry) => this.keyComparator(entry[0], key));
  }

  /** A snapshot `SortedSet` of the current keys — not a live view. */
  keys(): SortedSet<K> {
    return new SortedSet<K>(this.keysGenerator(), ...comparatorArgs(this.keyComparator));
  }

  private *keysGenerator(): Generator<K> {
    for (const [key] of this.engine) {
      yield key;
    }
  }

  *values(): IterableIterator<V> {
    for (const [, value] of this.engine) {
      yield value;
    }
  }

  entries(): IterableIterator<[K, V]> {
    return this.engine[Symbol.iterator]();
  }

  /** Iterates `[key, value]` pairs with keys in `[minKey, maxKey]`. */
  irange(minKey?: K, maxKey?: K): IterableIterator<[K, V]> {
    const min = minKey === undefined ? undefined : ([minKey, undefined as unknown as V] as [K, V]);
    const max = maxKey === undefined ? undefined : ([maxKey, undefined as unknown as V] as [K, V]);
    return this.engine.irange(min, max);
  }

  /** O(√n). Entry at ordinal position `index` in key order. */
  at(index: number): [K, V] | undefined {
    return this.engine.at(index);
  }

  get size(): number {
    return this.engine.length;
  }

  clear(): void {
    this.engine.clear();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.engine[Symbol.iterator]();
  }
}
