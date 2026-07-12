import { SortedList } from './sorted-list.js';
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
 * Composed from a private `SortedList<[K, V]>` whose comparator only looks at
 * the key component — reuses the same bucket structure as
 * `SortedList`/`SortedSet` instead of reimplementing it.
 */
export class SortedMap<K, V> implements Iterable<[K, V]> {
  private readonly entriesList: SortedList<[K, V]>;
  private readonly keyComparator: Comparator<K>;

  constructor(entries?: Iterable<[K, V]>, ...options: ComparatorArg<K>) {
    const opts = options[0] as SortedOptions<K> | undefined;
    this.keyComparator = opts?.comparator ?? (defaultKeyComparator as Comparator<K>);
    const entryComparator: Comparator<[K, V]> = (a, b) => this.keyComparator(a[0], b[0]);
    this.entriesList = new SortedList<[K, V]>(undefined, ...comparatorArgs(entryComparator));
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  private locate(key: K): number {
    return this.entriesList.bisectLeft([key, undefined as unknown as V]);
  }

  private findExact(key: K): [K, V] | undefined {
    const entry = this.entriesList.at(this.locate(key));
    return entry && this.keyComparator(entry[0], key) === 0 ? entry : undefined;
  }

  /** O(√n) amortized: replaces the value if the key exists, otherwise inserts. */
  set(key: K, value: V): void {
    const idx = this.locate(key);
    const entry = this.entriesList.at(idx);
    if (entry && this.keyComparator(entry[0], key) === 0) {
      this.entriesList.pop(idx);
    }
    this.entriesList.add([key, value]);
  }

  /** O(log n) to locate the bucket + O(log bucket size) binary search. */
  get(key: K): V | undefined {
    return this.findExact(key)?.[1];
  }

  delete(key: K): boolean {
    const idx = this.locate(key);
    const entry = this.entriesList.at(idx);
    if (entry && this.keyComparator(entry[0], key) === 0) {
      this.entriesList.pop(idx);
      return true;
    }
    return false;
  }

  has(key: K): boolean {
    return this.findExact(key) !== undefined;
  }

  /** A snapshot `SortedSet` of the current keys — not a live view. */
  keys(): SortedSet<K> {
    return new SortedSet<K>(this.keysGenerator(), ...comparatorArgs(this.keyComparator));
  }

  private *keysGenerator(): Generator<K> {
    for (const [key] of this.entriesList) {
      yield key;
    }
  }

  *values(): IterableIterator<V> {
    for (const [, value] of this.entriesList) {
      yield value;
    }
  }

  entries(): IterableIterator<[K, V]> {
    return this.entriesList[Symbol.iterator]();
  }

  /** Iterates `[key, value]` pairs with keys in `[minKey, maxKey]`. */
  irange(minKey?: K, maxKey?: K): IterableIterator<[K, V]> {
    const min = minKey === undefined ? undefined : ([minKey, undefined as unknown as V] as [K, V]);
    const max = maxKey === undefined ? undefined : ([maxKey, undefined as unknown as V] as [K, V]);
    return this.entriesList.irange(min, max);
  }

  /** O(√n). Entry at ordinal position `index` in key order. */
  at(index: number): [K, V] | undefined {
    return this.entriesList.at(index);
  }

  get size(): number {
    return this.entriesList.length;
  }

  clear(): void {
    this.entriesList.clear();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entriesList[Symbol.iterator]();
  }
}
