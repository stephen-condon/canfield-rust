# Release Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conventional-commit-driven release process: a local `npm run release` script that opens a version-bump/changelog "release PR" (pushed with the contributor's own credentials so required CI fires), and an on-merge workflow that tags the commit and publishes a GitHub Release with the web bundle attached.

**Architecture:** `git-cliff` (run via `npx git-cliff`, zero install) computes the next semver from conventional commits and renders the changelog. A local script (`web/scripts/release/prepare.mjs`, invoked by `npm run release`) opens a `release/vX.Y.Z` PR (bumped manifests + `Cargo.lock` + `CHANGELOG.md`). A human squash-merges it; a *publish* workflow triggered by that push to `main` tags the commit and creates the Release using the default `GITHUB_TOKEN`. **No repo secrets are required.** The git tag is the source of truth.

**Tech Stack:** Node ESM (`.mjs`), `npx git-cliff`, Vitest, `gh` CLI, `cargo`, GitHub Actions, `wasm-pack`.

---

## Why this shape (context for the implementer)

`main` requires four CI status checks. A PR opened by a GitHub Actions workflow using the default `GITHUB_TOKEN` does **not** trigger other workflows, so the required checks would never run and the release PR could never merge. Avoiding that without a human-provisioned PAT/App secret is exactly why the *prepare* step is a **local script** (pushed with the contributor's own credentials → checks fire normally). The *publish* step stays in Actions because the human squash-merge is an ordinary push to `main`, which triggers it, and creating a tag+release needs only the automatic `GITHUB_TOKEN`. Net: zero repo secrets, zero admin setup.

## File Structure

- Create `cliff.toml` (repo root) — git-cliff config: commit→group mapping, bump rules (0.x-aware), changelog template. Shared by the local script and the publish workflow.
- Create `web/scripts/release/set-version.mjs` — pure `setVersion(version, files)` + `DEFAULT_FILES`; writes a version into the two crate `Cargo.toml`s + `web/package.json`. CLI entry when run directly. Under `web/scripts/` to match `setup-hooks.mjs` and keep the Vitest import inside the web root.
- Create `web/src/tests/set-version.test.ts` — Vitest unit test for `setVersion` against temp fixtures.
- Create `web/scripts/release/prepare.mjs` — the `npm run release` orchestrator: compute version, branch from `origin/main`, bump, changelog, commit, push, open PR.
- Modify `web/package.json` — add `"release"` script.
- Create `.github/workflows/release-publish.yml` — push-to-`main` → tag + GitHub Release.
- Modify `README.md` — new "Releasing" section + web unit-test count.
- Modify `CLAUDE.md` — versioning invariant, `release-publish` CI row, `npm run release` command, web unit-test counts.

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

- [ ] **Step 2: Smoke-test changelog rendering (zero install via npx)**

Run: `npx --yes git-cliff@2 --unreleased --strip all`
Expected: on first use npx fetches the git-cliff binary, then it renders a grouped changelog of commits since the last tag with no config/template error. There are no tags yet, so this covers all history; content is history-dependent — you only need it to render WITHOUT an error. If a config key is rejected, fix `cliff.toml` so it parses and re-run.

- [ ] **Step 3: Smoke-test version calculation**

Run: `npx --yes git-cliff@2 --bumped-version`
Expected: prints a single semver (e.g. `0.2.0` or `v0.2.0`) with no error. Exact value is history-dependent; you only need it to succeed and emit a valid `X.Y.Z`.

- [ ] **Step 4: Commit**

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
// the release flow (and a human, locally) can stamp that version into the repo
// deterministically.
//
// Usage (from repo root):  node web/scripts/release/set-version.mjs 1.2.3
//
// Exported for the prepare script and unit tests: setVersion(version, files).

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

## Task 3: `prepare.mjs` local release script

**Files:**
- Create: `web/scripts/release/prepare.mjs`
- Modify: `web/package.json` (add the `release` script)

- [ ] **Step 1: Create `prepare.mjs`**

Create `web/scripts/release/prepare.mjs`:

```js
#!/usr/bin/env node
//
// Prepare a release: compute the next version from conventional commits, bump
// every version field + Cargo.lock + CHANGELOG.md on a release/ branch, push it,
// and open a PR. Run via `npm run release` from web/.
//
//   npm run release                 # auto bump from commits
//   npm run release -- minor        # force a level (patch|minor|major)
//   npm run release -- 1.4.0        # explicit version
//   npm run release -- --dry-run    # show the plan, change nothing
//   npm run release -- --yes        # skip the confirmation prompt
//
// The git tag is the source of truth; this script stamps the computed version
// into the repo so the release PR is reviewable. It pushes with YOUR git
// credentials (not a CI token) so the required CI checks run on the PR.
//
// Prerequisites: git, node, `gh` (authenticated), and `cargo` on PATH.

import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { setVersion, DEFAULT_FILES } from './set-version.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const SEMVER = /^\d+\.\d+\.\d+$/
const LEVELS = new Set(['patch', 'minor', 'major'])

// Run a command at the repo root, inheriting stdio so the user sees progress.
function run(cmd, args) {
  execFileSync(cmd, args, { cwd: repoRoot, stdio: 'inherit' })
}

// Run a command at the repo root and return trimmed stdout.
function capture(cmd, args) {
  return execFileSync(cmd, args, { cwd: repoRoot, encoding: 'utf8' }).trim()
}

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

// npx ships git-cliff's binary; --yes avoids the install prompt on first use.
function cliff(args) {
  return capture('npx', ['--yes', 'git-cliff@2', ...args])
}

async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const assumeYes = argv.includes('--yes')
  const bump = argv.find((a) => !a.startsWith('--')) ?? 'auto'

  // --- Sync + compute version (dry-run needs only node + git + network) ---
  run('git', ['fetch', 'origin', '--tags', '--prune'])

  let version
  if (SEMVER.test(bump)) {
    version = bump
  } else if (bump === 'auto') {
    version = cliff(['--bumped-version']).replace(/^v/, '')
  } else if (LEVELS.has(bump)) {
    version = cliff(['--bump', bump, '--bumped-version']).replace(/^v/, '')
  } else {
    fail(`invalid bump "${bump}" (expected auto | patch | minor | major | x.y.z)`)
  }
  if (!SEMVER.test(version)) fail(`computed version "${version}" is not X.Y.Z`)

  const tag = `v${version}`
  console.log('\nRelease plan:')
  console.log(`  version : ${version}  (bump: ${bump})`)
  console.log(`  branch  : release/${tag}  (from origin/main)`)
  console.log('  updates : crates/*/Cargo.toml, web/package.json, Cargo.lock, CHANGELOG.md')
  console.log(`  then    : push + open PR "release: ${tag}"\n`)

  if (dryRun) {
    console.log('--dry-run: no changes made.')
    return
  }

  // --- Preflight before mutating anything ---
  try {
    capture('cargo', ['--version'])
  } catch {
    fail('cargo not found on PATH — install the Rust toolchain.')
  }
  try {
    execFileSync('gh', ['auth', 'status'], { cwd: repoRoot, stdio: 'ignore' })
  } catch {
    fail('gh is not authenticated — run `gh auth login`.')
  }
  if (capture('git', ['status', '--porcelain']) !== '') {
    fail('working tree is not clean — commit or stash your changes first.')
  }

  if (!assumeYes) {
    const rl = createInterface({ input: stdin, output: stdout })
    const answer = (await rl.question('Proceed? [y/N] ')).trim().toLowerCase()
    rl.close()
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Aborted.')
      return
    }
  }

  // --- Mutate on a release branch ---
  run('git', ['switch', '-c', `release/${tag}`, 'origin/main'])
  await setVersion(version, DEFAULT_FILES)
  run('cargo', ['update', '--workspace'])
  run('npx', ['--yes', 'git-cliff@2', '--tag', tag, '-o', 'CHANGELOG.md'])

  run('git', [
    'add',
    'crates/engine/Cargo.toml',
    'crates/wasm/Cargo.toml',
    'web/package.json',
    'Cargo.lock',
    'CHANGELOG.md',
  ])
  run('git', ['commit', '-m', `release: ${tag}`])
  run('git', ['push', '-u', 'origin', `release/${tag}`])

  const body = cliff(['--unreleased', '--tag', tag, '--strip', 'all'])
  run('gh', [
    'pr', 'create',
    '--base', 'main',
    '--head', `release/${tag}`,
    '--title', `release: ${tag}`,
    '--body', body,
  ])
  console.log(`\n✓ Opened release PR for ${tag}. Let CI pass, then squash-merge to publish.`)
}

main().catch((err) => fail(err.message))
```

- [ ] **Step 2: Add the `release` npm script**

In `web/package.json`, add a `"release"` entry to `scripts` (keep the others; place it after `"preview"`):

```json
    "preview": "vite preview",
    "release": "node scripts/release/prepare.mjs",
```

- [ ] **Step 3: Syntax-check the script**

Run: `node --check web/scripts/release/prepare.mjs && echo OK`
Expected: prints `OK` (valid syntax).

- [ ] **Step 4: Verify the dry-run computes a version (best-effort runtime check)**

Run: `cd web && npm run release -- --dry-run`
Expected: prints a `Release plan:` block with a valid `version : X.Y.Z` and ends with `--dry-run: no changes made.`, leaving the working tree unchanged (`git status --porcelain` still clean).
Note: the first `npx git-cliff` invocation downloads the binary, so this needs network access. If the sandbox blocks network and the download fails, report it — the syntax check (Step 3) plus the `set-version` unit test (Task 2) are the committed guarantees; the dry-run is then verified by the human during final review.

- [ ] **Step 5: Confirm tsc is unaffected**

Run: `cd web && npx tsc --noEmit`
Expected: no errors. (`.mjs` scripts under `web/scripts/` are not part of the `tsc` source set; this confirms nothing regressed.)

- [ ] **Step 6: Commit**

```bash
git add web/scripts/release/prepare.mjs web/package.json
git commit -m "feat(release): add npm run release script (opens version-bump release PR)"
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
# (from `npm run release`) is squash-merged. Every other push is a no-op. Builds
# wasm from source + web/dist, tags the commit, and creates the GitHub Release
# with the bundle attached. Uses only the automatic GITHUB_TOKEN — no secret.
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
Expected: prints `OK` (parses without error). This validates YAML syntax only, not Actions semantics — full validation happens when the workflow runs.

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

Run: `grep -rn "31 web\|(31 tests)\|31 web unit\|31 tests" README.md CLAUDE.md`
Expected: lists each spot citing 31 web unit tests. Update each to the new total from Task 2 Step 5 (34 if the baseline was 31). Do not touch the Rust "52 tests" counts.

- [ ] **Step 2: Update the web unit-test counts**

Replace each `31` web-unit-test reference found above with the new total (e.g. `34`) in both `README.md` and `CLAUDE.md` — including CLAUDE.md's `npm test` "(31 tests)" comment and the Definition of Done "all 31 web unit tests pass" line.

- [ ] **Step 3: Add a "Releasing" section to `README.md`**

Add this section (place it after the CI/testing section):

```markdown
## Releasing

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/)
and `git-cliff`. The version is a single number covering web + Rust changes, and
the **git tag (`vX.Y.Z`) is the source of truth** — never hand-edit the `version`
fields in `crates/*/Cargo.toml` or `web/package.json`; the release flow stamps
them.

There are **no repo secrets to configure**. You need `git`, Node, an
authenticated [`gh`](https://cli.github.com/) CLI, and `cargo` (the binary
`git-cliff` is fetched automatically via `npx`).

To cut a release, from `web/`:

```bash
npm run release            # auto: next version computed from commits
npm run release -- minor   # or force patch | minor | major
npm run release -- 1.4.0   # or pick an explicit version
npm run release -- --dry-run  # preview the computed version, change nothing
```

The script computes the next version from the commits since the last tag, bumps
every version field + `Cargo.lock` + `CHANGELOG.md` on a `release/vX.Y.Z` branch,
pushes it (with your credentials, so the required CI checks run), and opens a PR.
Review it; once the four CI checks pass, **squash-merge** it.

Merging triggers the **"Release — publish"** workflow, which builds the wasm +
web bundle, tags the commit `vX.Y.Z`, and creates the GitHub Release with
`canfield-vX.Y.Z-web.zip` attached.

**Versioning:** while on `0.x`, `feat` and breaking changes bump the minor and
`fix` bumps the patch; from `1.0.0` on, breaking changes bump the major. The
first release has no prior tag, so pass an explicit version for it
(`npm run release -- 0.2.0`).
```

- [ ] **Step 4: Add the release invariant, CI row, and command to `CLAUDE.md`**

In `CLAUDE.md`, under "Key Design Constraints", add:

```markdown
- **Versioning via `npm run release`, not by hand.** The git tag `vX.Y.Z` is the
  source of truth for the app version. The `version` fields in
  `crates/*/Cargo.toml` and `web/package.json` are kept in lockstep by the
  release flow — never edit them manually. Run `npm run release` (from `web/`) to
  cut a release: it opens a `release/vX.Y.Z` PR; squash-merging it triggers the
  publish workflow. While on `0.x`, `feat`/breaking bump minor and `fix` bumps
  patch; `git-cliff` (`cliff.toml`) computes it from conventional commits.
```

Add `npm run release` to the `web/` commands block:

```bash
npm run release            # cut a release (opens a version-bump PR; from web/)
```

And add this row to the CI jobs table:

```markdown
| **Release — publish** | `push` to `main` | No-op unless `web/package.json`'s version has no tag; then builds the bundle, tags `vX.Y.Z`, and creates the GitHub Release. Triggered by squash-merging a `release/` PR. |
```

- [ ] **Step 5: Verify docs reference reality**

Run: `grep -rn "npm run release\|Release — publish\|cliff.toml\|git-cliff" README.md CLAUDE.md`
Expected: shows the new references in both files. Confirm no remaining stale web-test references: `grep -rn "31 web\|(31 tests)\|31 web unit" README.md CLAUDE.md` returns nothing. Confirm no leftover PAT references: `grep -rn "RELEASE_PR_TOKEN\|workflow_dispatch" README.md CLAUDE.md` returns nothing.

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
Expected: the diff touches exactly the three manifests' version lines; the `checkout` reverts them cleanly (leaving no release-test changes).

- [ ] **Step 5: Prepare dry-run + publish workflow parse**

Run:
```bash
( cd web && npm run release -- --dry-run )
ruby -ryaml -e "YAML.load_file('.github/workflows/release-publish.yml')" && echo "publish OK"
```
Expected: the dry-run prints a `Release plan:` with a valid version and makes no changes; the publish workflow prints `publish OK`. (If network blocks the `npx git-cliff` download, note it and rely on the human to run the dry-run during review.)

- [ ] **Step 6: Push branch and open PR**

Follow the git-workflow skill: final `git fetch && git rebase origin/main`, review `git diff origin/main...HEAD`, push, open the PR with squash automerge.

---

## Self-Review notes (for the implementer)

- **Spec coverage:** composite single version (set-version + cliff bump) ✓; automated semver from conventional commits (Task 1 `[bump]`, Task 3 compute step) ✓; scripted + documented + zero-setup (Tasks 3 & 5, `npx git-cliff`, no secrets) ✓; honors branch protection (prepare pushes a normal PR with contributor creds; publish only tags) ✓; zip asset (Task 4) ✓; Vitest test for `set-version` (Task 2) ✓.
- **No repo secrets:** publish uses the automatic `GITHUB_TOKEN`; prepare is local. Nothing for an admin to provision.
- **0.x bump check:** `breaking_always_bump_major = false` + `features_always_bump_minor = true` yields feat/breaking→minor, fix→patch while 0.x, and breaking→major once ≥1.0.
- **Naming consistency:** `setVersion(version, files)` + `DEFAULT_FILES` exported by `set-version.mjs` (Task 2) are imported by `prepare.mjs` (Task 3) and the test — identical names.
