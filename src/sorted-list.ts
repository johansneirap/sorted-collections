import { BucketEngine } from './internal/bucket-engine.js';
import type { Comparator, ComparatorArg, SortedOptions } from './types.js';

function defaultComparator<T>(a: T, b: T): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const left = String(a);
  const right = String(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * A list that keeps its elements in sorted order as they're inserted.
 *
 * A thin public wrapper around the internal {@link BucketEngine} — see there
 * for the actual "list of lists" (sqrt-decomposition) implementation and its
 * complexity notes.
 *
 * @example
 * ```ts
 * const scores = new SortedList<number>([42, 7, 99]);
 * scores.add(15);
 * [...scores]; // [7, 15, 42, 99]
 * ```
 */
export class SortedList<T> implements Iterable<T> {
  private readonly engine: BucketEngine<T>;

  /**
   * @example
   * ```ts
   * new SortedList<number>(); // empty
   * new SortedList<number>([3, 1, 2]); // [1, 2, 3]
   * new SortedList<Person>([...], { comparator: (a, b) => a.age - b.age });
   * ```
   */
  constructor(iterable?: Iterable<T>, ...options: ComparatorArg<T>) {
    const opts = options[0] as SortedOptions<T> | undefined;
    const comparator = opts?.comparator ?? (defaultComparator as Comparator<T>);
    this.engine = new BucketEngine<T>(comparator);
    // Goes through `this.update` -> `this.add` (not the engine's) so that a
    // SortedSet's overridden, deduping `add` applies during construction too.
    if (iterable) {
      this.update(iterable);
    }
  }

  /** Safe to call from subclasses/clone: both `ComparatorArg<T>` branches accept `{ comparator }`. */
  protected comparatorArg(): ComparatorArg<T> {
    return [{ comparator: this.engine.comparator }] as unknown as ComparatorArg<T>;
  }

  /**
   * O(√n) amortized.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>();
   * scores.add(42);
   * scores.add(7);
   * [...scores]; // [7, 42]
   * ```
   */
  add(value: T): void {
    this.engine.add(value);
  }

  /**
   * Bulk-inserts every value from `iterable`, one {@link add} at a time.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([3, 1]);
   * scores.update([2, 5, 4]);
   * [...scores]; // [1, 2, 3, 4, 5]
   * ```
   */
  update(iterable: Iterable<T>): void {
    for (const value of iterable) {
      this.add(value);
    }
  }

  /**
   * Removes the first occurrence of `value`. Returns `false` if it wasn't present.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([1, 2, 2, 3]);
   * scores.remove(2); // true — removes one occurrence
   * scores.remove(99); // false — not present
   * ```
   */
  remove(value: T): boolean {
    return this.engine.remove(value);
  }

  /**
   * Like {@link remove}, but never throws (or returns anything) if `value` isn't present.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([1, 2, 3]);
   * scores.discard(99); // no-op, no error
   * ```
   */
  discard(value: T): void {
    this.engine.discard(value);
  }

  /**
   * Removes and returns the element at `index` (default: the last element).
   * Negative indices count from the end, same as {@link at}.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([10, 20, 30]);
   * scores.pop(); // 30 — last element
   * scores.pop(0); // 10 — first element
   * ```
   */
  pop(index?: number): T {
    return this.engine.pop(index);
  }

  /**
   * O(√n): walks bucket lengths to find the element at `index` (negative indices count from the end).
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([10, 20, 30]);
   * scores.at(0); // 10
   * scores.at(-1); // 30 — same as Array.prototype.at
   * scores.at(99); // undefined — out of range
   * ```
   */
  at(index: number): T | undefined {
    return this.engine.at(index);
  }

  /**
   * The index of the first occurrence of `value`, or `-1` if absent.
   *
   * @example
   * ```ts
   * new SortedList<number>([1, 2, 2, 3]).indexOf(2); // 1
   * new SortedList<number>([1, 2, 3]).indexOf(99); // -1
   * ```
   */
  indexOf(value: T): number {
    return this.engine.indexOf(value);
  }

  /**
   * O(log n): binary search for the bucket, then binary search within it.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([1, 2, 3]);
   * scores.has(2); // true
   * scores.has(99); // false
   * ```
   */
  has(value: T): boolean {
    return this.engine.has(value);
  }

  /**
   * The leftmost index where `value` could be inserted while keeping the list sorted.
   *
   * @example
   * ```ts
   * new SortedList<number>([1, 2, 2, 2, 3]).bisectLeft(2); // 1
   * ```
   */
  bisectLeft(value: T): number {
    return this.engine.bisectLeft(value);
  }

  /**
   * The rightmost index where `value` could be inserted while keeping the list sorted.
   *
   * @example
   * ```ts
   * new SortedList<number>([1, 2, 2, 2, 3]).bisectRight(2); // 4
   * ```
   */
  bisectRight(value: T): number {
    return this.engine.bisectRight(value);
  }

  /**
   * O(log n) to locate both bounds by value + O(k) to iterate the k results.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([1, 2, 3, 4, 5]);
   * [...scores.irange(2, 4)]; // [2, 3, 4] — inclusive by default
   * [...scores.irange(2, 4, { inclusive: [false, true] })]; // [3, 4]
   * ```
   */
  irange(min?: T, max?: T, options?: { inclusive?: [boolean, boolean] }): IterableIterator<T> {
    return this.engine.irange(min, max, options);
  }

  /**
   * O(√n) to locate both positional bounds + O(k) to iterate the k results.
   *
   * @example
   * ```ts
   * const scores = new SortedList<number>([10, 20, 30, 40, 50]);
   * [...scores.islice(1, 4)]; // [20, 30, 40] — like Array.prototype.slice
   * ```
   */
  islice(start?: number, end?: number): IterableIterator<T> {
    return this.engine.islice(start, end);
  }

  /**
   * @example
   * ```ts
   * new SortedList<number>([1, 2, 3]).length; // 3
   * ```
   */
  get length(): number {
    return this.engine.length;
  }

  /**
   * @example
   * ```ts
   * const scores = new SortedList<number>([1, 2, 3]);
   * scores.clear();
   * scores.length; // 0
   * ```
   */
  clear(): void {
    this.engine.clear();
  }

  /**
   * An independent copy — mutating the clone never affects the original.
   *
   * @example
   * ```ts
   * const original = new SortedList<number>([1, 2, 3]);
   * const copy = original.clone();
   * copy.add(4);
   * original.length; // 3
   * copy.length; // 4
   * ```
   */
  clone(): SortedList<T> {
    return new SortedList<T>(this, ...this.comparatorArg());
  }

  /**
   * @example
   * ```ts
   * const scores = new SortedList<number>([3, 1, 2]);
   * for (const value of scores) console.log(value); // 1, 2, 3
   * ```
   */
  [Symbol.iterator](): IterableIterator<T> {
    return this.engine[Symbol.iterator]();
  }
}
