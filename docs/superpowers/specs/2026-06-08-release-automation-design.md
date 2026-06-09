# Release automation design — conventional-commit-driven GitHub Releases

**Date:** 2026-06-08
**Status:** Approved (revised — local prepare script, zero repo secrets)

## Goal

Provide a scripted, documented, repeatable way to cut a GitHub Release for the
app, where:

- The **app version** is a single composite number covering web + Rust changes.
- The semver bump is **calculated automatically from conventional commits** —
  never decided by hand (an explicit override remains available).
- The process is **easy to run, documented, and zero-setup for contributors** —
  no repo secrets, no admin provisioning. Anyone with the repo's normal
  toolchain (Node, `gh`, `cargo`) and write access runs one command.
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

## Why a local prepare script (not a `workflow_dispatch` button)

`main` requires four CI status checks. A PR opened by a GitHub Actions workflow
using the default `GITHUB_TOKEN` **does not trigger other workflows**, so those
required checks would never run and the release PR could never be merged. The
only way to keep the prepare step fully in Actions is a human-provisioned PAT or
GitHub App secret — a manual setup step that defeats the "zero-setup for
contributors" goal and must be redone for every fork/clone.

Running prepare as a **local script** sidesteps this entirely: the contributor
pushes the release branch with their own credentials, so the required CI checks
fire on the PR like any normal PR — with no secret anywhere. `git-cliff` is run
via `npx git-cliff` (it ships an npm binary wrapper), so there is nothing to
install beyond Node, which the project already requires.

## Tooling

[git-cliff](https://git-cliff.org) is the single tool, chosen because it covers
both needs of the lightweight approach:

- `git cliff --bumped-version` → next semver from conventional commits since the
  last tag.
- `git cliff --tag vX.Y.Z` → renders `CHANGELOG.md` and the release-notes body.

Run as `npx git-cliff` locally (zero install) and via `taiki-e/install-action`
in the publish workflow (cached binary). Config lives in a committed `cliff.toml`
(commit grouping, the bump rules, and the changelog template). Alternatives
(cocogitto, convco) were rejected only because they add a second tool for no
additional capability here.

## Architecture — one local script + one workflow + shared helpers

### Shared helpers (committed)

- `cliff.toml` — git-cliff configuration (bump rules + changelog template), used
  by both the local prepare script and the publish workflow.
- `web/scripts/release/set-version.mjs` — the one tricky unit: a pure
  `setVersion(version, files)` that writes a given `X.Y.Z` into all three version
  fields (TOML for the two crates, JSON for `web/package.json`), preserving
  formatting and touching only the `[package]` / top-level `version`. Throws on a
  malformed version or a missing/ill-formed file. Lives under `web/scripts/` to
  match the existing `setup-hooks.mjs` convention and keep its Vitest import
  inside the web root. Also exposes a CLI entry for ad-hoc use.

### Prepare — local script `web/scripts/release/prepare.mjs`

Run via `npm run release` (from `web/`). Accepts an optional bump argument
(`auto` default | `patch` | `minor` | `major` | explicit `x.y.z`) and a
`--dry-run` flag (compute + print the plan, make no changes) and `--yes` (skip
the confirmation prompt).

Steps (ordered so `--dry-run` needs only Node + git + network, not `gh`/`cargo`):

1. `git fetch origin --tags --prune`.
2. Determine the version: explicit `x.y.z` used verbatim; `auto` →
   `npx git-cliff --bumped-version`; a level → `npx git-cliff --bump <level>
   --bumped-version`. Validate it is `X.Y.Z`.
3. Print the plan. On `--dry-run`, stop here. Otherwise prompt to proceed (unless
   `--yes`).
4. Preflight before mutating anything: working tree clean; `gh` authenticated;
   `cargo` available. Fail with a clear message otherwise.
5. `git switch -c release/vX.Y.Z origin/main` (always branch from latest `main`,
   independent of the current local branch).
6. `setVersion(version)` to update the three fields.
7. `cargo update --workspace` to refresh `Cargo.lock`'s member entries.
8. `npx git-cliff --tag vX.Y.Z -o CHANGELOG.md`.
9. Commit `release: vX.Y.Z` (the three manifests + `Cargo.lock` + `CHANGELOG.md`).
10. `git push -u origin release/vX.Y.Z`.
11. `gh pr create` titled `release: vX.Y.Z`, body =
    `npx git-cliff --unreleased --tag vX.Y.Z --strip all`.

The first release has no prior tag, so `auto` may not produce the intended
number; pass an explicit `x.y.z` (e.g. `npm run release -- 0.2.0`) for it.

The PR runs the four required CI jobs like any normal PR (pushed by the
contributor, so checks fire). A human reviews and **squash-merges** it. The
script never writes to `main` directly.

### Publish — workflow `.github/workflows/release-publish.yml`

Trigger: `push` to `main` (the squash-merge of the release PR is such a push).

Steps:

1. Read the version from `web/package.json`.
2. If tag `vX.Y.Z` already exists → exit 0 (no-op for ordinary merges).
3. Otherwise:
   - Build wasm **from source** and `web/dist` (reusing the `ci.yml` pattern, so
     the artifact is built from current engine source, not a committed binary).
   - Zip `web/dist` into `canfield-vX.Y.Z-web.zip`.
   - Create the `vX.Y.Z` tag on the merged commit.
   - `gh release create vX.Y.Z` with the git-cliff notes as the body and the zip
     attached as a release asset (using the automatic `GITHUB_TOKEN`).

This workflow only ever creates a **tag + release** — it pushes no commits to
`main`, so branch protection is untouched, and it needs no secret beyond the
default `GITHUB_TOKEN`. Detection is by "version in `package.json` has no
matching tag yet," which makes the release-PR merge produce exactly one release
and makes every other push a no-op.

## Data flow

```
contributor runs: npm run release [auto|patch|minor|major|x.y.z]
  └─ npx git-cliff --bumped-version ───────────► vX.Y.Z
       └─ setVersion writes 3 manifests
       └─ cargo update --workspace  ► Cargo.lock
       └─ npx git-cliff --tag vX.Y.Z  ► CHANGELOG.md
       └─ commit "release: vX.Y.Z" on release/vX.Y.Z
       └─ git push  (contributor creds → required CI fires)
       └─ gh pr create  ───────────────────────► Release PR
                                                     │ (4 CI checks pass)
contributor squash-merges the PR ────────────────────┘
  push to main fires release-publish workflow
  └─ version untagged?  ── no ─► exit (no-op)
                         └ yes ─► build wasm+web, zip dist
                                  git tag vX.Y.Z
                                  gh release create + asset
```

## Testing

- **`set-version.mjs`** gets a Vitest unit test (it edits TOML + JSON; worth
  locking down). The test exercises: all three files updated to the given
  version, a malformed-version argument rejected, dependency `version` fields
  left untouched, and idempotence when run twice. Consistent with the repo's
  "every tricky unit is tested" rigor.
- **`prepare.mjs`** is orchestration that shells out to git/git-cliff/gh; it is
  verified by `npm run release -- --dry-run` (prints the computed version and the
  planned actions, makes no changes) rather than a unit test. The pure file
  mutation it depends on is covered by the `set-version` test.
- The web unit-test count in the docs (README, CLAUDE.md) increases by the number
  of new `set-version` cases and must be updated in the same change.
- No new Rust tests (the scripts are JS; the crates are unchanged apart from a
  mechanically-written `version` field).

## Documentation (required by CLAUDE.md docs policy)

- **README.md** — new **"Releasing"** section: the `npm run release` flow, the
  bump override, `--dry-run`, the prerequisites (`gh` authenticated, `cargo`,
  Node), the PR-then-squash-merge step, and where the release/asset appear; plus
  the updated web unit-test count.
- **CLAUDE.md** — add the invariant ("git tag is the source of truth; never
  hand-edit version fields — run `npm run release`"), add `release-publish` to
  the CI table, add `npm run release` to the web commands, and update the web
  unit-test count.

## Out of scope (YAGNI)

- Publishing crates to crates.io (the crates are internal/unpublished).
- Cross-platform native binaries / installers (the deliverable is a web bundle;
  `cargo-dist`/`dist` is not a fit).
- GitHub Pages deployment (can be a later, separate change).
- Showing the version inside the app UI (separate, optional).
- A `workflow_dispatch` "button" for prepare (rejected: it requires a
  human-provisioned PAT/App secret, defeating the zero-setup goal).
