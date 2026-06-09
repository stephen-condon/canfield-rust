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
