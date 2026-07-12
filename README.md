<a id="readme-top"></a>

[![CI][ci-shield]][ci-url]
[![npm version][npm-shield]][npm-url]
[![License: MIT][license-shield]][license-url]
[![Zero dependencies][deps-shield]][deps-url]

<br />
<div align="center">
  <h3 align="center">sorted-collections</h3>

  <p align="center">
    SortedList, SortedSet, and SortedMap for JavaScript/TypeScript
    <br />
    <a href="#usage"><strong>Explore the usage examples »</strong></a>
    <br />
    <br />
    <a href="https://github.com/johansneirap/sorted-collections/issues/new?labels=bug&template=bug_report.md">Report Bug</a>
    &middot;
    <a href="https://github.com/johansneirap/sorted-collections/issues/new?labels=enhancement&template=feature_request.md">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#performance">Performance</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

JavaScript/TypeScript has no built-in data structure that keeps its elements in sorted
order as you mutate it. Common patterns — leaderboards, order books, "give me everything
between X and Y" — end up re-sorting an array by hand on every insert, which is
`O(n log n)` repeated: fine for a handful of items, expensive at scale.

`sorted-collections` gives you three structures instead, with zero runtime dependencies:

* **`SortedList`** — a list that keeps insertion order sorted automatically.
* **`SortedSet`** — a sorted set with no duplicates, plus set-theory operations
  (`union`, `intersection`, `difference`, `isSubsetOf`).
* **`SortedMap`** — a dictionary ordered by key.

All three are backed by the same "list of lists" (bucketed array) technique Python's
[`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers) uses —
buckets of roughly `√n` sorted elements, trading a small amount of positional-access
speed for a much simpler, easier-to-audit implementation than a balanced tree. See
[`src/internal/bucket-engine.ts`](src/internal/bucket-engine.ts) for the actual
implementation, and [Performance](#performance) for what that trade-off looks like in
real numbers. The package is written in TypeScript but designed to be just as
comfortable from plain JavaScript — hence no `-ts` in the name.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![TypeScript][typescript-badge]][typescript-url]
* [![Vitest][vitest-badge]][vitest-url]
* [![Biome][biome-badge]][biome-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

Node.js `^20.19.0` or `>=22.12.0`.

### Installation

```bash
npm i sorted-collections
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

```ts
import { SortedList, SortedSet, SortedMap } from 'sorted-collections';

const scores = new SortedList<number>();
scores.add(42);
scores.add(7);
scores.add(99);
[...scores]; // [7, 42, 99]

const tags = new SortedSet<string>(['b', 'a', 'c']);
tags.has('b'); // true

const byPrice = new SortedMap<number, string>();
byPrice.set(101.5, 'order-1');
byPrice.set(99.75, 'order-2');
[...byPrice.keys()]; // [99.75, 101.5]
```

Range queries work the same way across all three structures:

```ts
// Everyone scoring between 50 and 100, inclusive:
[...scores.irange(50, 100)];

// Order book: every order priced at 100 or less:
[...byPrice.irange(undefined, 100)];
```

_Full API reference and use-case guides (leaderboards, order books, time-series) are
coming to a docs site — see [Roadmap](#roadmap)._

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PERFORMANCE -->
## Performance

Numbers below: Node v25, single run of `npm run bench` (script in
[`benchmarks/`](benchmarks/) — reproduce locally with `npm run bench`; results vary by
machine). Ops/sec, higher is better.

| Operation | `SortedList` | `Array` (naive) |
|---|---:|---:|
| `add()`, one at a time, n=5,000 | 3,146/s | 12/s |
| `has()`, n=100,000 | 20,224/s | 67/s |

| Operation | `SortedSet` | native `Set` |
|---|---:|---:|
| `add()`, one at a time, n=5,000 | 2,092/s | 12,923/s |
| `has()`, n=100,000 | 20,121/s | 835,314/s |

| Operation | `SortedMap` | native `Map` |
|---|---:|---:|
| `set()`, one at a time, n=5,000 | 1,397/s | 7,056/s |
| `get()`, n=100,000 | 12,453/s | 834,080/s |

**Honest notes — when this library is (and isn't) the right call:**

* Native `Set`/`Map` numbers are a raw-speed reference only, not an apples-to-apples
  comparison: they don't keep anything sorted, don't offer `irange`/`at`/`bisectLeft`,
  and iterate in insertion order rather than sorted order. You pay for order; this is
  what that cost looks like next to not paying for it.
* `add()`/`set()` vs. the naive "array + resort on every insert" pattern is only run up
  to n=5,000 — that pattern is `O(n² log n)` and would take minutes at n=100,000. That
  collapse *is* the problem this library exists to fix, not an oversight in the
  benchmark.
* `at(index)` and full iteration are `O(√n)`, documented as such — this library
  deliberately doesn't maintain the extra index a balanced tree would need for `O(log n)`
  positional access, favoring a simpler implementation instead. That trade-off costs
  the most on large collections doing lots of positional lookups; `has()`/`get()`/`add()`/
  `set()` don't pay it.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] `SortedList`, `SortedSet`, `SortedMap` implemented, 100% test coverage
- [x] Property-based tests against naive reference implementations ([`fast-check`](https://github.com/dubzzz/fast-check))
- [x] Reproducible benchmark suite
- [ ] Documentation site (getting started, use-case guides, API reference)
- [ ] Publish `1.0.0` to npm

See the [open issues](https://github.com/johansneirap/sorted-collections/issues) for
proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn,
inspire, and create. Any contributions you make are **greatly appreciated**. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide — environment setup, what a PR
needs (tests, a changeset), and code style.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Open an [issue](https://github.com/johansneirap/sorted-collections/issues) — bug
reports and feature requests both welcome.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [`sortedcontainers`](https://github.com/grantjenks/python-sortedcontainers) by Grant
  Jenks — the Python library this project takes its core "list of lists" technique and
  naming conventions from.
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template) — the
  structure this README is based on.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[ci-shield]: https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/johansneirap/sorted-collections/actions/workflows/ci.yml
[npm-shield]: https://img.shields.io/npm/v/sorted-collections.svg
[npm-url]: https://www.npmjs.com/package/sorted-collections
[license-shield]: https://img.shields.io/npm/l/sorted-collections.svg
[license-url]: https://github.com/johansneirap/sorted-collections/blob/main/LICENSE
[deps-shield]: https://img.shields.io/badge/dependencies-0-brightgreen.svg
[deps-url]: package.json
[typescript-badge]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[vitest-badge]: https://img.shields.io/badge/vitest-%23729B1B.svg?style=for-the-badge&logo=vitest&logoColor=white
[vitest-url]: https://vitest.dev/
[biome-badge]: https://img.shields.io/badge/biome-%2360A5FA.svg?style=for-the-badge&logo=biome&logoColor=white
[biome-url]: https://biomejs.dev/
