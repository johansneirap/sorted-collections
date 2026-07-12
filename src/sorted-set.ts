import { SortedList } from './sorted-list.js';

/**
 * Like {@link SortedList}, but rejects duplicates (compared via the
 * comparator, not reference identity). Adds set-theory operations.
 *
 * STUB: signatures only, no implementation yet. Pending API review before
 * the real bucket-backed logic is implemented.
 */
export class SortedSet<T> extends SortedList<T> {
  union(other: SortedSet<T>): SortedSet<T> {
    throw new Error('SortedSet#union: not implemented');
  }

  intersection(other: SortedSet<T>): SortedSet<T> {
    throw new Error('SortedSet#intersection: not implemented');
  }

  difference(other: SortedSet<T>): SortedSet<T> {
    throw new Error('SortedSet#difference: not implemented');
  }

  isSubsetOf(other: SortedSet<T>): boolean {
    throw new Error('SortedSet#isSubsetOf: not implemented');
  }
}
