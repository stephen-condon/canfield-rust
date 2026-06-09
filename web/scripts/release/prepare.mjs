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
