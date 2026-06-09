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
