import { SortedSet as SCSortedSet } from 'sorted-containers';
import { SortedSet as SKSortedSet } from 'sortedkit';
import { Bench } from 'tinybench';
import { SortedSet } from '../src/sorted-set.js';
import { randomProbes, runAndPrint, shuffledSequential } from './utils.js';

export async function runSortedSetInsertBenchmarks(size: number): Promise<void> {
  const data = shuffledSequential(size);
  const label = size.toLocaleString('en-US');

  const bench = new Bench({ time: 500 });
  bench
    .add('SortedSet#add', () => {
      const set = new SortedSet<number>();
      for (const v of data) set.add(v);
    })
    .add('native Set#add', () => {
      const set = new Set<number>();
      for (const v of data) set.add(v);
    })
    .add('sorted-containers SortedSet#add', () => {
      const set = new SCSortedSet<number>();
      for (const v of data) set.add(v);
    })
    .add('sortedkit SortedSet#add', () => {
      const set = new SKSortedSet<number>();
      for (const v of data) set.add(v);
    });

  await runAndPrint(`SortedSet — insert n=${label} one at a time`, bench);
}

export async function runSortedSetReadBenchmarks(size: number): Promise<void> {
  const data = shuffledSequential(size);
  const label = size.toLocaleString('en-US');

  const set = new SortedSet<number>(data);
  const nativeSet = new Set<number>(data);
  const scSet = new SCSortedSet<number>(data);
  const skSet = new SKSortedSet<number>(undefined, data);

  const probes = randomProbes(2000, size);
  const hasBench = new Bench({ time: 500 });
  hasBench
    .add('SortedSet#has', () => {
      for (const v of probes) set.has(v);
    })
    .add('native Set#has', () => {
      for (const v of probes) nativeSet.has(v);
    })
    .add('sorted-containers SortedSet#has', () => {
      for (const v of probes) scSet.has(v);
    })
    .add('sortedkit SortedSet#has', () => {
      for (const v of probes) skSet.has(v);
    });
  await runAndPrint(`SortedSet — has() n=${label}`, hasBench);

  const iterBench = new Bench({ time: 500 });
  iterBench
    .add('SortedSet iterate (sorted order)', () => {
      let sum = 0;
      for (const v of set) sum += v;
      return sum;
    })
    .add('native Set iterate (insertion order, not sorted)', () => {
      let sum = 0;
      for (const v of nativeSet) sum += v;
      return sum;
    })
    .add('sorted-containers SortedSet iterate', () => {
      let sum = 0;
      for (const v of scSet) sum += v;
      return sum;
    })
    .add('sortedkit SortedSet iterate', () => {
      let sum = 0;
      for (const v of skSet) sum += v;
      return sum;
    });
  await runAndPrint(`SortedSet — full iteration n=${label}`, iterBench);
}
