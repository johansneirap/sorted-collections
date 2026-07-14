import { SortedMap as SCSortedMap } from 'sorted-containers';
import { SortedMap as SKSortedMap } from 'sortedkit';
import { Bench } from 'tinybench';
import { SortedMap } from '../src/sorted-map.js';
import { randomProbes, runAndPrint, shuffledSequential } from './utils.js';

export async function runSortedMapInsertBenchmarks(size: number): Promise<void> {
  const keys = shuffledSequential(size);
  const entries: [number, number][] = keys.map((k) => [k, k * 2]);
  const label = size.toLocaleString('en-US');

  const bench = new Bench({ time: 500 });
  bench
    .add('SortedMap#set', () => {
      const map = new SortedMap<number, number>();
      for (const [k, v] of entries) map.set(k, v);
    })
    .add('native Map#set', () => {
      const map = new Map<number, number>();
      for (const [k, v] of entries) map.set(k, v);
    })
    .add('sorted-containers SortedMap#set', () => {
      const map = new SCSortedMap<number, number>();
      for (const [k, v] of entries) map.set(k, v);
    })
    .add('sortedkit SortedMap#set', () => {
      const map = new SKSortedMap<number, number>();
      for (const [k, v] of entries) map.set(k, v);
    });

  await runAndPrint(`SortedMap — insert n=${label} one at a time`, bench);
}

/**
 * Bulk-construction benchmark: `new SortedMap(entries)` (fromSorted +
 * dedupe-keeping-last fast path) vs. the old behavior of building empty and
 * calling `set()` per entry — kept accessible here via a plain loop, even
 * though the constructor no longer builds this way.
 */
export async function runSortedMapConstructionBenchmarks(size: number): Promise<void> {
  const keys = shuffledSequential(size);
  const entries: [number, number][] = keys.map((k) => [k, k * 2]);
  const label = size.toLocaleString('en-US');

  const bench = new Bench({ time: 500 });
  bench
    .add('new SortedMap(entries) (bulk fromSorted)', () => {
      new SortedMap<number, number>(entries);
    })
    .add('empty SortedMap + set() per entry (old path)', () => {
      const map = new SortedMap<number, number>();
      for (const [k, v] of entries) map.set(k, v);
    })
    .add('sorted-containers new SortedMap(entries)', () => {
      new SCSortedMap<number, number>(entries);
    });

  await runAndPrint(`SortedMap — construction from n=${label} entries`, bench);
}

export async function runSortedMapReadBenchmarks(size: number): Promise<void> {
  const keys = shuffledSequential(size);
  const entries: [number, number][] = keys.map((k) => [k, k * 2]);
  const label = size.toLocaleString('en-US');

  const map = new SortedMap<number, number>(entries);
  const nativeMap = new Map<number, number>(entries);
  const scMap = new SCSortedMap<number, number>(entries);
  const skMap = new SKSortedMap<number, number>(undefined, entries);

  const probes = randomProbes(2000, size);
  const getBench = new Bench({ time: 500 });
  getBench
    .add('SortedMap#get', () => {
      for (const k of probes) map.get(k);
    })
    .add('native Map#get', () => {
      for (const k of probes) nativeMap.get(k);
    })
    .add('sorted-containers SortedMap#get', () => {
      for (const k of probes) scMap.get(k);
    })
    .add('sortedkit SortedMap#get', () => {
      for (const k of probes) skMap.get(k);
    });
  await runAndPrint(`SortedMap — get() n=${label}`, getBench);

  const iterBench = new Bench({ time: 500 });
  iterBench
    .add('SortedMap iterate (sorted by key)', () => {
      let sum = 0;
      for (const [k] of map) sum += k;
      return sum;
    })
    .add('native Map iterate (insertion order, not sorted)', () => {
      let sum = 0;
      for (const [k] of nativeMap) sum += k;
      return sum;
    })
    .add('sorted-containers SortedMap iterate', () => {
      let sum = 0;
      for (const [k] of scMap) sum += k;
      return sum;
    })
    .add('sortedkit SortedMap iterate', () => {
      let sum = 0;
      for (const [k] of skMap) sum += k;
      return sum;
    });
  await runAndPrint(`SortedMap — full iteration n=${label}`, iterBench);
}
