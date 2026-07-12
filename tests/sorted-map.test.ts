import { describe, expect, it } from 'vitest';
import { SortedMap } from '../src/sorted-map.js';

describe('SortedMap — empty map', () => {
  it('has size 0', () => {
    expect(new SortedMap<number, string>().size).toBe(0);
  });

  it('get/has/delete on a missing key', () => {
    const map = new SortedMap<number, string>();
    expect(map.get(1)).toBeUndefined();
    expect(map.has(1)).toBe(false);
    expect(map.delete(1)).toBe(false);
  });

  it('at() returns undefined', () => {
    expect(new SortedMap<number, string>().at(0)).toBeUndefined();
  });

  it('iterates to nothing', () => {
    const map = new SortedMap<number, string>();
    expect([...map]).toEqual([]);
    expect([...map.keys()]).toEqual([]);
    expect([...map.values()]).toEqual([]);
    expect([...map.entries()]).toEqual([]);
    expect([...map.irange()]).toEqual([]);
  });
});

describe('SortedMap — set/get/has/delete', () => {
  it('set() then get() round-trips the value', () => {
    const map = new SortedMap<number, string>();
    map.set(1, 'one');
    expect(map.get(1)).toBe('one');
    expect(map.has(1)).toBe(true);
    expect(map.size).toBe(1);
  });

  it('set() on an existing key overwrites the value without growing size', () => {
    const map = new SortedMap<number, string>();
    map.set(1, 'one');
    map.set(1, 'uno');
    expect(map.get(1)).toBe('uno');
    expect(map.size).toBe(1);
  });

  it('delete() removes the entry and returns true; false if absent', () => {
    const map = new SortedMap<number, string>([[1, 'one']]);
    expect(map.delete(1)).toBe(true);
    expect(map.has(1)).toBe(false);
    expect(map.size).toBe(0);
    expect(map.delete(1)).toBe(false);
  });

  it('constructor accepts an iterable of entries, later duplicates win', () => {
    const map = new SortedMap<number, string>([
      [2, 'two'],
      [1, 'one'],
      [1, 'uno'],
    ]);
    expect(map.size).toBe(2);
    expect(map.get(1)).toBe('uno');
    expect(map.get(2)).toBe('two');
  });
});

describe('SortedMap — ordering', () => {
  it('iterates entries sorted by key regardless of insertion order', () => {
    const map = new SortedMap<number, string>();
    map.set(5, 'e');
    map.set(1, 'a');
    map.set(3, 'c');
    expect([...map]).toEqual([
      [1, 'a'],
      [3, 'c'],
      [5, 'e'],
    ]);
  });

  it('at() returns the entry at the ordinal key position', () => {
    const map = new SortedMap<number, string>([
      [5, 'e'],
      [1, 'a'],
      [3, 'c'],
    ]);
    expect(map.at(0)).toEqual([1, 'a']);
    expect(map.at(1)).toEqual([3, 'c']);
    expect(map.at(2)).toEqual([5, 'e']);
    expect(map.at(3)).toBeUndefined();
  });
});

describe('SortedMap — keys/values/entries', () => {
  const build = () =>
    new SortedMap<number, string>([
      [2, 'two'],
      [1, 'one'],
      [3, 'three'],
    ]);

  it('keys() returns a sorted, deduped SortedSet snapshot', () => {
    const map = build();
    const keys = map.keys();
    expect([...keys]).toEqual([1, 2, 3]);
    expect(keys.has(2)).toBe(true);

    // It's a snapshot: mutating the map afterwards doesn't affect it.
    map.set(4, 'four');
    expect([...keys]).toEqual([1, 2, 3]);
  });

  it('values() iterates in key order', () => {
    expect([...build().values()]).toEqual(['one', 'two', 'three']);
  });

  it('entries() iterates [key, value] pairs in key order', () => {
    expect([...build().entries()]).toEqual([
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
    ]);
  });
});

describe('SortedMap — irange', () => {
  const build = () => new SortedMap<number, string>([1, 2, 3, 4, 5].map((n) => [n, `v${n}`]));

  it('defaults to inclusive bounds on both ends', () => {
    expect([...build().irange(2, 4)]).toEqual([
      [2, 'v2'],
      [3, 'v3'],
      [4, 'v4'],
    ]);
  });

  it('open-ended bounds', () => {
    const map = build();
    expect([...map.irange(4)]).toEqual([
      [4, 'v4'],
      [5, 'v5'],
    ]);
    expect([...map.irange(undefined, 2)]).toEqual([
      [1, 'v1'],
      [2, 'v2'],
    ]);
  });

  it('empty range when min > max', () => {
    expect([...build().irange(4, 2)]).toEqual([]);
  });
});

describe('SortedMap — clear', () => {
  it('empties the map', () => {
    const map = new SortedMap<number, string>([
      [1, 'a'],
      [2, 'b'],
    ]);
    map.clear();
    expect(map.size).toBe(0);
    expect([...map]).toEqual([]);
  });
});

describe('SortedMap — custom comparator', () => {
  interface UserKey {
    id: number;
  }

  it('orders and matches keys by the comparator, not reference identity', () => {
    const map = new SortedMap<UserKey, string>(
      [
        [{ id: 3 }, 'c'],
        [{ id: 1 }, 'a'],
        [{ id: 2 }, 'b'],
      ],
      { comparator: (a, b) => a.id - b.id },
    );
    expect([...map.values()]).toEqual(['a', 'b', 'c']);
    expect(map.get({ id: 2 })).toBe('b');
    expect(map.has({ id: 2 })).toBe(true);
    expect(map.delete({ id: 2 })).toBe(true);
    expect(map.size).toBe(2);
  });
});

describe('SortedMap — string keys (natural order, no comparator required)', () => {
  it('sorts lexicographically', () => {
    const map = new SortedMap<string, number>([
      ['banana', 1],
      ['apple', 2],
      ['cherry', 3],
    ]);
    expect([...map.keys()]).toEqual(['apple', 'banana', 'cherry']);
  });

  it('treats equal strings as the same key', () => {
    const map = new SortedMap<string, number>([['apple', 1]]);
    expect(map.get('apple')).toBe(1);
    expect(map.has('apple')).toBe(true);
    map.set('apple', 2);
    expect(map.get('apple')).toBe(2);
    expect(map.size).toBe(1);
  });
});

describe('SortedMap — at scale', () => {
  it('keeps 3000 keys sorted and consistent through interleaved set/delete', () => {
    const map = new SortedMap<number, number>();
    const reference = new Map<number, number>();
    for (let i = 0; i < 3000; i++) {
      const key = Math.floor(Math.random() * 1000);
      if (i % 4 === 0 && reference.size > 0) {
        const keys = [...reference.keys()];
        const toDelete = keys[Math.floor(Math.random() * keys.length)]!;
        map.delete(toDelete);
        reference.delete(toDelete);
      } else {
        map.set(key, i);
        reference.set(key, i);
      }
    }
    expect(map.size).toBe(reference.size);
    const expectedEntries = [...reference.entries()].sort((a, b) => a[0] - b[0]);
    expect([...map]).toEqual(expectedEntries);
  });
});
