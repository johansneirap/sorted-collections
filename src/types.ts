/**
 * A standard JS/TS comparator: negative if `a` sorts before `b`, positive if
 * after, zero if equal.
 */
export type Comparator<T> = (a: T, b: T) => number;

export interface SortedOptions<T> {
  comparator?: Comparator<T>;
}

export interface SortedOptionsRequired<T> {
  comparator: Comparator<T>;
}

/** Types with a natural order (`<`/`>`) usable without an explicit comparator. */
export type NaturallyOrderable = number | string;

/**
 * Rest-tuple used in constructors so TypeScript enforces a comparator at
 * compile time for any `T` that isn't naturally orderable, while keeping it
 * optional for `number`/`string`.
 */
export type ComparatorArg<T> = T extends NaturallyOrderable
  ? [options?: SortedOptions<T>]
  : [options: SortedOptionsRequired<T>];
