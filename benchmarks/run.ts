import {
  runSortedListConstructionBenchmarks,
  runSortedListInsertBenchmarks,
  runSortedListReadBenchmarks,
} from './sorted-list.bench.js';
import {
  runSortedMapConstructionBenchmarks,
  runSortedMapInsertBenchmarks,
  runSortedMapReadBenchmarks,
} from './sorted-map.bench.js';
import {
  runSortedSetConstructionBenchmarks,
  runSortedSetInsertBenchmarks,
  runSortedSetReadBenchmarks,
} from './sorted-set.bench.js';

// Insert sizes are kept small: the naive "array + resort on every insert"
// baseline is intentionally O(n² log n) and would take minutes at n=100,000.
const INSERT_SIZES = [1_000, 5_000];
// Read sizes (has/get/at/iterate) are cheap for every contender once built.
const READ_SIZES = [1_000, 10_000, 100_000];
// Bulk construction (fromSorted) is O(n log n) — no naive resort baseline in
// the mix, so it can go much larger than the insert-heavy sizes above.
const CONSTRUCTION_SIZES = [1_000, 100_000, 1_000_000];

async function main(): Promise<void> {
  console.log(
    `sorted-collections benchmarks — Node ${process.version}, ${new Date().toISOString()}`,
  );

  console.log('\n## SortedList\n');
  for (const size of CONSTRUCTION_SIZES) await runSortedListConstructionBenchmarks(size);
  for (const size of INSERT_SIZES) await runSortedListInsertBenchmarks(size);
  for (const size of READ_SIZES) await runSortedListReadBenchmarks(size);

  console.log('\n## SortedSet\n');
  for (const size of CONSTRUCTION_SIZES) await runSortedSetConstructionBenchmarks(size);
  for (const size of INSERT_SIZES) await runSortedSetInsertBenchmarks(size);
  for (const size of READ_SIZES) await runSortedSetReadBenchmarks(size);

  console.log('\n## SortedMap\n');
  for (const size of CONSTRUCTION_SIZES) await runSortedMapConstructionBenchmarks(size);
  for (const size of INSERT_SIZES) await runSortedMapInsertBenchmarks(size);
  for (const size of READ_SIZES) await runSortedMapReadBenchmarks(size);
}

main();
