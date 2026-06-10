# Feature comparison: predecessor vs. this version

This document compares the original Canfield implementation at
[`github.com/stephen-condon/canfield`](https://github.com/stephen-condon/canfield)
against this Rust + WASM + TypeScript rewrite, and records which features were
migrated, which are being migrated now, and which are intentionally absent.

## Correction: the predecessor is Electron + Vue, not Go

The original repo is an **Electron + Vue 3 + TypeScript** desktop app
(`canfield-solitaire`, v1.1.0). There is **no Go code** in it. All game logic is
pure TypeScript in the Electron renderer (`src/renderer/src/engine/CanfieldEngine.ts`);
the Electron main process only handles persistence (`electron-store`) and native
file dialogs over IPC. This rewrite mirrors that app's `window.api` IPC surface
in `web/src/api.ts` (backed by `localStorage` instead of `electron-store`).

## Architecture

| Aspect | Predecessor (Electron/Vue) | This version (Rust/WASM/TS) |
|---|---|---|
| Game logic | Pure TypeScript engine in the renderer | Pure Rust engine (`crates/engine`), compiled to WASM |
| UI | Vue 3 SPA + `vue-router` | Plain TypeScript + Vite, no framework |
| Persistence | `electron-store` via IPC | `localStorage` via `web/src/api.ts` |
| Asset import | Electron native file dialog | (web) file `<input>` → data URL |
| Distribution | Electron desktop (win/mac/linux) | Static web bundle |

## Feature matrix

Legend: ✅ present · ❌ absent · ⚠️ partial

| Feature | Predecessor | This version (before) | Status / action |
|---|:---:|:---:|---|
| Foundations build up by suit (wrap K→A) | ✅ | ✅ | Parity |
| Tableau builds down, alternating color (wrap A→K) | ✅ | ✅ | Parity |
| Draw 1 / Draw 3 | ✅ | ✅ | Parity |
| Redeal (unlimited, on empty-stock click) | ✅ | ✅ | Parity |
| Auto-fill empty tableau from reserve | ✅ | ✅ | Parity |
| Win detection (52 on foundations) | ✅ | ✅ | Parity |
| Multi-card tableau→tableau drag | ✅ | ✅ | Parity |
| Waste/reserve → foundation drag & dbl-click | ✅ | ✅ | Parity |
| **Tableau → foundation drag** | ✅ | ❌ **broken** | **Fixed (this PR)** |
| **Tableau-top dbl-click → foundation** | ✅ | ❌ broken | **Fixed (this PR)** |
| **Empty foundation rank+suit watermark** | ✅ | ❌ | Plan: PR2 |
| **Empty reserve 🃏 / stock ↺ icons** | ✅ | ❌ | Plan: PR2 |
| **Tableau ♦ hint (while reserve non-empty)** | ✅ | ❌ | Plan: PR2 |
| **Drop-target highlighting** | ✅ | ⚠️ CSS exists, never wired | Plan: PR3 |
| **Win confetti animation** | ✅ | ❌ | Plan: PR4 |
| **Custom card-back / background image** | ✅ (native dialog) | ⚠️ `backgroundPath` vestigial | Plan: PR5 (web-adapted upload) |
| Single auto-save slot + Resume | ✅ | ✅ | Parity |
| Statistics: games / wins / losses / win% | ✅ | ✅ | Parity |
| Surrender flow (confirm + post-surrender overlay) | ✅ | ✅ | Parity |
| Move counter + game timer | ✅ | ✅ | Parity |

## Intentionally absent in BOTH (not regressions)

These were never implemented in the predecessor and are out of scope unless
added as net-new features:

- Scoring of any kind (no standard score, no Vegas mode)
- Undo / redo (this rewrite has no undo stack by design)
- Auto-complete / "send all to foundations"
- A move-hint system
- Sound effects / music
- In-app Help/Rules and About screens (predecessor had rules only as a
  markdown file, not surfaced in the UI)

## Electron-only capabilities

- The predecessor's image import used a **native OS file dialog** and stored
  `file://` paths. A pure web build cannot open a native dialog, so PR5 adapts
  this to an in-page file `<input>` that reads the image as a data URL and
  persists it in `localStorage`.
