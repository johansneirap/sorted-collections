import { describe, expect, it } from 'vitest';
import { BucketEngine } from '../src/internal/bucket-engine.js';

const numericComparator = (a: number, b: number): number => a - b;

/** Builds a reference engine the old way: empty + add() per element. */
function buildViaAdd(values: number[]): BucketEngine<number> {
  const engine = new BucketEngine<number>(numericComparator);
  for (const v of values) engine.add(v);
  return engine;
}

describe('BucketEngine.fromSorted', () => {
  it('builds an empty engine from an empty array', () => {
    const engine = BucketEngine.fromSorted<number>([], numericComparator);
    expect(engine.length).toBe(0);
    expect([...engine]).toEqual([]);
  });

  it('builds a single-element engine', () => {
    const engine = BucketEngine.fromSorted([42], numericComparator);
    expect(engine.length).toBe(1);
    expect([...engine]).toEqual([42]);
    expect(engine.has(42)).toBe(true);
  });

  it('matches the observable state of building via add() per element', () => {
    const values = Array.from({ length: 500 }, (_, i) => i);
    const viaFromSorted = BucketEngine.fromSorted(values, numericComparator);
    const viaAdd = buildViaAdd(values);
    expect([...viaFromSorted]).toEqual([...viaAdd]);
    expect(viaFromSorted.length).toBe(viaAdd.length);
    for (const v of [0, 1, 250, 499]) {
      expect(viaFromSorted.at(v)).toBe(viaAdd.at(v));
      expect(viaFromSorted.has(v)).toBe(viaAdd.has(v));
      expect(viaFromSorted.indexOf(v)).toBe(viaAdd.indexOf(v));
    }
  });

  it('preserves adjacent duplicates, unlike a deduping structure', () => {
    const engine = BucketEngine.fromSorted([1, 1, 2, 2, 2, 3], numericComparator);
    expect([...engine]).toEqual([1, 1, 2, 2, 2, 3]);
    expect(engine.length).toBe(6);
  });

  it('rejects an array that is not actually sorted (dev-mode precondition check)', () => {
    expect(() => BucketEngine.fromSorted([3, 1, 2], numericComparator)).toThrow(/not sorted/);
  });

  describe('bucket-size boundaries (MIN_BUCKET_SIZE = 32)', () => {
    it.each([31, 32, 33])('produces correct order and length for n=%i', (n) => {
      const values = Array.from({ length: n }, (_, i) => i);
      const engine = BucketEngine.fromSorted(values, numericComparator);
      expect(engine.length).toBe(n);
      expect([...engine]).toEqual(values);
      expect(engine.at(0)).toBe(0);
      expect(engine.at(-1)).toBe(n - 1);
    });
  });
});
