# Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conventional-commit-driven release process: a one-button GitHub Actions workflow that opens a version-bump/changelog "release PR", and an on-merge workflow that tags the commit and publishes a GitHub Release with the web bundle attached.

**Architecture:** `git-cliff` computes the next semver from conventional commits and renders the changelog. A `workflow_dispatch` *prepare* job opens a `release/vX.Y.Z` PR (bumped version in all 3 fields + `Cargo.lock` + `CHANGELOG.md`). A human squash-merges it; a *publish* job triggered by that push to `main` tags the commit and creates the Release. The git tag is the source of truth.

**Tech Stack:** GitHub Actions, `git-cliff`, Node ESM (`.mjs`), Vitest, `gh` CLI, `wasm-pack`.

---

## Prerequisites (one-time repo setup — document, do not script)

These are configured by the human in GitHub repo settings, not by this plan's code. Task 5 documents them; call them out at handoff.

1. **`RELEASE_PR_TOKEN` secret** — a fine-grained Personal Access Token (or GitHub App installation token) scoped to this repo with `Contents: read/write` and `Pull requests: read/write`. The prepare workflow uses it to push the release branch and open the PR **so the four required CI checks actually run on the PR** (a PR opened by the default `GITHUB_TOKEN` does not trigger other workflows, so it could never satisfy required checks).
   - **Secret-free fallback** (if the user declines the PAT): leave prepare on `GITHUB_TOKEN`; after the bot opens the PR a human must **close and reopen it** to trigger the CI checks. Clunky but needs no secret. Documented in README.
2. The publish workflow uses the default `GITHUB_TOKEN` (creating a tag + release needs only `contents: write`) — no extra secret.

## File Structure

- Create `cliff.toml` (repo root) — git-cliff config: commit→group mapping, bump rules (0.x-aware), changelog template.
- Create `web/scripts/release/set-version.mjs` — pure `setVersion(version, files)` that writes a version into the two crate `Cargo.toml`s + `web/package.json`; CLI entry when run directly. Lives under `web/scripts/` to match the existing `setup-hooks.mjs` convention and keep the Vitest import inside the web root.
- Create `web/src/tests/set-version.test.ts` — Vitest unit test for `setVersion` against temp fixtures.
- Create `.github/workflows/release-prepare.yml` — `workflow_dispatch` → release PR.
- Create `.github/workflows/release-publish.yml` — push-to-`main` → tag + release.
- Modify `README.md` — new "Releasing" section + web unit-test count.
- Modify `CLAUDE.md` — version invariant, CI table rows, web unit-test counts.

---

## Task 1: git-cliff configuration

**Files:**
- Create: `cliff.toml`

- [ ] **Step 1: Create `cliff.toml`**

```toml
# git-cliff configuration — https://git-cliff.org
# Drives both the changelog (CHANGELOG.md / release notes) and the
# `--bumped-version` semver calculation from conventional commits.

[changelog]
header = "# Changelog\n\nAll notable changes to this project are documented here.\n"
body = """
{% if version %}\
## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}
{% else %}\
## [unreleased]
{% endif %}\
{% for group, commits in commits | group_by(attribute="group") %}
### {{ group | upper_first }}
{% for commit in commits %}
- {{ commit.message | upper_first }}\
{% endfor %}
{% endfor %}\n
"""
trim = true

[git]
conventional_commits = true
filter_unconventional = true
split_commits = false
# Order matters: the first matching parser wins.
commit_parsers = [
  { message = "^feat", group = "Features" },
  { message = "^fix", group = "Bug Fixes" },
  { message = "^perf", group = "Performance" },
  { message = "^refactor", group = "Refactor" },
  { message = "^doc", group = "Documentation" },
  { message = "^test", group = "Testing" },
  { message = "^release", skip = true },
  { message = "^chore\\(release\\)", skip = true },
  { message = "^chore", group = "Miscellaneous" },
]
filter_commits = false
tag_pattern = "v[0-9]*"
topo_order = false
sort_commits = "oldest"

# Bump rules. While the version is 0.x: feat AND breaking changes both bump
# the MINOR (0.x convention), fix bumps PATCH. Once >= 1.0.0, breaking changes
# bump MAJOR automatically (git-cliff applies major bumps for breaking changes
# only when major version > 0, since breaking_always_bump_major = false).
[bump]
features_always_bump_minor = true
breaking_always_bump_major = false
```

- [ ] **Step 2: Install git-cliff locally for a smoke check**

Run: `cargo install git-cliff --locked` (or `brew install git-cliff`)
Expected: `git-cliff` binary on PATH (`git-cliff --version` prints a version).

- [ ] **Step 3: Smoke-test changelog rendering**

Run: `git cliff --unreleased --strip all`
Expected: prints a grouped changelog of commits since the last tag (no error). Content is history-dependent; the only requirement is that it renders without a config error.

- [ ] **Step 4: Smoke-test version calculation**

Run: `git cliff --bumped-version`
Expected: prints a single semver (e.g. `0.2.0` or `v0.2.0`) with no error. The exact value depends on commit history; you only need it to succeed and emit a valid `X.Y.Z`.

- [ ] **Step 5: Commit**

```bash
git add cliff.toml
git commit -m "chore: add git-cliff config for release automation"
```

---

## Task 2: `set-version.mjs` (TDD)

**Files:**
- Create: `web/scripts/release/set-version.mjs`
- Test: `web/src/tests/set-version.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/tests/set-version.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setVersion } from '../../scripts/release/set-version.mjs'

const CARGO = `[package]
name = "demo"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
`

const PKG = `{
  "name": "demo",
  "version": "0.1.0",
  "type": "module"
}
`

let dir: string
let files: { cargoCrates: string[]; packageJson: string }

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'setver-'))
  const a = join(dir, 'a-Cargo.toml')
  const b = join(dir, 'b-Cargo.toml')
  const p = join(dir, 'package.json')
  await writeFile(a, CARGO)
  await writeFile(b, CARGO)
  await writeFile(p, PKG)
  files = { cargoCrates: [a, b], packageJson: p }
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('setVersion', () => {
  it('writes the version into every crate package and package.json', async () => {
    await setVersion('1.2.3', files)
    for (const c of files.cargoCrates) {
      const src = await readFile(c, 'utf8')
      expect(src).toContain('version = "1.2.3"')
      // dependency version must be left untouched
      expect(src).toContain('serde = { version = "1"')
    }
    const pkg = JSON.parse(await readFile(files.packageJson, 'utf8'))
    expect(pkg.version).toBe('1.2.3')
  })

  it('rejects a malformed version', async () => {
    await expect(setVersion('1.2', files)).rejects.toThrow(/invalid version/)
  })

  it('is idempotent when run twice', async () => {
    await setVersion('2.0.0', files)
    await setVersion('2.0.0', files)
    const src = await readFile(files.cargoCrates[0], 'utf8')
    expect((src.match(/version = "2\.0\.0"/g) || []).length).toBe(1)
    const pkg = JSON.parse(await readFile(files.packageJson, 'utf8'))
    expect(pkg.version).toBe('2.0.0')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run src/tests/set-version.test.ts`
Expected: FAIL — cannot resolve `../../scripts/release/set-version.mjs` (module does not exist yet).

- [ ] **Step 3: Implement `set-version.mjs`**

Create `web/scripts/release/set-version.mjs`:

```js
#!/usr/bin/env node
//
// Writes a single app version into every version field that the release
// process keeps in lockstep: both crate Cargo.toml [package] versions and
// web/package.json. The git tag is the source of truth; this script exists so
// the release-prepare workflow (and a human, locally) can stamp that version
// into the repo deterministically.
//
// Usage (from repo root):  node web/scripts/release/set-version.mjs 1.2.3
//
// Exported for unit testing: setVersion(version, files).

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const SEMVER = /^\d+\.\d+\.\d+$/

// web/scripts/release/ -> ../../.. -> repo root
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export const DEFAULT_FILES = {
  cargoCrates: [
    resolve(repoRoot, 'crates/engine/Cargo.toml'),
    resolve(repoRoot, 'crates/wasm/Cargo.toml'),
  ],
  packageJson: resolve(repoRoot, 'web/package.json'),
}

// Matches the [package] version line only (line-anchored). Inline dependency
// versions like `serde = { version = "1" }` start with the crate name, so they
// are never matched.
const PACKAGE_VERSION_LINE = /^version = "[^"]*"$/m

export async function setVersion(version, files = DEFAULT_FILES) {
  if (!SEMVER.test(version)) {
    throw new Error(`invalid version "${version}" (expected X.Y.Z)`)
  }

  for (const path of files.cargoCrates) {
    const src = await readFile(path, 'utf8')
    if (!PACKAGE_VERSION_LINE.test(src)) {
      throw new Error(`no [package] version line found in ${path}`)
    }
    await writeFile(path, src.replace(PACKAGE_VERSION_LINE, `version = "${version}"`))
  }

  const pkgSrc = await readFile(files.packageJson, 'utf8')
  const pkg = JSON.parse(pkgSrc)
  pkg.version = version
  await writeFile(files.packageJson, JSON.stringify(pkg, null, 2) + '\n')
}

// CLI entry point — only when executed directly, not when imported.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = process.argv[2]
  setVersion(version).then(
    () => console.log(`set version ${version}`),
    (err) => {
      console.error(err.message)
      process.exit(1)
    },
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run src/tests/set-version.test.ts`
Expected: PASS — 3 passing tests.

- [ ] **Step 5: Verify the full web suite still passes**

Run: `cd web && npm test`
Expected: PASS — previous 31 tests + 3 new = 34 tests. (If the baseline differs, note the new total; Task 5 updates the docs to match.)

- [ ] **Step 6: Commit**

```bash
git add web/scripts/release/set-version.mjs web/src/tests/set-version.test.ts
git commit -m "feat(release): add set-version script to stamp app version into all manifests"
```

---

## Task 3: `release-prepare.yml` workflow

**Files:**
- Create: `.github/workflows/release-prepare.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Release — prepare

# Manually triggered. Computes the next version from conventional commits,
# bumps every version field + Cargo.lock + CHANGELOG.md on a release/* branch,
# and opens a PR. A human squash-merges that PR to ship (see release-publish).
on:
  workflow_dispatch:
    inputs:
      bump:
        description: "Version: auto (from commits) | patch | minor | major | explicit x.y.z"
        required: false
        default: auto

permissions:
  contents: write
  pull-requests: write

jobs:
  prepare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history + tags so git-cliff can compute the bump
          # PAT so the branch push / PR creation runs the required CI checks
          # (a PR opened by the default GITHUB_TOKEN does not trigger workflows).
          token: ${{ secrets.RELEASE_PR_TOKEN }}

      - name: Install stable toolchain
        uses: dtolnay/rust-toolchain@stable

      - name: Install git-cliff
        uses: taiki-e/install-action@v2
        with:
          tool: git-cliff

      - name: Compute version
        id: version
        run: |
          set -euo pipefail
          case "${{ inputs.bump }}" in
            auto)
              VERSION="$(git cliff --bumped-version | sed 's/^v//')" ;;
            patch|minor|major)
              VERSION="$(git cliff --bump "${{ inputs.bump }}" --bumped-version | sed 's/^v//')" ;;
            *)
              VERSION="${{ inputs.bump }}" ;;
          esac
          if ! echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
            echo "::error::computed version '$VERSION' is not X.Y.Z"; exit 1
          fi
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          echo "Release version: $VERSION"

      - name: Configure git identity
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Create release branch
        run: git switch -c "release/v${{ steps.version.outputs.version }}"

      - name: Stamp version into manifests
        run: node web/scripts/release/set-version.mjs "${{ steps.version.outputs.version }}"

      - name: Refresh Cargo.lock
        run: cargo update --workspace

      - name: Regenerate CHANGELOG.md
        run: git cliff --tag "v${{ steps.version.outputs.version }}" -o CHANGELOG.md

      - name: Render PR body (release notes)
        run: git cliff --unreleased --tag "v${{ steps.version.outputs.version }}" --strip all -o RELEASE_NOTES.md

      - name: Commit
        run: |
          git add crates/engine/Cargo.toml crates/wasm/Cargo.toml web/package.json Cargo.lock CHANGELOG.md
          git commit -m "release: v${{ steps.version.outputs.version }}"

      - name: Push branch
        run: git push -u origin "release/v${{ steps.version.outputs.version }}"

      - name: Open release PR
        env:
          GH_TOKEN: ${{ secrets.RELEASE_PR_TOKEN }}
        run: |
          gh pr create \
            --base main \
            --head "release/v${{ steps.version.outputs.version }}" \
            --title "release: v${{ steps.version.outputs.version }}" \
            --body-file RELEASE_NOTES.md
```

- [ ] **Step 2: Sanity-check YAML syntax**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/release-prepare.yml')" && echo OK`
Expected: prints `OK` (parses without error). This validates YAML syntax only, not Actions semantics — full validation happens when the workflow runs.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release-prepare.yml
git commit -m "ci: add release-prepare workflow (opens version-bump release PR)"
```

---

## Task 4: `release-publish.yml` workflow

**Files:**
- Create: `.github/workflows/release-publish.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Release — publish

# Fires on every push to main. Releases only when the version in
# web/package.json has no matching git tag yet — i.e. right after a release PR
# is squash-merged. Every other push is a no-op. Builds wasm from source +
# web/dist, tags the commit, and creates the GitHub Release with the bundle.
on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # tags + history for the no-op check and release notes

      - name: Read version + check for existing tag
        id: gate
        run: |
          set -euo pipefail
          VERSION="$(node -p "require('./web/package.json').version")"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          if git rev-parse "v$VERSION" >/dev/null 2>&1; then
            echo "release=false" >> "$GITHUB_OUTPUT"
            echo "Tag v$VERSION already exists — nothing to publish."
          else
            echo "release=true" >> "$GITHUB_OUTPUT"
            echo "Publishing v$VERSION."
          fi

      - name: Install stable toolchain
        if: steps.gate.outputs.release == 'true'
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo + target
        if: steps.gate.outputs.release == 'true'
        uses: Swatinem/rust-cache@v2

      - name: Install wasm-pack
        if: steps.gate.outputs.release == 'true'
        uses: jetli/wasm-pack-action@v0.4.0

      - name: Build WASM from source
        if: steps.gate.outputs.release == 'true'
        run: wasm-pack build crates/wasm --target web --out-dir ../../web/src/pkg

      - name: Setup Node
        if: steps.gate.outputs.release == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Build web bundle
        if: steps.gate.outputs.release == 'true'
        working-directory: web
        run: |
          npm ci
          npm run build

      - name: Zip web bundle
        if: steps.gate.outputs.release == 'true'
        run: |
          cd web/dist
          zip -r "${{ github.workspace }}/canfield-v${{ steps.gate.outputs.version }}-web.zip" .

      - name: Install git-cliff
        if: steps.gate.outputs.release == 'true'
        uses: taiki-e/install-action@v2
        with:
          tool: git-cliff

      - name: Render release notes
        if: steps.gate.outputs.release == 'true'
        run: git cliff --unreleased --tag "v${{ steps.gate.outputs.version }}" --strip all -o RELEASE_NOTES.md

      - name: Create and push tag
        if: steps.gate.outputs.release == 'true'
        run: |
          git tag "v${{ steps.gate.outputs.version }}"
          git push origin "v${{ steps.gate.outputs.version }}"

      - name: Create GitHub Release
        if: steps.gate.outputs.release == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create "v${{ steps.gate.outputs.version }}" \
            --title "v${{ steps.gate.outputs.version }}" \
            --notes-file RELEASE_NOTES.md \
            "canfield-v${{ steps.gate.outputs.version }}-web.zip"
```

- [ ] **Step 2: Sanity-check YAML syntax**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/release-publish.yml')" && echo OK`
Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release-publish.yml
git commit -m "ci: add release-publish workflow (tag + GitHub Release on merge)"
```

---

## Task 5: Documentation

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Find every web unit-test count to update**

Run: `grep -rn "31 " README.md CLAUDE.md; grep -rn "31 web unit" README.md CLAUDE.md; grep -rn "(31 tests)" README.md CLAUDE.md`
Expected: lists each spot citing 31 web unit tests. Update each to the new total from Task 2 Step 5 (34 if the baseline was 31).

- [ ] **Step 2: Update the web unit-test counts**

Replace each `31` web-unit-test reference found above with the new total (e.g. `34`) in both `README.md` and `CLAUDE.md` — including CLAUDE.md's `npm test` "(31 tests)" comment and the Definition of Done "all 31 web unit tests pass" line.

- [ ] **Step 3: Add a "Releasing" section to `README.md`**

Add this section (place it after the CI/testing section):

```markdown
## Releasing

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/)
and `git-cliff`. The version is a single number covering web + Rust changes, and
the **git tag (`vX.Y.Z`) is the source of truth** — never hand-edit the `version`
fields in `crates/*/Cargo.toml` or `web/package.json`; a release stamps them.

To cut a release:

1. In **Actions → "Release — prepare" → Run workflow**, leave `bump` as `auto`
   (or force `patch`/`minor`/`major`/an explicit `x.y.z`). It computes the next
   version from the commits since the last tag, bumps every version field +
   `Cargo.lock` + `CHANGELOG.md` on a `release/vX.Y.Z` branch, and opens a PR.
2. Review the PR; once the four CI checks pass, **squash-merge** it.
3. Merging triggers **"Release — publish"**, which builds the wasm + web bundle,
   tags the commit `vX.Y.Z`, and creates the GitHub Release with
   `canfield-vX.Y.Z-web.zip` attached.

**Versioning:** while on `0.x`, `feat` and breaking changes bump the minor and
`fix` bumps the patch; from `1.0.0` on, breaking changes bump the major.

**One-time setup:** the prepare workflow needs a repo secret `RELEASE_PR_TOKEN`
(a fine-grained PAT with `Contents: read/write` + `Pull requests: read/write`)
so the release PR triggers the required CI checks. Without it, after the bot
opens the PR a maintainer must close and reopen the PR to trigger CI.
```

- [ ] **Step 4: Add the release invariant + CI rows to `CLAUDE.md`**

In `CLAUDE.md`, under "Key Design Constraints", add:

```markdown
- **Versioning via release, not by hand.** The git tag `vX.Y.Z` is the source of
  truth for the app version. The `version` fields in `crates/*/Cargo.toml` and
  `web/package.json` are kept in lockstep by the release workflow — never edit
  them manually. Run **Actions → "Release — prepare"** to bump. While on `0.x`,
  `feat`/breaking bump minor and `fix` bumps patch; `git-cliff` (`cliff.toml`)
  computes it from conventional commits.
```

And add these two rows to the CI jobs table:

```markdown
| **Release — prepare** | `workflow_dispatch` only | Computes version via `git-cliff`, opens a `release/vX.Y.Z` PR (bumped manifests + `Cargo.lock` + `CHANGELOG.md`). Not a PR check. |
| **Release — publish** | `push` to `main` | No-op unless `web/package.json`'s version has no tag; then builds the bundle, tags `vX.Y.Z`, and creates the GitHub Release. |
```

- [ ] **Step 5: Verify docs reference reality**

Run: `grep -rn "Release — prepare\|Release — publish\|RELEASE_PR_TOKEN\|cliff.toml" README.md CLAUDE.md`
Expected: shows the new references in both files. Confirm no remaining stale `31`-test references: `grep -rn "31 web\|(31 tests)\|31 web unit" README.md CLAUDE.md` returns nothing.

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: document the release workflow and versioning invariant"
```

---

## Task 6: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Web suite green**

Run: `cd web && npm test`
Expected: PASS — new total (e.g. 34 tests).

- [ ] **Step 2: TypeScript clean**

Run: `cd web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Rust unaffected**

Run: `cargo test -p canfield-engine && cargo fmt --all -- --check && cargo clippy --workspace --all-targets -- -D warnings`
Expected: tests pass; fmt and clippy clean.

- [ ] **Step 4: Dry-run the version stamp locally (no commit)**

Run:
```bash
node web/scripts/release/set-version.mjs 9.9.9
git --no-pager diff --stat
git checkout -- crates/engine/Cargo.toml crates/wasm/Cargo.toml web/package.json
```
Expected: the diff touches exactly the three manifests' version lines; the `checkout` reverts them cleanly (leaving no release-test changes staged).

- [ ] **Step 5: Both workflows parse**

Run: `for f in .github/workflows/release-*.yml; do ruby -ryaml -e "YAML.load_file('$f')" && echo "$f OK"; done`
Expected: both print `OK`.

- [ ] **Step 6: Push branch and open PR**

Follow the git-workflow skill: final `git fetch && git rebase origin/main`, review `git diff origin/main...HEAD`, push, open the PR with squash automerge.

---

## Self-Review notes (for the implementer)

- **Spec coverage:** composite single version (set-version + cliff bump) ✓; automated semver from conventional commits (Task 1 `[bump]`, Task 3 compute step) ✓; scripted + documented (Tasks 2 & 5) ✓; honors branch protection (prepare opens PR, publish only tags) ✓; zip asset (Task 4) ✓; Vitest test for the script (Task 2) ✓.
- **Known prerequisite:** `RELEASE_PR_TOKEN` must exist before the prepare workflow can produce a mergeable PR (see Prerequisites). This is a human repo-settings step, intentionally not scripted.
- **0.x bump check:** `breaking_always_bump_major = false` + `features_always_bump_minor = true` yields feat/breaking→minor, fix→patch while 0.x, and breaking→major once ≥1.0.
```
