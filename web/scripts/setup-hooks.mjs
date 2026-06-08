#!/usr/bin/env node
//
// Installs the repo's shared git hooks by pointing core.hooksPath at the
// committed .githooks/ directory. Runs automatically via the "prepare" npm
// script on `npm install`, so contributors don't have to remember a manual
// step. Also runnable directly: `npm run prepare` (from web/).
//
// The value `.githooks` is stored verbatim in .git/config; git resolves it
// relative to the worktree root when running hooks, so this is correct even
// though this script runs from the web/ subdirectory.
//
// Safe to no-op: if there is no git work tree (e.g. CI installing from a
// packaged tarball, or git is unavailable), it exits 0 without failing the
// install.

import { execFileSync } from 'node:child_process'

// No shell: args are passed as an array, so nothing is interpolated.
function gitOutput(args) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
}

try {
  if (gitOutput(['rev-parse', '--is-inside-work-tree']) !== 'true') process.exit(0)
} catch {
  // git missing or not a repository — nothing to install.
  process.exit(0)
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' })
  console.log('✓ git hooks installed (core.hooksPath = .githooks)')
} catch {
  // Never block the install over hook setup; print the manual fallback.
  console.warn(
    '⚠ could not configure git hooks automatically. Install manually with:\n' +
      '    git config core.hooksPath .githooks'
  )
}
