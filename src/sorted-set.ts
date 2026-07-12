import { SortedList } from './sorted-list.js';

/**
 * Like {@link SortedList}, but rejects duplicates (compared via the
 * comparator, not reference identity). Adds set-theory operations.
 *
 * Reuses `SortedList`'s bucket structure entirely: the only behavioral
 * difference is that `add` is a no-op for values already present.
 */
export class SortedSet<T> extends SortedList<T> {
  /** O(log n) `has` check + O(√n) amortized insert if the value is new. */
  override add(value: T): void {
    if (!this.has(value)) {
      super.add(value);
    }
  }

  override clone(): SortedSet<T> {
    return new SortedSet<T>(this, ...this.comparatorArg());
  }

  /** O(m log n + m) for a set of size m being merged in. */
  union(other: SortedSet<T>): SortedSet<T> {
    const result = this.clone();
    for (const value of other) {
      result.add(value);
    }
    return result;
  }

  intersection(other: SortedSet<T>): SortedSet<T> {
    const result = new SortedSet<T>([], ...this.comparatorArg());
    for (const value of this) {
      if (other.has(value)) {
        result.add(value);
      }
    }
    return result;
  }

  difference(other: SortedSet<T>): SortedSet<T> {
    const result = new SortedSet<T>([], ...this.comparatorArg());
    for (const value of this) {
      if (!other.has(value)) {
        result.add(value);
      }
    }
    return result;
  }

  isSubsetOf(other: SortedSet<T>): boolean {
    for (const value of this) {
      if (!other.has(value)) {
        return false;
      }
    }
    return true;
  }
}
