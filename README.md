# Canfield Solitaire

A Canfield solitaire game built as a Cargo workspace: pure Rust game engine compiled to WebAssembly, consumed by a plain HTML/TypeScript frontend running in any browser.

## What is Canfield?

Canfield is a solitaire card game dealt from a 52-card deck. One card is dealt face-up to the first foundation slot and its rank becomes the **base rank** — all four foundations must be built up from that rank, in suit, wrapping King→Ace as needed. Thirteen cards form the **reserve** (face-down stack, top card exposed). Four cards go to the **tableau**, one per column. The remaining 34 cards are the **stock**, drawn three at a time (or one in Draw 1 mode).

The goal is to move all 52 cards onto the foundations.

## Architecture

```
canfield/
├── Cargo.toml              workspace manifest
├── crates/
│   ├── engine/             pure Rust library — no WASM or UI deps
│   │   └── src/
│   │       ├── types.rs    Card, GameState, Suit, Rank, ZoneId
│   │       └── engine.rs   all move functions + 52 unit tests
│   └── wasm/               thin wasm-bindgen wrapper
│       └── src/lib.rs      JSON-in / JSON-out exported functions
└── web/                    plain HTML + TypeScript frontend
    ├── src/
    │   ├── main.ts         WASM init → renderMainMenu
    │   ├── board.ts        all screen rendering (menu, game, stats, prefs)
    │   ├── card.ts         DOM card element factory
    │   ├── confetti.ts     canvas confetti burst for the win overlay
    │   ├── api.ts          localStorage adapter (replaces electron-store)
    │   └── types.ts        TypeScript mirror of Rust types
    ├── src/tests/          Vitest unit tests (jsdom)
    └── e2e/                Playwright end-to-end tests
```

Game state crosses the WASM boundary as serialized JSON strings. The engine is a pure state machine: every move function accepts a `&GameState` and returns `Option<GameState>` — `None` means an illegal move.

## Prerequisites

- **Rust** (stable, 2021 edition) — [rustup.rs](https://rustup.rs)
- **wasm-pack** — `cargo install wasm-pack`
- **Node.js** 18+ and npm
- The `wasm32-unknown-unknown` target — `rustup target add wasm32-unknown-unknown`

## Quick Start

```bash
# 1. Build the WASM package (run from workspace root)
wasm-pack build crates/wasm --target web --out-dir ../../web/src/pkg

# 2. Install frontend dependencies
cd web && npm install

# 3. Start the dev server
npm run dev
# → http://localhost:5173
```

## Commands

### Rust / Engine

```bash
# From workspace root:
cargo test -p canfield-engine        # Run all 52 engine unit tests
cargo check                          # Type-check all crates

# Rebuild WASM after engine changes:
wasm-pack build crates/wasm --target web --out-dir ../../web/src/pkg
```

### Web Frontend

```bash
# From web/:
npm test                   # Vitest unit tests (50 tests, jsdom, run once)
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright E2E tests (4 tests, launches dev server)
npm run build              # tsc + Vite production build → dist/
npm run dev                # Vite dev server with HMR
npm run preview            # Serve the production build locally
npm run release            # Cut a release: compute version + open a PR (see Releasing)
```

## Testing

| Suite | Command | Count |
|---|---|---|
| Rust engine unit tests | `cargo test -p canfield-engine` | 52 |
| Web unit tests (Vitest/jsdom) | `cd web && npm test` | 50 |
| E2E tests (Playwright/Chromium) | `cd web && npm run test:e2e` | 4 |

All tests must pass before committing. Web unit tests are isolated: they mock the WASM module and the `api` localStorage adapter — no real WASM execution or browser storage in unit tests.

## Continuous Integration

Every pull request and push to `main` runs `.github/workflows/ci.yml`:

| Job | Checks |
|---|---|
| **Rust** | `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test -p canfield-engine` |
| **WASM build** | `wasm-pack build` from source; uploads the package as an artifact |
| **Web** | downloads that artifact, then `tsc --noEmit`, `npm test`, `npm run build` |
| **E2E** | downloads that artifact, then Playwright |

The web and E2E jobs run against **WASM built from source in CI**, not the committed `web/src/pkg/` binary, so the build can never ship a stale or tampered artifact. CodeQL analysis runs separately. `main` requires all four jobs to pass and squash-merges only.

### Pre-commit hook

A path-aware hook runs the fast CI gates locally before each commit. It installs automatically when you run `npm install` in `web/` (via the `prepare` script). To install it manually:

```bash
git config core.hooksPath .githooks
```

It runs the Rust gates (`fmt`, `clippy`, `cargo test`) when `crates/**` is staged and the web gates (`tsc`, `npm test`) when `web/**` is staged. Slow steps (wasm/production build, E2E) are left to CI. Bypass with `git commit --no-verify`.

## Releasing

Releases are driven by [Conventional Commits](https://www.conventionalcommits.org/) and [`git-cliff`](https://git-cliff.org). The version is a single number covering both web and Rust changes, and the **git tag (`vX.Y.Z`) is the source of truth** — never hand-edit the `version` fields in `crates/*/Cargo.toml` or `web/package.json`; the release flow stamps them.

There are **no repo secrets to configure**. You need `git`, Node, an authenticated [`gh`](https://cli.github.com/) CLI, and `cargo` (the `git-cliff` binary is fetched automatically via `npx`).

To cut a release, from `web/`:

```bash
npm run release               # auto: next version computed from commits
npm run release -- minor      # or force patch | minor | major
npm run release -- 1.4.0      # or pick an explicit version
npm run release -- --dry-run  # preview the computed version, change nothing
```

The script computes the next version from the commits since the last tag (`feat`/breaking → minor, `fix` → patch while on `0.x`; from `1.0.0` on, breaking → major), bumps every version field + `Cargo.lock` + `CHANGELOG.md` on a `release/vX.Y.Z` branch, pushes it **with your credentials so the required CI checks run**, and opens a PR. Review it; once the four CI checks pass, **squash-merge** it.

Merging triggers the **Release — publish** workflow (`.github/workflows/release-publish.yml`), which builds the wasm + web bundle, tags the commit `vX.Y.Z`, and creates the GitHub Release with `canfield-vX.Y.Z-web.zip` attached. It is a no-op on any push whose version already has a tag.

The first release has no prior tag, so pass an explicit version for it (`npm run release -- 0.2.0`).

## Game Rules Implemented

- **Foundation**: built up in suit from the base rank, wrapping King→Ace.
- **Tableau**: columns built down in alternating colors, wrapping Ace→King. Empty columns are automatically filled from the reserve.
- **Reserve**: thirteen cards dealt face-down; top card always exposed. Automatically refills empty tableau columns after every move.
- **Stock / Waste**: draw 1 or draw 3 per click. The waste pile may be redealt into the stock exactly once per cycle (order preserved).
- **Win condition**: all 52 cards on the foundations. Winning triggers a canvas confetti burst (skipped when the OS requests reduced motion).
- **No undo**: by design.

Empty piles show faded watermarks: each empty foundation shows the base rank and the suit it accepts (e.g. "J♥"), the empty reserve and stock show 🃏 and ↺, and an empty tableau column shows a ♦ hint while the reserve still has cards to auto-fill it. While dragging a card, the foundation or tableau zone under the cursor is highlighted as a valid drop target.

## Persistence

All game data is stored in `localStorage` under three keys:

| Key | Contents |
|---|---|
| `canfield:savedGame` | JSON-serialized `GameState` (resumed on next visit) |
| `canfield:preferences` | `drawCount` (1 or 3), `backgroundPath` |
| `canfield:statistics` | `gamesPlayed`, `wins`, `losses` |
