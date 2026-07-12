# Contributing to `sorted-collections`

Thanks for considering a contribution. This project aims to be a small, well-tested,
well-documented set of sorted data structures — that bar applies to contributions too.

## Getting started

```bash
git clone https://github.com/johansneirap/sorted-collections.git
cd sorted-collections
npm install
npm test
npm run bench
```

## Before opening a PR

- Any behavior change requires a test (unit and/or property-based with `fast-check`).
- Performance-related changes require running the benchmark before/after and pasting
  the result in the PR description.
- Code style is enforced automatically in CI (Biome). Don't debate style in review —
  run `npm run lint:fix` and move on.

## Reporting a bug

Open an issue using the bug report template. Include the package version, your
environment (Node/browser + version), and — ideally — a minimal failing test.

## Proposing a feature

Open an issue first to discuss whether it fits the intended scope of the library before
investing time in a large PR.

## Versioning

Strict [semver](https://semver.org/). Any change to the public signatures of
`SortedList`, `SortedSet`, or `SortedMap` is a breaking change → major version. New
non-destructive operations → minor. Fixes → patch.

## Response times

During the active-development phase after launch, the maintainer aims to respond to new
issues and PRs within 3–5 business days. If that changes, it will be announced here rather
than left silent.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
