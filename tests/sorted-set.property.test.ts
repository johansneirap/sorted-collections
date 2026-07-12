import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SortedSet } from '../src/sorted-set.js';

type Op =
  | { type: 'add'; value: number }
  | { type: 'remove'; value: number }
  | { type: 'discard'; value: number };

const opArbitrary: fc.Arbitrary<Op> = fc.oneof(
  fc.record({ type: fc.constant('add' as const), value: fc.integer({ min: -30, max: 30 }) }),
  fc.record({ type: fc.constant('remove' as const), value: fc.integer({ min: -30, max: 30 }) }),
  fc.record({ type: fc.constant('discard' as const), value: fc.integer({ min: -30, max: 30 }) }),
);

function applyToReference(reference: Set<number>, op: Op): void {
  switch (op.type) {
    case 'add':
      reference.add(op.value);
      return;
    case 'remove':
    case 'discard':
      reference.delete(op.value);
      return;
  }
}

function applyToSet(set: SortedSet<number>, op: Op): void {
  switch (op.type) {
    case 'add':
      set.add(op.value);
      return;
    case 'remove':
      set.remove(op.value);
      return;
    case 'discard':
      set.discard(op.value);
      return;
  }
}

describe('SortedSet — property-based (fast-check)', () => {
  it('matches a native Set reference after every operation, for any sequence', () => {
    fc.assert(
      fc.property(fc.array(opArbitrary, { minLength: 0, maxLength: 200 }), (ops) => {
        const set = new SortedSet<number>();
        const reference = new Set<number>();
        for (const op of ops) {
          applyToSet(set, op);
          applyToReference(reference, op);
          expect([...set]).toEqual([...reference].sort((a, b) => a - b));
          expect(set.length).toBe(reference.size);
        }
      }),
      { numRuns: 500 },
    );
  });

  it('union/intersection/difference/isSubsetOf match native Set semantics', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -30, max: 30 }), { maxLength: 60 }),
        fc.array(fc.integer({ min: -30, max: 30 }), { maxLength: 60 }),
        (valuesA, valuesB) => {
          const a = new SortedSet<number>(valuesA);
          const b = new SortedSet<number>(valuesB);
          const refA = new Set(valuesA);
          const refB = new Set(valuesB);

          const union = [...new Set([...refA, ...refB])].sort((x, y) => x - y);
          const intersection = [...refA].filter((v) => refB.has(v)).sort((x, y) => x - y);
          const difference = [...refA].filter((v) => !refB.has(v)).sort((x, y) => x - y);
          const isSubset = [...refA].every((v) => refB.has(v));

          expect([...a.union(b)]).toEqual(union);
          expect([...a.intersection(b)]).toEqual(intersection);
          expect([...a.difference(b)]).toEqual(difference);
          expect(a.isSubsetOf(b)).toBe(isSubset);
        },
      ),
      { numRuns: 300 },
    );
  });
});
