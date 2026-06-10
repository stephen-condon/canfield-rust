# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Writing Style

Use **American English** throughout all code, comments, and documentation (e.g., "behavior" not "behaviour", "serialized" not "serialised", "color" not "colour").

## Documentation

**Any meaningful change must update the docs as part of the same change — not as a follow-up.** "Meaningful" means anything that alters behavior, architecture, commands, the build/CI pipeline, test counts, or developer workflow. Update the relevant file(s):

- **`README.md`** — user- and contributor-facing: setup, commands, architecture overview, game rules, testing, CI.
- **`CLAUDE.md`** (this file) — guidance for working in the repo: design constraints, invariants, workflow, Definition of Done.

If a change makes a statement in either file inaccurate (e.g., a test count, a command, a job name), fix it in the same commit. A PR that changes behavior without the corresponding doc update is incomplete.

## Commands

```bash
# From workspace root:
cargo test -p canfield-engine                   # Run all 52 Rust engine tests
cargo check                                     # Type-check all crates
wasm-pack build crates/wasm --target web \
  --out-dir ../../web/src/pkg                   # Rebuild WASM after engine changes

# From web/:
npm test                   # Vitest unit tests — run once (59 tests)
npm run test:watch         # Vitest in watch mode
npm run test:e2e           # Playwright E2E (4 tests, launches dev server)
npm run build              # Production build → web/dist/
npm run dev                # Dev server at http://localhost:5173
npm run release            # Cut a release — opens a version-bump PR (see Releasing)
npx tsc --noEmit           # TypeScript type-check only

# Hooks install automatically via `npm install` (web/); manual fallback:
git config core.hooksPath .githooks
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
- `src/card.ts` — `createCardElement(card, opts)` — the only DOM factory for card elements. Emits `card-dbl-click` and `card-drag-start` custom events that bubble up to the board. Also exports `createFoundationPlaceholder` / `createGlyphPlaceholder` — the faded watermarks shown inside empty piles (foundation base rank+suit, reserve 🃏, stock ↺, and a tableau ♦ hint shown only while the reserve is non-empty). Placeholders are `pointer-events: none` so they never intercept drops.
- `src/confetti.ts` — `startConfetti(canvas)` — dependency-free canvas confetti for the win overlay. Returns a handle whose `stop()` ends it; no-ops under `prefers-reduced-motion` or when the canvas has no 2D context.
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
- **Versioning via `npm run release`, not by hand.** The git tag `vX.Y.Z` is the source of truth for the app version. The `version` fields in `crates/*/Cargo.toml` and `web/package.json` are kept in lockstep by the release flow — never edit them manually. Run `npm run release` (from `web/`): it computes the next version from conventional commits via `git-cliff`/`cliff.toml`, opens a `release/vX.Y.Z` PR, and squash-merging that PR triggers the publish workflow. While on `0.x`, `feat`/breaking bump the minor and `fix` bumps the patch.

## Testing Requirements

- **Rust engine tests** must remain at 100% function coverage. Every new or changed engine function must ship with tests.
- **Web unit tests** must remain isolated: no real WASM execution, no real `localStorage`. Mock the `../pkg/canfield_wasm.js` module and `../api` module using `vi.mock`.
- **`vi.mock` hoisting**: Vitest hoists `vi.mock` calls above all variable declarations. Factory functions inside `vi.mock` cannot reference module-level `const` variables — inline all literal values directly into the factory.
- E2E tests (`e2e/`) exercise the live dev server (real WASM + real DOM) and are not a substitute for unit coverage.

## Continuous Integration

CI runs on every pull request and on pushes to `main`, defined in `.github/workflows/ci.yml`. Jobs:

| Job | Runs | Notes |
|---|---|---|
| **Rust (fmt, clippy, test)** | `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test -p canfield-engine` | `clippy` is `-D warnings`: any lint fails the build. |
| **WASM build (wasm32 target)** | `wasm-pack build`, then uploads `web/src/pkg/` as the `wasm-pkg` artifact | Builds the wasm from current source. |
| **Web (tsc, unit tests, build)** | downloads `wasm-pkg` → `tsc --noEmit`, `npm test`, `npm run build` | `needs: wasm-build`. |
| **Web E2E (Playwright)** | downloads `wasm-pkg` → `npm run test:e2e` | `needs: wasm-build`. |

CodeQL analysis (actions / JavaScript-TypeScript / Rust) also runs as a separate workflow.

**Release — publish** (`.github/workflows/release-publish.yml`) is a separate workflow that runs on every push to `main`. It is a no-op unless `web/package.json`'s version has no matching tag yet (i.e. a `release/` PR was just squash-merged); then it builds the bundle, tags `vX.Y.Z`, and creates the GitHub Release with `canfield-vX.Y.Z-web.zip`. It uses only the automatic `GITHUB_TOKEN` and is not a required PR check. See the release flow in the Key Design Constraints.

**WASM is built from source in CI, not trusted from the commit.** `web` and `e2e` download the `wasm-pkg` artifact and overwrite `web/src/pkg/` before building/testing, so the production bundle and E2E always run against wasm compiled from the current engine source — a stale or tampered committed binary cannot reach the build. `wasm-pack` output is **not** byte-reproducible across machines, so CI does **not** byte-compare the committed `web/src/pkg/`; keeping it fresh is a local Definition-of-Done step instead.

`main` is protected by a ruleset: squash-merge only, branches must be up to date, and all four jobs above are required status checks.

### Pre-commit hook

`.githooks/pre-commit` runs the fast CI gates locally so you don't push a commit that fails CI. It installs automatically: running `npm install` in `web/` triggers the `prepare` script (`scripts/setup-hooks.mjs`), which sets `core.hooksPath` to `.githooks`. The script no-ops safely when there is no git work tree (e.g. CI tarball installs). Manual fallback:

```bash
git config core.hooksPath .githooks
```

It is **path-aware** — only checks relevant to the staged files run:

- staged `crates/**` → `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test -p canfield-engine` (and a reminder to rebuild `web/src/pkg/` if `engine`/`wasm` changed).
- staged `web/**` → `npx tsc --noEmit`, `npm test`.

It deliberately skips the slow jobs (`wasm-pack build`, `npm run build`, Playwright E2E, CodeQL) — those run in CI. Bypass a single commit with `git commit --no-verify`.

## Definition of Done

The `.githooks/pre-commit` hook automates the fast subset of this list (steps 1, 2, 4 and the Rust lint/format gates) for the files you staged. Installing it (`git config core.hooksPath .githooks`) is the easiest way to stay in sync; the full list still applies before merging.

Before every commit:
1. `cargo test -p canfield-engine` — all Rust tests pass; `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets -- -D warnings` are clean (both are CI gates).
2. `cd web && npm test` — all 59 web unit tests pass.
3. **Ensure WASM is up to date.** If anything under `crates/engine/` or `crates/wasm/` changed, rebuild and commit the regenerated package:
   ```bash
   wasm-pack build crates/wasm --target web --out-dir ../../web/src/pkg
   git diff --exit-code web/src/pkg/   # must be clean after rebuild
   ```
   A non-empty diff after rebuilding means stale artifacts were about to be committed — stage `web/src/pkg/` and commit it alongside the engine change. Run this check locally: `wasm-pack` output is only byte-reproducible on the same machine, so this is enforced here rather than in CI.
4. `npx tsc --noEmit` — no TypeScript errors.

Before merging:
5. `cd web && npm run test:e2e` — all 4 E2E tests pass.
6. `cd web && npm run build` — production build succeeds cleanly.

## Git Workflow

- Use **Conventional Commits** prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.
- Keep commits atomic — one logical change per commit.
- Branch from `main`. Open a PR and merge via squash when all checks pass.
- Never force-push.
