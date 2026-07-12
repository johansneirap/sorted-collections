import type { SortedSet } from './sorted-set.js';
import type { ComparatorArg } from './types.js';

/**
 * A dictionary ordered by key.
 *
 * STUB: signatures only, no implementation yet. Pending API review before
 * the real bucket-backed logic is implemented.
 */
export class SortedMap<K, V> implements Iterable<[K, V]> {
  constructor(entries?: Iterable<[K, V]>, ...options: ComparatorArg<K>) {
    throw new Error('SortedMap: not implemented');
  }

  /** O(√n) amortized. */
  set(key: K, value: V): void {
    throw new Error(`SortedMap#set(${String(key)}): not implemented`);
  }

  /** O(log n) to locate the bucket + O(log bucket size) binary search. */
  get(key: K): V | undefined {
    throw new Error(`SortedMap#get(${String(key)}): not implemented`);
  }

  delete(key: K): boolean {
    throw new Error(`SortedMap#delete(${String(key)}): not implemented`);
  }

  has(key: K): boolean {
    throw new Error(`SortedMap#has(${String(key)}): not implemented`);
  }

  keys(): SortedSet<K> | IterableIterator<K> {
    throw new Error('SortedMap#keys: not implemented');
  }

  values(): IterableIterator<V> {
    throw new Error('SortedMap#values: not implemented');
  }

  entries(): IterableIterator<[K, V]> {
    throw new Error('SortedMap#entries: not implemented');
  }

  /** Iterates `[key, value]` pairs with keys in `[minKey, maxKey]`. */
  irange(minKey?: K, maxKey?: K): IterableIterator<[K, V]> {
    throw new Error('SortedMap#irange: not implemented');
  }

  /** O(√n). Entry at ordinal position `index` in key order. */
  at(index: number): [K, V] | undefined {
    throw new Error(`SortedMap#at(${index}): not implemented`);
  }

  get size(): number {
    throw new Error('SortedMap#size: not implemented');
  }

  clear(): void {
    throw new Error('SortedMap#clear: not implemented');
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    throw new Error('SortedMap#[Symbol.iterator]: not implemented');
  }
}
