import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SortedMap } from '../src/sorted-map.js';

type Op = { type: 'set'; key: number; value: number } | { type: 'delete'; key: number };

const opArbitrary: fc.Arbitrary<Op> = fc.oneof(
  fc.record({
    type: fc.constant('set' as const),
    key: fc.integer({ min: -30, max: 30 }),
    value: fc.integer(),
  }),
  fc.record({ type: fc.constant('delete' as const), key: fc.integer({ min: -30, max: 30 }) }),
);

function applyToReference(reference: Map<number, number>, op: Op): void {
  if (op.type === 'set') {
    reference.set(op.key, op.value);
  } else {
    reference.delete(op.key);
  }
}

function applyToMap(map: SortedMap<number, number>, op: Op): void {
  if (op.type === 'set') {
    map.set(op.key, op.value);
  } else {
    map.delete(op.key);
  }
}

function sortedEntries(reference: Map<number, number>): [number, number][] {
  return [...reference.entries()].sort((a, b) => a[0] - b[0]);
}

describe('SortedMap — property-based (fast-check)', () => {
  it('matches a native Map reference after every operation, for any sequence', () => {
    fc.assert(
      fc.property(fc.array(opArbitrary, { minLength: 0, maxLength: 200 }), (ops) => {
        const map = new SortedMap<number, number>();
        const reference = new Map<number, number>();
        for (const op of ops) {
          applyToMap(map, op);
          applyToReference(reference, op);
          expect([...map]).toEqual(sortedEntries(reference));
          expect(map.size).toBe(reference.size);
        }
      }),
      { numRuns: 500 },
    );
  });

  it('get/has match a native Map reference', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: -30, max: 30 }), fc.integer()), { maxLength: 100 }),
        fc.integer({ min: -40, max: 40 }),
        (entries, target) => {
          const map = new SortedMap<number, number>(entries);
          const reference = new Map<number, number>(entries);
          expect(map.get(target)).toBe(reference.get(target));
          expect(map.has(target)).toBe(reference.has(target));
        },
      ),
      { numRuns: 300 },
    );
  });

  it('at() matches indexing into the sorted key order of a native Map reference', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: -30, max: 30 }), fc.integer()), { maxLength: 100 }),
        fc.integer({ min: -5, max: 105 }),
        (entries, index) => {
          const map = new SortedMap<number, number>(entries);
          const reference = new Map<number, number>(entries);
          // Array.prototype.at() (not bracket indexing) to mirror map.at()'s
          // support for negative indices.
          const expected = sortedEntries(reference).at(index);
          expect(map.at(index)).toEqual(expected);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('irange matches a naive filter on sorted reference entries', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: -30, max: 30 }), fc.integer()), { maxLength: 100 }),
        fc.integer({ min: -40, max: 40 }),
        fc.integer({ min: -40, max: 40 }),
        (entries, a, b) => {
          const [min, max] = a <= b ? [a, b] : [b, a];
          const map = new SortedMap<number, number>(entries);
          const reference = new Map<number, number>(entries);
          const expected = sortedEntries(reference).filter(([k]) => k >= min && k <= max);
          expect([...map.irange(min, max)]).toEqual(expected);
        },
      ),
      { numRuns: 300 },
    );
  });
});
