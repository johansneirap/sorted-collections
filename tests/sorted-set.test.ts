import { describe, expect, it } from 'vitest';
import { SortedSet } from '../src/sorted-set.js';

describe('SortedSet — empty set', () => {
  it('has length 0', () => {
    expect(new SortedSet<number>().length).toBe(0);
  });

  it('union/intersection/difference with another empty set stay empty', () => {
    const a = new SortedSet<number>();
    const b = new SortedSet<number>();
    expect([...a.union(b)]).toEqual([]);
    expect([...a.intersection(b)]).toEqual([]);
    expect([...a.difference(b)]).toEqual([]);
    expect(a.isSubsetOf(b)).toBe(true);
  });
});

describe('SortedSet — deduplication', () => {
  it('add() is a no-op for values already present', () => {
    const set = new SortedSet<number>();
    set.add(5);
    set.add(5);
    set.add(5);
    expect(set.length).toBe(1);
    expect([...set]).toEqual([5]);
  });

  it('constructor dedupes an iterable with duplicates', () => {
    const set = new SortedSet<number>([3, 1, 2, 1, 3, 2, 1]);
    expect([...set]).toEqual([1, 2, 3]);
    expect(set.length).toBe(3);
  });

  it('update() dedupes bulk-inserted values', () => {
    const set = new SortedSet<number>([1, 2]);
    set.update([2, 3, 3, 4]);
    expect([...set]).toEqual([1, 2, 3, 4]);
  });

  it('stays sorted and deduped at scale', () => {
    const values = Array.from({ length: 2000 }, () => Math.floor(Math.random() * 500));
    const set = new SortedSet<number>(values);
    const expected = [...new Set(values)].sort((a, b) => a - b);
    expect([...set]).toEqual(expected);
    expect(set.length).toBe(expected.length);
  });
});

describe('SortedSet — bulk construction from an iterable', () => {
  it('empty iterable', () => {
    expect([...new SortedSet<number>([])]).toEqual([]);
  });

  it('single element', () => {
    expect([...new SortedSet<number>([7])]).toEqual([7]);
  });

  it('already sorted input, no duplicates', () => {
    expect([...new SortedSet<number>([1, 2, 3])]).toEqual([1, 2, 3]);
  });

  it('reverse-sorted input', () => {
    expect([...new SortedSet<number>([3, 2, 1])]).toEqual([1, 2, 3]);
  });

  it('duplicates are removed, keeping the first occurrence encountered by comparator', () => {
    const set = new SortedSet<number>([3, 1, 2, 1, 3, 2, 1]);
    expect([...set]).toEqual([1, 2, 3]);
    expect(set.length).toBe(3);
  });

  it('custom comparator', () => {
    const set = new SortedSet<number>([3, 1, 2], { comparator: (a, b) => b - a });
    expect([...set]).toEqual([3, 2, 1]);
  });

  it('accepts a non-array iterable (generator) and dedupes it', () => {
    function* gen(): Generator<number> {
      yield 2;
      yield 1;
      yield 2;
      yield 3;
    }
    const set = new SortedSet<number>(gen());
    expect([...set]).toEqual([1, 2, 3]);
  });

  describe('bucket-size boundaries (MIN_BUCKET_SIZE = 32)', () => {
    it.each([31, 32, 33])('produces a correctly sorted, deduped set for n=%i', (n) => {
      const shuffled = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
      const withDuplicates = [...shuffled, ...shuffled];
      const set = new SortedSet<number>(withDuplicates);
      expect(set.length).toBe(n);
      expect([...set]).toEqual(Array.from({ length: n }, (_, i) => i));
    });
  });

  it('SortedSet.from() is equivalent to the constructor', () => {
    expect([...SortedSet.from([3, 1, 2, 1])]).toEqual([...new SortedSet<number>([3, 1, 2, 1])]);
    expect(SortedSet.from([3, 1, 2])).toBeInstanceOf(SortedSet);
  });
});

describe('SortedSet — inherited SortedList behavior', () => {
  it('has/indexOf/at/remove/discard work as on SortedList', () => {
    const set = new SortedSet<number>([5, 1, 3]);
    expect(set.has(3)).toBe(true);
    expect(set.indexOf(3)).toBe(1);
    expect(set.at(0)).toBe(1);
    expect(set.remove(3)).toBe(true);
    expect(set.has(3)).toBe(false);
    expect(() => set.discard(99)).not.toThrow();
  });

  it('irange/islice work as on SortedList', () => {
    const set = new SortedSet<number>([1, 2, 3, 4, 5]);
    expect([...set.irange(2, 4)]).toEqual([2, 3, 4]);
    expect([...set.islice(1, 3)]).toEqual([2, 3]);
  });
});

describe('SortedSet — union/intersection/difference/isSubsetOf', () => {
  const a = () => new SortedSet<number>([1, 2, 3, 4]);
  const b = () => new SortedSet<number>([3, 4, 5, 6]);

  it('union combines and dedupes, staying sorted', () => {
    expect([...a().union(b())]).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('intersection keeps only shared elements', () => {
    expect([...a().intersection(b())]).toEqual([3, 4]);
  });

  it('difference keeps elements only in the receiver', () => {
    expect([...a().difference(b())]).toEqual([1, 2]);
    expect([...b().difference(a())]).toEqual([5, 6]);
  });

  it('isSubsetOf', () => {
    expect(new SortedSet<number>([3, 4]).isSubsetOf(a())).toBe(true);
    expect(a().isSubsetOf(b())).toBe(false);
    expect(new SortedSet<number>().isSubsetOf(a())).toBe(true);
  });

  it('set operations do not mutate the operands', () => {
    const setA = a();
    const setB = b();
    setA.union(setB);
    setA.intersection(setB);
    setA.difference(setB);
    expect([...setA]).toEqual([1, 2, 3, 4]);
    expect([...setB]).toEqual([3, 4, 5, 6]);
  });

  it('union/intersection/difference return SortedSet instances usable as such', () => {
    const result = a().union(b());
    result.add(100);
    result.add(100);
    expect(result.length).toBe(7);
  });
});

describe('SortedSet — clone', () => {
  it('is an independent, deduping copy', () => {
    const set = new SortedSet<number>([3, 1, 2]);
    const copy = set.clone();
    expect([...copy]).toEqual([1, 2, 3]);
    copy.add(1);
    copy.add(0);
    expect(copy.length).toBe(4);
    expect(set.has(0)).toBe(false);
  });
});

describe('SortedSet — custom comparator equality', () => {
  interface Person {
    name: string;
    age: number;
  }

  it('dedupes by comparator, not reference identity', () => {
    const set = new SortedSet<Person>(
      [
        { name: 'Alice', age: 30 },
        { name: 'Alice (dup)', age: 30 },
        { name: 'Bob', age: 25 },
      ],
      { comparator: (p, q) => p.age - q.age },
    );
    expect(set.length).toBe(2);
    expect([...set].map((p) => p.name)).toEqual(['Bob', 'Alice']);
  });
});
