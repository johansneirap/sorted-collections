import type { Comparator } from '../types.js';

type Bias = 'left' | 'right';

/**
 * Generic binary search over `length` candidates. `compare(candidate)` must
 * return the same sign a comparator would for `comparator(candidate, target)`
 * — i.e. negative if the candidate sorts before the (implicit) target.
 * Taking a closure instead of `(target, comparator)` lets callers search by
 * a bare key without constructing a throwaway full element to compare against.
 */
function bisectByCompare<T>(
  length: number,
  getCandidate: (index: number) => T,
  compare: (candidate: T) => number,
  bias: Bias,
): number {
  let lo = 0;
  let hi = length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compare(getCandidate(mid));
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
 * Internal "list of lists" (sqrt-decomposition) engine shared by `SortedList`
 * and `SortedMap` — not part of the public API.
 *
 * Buckets of roughly √n sorted elements each, the same technique used by
 * Python's `sortedcontainers`. Locating a bucket by value is a binary search
 * over bucket boundaries (O(log buckets)); locating by position walks bucket
 * lengths (O(buckets)). With bucket count kept close to √n, that's O(log n)
 * and O(√n) respectively.
 *
 * `SortedMap` uses the `*By` methods directly (with a closure that compares
 * a stored `[K, V]` entry against a bare key) instead of `SortedList`'s
 * public wrapper: going through `bisectLeft` + `at` would pay for a
 * positional index (O(√n)) it doesn't need, and comparing via a search value
 * would need a throwaway `[key, undefined]` tuple and double key-unwrapping
 * per comparison instead of one.
 */
export class BucketEngine<T> implements Iterable<T> {
  private static readonly MIN_BUCKET_SIZE = 32;

  private buckets: T[][] = [];
  private count = 0;
  readonly comparator: Comparator<T>;

  constructor(comparator: Comparator<T>) {
    this.comparator = comparator;
  }

  private targetBucketSize(): number {
    return Math.max(BucketEngine.MIN_BUCKET_SIZE, Math.ceil(Math.sqrt(this.count)));
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

  /** Lookup by an arbitrary comparison closure: which (bucket, local index) does it point to? O(log n). Callers must ensure buckets is non-empty. */
  private locateBy(compare: (candidate: T) => number, bias: Bias): BucketLocation {
    const bucketIndex = bisectByCompare(
      this.buckets.length,
      (i) => {
        const bucket = this.buckets[i]!;
        return bucket[bucket.length - 1]!;
      },
      compare,
      bias,
    );
    const clampedBucketIndex = Math.min(bucketIndex, this.buckets.length - 1);
    const bucket = this.buckets[clampedBucketIndex]!;
    const localIndex = bisectByCompare(bucket.length, (i) => bucket[i]!, compare, bias);
    return { bucketIndex: clampedBucketIndex, localIndex };
  }

  /** Value-based lookup: which (bucket, local index) does `value` belong at? O(log n). Callers must ensure buckets is non-empty. */
  private locate(value: T, bias: Bias): BucketLocation {
    return this.locateBy((candidate) => this.comparator(candidate, value), bias);
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
    throw new Error('BucketEngine: internal invariant violated (count out of sync with buckets)');
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

  /**
   * Replaces the stored element equal to `value` (by comparator) in place, or
   * inserts it if absent. O(log n) to locate; O(1) to replace in place, or
   * O(√n) amortized to insert. This is what backs `SortedMap#set` — cheaper
   * than a separate find-then-remove-then-add round trip.
   */
  set(value: T): void {
    if (this.buckets.length === 0) {
      this.buckets.push([value]);
      this.count += 1;
      return;
    }
    const { bucketIndex, localIndex } = this.locate(value, 'left');
    const bucket = this.buckets[bucketIndex]!;
    if (localIndex < bucket.length && this.comparator(bucket[localIndex]!, value) === 0) {
      bucket[localIndex] = value;
      return;
    }
    bucket.splice(localIndex, 0, value);
    this.count += 1;
    this.maybeSplit(bucketIndex);
  }

  remove(value: T): boolean {
    return this.removeBy((candidate) => this.comparator(candidate, value));
  }

  /** Same O(log n) path as {@link remove}, via an arbitrary comparison closure instead of a full value. */
  removeBy(compare: (candidate: T) => number): boolean {
    if (this.buckets.length === 0) {
      return false;
    }
    const { bucketIndex, localIndex } = this.locateBy(compare, 'left');
    const bucket = this.buckets[bucketIndex]!;
    if (localIndex >= bucket.length || compare(bucket[localIndex]!) !== 0) {
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
    return this.hasBy((candidate) => this.comparator(candidate, value));
  }

  /** Same O(log n) path as {@link has}, via an arbitrary comparison closure instead of a full value. */
  hasBy(compare: (candidate: T) => number): boolean {
    return this.findBy(compare) !== undefined;
  }

  /** Same O(log n) path as {@link has}, but returns the actual stored element instead of a boolean. */
  findBy(compare: (candidate: T) => number): T | undefined {
    if (this.buckets.length === 0) {
      return undefined;
    }
    const { bucketIndex, localIndex } = this.locateBy(compare, 'left');
    const bucket = this.buckets[bucketIndex]!;
    return localIndex < bucket.length && compare(bucket[localIndex]!) === 0
      ? bucket[localIndex]
      : undefined;
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
   * Fenwick index. Confirmed empirically via `npm run bench`.)
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

  [Symbol.iterator](): IterableIterator<T> {
    return this.iterateRange({ bucketIndex: 0, localIndex: 0 });
  }
}
