# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Writing Style

Use **American English** throughout all code, comments, and documentation (e.g., "behavior" not "behaviour", "serialized" not "serialised", "color" not "colour").

## Commands

```bash
# From workspace root:
cargo test -p canfield-engine                   # Run all 52 Rust engine tests
cargo check                                     # Type-check all crates
wasm-pack build crates/wasm --target web \
  --out-dir ../../web/src/pkg                   # Rebuild WASM after engine changes

# From web/:
npm test                   # Vitest unit tests — run once (28 tests)
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright E2E (4 tests, launches dev server)
npm run build              # Production build → web/dist/
npm run dev                # Dev server at http://localhost:5173
npx tsc --noEmit           # TypeScript type-check only
```

**Important:** Any change to `crates/engine/` or `crates/wasm/` requires a `wasm-pack build` run before the web frontend will pick up the change.

## Architecture

This is a **Cargo workspace** with three layers:

### 1. Engine crate (`crates/engine/`)

Pure Rust library. Zero WASM, zero UI deps. All game logic lives here.

- `src/types.rs` — `Suit`, `Color`, `Rank` (type alias `u8`), `Card`, `ZoneId`, `GameState`. Read this first when touching the engine.
- `src/engine.rs` — All public move functions + 52 unit tests. Key functions:
  - `new_game(draw_count: u8) -> GameState`
  - `draw_from_stock(&GameState) -> Option<GameState>`
  - `redeal_stock(&GameState) -> Option<GameState>`
  - `move_to_foundation(&GameState, ZoneId, usize) -> Option<GameState>`
  - `move_tableau_to_tableau(&GameState, usize, usize, usize) -> Option<GameState>`
  - `move_to_tableau(&GameState, ZoneId, usize) -> Option<GameState>`
  - `auto_move_to_foundation(&GameState, ZoneId) -> Option<GameState>`
  - `check_win(&GameState) -> bool`

All move functions are **pure**: they accept `&GameState` and return `Option<GameState>`. `None` means the move is illegal. They never mutate in place. State is cloned internally via `GameState: Clone`.

### 2. WASM crate (`crates/wasm/`)

Thin `wasm-bindgen` wrapper. Every exported function takes JSON strings and returns `Option<String>` (which becomes `string | undefined` in TypeScript). Zone IDs are passed as strings (`"waste"`, `"reserve"`, `"foundation_0"`, `"tableau_2"`, etc.) and parsed by `ZoneId::parse`.

`getrandom = { features = ["js"] }` is a required dependency — without it `rand` cannot compile for `wasm32-unknown-unknown`.

After any change to the engine or wasm crate, regenerate the package:
```bash
wasm-pack build crates/wasm --target web --out-dir ../../web/src/pkg
```

The generated `web/src/pkg/` files are committed to git (the `.gitignore` inside `pkg/` is force-overridden with `git add -f`).

### 3. Web frontend (`web/`)

Plain TypeScript + Vite. No framework. Key files:

- `src/main.ts` — Calls `await init()` to initialize the WASM module, then `renderMainMenu()`.
- `src/board.ts` — All screen rendering: `renderMainMenu`, `renderGameBoard`, `renderStatistics`, `renderPreferences`. Also owns the game timer (`setInterval`).
- `src/card.ts` — `createCardElement(card, opts)` — the only DOM factory for card elements. Emits `card-dbl-click` and `card-drag-start` custom events that bubble up to the board.
- `src/api.ts` — `localStorage` adapter. Mirrors the `window.api` IPC interface from the original Electron app. All persistence goes through this module.
- `src/types.ts` — TypeScript mirror of the Rust types. Used for IDE support only; the canonical source of truth is `crates/engine/src/types.rs`.

**innerHTML policy**: Use `innerHTML` only for static HTML structure. Populate dynamic values (user-originated data, stats counts, preferences) via `textContent` or DOM property assignment after rendering the structure. Never interpolate untrusted strings directly into `innerHTML`.

## Key Design Constraints

- **No undo.** The engine has no undo stack by design.
- **Explicit redeal.** `redeal_stock` only fires when the user clicks an empty stock pile. Never triggered automatically.
- **Auto-fill empty tableau.** `auto_fill_empty_tableau` runs inside every engine move function that can create an empty tableau column. It is not optional and not configurable.
- **Foundation suit assignment.** `foundation_suits[i]` is set at deal time and immutable for the life of the game. `can_place_on_foundation` hard-rejects any card whose suit doesn't match.
- **Rank wrapping.** Both foundations and tableau use wrapping rank arithmetic: King→Ace on foundations, Ace→King on tableau (via `next_rank` / `prev_rank`).
- **Draw order invariant.** After a full draw+redeal cycle, the stock card order is identical to the initial order. Two tests (`stock_order_preserved_after_cycle_draw1/3`) verify this.

## Testing Requirements

- **Rust engine tests** must remain at 100% function coverage. Every new or changed engine function must ship with tests.
- **Web unit tests** must remain isolated: no real WASM execution, no real `localStorage`. Mock the `../pkg/canfield_wasm.js` module and `../api` module using `vi.mock`.
- **`vi.mock` hoisting**: Vitest hoists `vi.mock` calls above all variable declarations. Factory functions inside `vi.mock` cannot reference module-level `const` variables — inline all literal values directly into the factory.
- E2E tests (`e2e/`) exercise the live dev server (real WASM + real DOM) and are not a substitute for unit coverage.

## Definition of Done

Before every commit:
1. `cargo test -p canfield-engine` — all Rust tests pass.
2. `cd web && npm test` — all 28 web unit tests pass.
3. If WASM-facing code changed, run `wasm-pack build` and include the updated `web/src/pkg/` files in the commit.
4. `npx tsc --noEmit` — no TypeScript errors.

Before merging:
5. `cd web && npm run test:e2e` — all 4 E2E tests pass.
6. `cd web && npm run build` — production build succeeds cleanly.

## Git Workflow

- Use **Conventional Commits** prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.
- Keep commits atomic — one logical change per commit.
- Branch from `main`. Open a PR and merge via squash when all checks pass.
- Never force-push.
