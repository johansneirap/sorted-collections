import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SortedList } from '../src/sorted-list.js';

type Op =
  | { type: 'add'; value: number }
  | { type: 'remove'; value: number }
  | { type: 'discard'; value: number }
  | { type: 'pop'; index: number };

const opArbitrary: fc.Arbitrary<Op> = fc.oneof(
  fc.record({ type: fc.constant('add' as const), value: fc.integer({ min: -50, max: 50 }) }),
  fc.record({ type: fc.constant('remove' as const), value: fc.integer({ min: -50, max: 50 }) }),
  fc.record({ type: fc.constant('discard' as const), value: fc.integer({ min: -50, max: 50 }) }),
  fc.record({ type: fc.constant('pop' as const), index: fc.integer({ min: -20, max: 20 }) }),
);

/** Naive reference model: unsorted array, re-sorted after every mutation. */
function applyToReference(reference: number[], op: Op): void {
  switch (op.type) {
    case 'add':
      reference.push(op.value);
      reference.sort((a, b) => a - b);
      return;
    case 'remove':
    case 'discard': {
      const idx = reference.indexOf(op.value);
      if (idx !== -1) reference.splice(idx, 1);
      return;
    }
    case 'pop': {
      const resolved = op.index < 0 ? reference.length + op.index : op.index;
      if (resolved >= 0 && resolved < reference.length) reference.splice(resolved, 1);
      return;
    }
  }
}

function applyToList(list: SortedList<number>, op: Op): void {
  switch (op.type) {
    case 'add':
      list.add(op.value);
      return;
    case 'remove':
      list.remove(op.value);
      return;
    case 'discard':
      list.discard(op.value);
      return;
    case 'pop': {
      const resolved = op.index < 0 ? list.length + op.index : op.index;
      if (resolved >= 0 && resolved < list.length) list.pop(op.index);
      return;
    }
  }
}

describe('SortedList — property-based (fast-check)', () => {
  it('matches a naive array+sort reference after every operation, for any sequence', () => {
    fc.assert(
      fc.property(fc.array(opArbitrary, { minLength: 0, maxLength: 200 }), (ops) => {
        const list = new SortedList<number>();
        const reference: number[] = [];
        for (const op of ops) {
          applyToList(list, op);
          applyToReference(reference, op);
          expect([...list]).toEqual(reference);
          expect(list.length).toBe(reference.length);
        }
      }),
      { numRuns: 500 },
    );
  });

  it('bisectLeft/bisectRight match textbook definitions on a naive sorted reference', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: -60, max: 60 }),
        (values, target) => {
          const list = new SortedList<number>(values);
          const reference = [...values].sort((a, b) => a - b);
          const expectedLeft = reference.findIndex((v) => v >= target);
          const expectedRight = reference.findIndex((v) => v > target);
          expect(list.bisectLeft(target)).toBe(
            expectedLeft === -1 ? reference.length : expectedLeft,
          );
          expect(list.bisectRight(target)).toBe(
            expectedRight === -1 ? reference.length : expectedRight,
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  it('has/indexOf match a naive reference implementation', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: -60, max: 60 }),
        (values, target) => {
          const list = new SortedList<number>(values);
          const reference = [...values].sort((a, b) => a - b);
          expect(list.has(target)).toBe(reference.includes(target));
          expect(list.indexOf(target)).toBe(reference.indexOf(target));
        },
      ),
      { numRuns: 300 },
    );
  });

  it('at() matches indexing into a naive sorted reference, including negative indices', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: -10, max: 10 }),
        (values, index) => {
          const list = new SortedList<number>(values);
          const reference = [...values].sort((a, b) => a - b);
          const resolved = index < 0 ? reference.length + index : index;
          const expected =
            resolved >= 0 && resolved < reference.length ? reference[resolved] : undefined;
          expect(list.at(index)).toBe(expected);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('irange matches a naive filter on a sorted reference', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -50, max: 50 }), { minLength: 0, maxLength: 100 }),
        fc.integer({ min: -60, max: 60 }),
        fc.integer({ min: -60, max: 60 }),
        (values, a, b) => {
          const [min, max] = a <= b ? [a, b] : [b, a];
          const list = new SortedList<number>(values);
          const reference = [...values].sort((x, y) => x - y).filter((v) => v >= min && v <= max);
          expect([...list.irange(min, max)]).toEqual(reference);
        },
      ),
      { numRuns: 300 },
    );
  });
});
