# Order Book with `SortedMap`

A simplified order book depth is a price → quantity map that needs to stay sorted by
price: best bid/ask are the extremes, and "how much liquidity between these two
prices" is a range query.

## Modeling price levels

```ts
import { SortedMap } from 'sorted-collections';

const bids = new SortedMap<number, number>();
bids.set(99.75, 100);
bids.set(101.5, 50);
bids.set(100.25, 75);

[...bids];
// [[99.75, 100], [100.25, 75], [101.5, 50]] — always sorted by price, regardless of insert order
```

## Best bid / best ask

Bids are sorted ascending, so the best (highest) bid is the last entry. Asks work the
same way in reverse — the best (lowest) ask is the first entry:

```ts
const bestBid = bids.at(-1); // [101.5, 50]

const asks = new SortedMap<number, number>();
asks.set(102.0, 40);
asks.set(101.75, 60);

const bestAsk = asks.at(0); // [101.75, 60]

const spread = bestAsk![0] - bestBid![0]; // 0.25
```

## Adding and removing liquidity at a price level

```ts
function addLiquidity(book: SortedMap<number, number>, price: number, qty: number) {
  book.set(price, (book.get(price) ?? 0) + qty);
}

function removeLiquidity(book: SortedMap<number, number>, price: number, qty: number) {
  const remaining = (book.get(price) ?? 0) - qty;
  if (remaining <= 0) {
    book.delete(price); // don't leave a zero-quantity level sitting around
  } else {
    book.set(price, remaining);
  }
}

addLiquidity(bids, 100.25, 25);
// [[99.75, 100], [100.25, 100], [101.5, 50]]

removeLiquidity(bids, 99.75, 100);
// [[100.25, 100], [101.5, 50]] — the 99.75 level is gone, not sitting at 0
```

## Depth within a price range

```ts
const depth = [...bids.irange(100, 101)];
// [[100.25, 100]] — every bid priced between 100 and 101, inclusive
```

`irange`'s bounds are on the map's *key* (price here), not the value — this is the same
`irange` every structure in this library has, so range queries read the same whether
you're working with a `SortedList`, `SortedSet`, or `SortedMap`.

See the [API reference](/api/classes/SortedMap) for the rest of `SortedMap`'s methods.
