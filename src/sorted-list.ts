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

type Bias = 'left' | 'right';

/** Generic binary search: leftmost/rightmost insertion point of `target` among `length` keys. */
function bisectBy<T>(
  length: number,
  getKey: (index: number) => T,
  target: T,
  comparator: Comparator<T>,
  bias: Bias,
): number {
  let lo = 0;
  let hi = length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = comparator(getKey(mid), target);
    const goLeft = bias === 'left' ? cmp >= 0 : cmp > 0;
    if (goLeft) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

interface BucketLocation {
  bucketIndex: number;
  localIndex: number;
}

/**
 * A list that keeps its elements in sorted order as they're inserted.
 *
 * Backed internally by a "list of lists" — buckets of roughly √n sorted
 * elements each — the same technique used by Python's `sortedcontainers`.
 * Locating a bucket by value is a binary search over bucket boundaries
 * (O(log buckets)); locating by position walks bucket lengths (O(buckets)).
 * With bucket count kept close to √n, that's O(log n) and O(√n) respectively.
 */
export class SortedList<T> implements Iterable<T> {
  private static readonly MIN_BUCKET_SIZE = 32;

  private buckets: T[][] = [];
  private count = 0;
  protected readonly comparator: Comparator<T>;

  constructor(iterable?: Iterable<T>, ...options: ComparatorArg<T>) {
    const opts = options[0] as SortedOptions<T> | undefined;
    this.comparator = opts?.comparator ?? (defaultComparator as Comparator<T>);
    if (iterable) {
      this.update(iterable);
    }
  }

  /** Safe to call from subclasses/clone: both `ComparatorArg<T>` branches accept `{ comparator }`. */
  protected comparatorArg(): ComparatorArg<T> {
    return [{ comparator: this.comparator }] as unknown as ComparatorArg<T>;
  }

  private targetBucketSize(): number {
    return Math.max(SortedList.MIN_BUCKET_SIZE, Math.ceil(Math.sqrt(this.count)));
  }

  private maybeSplit(bucketIndex: number): void {
    const bucket = this.buckets[bucketIndex]!;
    const target = this.targetBucketSize();
    if (bucket.length > target * 2) {
      const mid = bucket.length >>> 1;
      const right = bucket.splice(mid);
      this.buckets.splice(bucketIndex + 1, 0, right);
    }
  }

  private maybeMerge(bucketIndex: number): void {
    const bucket = this.buckets[bucketIndex]!;
    if (bucket.length === 0) {
      this.buckets.splice(bucketIndex, 1);
      return;
    }
    if (this.buckets.length <= 1) {
      return;
    }
    const target = this.targetBucketSize();
    if (bucket.length < target / 2) {
      const neighborIndex = bucketIndex > 0 ? bucketIndex - 1 : bucketIndex + 1;
      const [a, b] =
        bucketIndex < neighborIndex ? [bucketIndex, neighborIndex] : [neighborIndex, bucketIndex];
      const merged = this.buckets[a]!.concat(this.buckets[b]!);
      this.buckets.splice(a, 2, merged);
      this.maybeSplit(a);
    }
  }

  /** Value-based lookup: which (bucket, local index) does `value` belong at? O(log n). Callers must ensure buckets is non-empty. */
  private locate(value: T, bias: Bias): BucketLocation {
    const bucketIndex = bisectBy(
      this.buckets.length,
      (i) => {
        const bucket = this.buckets[i]!;
        return bucket[bucket.length - 1]!;
      },
      value,
      this.comparator,
      bias,
    );
    const clampedBucketIndex = Math.min(bucketIndex, this.buckets.length - 1);
    const bucket = this.buckets[clampedBucketIndex]!;
    const localIndex = bisectBy(bucket.length, (i) => bucket[i]!, value, this.comparator, bias);
    return { bucketIndex: clampedBucketIndex, localIndex };
  }

  /** Position-based lookup: which (bucket, local index) is global index `index` at? O(√n). */
  private locatePosition(index: number): BucketLocation | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }
    let remaining = index;
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i]!;
      if (remaining < bucket.length) {
        return { bucketIndex: i, localIndex: remaining };
      }
      remaining -= bucket.length;
    }
    /* v8 ignore next -- unreachable unless `count` desyncs from `buckets`, which would be an internal bug */
    throw new Error('SortedList: internal invariant violated (count out of sync with buckets)');
  }

  /** Inverse of {@link locatePosition}: sums preceding bucket lengths. O(√n). */
  private globalIndex(bucketIndex: number, localIndex: number): number {
    let total = localIndex;
    for (let i = 0; i < bucketIndex; i++) {
      total += this.buckets[i]!.length;
    }
    return total;
  }

  private resolveIndex(index: number): number {
    return index < 0 ? this.count + index : index;
  }

  private *iterateRange(start: BucketLocation, end?: BucketLocation): Generator<T> {
    for (let bucketIndex = start.bucketIndex; bucketIndex < this.buckets.length; bucketIndex++) {
      if (end && bucketIndex > end.bucketIndex) {
        return;
      }
      const bucket = this.buckets[bucketIndex]!;
      const from = bucketIndex === start.bucketIndex ? start.localIndex : 0;
      const to = end && bucketIndex === end.bucketIndex ? end.localIndex : bucket.length;
      for (let i = from; i < to; i++) {
        yield bucket[i]!;
      }
    }
  }

  /** O(√n) amortized: locates the target bucket and splices the value in, splitting oversized buckets. */
  add(value: T): void {
    if (this.buckets.length === 0) {
      this.buckets.push([value]);
      this.count += 1;
      return;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'right');
    this.buckets[bucketIndex]!.splice(localIndex, 0, value);
    this.count += 1;
    this.maybeSplit(bucketIndex);
  }

  update(iterable: Iterable<T>): void {
    for (const value of iterable) {
      this.add(value);
    }
  }

  remove(value: T): boolean {
    if (this.buckets.length === 0) {
      return false;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'left');
    const bucket = this.buckets[bucketIndex]!;
    if (localIndex >= bucket.length || this.comparator(bucket[localIndex]!, value) !== 0) {
      return false;
    }
    bucket.splice(localIndex, 1);
    this.count -= 1;
    this.maybeMerge(bucketIndex);
    return true;
  }

  discard(value: T): void {
    this.remove(value);
  }

  pop(index?: number): T {
    if (this.count === 0) {
      throw new RangeError('SortedList#pop: list is empty');
    }
    const resolved = index === undefined ? this.count - 1 : this.resolveIndex(index);
    const location = this.locatePosition(resolved);
    if (!location) {
      throw new RangeError(`SortedList#pop: index ${index} is out of range`);
    }
    const bucket = this.buckets[location.bucketIndex]!;
    const [value] = bucket.splice(location.localIndex, 1);
    this.count -= 1;
    this.maybeMerge(location.bucketIndex);
    return value as T;
  }

  /** O(√n): walks bucket lengths to find the element at `index` (negative indices count from the end). */
  at(index: number): T | undefined {
    const location = this.locatePosition(this.resolveIndex(index));
    if (!location) {
      return undefined;
    }
    return this.buckets[location.bucketIndex]![location.localIndex];
  }

  indexOf(value: T): number {
    if (this.buckets.length === 0) {
      return -1;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'left');
    const bucket = this.buckets[bucketIndex]!;
    if (localIndex >= bucket.length || this.comparator(bucket[localIndex]!, value) !== 0) {
      return -1;
    }
    return this.globalIndex(bucketIndex, localIndex);
  }

  /** O(log n): binary search for the bucket, then binary search within it. */
  has(value: T): boolean {
    if (this.buckets.length === 0) {
      return false;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'left');
    const bucket = this.buckets[bucketIndex]!;
    return localIndex < bucket.length && this.comparator(bucket[localIndex]!, value) === 0;
  }

  bisectLeft(value: T): number {
    if (this.buckets.length === 0) {
      return 0;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'left');
    return this.globalIndex(bucketIndex, localIndex);
  }

  bisectRight(value: T): number {
    if (this.buckets.length === 0) {
      return 0;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'right');
    return this.globalIndex(bucketIndex, localIndex);
  }

  /** O(log n) to locate both bounds by value + O(k) to iterate the k results. */
  irange(min?: T, max?: T, options?: { inclusive?: [boolean, boolean] }): IterableIterator<T> {
    if (this.buckets.length === 0) {
      return this.iterateRange({ bucketIndex: 0, localIndex: 0 });
    }
    const [minInclusive, maxInclusive] = options?.inclusive ?? [true, true];
    const start =
      min === undefined
        ? { bucketIndex: 0, localIndex: 0 }
        : this.locate(min, minInclusive ? 'left' : 'right');
    const end = max === undefined ? undefined : this.locate(max, maxInclusive ? 'right' : 'left');
    return this.iterateRange(start, end);
  }

  /**
   * O(√n) to locate both positional bounds + O(k) to iterate the k results.
   * (Slightly worse than the O(log n) originally targeted for this method —
   * positional lookup fundamentally needs a bucket-length walk without a
   * Fenwick index. Flagged for empirical validation before publishing final
   * numbers.)
   */
  islice(start?: number, end?: number): IterableIterator<T> {
    const resolvedStart = Math.max(0, start === undefined ? 0 : this.resolveIndex(start));
    const resolvedEnd = Math.min(
      this.count,
      end === undefined ? this.count : this.resolveIndex(end),
    );
    if (resolvedStart >= resolvedEnd || this.count === 0) {
      return this.iterateRange(
        { bucketIndex: 0, localIndex: 0 },
        { bucketIndex: 0, localIndex: 0 },
      );
    }
    const startLoc = this.locatePosition(resolvedStart)!;
    const endLoc = this.locatePosition(resolvedEnd - 1)!;
    return this.iterateRange(startLoc, {
      bucketIndex: endLoc.bucketIndex,
      localIndex: endLoc.localIndex + 1,
    });
  }

  get length(): number {
    return this.count;
  }

  clear(): void {
    this.buckets = [];
    this.count = 0;
  }

  clone(): SortedList<T> {
    return new SortedList<T>(this, ...this.comparatorArg());
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.iterateRange({ bucketIndex: 0, localIndex: 0 });
  }
}
