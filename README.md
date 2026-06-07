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
npm test                   # Vitest unit tests (28 tests, jsdom, run once)
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright E2E tests (4 tests, launches dev server)
npm run build              # tsc + Vite production build → dist/
npm run dev                # Vite dev server with HMR
npm run preview            # Serve the production build locally
```

## Testing

| Suite | Command | Count |
|---|---|---|
| Rust engine unit tests | `cargo test -p canfield-engine` | 52 |
| Web unit tests (Vitest/jsdom) | `cd web && npm test` | 28 |
| E2E tests (Playwright/Chromium) | `cd web && npm run test:e2e` | 4 |

All tests must pass before committing. Web unit tests are isolated: they mock the WASM module and the `api` localStorage adapter — no real WASM execution or browser storage in unit tests.

## Game Rules Implemented

- **Foundation**: built up in suit from the base rank, wrapping King→Ace.
- **Tableau**: columns built down in alternating colors, wrapping Ace→King. Empty columns are automatically filled from the reserve.
- **Reserve**: thirteen cards dealt face-down; top card always exposed. Automatically refills empty tableau columns after every move.
- **Stock / Waste**: draw 1 or draw 3 per click. The waste pile may be redealt into the stock exactly once per cycle (order preserved).
- **Win condition**: all 52 cards on the foundations.
- **No undo**: by design.

## Persistence

All game data is stored in `localStorage` under three keys:

| Key | Contents |
|---|---|
| `canfield:savedGame` | JSON-serialized `GameState` (resumed on next visit) |
| `canfield:preferences` | `drawCount` (1 or 3), `backgroundPath` |
| `canfield:statistics` | `gamesPlayed`, `wins`, `losses` |
