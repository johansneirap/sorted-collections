# Leaderboard with `SortedSet`

A leaderboard needs: insert a score, get the top N, get someone's rank, and do all of
that without re-sorting the whole thing on every update.

## Modeling entries

`SortedSet` compares whole objects, so model each entry as `{ player, score }` and
compare by score, breaking ties by name to keep results deterministic:

```ts
import { SortedSet } from 'sorted-collections';

interface Entry {
  player: string;
  score: number;
}

const leaderboard = new SortedSet<Entry>([], {
  comparator: (a, b) => a.score - b.score || a.player.localeCompare(b.player),
});

leaderboard.add({ player: 'ada', score: 1200 });
leaderboard.add({ player: 'grace', score: 980 });
leaderboard.add({ player: 'alan', score: 1500 });
```

## Top N

Sorted ascending, so the top N is the last N elements. `islice` takes negative indices
like `Array.prototype.slice`:

```ts
const topThree = [...leaderboard.islice(-3)].reverse();
// [{ player: 'alan', score: 1500 }, { player: 'ada', score: 1200 }, { player: 'grace', score: 980 }]
```

## Someone's rank

`indexOf` needs an object equal under the comparator's rules — it doesn't have to be
the same reference, just the same `score`/`player`:

```ts
const rank = leaderboard.length - leaderboard.indexOf({ player: 'ada', score: 1200 });
// rank === 2 (alan at 1500 is rank 1, ada at 1200 is rank 2)
```

## Everyone in a score band

For a compound comparator like this one, build range bounds carefully: the tie-break
field on a boundary object affects whether ties *at* the boundary get included. Use a
value that sorts before everything for the low bound, and after everything for the high
bound:

```ts
leaderboard.add({ player: 'bob', score: 1000 });
leaderboard.add({ player: 'amy', score: 1400 });
leaderboard.add({ player: 'zoe', score: 1400 });

// Everyone scoring between 1000 and 1400, inclusive — '' sorts before any real name,
// '￿' sorts after any real name, so ties exactly at 1000 or 1400 aren't dropped:
const band = [...leaderboard.irange({ player: '', score: 1000 }, { player: '￿', score: 1400 })];
// [bob(1000), ada(1200), amy(1400), zoe(1400)]
```

If your comparator only sorts by score (no tie-break), you can skip this and pass plain
`{ score }`-shaped bounds directly.

## Updating a score

`SortedSet` doesn't have an in-place "update" — remove the old entry, add the new one:

```ts
leaderboard.discard({ player: 'grace', score: 980 });
leaderboard.add({ player: 'grace', score: 1050 });
```

See the [API reference](/api/classes/SortedSet) for the rest of `SortedSet`'s methods,
including `union`/`intersection`/`difference` for merging leaderboards across shards.
