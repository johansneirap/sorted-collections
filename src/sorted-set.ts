import { SortedList } from './sorted-list.js';

/**
 * Like {@link SortedList}, but rejects duplicates (compared via the
 * comparator, not reference identity). Adds set-theory operations.
 *
 * Reuses `SortedList`'s bucket structure entirely: the only behavioral
 * difference is that `add` is a no-op for values already present.
 *
 * @example
 * ```ts
 * const tags = new SortedSet<string>(['b', 'a', 'c', 'a']);
 * [...tags]; // ['a', 'b', 'c'] — the duplicate 'a' was dropped
 * ```
 */
export class SortedSet<T> extends SortedList<T> {
  /**
   * O(log n) `has` check + O(√n) amortized insert if the value is new.
   *
   * @example
   * ```ts
   * const tags = new SortedSet<string>(['a']);
   * tags.add('a'); // no-op, already present
   * tags.length; // 1
   * ```
   */
  override add(value: T): void {
    if (!this.has(value)) {
      super.add(value);
    }
  }

  /**
   * @example
   * ```ts
   * const original = new SortedSet<number>([1, 2, 3]);
   * const copy = original.clone();
   * copy.add(4);
   * original.length; // 3
   * ```
   */
  override clone(): SortedSet<T> {
    return new SortedSet<T>(this, ...this.comparatorArg());
  }

  /**
   * O(m log n + m) for a set of size m being merged in.
   *
   * @example
   * ```ts
   * const a = new SortedSet<number>([1, 2, 3]);
   * const b = new SortedSet<number>([3, 4]);
   * [...a.union(b)]; // [1, 2, 3, 4]
   * ```
   */
  union(other: SortedSet<T>): SortedSet<T> {
    const result = this.clone();
    for (const value of other) {
      result.add(value);
    }
    return result;
  }

  /**
   * @example
   * ```ts
   * const a = new SortedSet<number>([1, 2, 3]);
   * const b = new SortedSet<number>([2, 3, 4]);
   * [...a.intersection(b)]; // [2, 3]
   * ```
   */
  intersection(other: SortedSet<T>): SortedSet<T> {
    const result = new SortedSet<T>([], ...this.comparatorArg());
    for (const value of this) {
      if (other.has(value)) {
        result.add(value);
      }
    }
    return result;
  }

  /**
   * @example
   * ```ts
   * const a = new SortedSet<number>([1, 2, 3]);
   * const b = new SortedSet<number>([2, 3]);
   * [...a.difference(b)]; // [1] — in a, not in b
   * ```
   */
  difference(other: SortedSet<T>): SortedSet<T> {
    const result = new SortedSet<T>([], ...this.comparatorArg());
    for (const value of this) {
      if (!other.has(value)) {
        result.add(value);
      }
    }
    return result;
  }

  /**
   * @example
   * ```ts
   * new SortedSet<number>([2, 3]).isSubsetOf(new SortedSet<number>([1, 2, 3, 4])); // true
   * new SortedSet<number>([1, 5]).isSubsetOf(new SortedSet<number>([1, 2, 3])); // false
   * ```
   */
  isSubsetOf(other: SortedSet<T>): boolean {
    for (const value of this) {
      if (!other.has(value)) {
        return false;
      }
    }
    return true;
  }
}
