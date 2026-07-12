import { describe, expect, it } from 'vitest';
import { SortedList } from '../src/sorted-list.js';

describe('SortedList — empty list', () => {
  it('has length 0', () => {
    expect(new SortedList<number>().length).toBe(0);
  });

  it('at() returns undefined for any index', () => {
    const list = new SortedList<number>();
    expect(list.at(0)).toBeUndefined();
    expect(list.at(-1)).toBeUndefined();
  });

  it('has() returns false', () => {
    expect(new SortedList<number>().has(1)).toBe(false);
  });

  it('indexOf() returns -1', () => {
    expect(new SortedList<number>().indexOf(1)).toBe(-1);
  });

  it('remove() returns false, discard() does not throw', () => {
    const list = new SortedList<number>();
    expect(list.remove(1)).toBe(false);
    expect(() => list.discard(1)).not.toThrow();
  });

  it('pop() throws RangeError', () => {
    expect(() => new SortedList<number>().pop()).toThrow(RangeError);
  });

  it('bisectLeft/bisectRight are 0', () => {
    const list = new SortedList<number>();
    expect(list.bisectLeft(5)).toBe(0);
    expect(list.bisectRight(5)).toBe(0);
  });

  it('iterates to nothing', () => {
    expect([...new SortedList<number>()]).toEqual([]);
    expect([...new SortedList<number>().irange()]).toEqual([]);
    expect([...new SortedList<number>().islice()]).toEqual([]);
  });
});

describe('SortedList — single element', () => {
  it('add() then has/at/indexOf reflect it', () => {
    const list = new SortedList<number>();
    list.add(42);
    expect(list.length).toBe(1);
    expect(list.has(42)).toBe(true);
    expect(list.at(0)).toBe(42);
    expect(list.at(-1)).toBe(42);
    expect(list.indexOf(42)).toBe(0);
  });

  it('remove() empties the list', () => {
    const list = new SortedList<number>([42]);
    expect(list.remove(42)).toBe(true);
    expect(list.length).toBe(0);
    expect(list.has(42)).toBe(false);
  });
});

describe('SortedList — insertion order & sorting', () => {
  it('keeps elements sorted regardless of insertion order', () => {
    const list = new SortedList<number>([5, 3, 8, 1, 9, 2, 7, 4, 6]);
    expect([...list]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('add() maintains sort order incrementally', () => {
    const list = new SortedList<number>();
    for (const v of [5, 1, 4, 2, 3]) list.add(v);
    expect([...list]).toEqual([1, 2, 3, 4, 5]);
  });

  it('allows duplicates, keeping them adjacent', () => {
    const list = new SortedList<number>([3, 1, 2, 1, 3, 2, 1]);
    expect([...list]).toEqual([1, 1, 1, 2, 2, 3, 3]);
    expect(list.length).toBe(7);
  });

  it('update() bulk-inserts', () => {
    const list = new SortedList<number>([3, 1]);
    list.update([2, 5, 4]);
    expect([...list]).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('SortedList — duplicates: bisectLeft/bisectRight/indexOf/remove', () => {
  it('bisectLeft/bisectRight bracket a run of equal values', () => {
    const list = new SortedList<number>([1, 2, 2, 2, 3]);
    expect(list.bisectLeft(2)).toBe(1);
    expect(list.bisectRight(2)).toBe(4);
  });

  it('bisectLeft/bisectRight on absent values give the insertion point', () => {
    const list = new SortedList<number>([1, 3, 5]);
    expect(list.bisectLeft(4)).toBe(2);
    expect(list.bisectRight(4)).toBe(2);
    expect(list.bisectLeft(0)).toBe(0);
    expect(list.bisectLeft(9)).toBe(3);
  });

  it('indexOf() finds the first occurrence', () => {
    const list = new SortedList<number>([1, 2, 2, 2, 3]);
    expect(list.indexOf(2)).toBe(1);
    expect(list.indexOf(9)).toBe(-1);
  });

  it('remove() removes only one occurrence', () => {
    const list = new SortedList<number>([2, 2, 2]);
    expect(list.remove(2)).toBe(true);
    expect(list.length).toBe(2);
    expect([...list]).toEqual([2, 2]);
  });
});

describe('SortedList — at/pop with negative indices', () => {
  it('at() supports negative indices like Array.prototype.at', () => {
    const list = new SortedList<number>([10, 20, 30]);
    expect(list.at(-1)).toBe(30);
    expect(list.at(-2)).toBe(20);
    expect(list.at(-4)).toBeUndefined();
    expect(list.at(3)).toBeUndefined();
  });

  it('pop() defaults to the last element', () => {
    const list = new SortedList<number>([10, 20, 30]);
    expect(list.pop()).toBe(30);
    expect([...list]).toEqual([10, 20]);
  });

  it('pop(index) removes and returns that element', () => {
    const list = new SortedList<number>([10, 20, 30]);
    expect(list.pop(0)).toBe(10);
    expect([...list]).toEqual([20, 30]);
  });

  it('pop() with negative index', () => {
    const list = new SortedList<number>([10, 20, 30]);
    expect(list.pop(-1)).toBe(30);
  });

  it('pop() out of range throws RangeError', () => {
    const list = new SortedList<number>([1]);
    expect(() => list.pop(5)).toThrow(RangeError);
  });
});

describe('SortedList — irange', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('defaults to inclusive bounds on both ends', () => {
    const list = new SortedList<number>(values);
    expect([...list.irange(3, 7)]).toEqual([3, 4, 5, 6, 7]);
  });

  it('supports exclusive bounds via options.inclusive', () => {
    const list = new SortedList<number>(values);
    expect([...list.irange(3, 7, { inclusive: [false, false] })]).toEqual([4, 5, 6]);
    expect([...list.irange(3, 7, { inclusive: [false, true] })]).toEqual([4, 5, 6, 7]);
    expect([...list.irange(3, 7, { inclusive: [true, false] })]).toEqual([3, 4, 5, 6]);
  });

  it('open-ended bounds', () => {
    const list = new SortedList<number>(values);
    expect([...list.irange(8)]).toEqual([8, 9, 10]);
    expect([...list.irange(undefined, 3)]).toEqual([1, 2, 3]);
    expect([...list.irange()]).toEqual(values);
  });

  it('empty range when min > max', () => {
    const list = new SortedList<number>(values);
    expect([...list.irange(8, 3)]).toEqual([]);
  });

  it('handles duplicate boundary values', () => {
    const list = new SortedList<number>([1, 2, 2, 2, 3]);
    expect([...list.irange(2, 2)]).toEqual([2, 2, 2]);
  });

  it('stays correct when the range sits in an early bucket of a multi-bucket list', () => {
    const list = new SortedList<number>(Array.from({ length: 200 }, (_, i) => i));
    expect([...list.irange(0, 20)]).toEqual(Array.from({ length: 21 }, (_, i) => i));
  });
});

describe('SortedList — islice', () => {
  const values = [10, 20, 30, 40, 50];

  it('slices by position like Array.prototype.slice', () => {
    const list = new SortedList<number>(values);
    expect([...list.islice(1, 4)]).toEqual([20, 30, 40]);
    expect([...list.islice(0, 0)]).toEqual([]);
    expect([...list.islice()]).toEqual(values);
    expect([...list.islice(2)]).toEqual([30, 40, 50]);
  });

  it('clamps out-of-range bounds', () => {
    const list = new SortedList<number>(values);
    expect([...list.islice(-100, 100)]).toEqual(values);
    expect([...list.islice(3, 1)]).toEqual([]);
  });

  it('supports negative start/end', () => {
    const list = new SortedList<number>(values);
    expect([...list.islice(-2)]).toEqual([40, 50]);
    expect([...list.islice(0, -1)]).toEqual([10, 20, 30, 40]);
  });

  it('stays correct when the slice sits in an early bucket of a multi-bucket list', () => {
    const list = new SortedList<number>(Array.from({ length: 200 }, (_, i) => i));
    expect([...list.islice(0, 20)]).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });
});

describe('SortedList — bucket merging on removal', () => {
  it('merges an undersized bucket with a neighbor and keeps content correct', () => {
    const list = new SortedList<number>(Array.from({ length: 200 }, (_, i) => i));
    // The first 32 elements (0..31) live permanently in the first bucket, since
    // sequential ascending insertion always appends to the last bucket. Draining
    // most of them forces that bucket below the merge threshold.
    for (let i = 0; i < 20; i++) {
      expect(list.remove(i)).toBe(true);
    }
    const expected = Array.from({ length: 180 }, (_, i) => i + 20);
    expect(list.length).toBe(180);
    expect([...list]).toEqual(expected);
    for (const v of [20, 21, 100, 199]) {
      expect(list.has(v)).toBe(true);
      expect(list.indexOf(v)).toBe(expected.indexOf(v));
    }
  });

  it('merges a non-first undersized bucket with its previous neighbor', () => {
    const list = new SortedList<number>(Array.from({ length: 200 }, (_, i) => i));
    // Values 32..63 settle into the second bucket once the first one splits off;
    // draining most of it (while the first bucket is untouched) forces a merge
    // with the *previous* neighbor rather than the next one.
    for (let i = 32; i < 52; i++) {
      expect(list.remove(i)).toBe(true);
    }
    const expected = [
      ...Array.from({ length: 32 }, (_, i) => i),
      ...Array.from({ length: 148 }, (_, i) => i + 52),
    ];
    expect(list.length).toBe(180);
    expect([...list]).toEqual(expected);
  });
});

describe('SortedList — clear/clone', () => {
  it('clear() empties the list', () => {
    const list = new SortedList<number>([1, 2, 3]);
    list.clear();
    expect(list.length).toBe(0);
    expect([...list]).toEqual([]);
  });

  it('clone() is an independent copy', () => {
    const list = new SortedList<number>([3, 1, 2]);
    const copy = list.clone();
    expect([...copy]).toEqual([1, 2, 3]);
    copy.add(0);
    expect(list.has(0)).toBe(false);
    expect(copy.has(0)).toBe(true);
  });
});

describe('SortedList — custom comparator', () => {
  interface Person {
    name: string;
    age: number;
  }

  it('orders by a derived key', () => {
    const list = new SortedList<Person>(
      [
        { name: 'Carol', age: 35 },
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
      { comparator: (a, b) => a.age - b.age },
    );
    expect([...list].map((p) => p.name)).toEqual(['Bob', 'Alice', 'Carol']);
  });

  it('has()/remove() use the comparator, not reference identity', () => {
    const list = new SortedList<Person>([{ name: 'Alice', age: 30 }], {
      comparator: (a, b) => a.age - b.age,
    });
    expect(list.has({ name: 'Alice (dup)', age: 30 })).toBe(true);
    expect(list.remove({ name: 'Alice (dup)', age: 30 })).toBe(true);
    expect(list.length).toBe(0);
  });
});

describe('SortedList — strings (natural order, no comparator required)', () => {
  it('sorts lexicographically', () => {
    const list = new SortedList<string>(['banana', 'apple', 'cherry']);
    expect([...list]).toEqual(['apple', 'banana', 'cherry']);
  });

  it('treats equal strings as equal (retains duplicates, has() finds them)', () => {
    const list = new SortedList<string>(['b', 'a', 'b', 'a']);
    expect([...list]).toEqual(['a', 'a', 'b', 'b']);
    expect(list.has('a')).toBe(true);
    expect(list.bisectLeft('a')).toBe(0);
    expect(list.bisectRight('a')).toBe(2);
  });
});

describe('SortedList — bucket rebalancing at scale', () => {
  it('keeps 5000 elements sorted through interleaved insertions', () => {
    const list = new SortedList<number>();
    const n = 5000;
    const shuffled = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
    for (const v of shuffled) list.add(v);
    expect(list.length).toBe(n);
    expect([...list]).toEqual(Array.from({ length: n }, (_, i) => i));
    for (let i = 0; i < n; i += 137) {
      expect(list.at(i)).toBe(i);
      expect(list.indexOf(i)).toBe(i);
    }
  });

  it('keeps order correct through interleaved insertions and removals', () => {
    const list = new SortedList<number>();
    const reference: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const v = Math.floor(Math.random() * 1000);
      list.add(v);
      reference.push(v);
      if (i % 3 === 0) {
        const toRemove = reference[Math.floor(Math.random() * reference.length)]!;
        list.remove(toRemove);
        reference.splice(reference.indexOf(toRemove), 1);
      }
    }
    reference.sort((a, b) => a - b);
    expect([...list]).toEqual(reference);
  });
});
