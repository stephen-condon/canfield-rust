# Release automation design — conventional-commit-driven GitHub Releases

**Date:** 2026-06-08
**Status:** Approved (pending spec review)

## Goal

Provide a scripted, documented, repeatable way to cut a GitHub Release for the
app, where:

- The **app version** is a single composite number covering web + Rust changes.
- The semver bump is **calculated automatically from conventional commits** —
  never decided by hand (an explicit override remains available).
- The process is **easy to run and documented**, and the version-calculation /
  file-mutation logic lives in committed, locally-runnable scripts rather than
  buried in CI YAML.
- It **honors `main`'s branch protection** (squash-merge only, branches up to
  date, four required status checks).

## Source of truth

The **git tag** (`vX.Y.Z`) is the canonical version. The three in-repo version
fields — `crates/engine/Cargo.toml`, `crates/wasm/Cargo.toml`,
`web/package.json` — are kept in lockstep by the release process and must not be
hand-edited. They are accurate as of each release because the release PR updates
them.

Pre-1.0 semantics apply while the version is `0.x`: `git-cliff` is configured so
that `feat` and breaking changes both produce a minor bump (`0.x` → `0.(x+1).0`)
and `fix` produces a patch bump, per Cargo/SemVer 0.x convention.

## Tooling

[git-cliff](https://git-cliff.org) is the single tool, chosen because it covers
both needs of the lightweight ("option 2") approach:

- `git cliff --bumped-version` → next semver from conventional commits since the
  last tag.
- `git cliff --tag vX.Y.Z` → renders `CHANGELOG.md` and the release-notes body.

Config lives in a committed `cliff.toml` (commit grouping, the bump rules, and
the changelog template). Alternatives (cocogitto, convco) were rejected only
because they add a second tool for no additional capability here.

## Architecture — two workflows + scripts

### Scripts (committed, locally runnable)

- `scripts/release/set-version.mjs <version>` — the one tricky unit: writes a
  given `X.Y.Z` into all three version fields (TOML for the two crates, JSON for
  `web/package.json`), preserving formatting and touching only the `version`
  field of each `[package]` / top-level object. Exits non-zero on a malformed
  argument or if any target file is missing. Runnable by hand for testing.
- `cliff.toml` — git-cliff configuration (bump rules + changelog template).

The workflows are thin wrappers that call git-cliff and `set-version.mjs`; no
release logic is hidden in YAML.

### Workflow 1 — `.github/workflows/release-prepare.yml`

Trigger: `workflow_dispatch` with one optional input `bump` (default `auto`;
accepts `patch` | `minor` | `major` | an explicit `x.y.z`).

Steps:

1. Determine the version: if `bump` is `auto`, run `git cliff --bumped-version`;
   otherwise honor the override (a level computes from the last tag; an explicit
   `x.y.z` is used verbatim).
2. Create branch `release/vX.Y.Z`.
3. `node scripts/release/set-version.mjs X.Y.Z` to update the three fields.
4. Regenerate `CHANGELOG.md` via `git cliff --tag vX.Y.Z`.
5. Commit `release: vX.Y.Z`, push the branch.
6. Open a PR (`gh pr create`) titled `release: vX.Y.Z` with the rendered notes
   as the body.

The PR runs the existing four required CI jobs like any other PR. A human
reviews and **squash-merges** it. This is the only branch/PR creation step;
it never writes to `main` directly.

### Workflow 2 — `.github/workflows/release-publish.yml`

Trigger: `push` to `main`.

Steps:

1. Read the version from `web/package.json`.
2. If tag `vX.Y.Z` already exists → exit 0 (no-op for ordinary merges).
3. Otherwise:
   - Build wasm **from source** and `web/dist` (reusing the `ci.yml` pattern, so
     the artifact is built from current engine source, not a committed binary).
   - Zip `web/dist` into `canfield-vX.Y.Z-web.zip`.
   - Create the `vX.Y.Z` tag on the merged commit.
   - `gh release create vX.Y.Z` with the git-cliff notes as the body and the zip
     attached as a release asset.

This workflow only ever creates a **tag + release** — it pushes no commits to
`main`, so branch protection is untouched. Detection is by "version in
`package.json` has no matching tag yet," which makes the release-PR merge produce
exactly one release and makes every other push a no-op.

## Data flow

```
operator clicks "Run workflow" (release-prepare)
  └─ git cliff --bumped-version ─────────────► vX.Y.Z
       └─ set-version.mjs writes 3 files
       └─ git cliff --tag vX.Y.Z  ► CHANGELOG.md
       └─ commit "release: vX.Y.Z" on release/vX.Y.Z
       └─ gh pr create  ───────────────────► Release PR
                                                  │ (4 CI jobs pass)
operator squash-merges the PR ───────────────────┘
  push to main fires release-publish
  └─ version untagged?  ── no ─► exit (no-op)
                         └ yes ─► build wasm+web, zip dist
                                  git tag vX.Y.Z
                                  gh release create + asset
```

## Testing

- **`scripts/release/set-version.mjs`** gets a Vitest unit test (it edits TOML +
  JSON; worth locking down). The test exercises: all three files updated to the
  given version, malformed-version argument rejected, and idempotence when run
  twice. Consistent with the repo's "every tricky unit is tested" rigor.
- The web unit-test count in the docs (README "31 tests", CLAUDE.md) increases
  by the number of new cases and must be updated in the same change.
- No new Rust tests (the scripts are JS; the crates are unchanged apart from a
  mechanically-written `version` field).

## Documentation (required by CLAUDE.md docs policy)

- **README.md** — new **"Releasing"** section: how to run the workflow, the
  `bump` override, the PR-then-merge flow, where the release/asset appear; plus
  the updated web unit-test count.
- **CLAUDE.md** — add the invariant ("git tag is the source of truth; never
  hand-edit version fields — run a release"), add `release-prepare` /
  `release-publish` to the CI table, and update the web unit-test count.

## Out of scope (YAGNI)

- Publishing crates to crates.io (the crates are internal/unpublished).
- Cross-platform native binaries / installers (the deliverable is a web bundle;
  `cargo-dist`/`dist` is not a fit).
- GitHub Pages deployment (can be a later, separate change).
- Showing the version inside the app UI (separate, optional).
- A fully-local release path — superseded by the chosen Actions + Release-PR
  flow.
```
