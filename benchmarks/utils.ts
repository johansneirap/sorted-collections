import type { Bench } from 'tinybench';

/** A shuffled permutation of 0..n-1 — unique values, random insertion order. */
export function shuffledSequential(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** Random probe values in [0, max), for has()/get() lookups. */
export function randomProbes(count: number, max: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * max));
}

export async function runAndPrint(title: string, bench: Bench): Promise<void> {
  await bench.run();
  console.log(`\n### ${title}\n`);
  const rows = bench.tasks.map((task) => {
    const r = task.result;
    const hasStats = r && 'throughput' in r;
    return {
      name: task.name,
      'ops/sec': hasStats ? Math.round(r.throughput.mean).toLocaleString('en-US') : 'n/a',
      'avg (ms)': hasStats ? r.latency.mean.toFixed(4) : 'n/a',
    };
  });
  console.table(rows);
}
