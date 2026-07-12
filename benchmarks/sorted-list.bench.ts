import { SortedArray } from 'sorted-containers';
import { Bench } from 'tinybench';
import { SortedList } from '../src/sorted-list.js';
import { randomProbes, runAndPrint, shuffledSequential } from './utils.js';

/**
 * Insert-heavy benchmark. Kept to small/medium n: the naive "array + resort
 * on every insert" baseline is intentionally O(n² log n) — that's the exact
 * problem this library exists to fix — and would take minutes at n=100,000.
 */
export async function runSortedListInsertBenchmarks(size: number): Promise<void> {
  const data = shuffledSequential(size);
  const label = size.toLocaleString('en-US');

  const bench = new Bench({ time: 500 });
  bench
    .add('SortedList#add', () => {
      const list = new SortedList<number>();
      for (const v of data) list.add(v);
    })
    .add('Array + resort on every insert (naive)', () => {
      const arr: number[] = [];
      for (const v of data) {
        arr.push(v);
        arr.sort((a, b) => a - b);
      }
    })
    .add('sorted-containers SortedArray#add', () => {
      const arr = new SortedArray<number>();
      for (const v of data) arr.add(v);
    });

  await runAndPrint(`SortedList — insert n=${label} one at a time`, bench);
}

/** Read-heavy benchmarks: build once per size, then time only the read op. */
export async function runSortedListReadBenchmarks(size: number): Promise<void> {
  const data = shuffledSequential(size);
  const label = size.toLocaleString('en-US');

  const list = new SortedList<number>(data);
  const sortedArr = [...data].sort((a, b) => a - b);
  const scArr = new SortedArray<number>(data);

  const probes = randomProbes(2000, size);
  const hasBench = new Bench({ time: 500 });
  hasBench
    .add('SortedList#has', () => {
      for (const v of probes) list.has(v);
    })
    .add('Array#includes (sorted, linear scan)', () => {
      for (const v of probes) sortedArr.includes(v);
    })
    .add('sorted-containers SortedArray#includes', () => {
      for (const v of probes) scArr.includes(v);
    });
  await runAndPrint(`SortedList — has() n=${label}`, hasBench);

  const indices = Array.from({ length: 2000 }, () => Math.floor(Math.random() * size));
  const atBench = new Bench({ time: 500 });
  atBench
    .add('SortedList#at', () => {
      for (const i of indices) list.at(i);
    })
    .add('Array[index]', () => {
      for (const i of indices) void sortedArr[i];
    })
    .add('sorted-containers SortedArray#at', () => {
      for (const i of indices) scArr.at(i);
    });
  await runAndPrint(
    `SortedList — at(index) n=${label} (native array indexing is O(1); shown for reference)`,
    atBench,
  );

  const iterBench = new Bench({ time: 500 });
  iterBench
    .add('SortedList iterate', () => {
      let sum = 0;
      for (const v of list) sum += v;
    })
    .add('Array iterate (already sorted)', () => {
      let sum = 0;
      for (const v of sortedArr) sum += v;
    })
    .add('sorted-containers SortedArray iterate', () => {
      let sum = 0;
      for (const v of scArr) sum += v;
    });
  await runAndPrint(`SortedList — full iteration n=${label}`, iterBench);
}
