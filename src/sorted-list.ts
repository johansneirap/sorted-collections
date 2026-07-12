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
 */
export class SortedList<T> implements Iterable<T> {
  private readonly engine: BucketEngine<T>;

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

  /** O(√n) amortized. */
  add(value: T): void {
    this.engine.add(value);
  }

  update(iterable: Iterable<T>): void {
    for (const value of iterable) {
      this.add(value);
    }
  }

  remove(value: T): boolean {
    return this.engine.remove(value);
  }

  discard(value: T): void {
    this.engine.discard(value);
  }

  pop(index?: number): T {
    return this.engine.pop(index);
  }

  /** O(√n): walks bucket lengths to find the element at `index` (negative indices count from the end). */
  at(index: number): T | undefined {
    return this.engine.at(index);
  }

  indexOf(value: T): number {
    return this.engine.indexOf(value);
  }

  /** O(log n): binary search for the bucket, then binary search within it. */
  has(value: T): boolean {
    return this.engine.has(value);
  }

  bisectLeft(value: T): number {
    return this.engine.bisectLeft(value);
  }

  bisectRight(value: T): number {
    return this.engine.bisectRight(value);
  }

  /** O(log n) to locate both bounds by value + O(k) to iterate the k results. */
  irange(min?: T, max?: T, options?: { inclusive?: [boolean, boolean] }): IterableIterator<T> {
    return this.engine.irange(min, max, options);
  }

  /** O(√n) to locate both positional bounds + O(k) to iterate the k results. */
  islice(start?: number, end?: number): IterableIterator<T> {
    return this.engine.islice(start, end);
  }

  get length(): number {
    return this.engine.length;
  }

  clear(): void {
    this.engine.clear();
  }

  clone(): SortedList<T> {
    return new SortedList<T>(this, ...this.comparatorArg());
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.engine[Symbol.iterator]();
  }
}
