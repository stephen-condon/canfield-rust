# Changelog

All notable changes to this project are documented here.
## [0.1.0] - 2026-06-09

### Bug Fixes

- Add Copy to ZoneId, Eq to GameState
- Use bounds-safe get() in first_face_up_index_in_col
- Fan waste pile so draw-3 is visually distinct from draw-1
- Conceal underneath waste cards and drop tableau column outline

### Documentation

- Add README and CLAUDE.md

### Features

- Add core types — Card, GameState, Suit, ZoneId
- Port build_deck, shuffle_deck, new_game with 10 passing tests
- Port rank arithmetic, foundation/tableau validation, firstFaceUpIndex with 18 tests
- Port all move functions with 52 passing tests (full engine coverage)
- Implement JSON-based WASM bindings; build pkg to web/src/pkg
- Scaffold plain HTML/TS frontend with Vite, Vitest, Playwright
- Add localStorage api adapter with 9 passing tests
- Implement card rendering with 12 passing tests
- Implement game board UI, main menu, statistics, preferences
- Port GameBoard behavior tests as DOM tests (7 passing)
- Add E2E tests adapted from Electron Playwright suite (4 passing)
- Conventional-commit-driven releases via npm run release (#8)

### Miscellaneous

- Initialize Cargo workspace with engine + wasm crates
- All tests passing — 52 Rust engine + 28 web unit + 4 E2E
- Add pre-commit hook and document CI + change-doc policy (#5)
- Auto-install git hooks via npm prepare script (#6)

### Ci

- Add GitHub Actions workflow for rust, web, and wasm-sync (#2)
- Fix flaky wasm job and formalize WASM-up-to-date in DoD (#3)
- Build web and e2e against CI-built wasm, not committed binary (#4)
- Set least-privilege GITHUB_TOKEN permissions per job (#7)

