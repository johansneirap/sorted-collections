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
- Code style is enforced automatically in CI (Biome) — both `npm run format:check` and
  `npm run lint` run there, and again in `prepublishOnly` before any release. Don't
  debate style in review — run `npm run format` and `npm run lint:fix` locally and move
  on.
- If your change affects the published package (any fix, feature, or breaking change —
  not docs/tests/CI-only PRs), add a changeset: `npx changeset add`, pick the right
  bump (patch/minor/major per [Versioning](#versioning)), and commit the generated file
  in `.changeset/`. Releases and the changelog are generated from these automatically.
- If your change touches the public API, update the relevant guide in `docs-site/` too.
  `npm run docs:dev` serves the docs site locally (API reference regenerates from
  source on every `docs:build`/`docs:dev`, so it can't go stale on its own).

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
