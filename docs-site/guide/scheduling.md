# Scheduling / Time-Series with `SortedList`

Calendars, task queues, and time-series data all share a shape: entries with a
timestamp, always needed in chronological order, with "what's next" and "what happened
between X and Y" as the core queries.

## Modeling events

```ts
import { SortedList } from 'sorted-collections';

interface Event {
  at: number; // unix ms
  label: string;
}

const schedule = new SortedList<Event>([], {
  comparator: (a, b) => a.at - b.at,
});

const t0 = Date.parse('2026-07-13T09:00:00Z');
const HOUR = 60 * 60 * 1000;

schedule.add({ at: t0 + 2 * HOUR, label: 'standup' });
schedule.add({ at: t0, label: 'deploy' });
schedule.add({ at: t0 + 5 * HOUR, label: 'retro' });
schedule.add({ at: t0 + 1 * HOUR, label: 'review PR' });

[...schedule].map((e) => e.label);
// ['deploy', 'review PR', 'standup', 'retro'] — chronological, regardless of insert order
```

## What's next

`bisectLeft` finds where "now" would be inserted; `islice` from there gets the next N
events. The event object used for the search only needs a value the comparator reads
(`at`) — other fields can be left as placeholders:

```ts
const now = t0 + 30 * 60 * 1000; // 30 minutes after t0

const idx = schedule.bisectLeft({ at: now, label: '' });
const nextTwo = [...schedule.islice(idx, idx + 2)];
// ['review PR', 'standup']
```

## Everything in a time window

```ts
const windowStart = t0;
const windowEnd = t0 + 3 * HOUR;

const inWindow = [...schedule.irange({ at: windowStart, label: '' }, { at: windowEnd, label: '' })];
// ['deploy', 'review PR', 'standup']
```

## Rescheduling

Same pattern as the other guides — `SortedList` doesn't have an in-place "move", so
remove the old entry and add the new one:

```ts
schedule.discard({ at: t0 + 2 * HOUR, label: 'standup' });
schedule.add({ at: t0 + 3 * HOUR, label: 'standup' });
// ['deploy', 'review PR', 'standup', 'retro'] — standup is now after review PR, still sorted
```

See the [API reference](/api/classes/SortedList) for the rest of `SortedList`'s methods.
