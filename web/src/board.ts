import {
  new_game,
  draw_from_stock,
  redeal_stock,
  move_to_foundation,
  move_tableau_to_tableau,
  move_to_tableau,
  auto_move_to_foundation,
} from './pkg/canfield_wasm.js'
import { createCardElement, createFoundationPlaceholder, createGlyphPlaceholder } from './card'
import { startConfetti, type ConfettiHandle } from './confetti'
import { api } from './api'
import type { GameState, Card, Preferences } from './types'

const app = (): HTMLElement => document.getElementById('app')!

// Apply the user's chosen background and card-back images. Both are stored as
// data URLs in preferences; we assign them via style/CSS-variable rather than
// innerHTML so user-supplied strings never become markup. Null falls back to
// the built-in felt / striped card back defined in the stylesheet.
export function applyTheme(prefs: Preferences): void {
  const body = document.body
  if (prefs.backgroundPath) {
    body.style.backgroundImage = `url("${prefs.backgroundPath}")`
    body.style.backgroundSize = 'cover'
    body.style.backgroundPosition = 'center'
  } else {
    body.style.backgroundImage = ''
    body.style.backgroundSize = ''
    body.style.backgroundPosition = ''
  }
  if (prefs.cardBackPath) {
    body.style.setProperty('--card-back-image', `url("${prefs.cardBackPath}")`)
    body.classList.add('has-custom-card-back')
  } else {
    body.style.removeProperty('--card-back-image')
    body.classList.remove('has-custom-card-back')
  }
}

function parseState(json: string): GameState {
  return JSON.parse(json) as GameState
}

// ---- Timer ----

let timerInterval: ReturnType<typeof setInterval> | null = null
let elapsedMs = 0

function startTimer(onTick: (ms: number) => void): void {
  stopTimer()
  const start = Date.now() - elapsedMs
  timerInterval = setInterval(() => {
    elapsedMs = Date.now() - start
    onTick(elapsedMs)
  }, 1000)
}

export function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ---- Main Menu ----

export function renderMainMenu(): void {
  stopTimer()
  applyTheme(api.getPreferences())
  const savedGame = api.getSavedGame()
  app().innerHTML = `
    <div id="screen-menu" class="screen active">
      <div class="menu-card">
        <h1>Canfield</h1>
        <button id="btn-new-game">New Game</button>
        <button id="btn-resume" class="btn-secondary" style="display:none">Resume Game</button>
        <button id="btn-statistics" class="btn-secondary">Statistics</button>
        <button id="btn-preferences" class="btn-secondary">Preferences</button>
      </div>
    </div>`

  if (savedGame) {
    document.getElementById('btn-resume')!.style.display = ''
  }

  document.getElementById('btn-new-game')!.addEventListener('click', () => {
    const prefs = api.getPreferences()
    const stateJson = new_game(prefs.drawCount)
    api.setSavedGame(stateJson)
    elapsedMs = 0
    renderGameBoard(stateJson)
  })

  document.getElementById('btn-resume')?.addEventListener('click', () => {
    if (!savedGame) return
    const state = parseState(savedGame)
    elapsedMs = state.elapsedMs
    renderGameBoard(savedGame)
  })

  document.getElementById('btn-statistics')!.addEventListener('click', renderStatistics)
  document.getElementById('btn-preferences')!.addEventListener('click', renderPreferences)
}

// ---- Game Board ----

export function renderGameBoard(stateJson: string): void {
  let state = parseState(stateJson)
  applyTheme(api.getPreferences())

  function updateDOM(): void {
    const reserveEl = document.getElementById('zone-reserve')!
    reserveEl.innerHTML = ''
    if (state.reserve.length > 0) {
      reserveEl.appendChild(
        createCardElement(state.reserve[state.reserve.length - 1], { draggable: true }),
      )
    } else {
      reserveEl.appendChild(createGlyphPlaceholder('reserve', '🃏'))
    }

    for (let i = 0; i < 4; i++) {
      const fEl = document.getElementById(`zone-foundation-${i}`)!
      fEl.innerHTML = ''
      if (state.foundations[i].length > 0) {
        fEl.appendChild(createCardElement(state.foundations[i][state.foundations[i].length - 1]))
      } else {
        fEl.appendChild(createFoundationPlaceholder(state.baseRank, state.foundationSuits[i]))
      }
    }

    for (let col = 0; col < 4; col++) {
      const tEl = document.getElementById(`zone-tableau-${col}`)!
      tEl.innerHTML = ''
      state.tableau[col].forEach((card, idx) => {
        const cardEl = createCardElement(card, { draggable: card.faceUp })
        cardEl.style.top = `${idx * 28}px`
        cardEl.style.position = 'absolute'
        cardEl.dataset.colIndex = String(idx)
        tEl.appendChild(cardEl)
      })
      // While the reserve still has cards, an empty column will auto-fill from
      // it on the next move — hint that with a faded glyph.
      if (state.tableau[col].length === 0 && state.reserve.length > 0) {
        tEl.appendChild(createGlyphPlaceholder('tableau', '♦'))
      }
    }

    const stockEl = document.getElementById('zone-stock')!
    stockEl.innerHTML = ''
    if (state.stock.length > 0) {
      const dummy: Card = { id: 'stock', suit: 'spades', rank: 1, faceUp: false }
      stockEl.appendChild(createCardElement(dummy))
    } else {
      stockEl.appendChild(createGlyphPlaceholder('stock', '↺'))
    }

    const wasteEl = document.getElementById('waste-slot')!
    wasteEl.innerHTML = ''
    const fanCount = Math.min(3, state.waste.length)
    const fanStart = state.waste.length - fanCount
    for (let i = fanStart; i < state.waste.length; i++) {
      const isTop = i === state.waste.length - 1
      const cardEl = createCardElement(state.waste[i], { draggable: isTop })
      cardEl.style.position = 'absolute'
      cardEl.style.left = `${(i - fanStart) * 24}px`
      wasteEl.appendChild(cardEl)
    }

    document.getElementById('hud-moves')!.textContent = String(state.moves)

    if (state.won) showWinOverlay()
  }

  function applyMove(newStateJson: string | undefined): void {
    if (!newStateJson) return
    state = parseState(newStateJson)
    state.elapsedMs = elapsedMs
    api.setSavedGame(JSON.stringify(state))
    updateDOM()
  }

  let confetti: ConfettiHandle | null = null

  function showWinOverlay(): void {
    stopTimer()
    api.recordWin()
    api.setSavedGame(null)
    const overlay = document.getElementById('overlay-win')!
    overlay.style.display = 'flex'
    document.getElementById('win-moves')!.textContent = String(state.moves)
    document.getElementById('win-time')!.textContent = formatTime(elapsedMs)
    confetti = startConfetti(document.getElementById('win-confetti') as HTMLCanvasElement)
  }

  function dismissWinOverlay(): void {
    confetti?.stop()
    confetti = null
  }

  function findZoneForCard(cardId: string): string | null {
    if (state.waste.length > 0 && state.waste[state.waste.length - 1].id === cardId)
      return 'waste'
    if (state.reserve.length > 0 && state.reserve[state.reserve.length - 1].id === cardId)
      return 'reserve'
    return null
  }

  // Resolve the source zone for any single card that can move to a foundation:
  // the waste/reserve top, or a tableau column's top (last) card. A buried
  // tableau card has no single-card foundation source and returns null.
  function findSourceZone(cardId: string): string | null {
    const zone = findZoneForCard(cardId)
    if (zone) return zone
    for (let col = 0; col < 4; col++) {
      const pile = state.tableau[col]
      if (pile.length > 0 && pile[pile.length - 1].id === cardId) return `tableau_${col}`
    }
    return null
  }

  function findTableauCol(cardId: string): number | null {
    for (let col = 0; col < 4; col++) {
      if (state.tableau[col].some((c) => c.id === cardId)) return col
    }
    return null
  }

  app().innerHTML = `
    <div id="screen-game" class="screen active">
      <div class="hud">
        <span class="hud-stat">Moves <span id="hud-moves">0</span></span>
        <span class="hud-stat">Time <span id="hud-time">0:00</span></span>
        <span class="hud-spacer"></span>
        <button id="btn-surrender">Surrender</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
      <div class="board">
        <div id="zone-reserve" class="zone reserve-slot" style="grid-column:1;grid-row:1"></div>
        <div id="zone-stock" class="zone stock-slot" style="grid-column:2;grid-row:1"></div>
        <div id="waste-slot" class="zone waste-slot" style="grid-column:3;grid-row:1"></div>
        ${[0, 1, 2, 3].map((i) => `<div id="zone-foundation-${i}" class="zone foundation-slot" data-foundation="${i}" style="grid-column:${5 + i};grid-row:1"></div>`).join('')}
        ${[0, 1, 2, 3].map((i) => `<div id="zone-tableau-${i}" class="zone tableau-col" data-col="${i}" style="grid-column:${5 + i};grid-row:2;position:relative"></div>`).join('')}
      </div>
      <div id="overlay-surrender" style="display:none" class="overlay">
        <p>Surrender this game?</p>
        <button id="btn-confirm-surrender">Surrender</button>
        <button id="btn-keep-playing">Keep Playing</button>
      </div>
      <div id="overlay-post-surrender" style="display:none" class="overlay">
        <p>Game over.</p>
        <button id="btn-new-game-after">New Game</button>
        <button id="btn-main-menu-after">Main Menu</button>
      </div>
      <div id="overlay-win" style="display:none" class="overlay">
        <canvas id="win-confetti" class="confetti-canvas"></canvas>
        <h2>You Won!</h2>
        <p>Moves: <span id="win-moves"></span></p>
        <p>Time: <span id="win-time"></span></p>
        <button id="btn-play-again">Play Again</button>
        <button id="btn-main-menu-win">Main Menu</button>
      </div>
    </div>`

  // Stock click
  document.getElementById('zone-stock')!.addEventListener('click', () => {
    applyMove(draw_from_stock(JSON.stringify(state)) ?? redeal_stock(JSON.stringify(state)))
  })

  // Highlight a drop zone while a card hovers it. dragover fires continuously,
  // so it re-asserts the class even if a spurious dragleave fires when the
  // cursor passes over a child card element.
  function wireDropHighlight(el: HTMLElement): void {
    el.addEventListener('dragover', (e) => {
      e.preventDefault()
      el.classList.add('drop-active')
    })
    el.addEventListener('dragleave', () => el.classList.remove('drop-active'))
  }

  function clearDropHighlights(): void {
    document
      .querySelectorAll('.zone.drop-active')
      .forEach((el) => el.classList.remove('drop-active'))
  }

  // Foundation drop targets
  for (let i = 0; i < 4; i++) {
    const fEl = document.getElementById(`zone-foundation-${i}`)!
    wireDropHighlight(fEl)
    fEl.addEventListener('drop', (e) => {
      e.preventDefault()
      clearDropHighlights()
      const cardId = e.dataTransfer?.getData('text/plain') ?? ''
      const zone = findSourceZone(cardId)
      if (zone) applyMove(move_to_foundation(JSON.stringify(state), zone, i))
    })
  }

  // Tableau drop targets
  for (let col = 0; col < 4; col++) {
    const tEl = document.getElementById(`zone-tableau-${col}`)!
    wireDropHighlight(tEl)
    tEl.addEventListener('drop', (e) => {
      clearDropHighlights()
      e.preventDefault()
      const cardId = e.dataTransfer?.getData('text/plain') ?? ''
      const fromCol = findTableauCol(cardId)
      if (fromCol !== null) {
        const fromIndex = state.tableau[fromCol].findIndex((c) => c.id === cardId)
        applyMove(move_tableau_to_tableau(JSON.stringify(state), fromCol, fromIndex, col))
      } else {
        const zone = findZoneForCard(cardId)
        if (zone) applyMove(move_to_tableau(JSON.stringify(state), zone, col))
      }
    })
  }

  // A drag released outside any zone still needs the highlight cleared.
  app().addEventListener('dragend', clearDropHighlights)

  // Double-click → auto move to foundation
  app().addEventListener('card-dbl-click', (e) => {
    const card = (e as CustomEvent<Card>).detail
    const zone = findSourceZone(card.id)
    if (zone) applyMove(auto_move_to_foundation(JSON.stringify(state), zone))
  })

  // Surrender flow
  document.getElementById('btn-surrender')!.addEventListener('click', () => {
    document.getElementById('overlay-surrender')!.style.display = 'flex'
  })

  document.getElementById('btn-keep-playing')!.addEventListener('click', () => {
    document.getElementById('overlay-surrender')!.style.display = 'none'
  })

  document.getElementById('btn-confirm-surrender')!.addEventListener('click', () => {
    stopTimer()
    api.recordLoss()
    api.setSavedGame(null)
    document.getElementById('overlay-surrender')!.style.display = 'none'
    document.getElementById('overlay-post-surrender')!.style.display = 'flex'
  })

  document.getElementById('btn-new-game-after')!.addEventListener('click', () => {
    const prefs = api.getPreferences()
    const newStateJson = new_game(prefs.drawCount)
    elapsedMs = 0
    api.setSavedGame(newStateJson)
    renderGameBoard(newStateJson)
  })

  document.getElementById('btn-main-menu-after')!.addEventListener('click', renderMainMenu)

  document.getElementById('btn-play-again')!.addEventListener('click', () => {
    dismissWinOverlay()
    const prefs = api.getPreferences()
    const newStateJson = new_game(prefs.drawCount)
    elapsedMs = 0
    api.setSavedGame(newStateJson)
    renderGameBoard(newStateJson)
  })

  document.getElementById('btn-main-menu-win')!.addEventListener('click', () => {
    dismissWinOverlay()
    renderMainMenu()
  })
  document.getElementById('btn-menu')!.addEventListener('click', renderMainMenu)

  startTimer((ms) => {
    const el = document.getElementById('hud-time')
    if (el) el.textContent = formatTime(ms)
  })

  updateDOM()
}

// ---- Statistics ----

function renderStatistics(): void {
  const stats = api.getStatistics()
  const winPct =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0

  app().innerHTML = `
    <div id="screen-stats" class="screen active">
      <div class="menu-card">
        <h2>Statistics</h2>
        <div class="stat-value">Games Played <span id="stat-played"></span></div>
        <div class="stat-value">Wins <span id="stat-wins"></span></div>
        <div class="stat-value">Losses <span id="stat-losses"></span></div>
        <div class="stat-value">Win % <span id="stat-pct"></span></div>
        <button id="btn-reset-stats">Reset Statistics</button>
        <button id="btn-back-stats">Back</button>
      </div>
    </div>`

  document.getElementById('stat-played')!.textContent = String(stats.gamesPlayed)
  document.getElementById('stat-wins')!.textContent = String(stats.wins)
  document.getElementById('stat-losses')!.textContent = String(stats.losses)
  document.getElementById('stat-pct')!.textContent = `${winPct}%`

  document.getElementById('btn-reset-stats')!.addEventListener('click', () => {
    api.resetStatistics()
    renderStatistics()
  })
  document.getElementById('btn-back-stats')!.addEventListener('click', renderMainMenu)
}

// ---- Preferences ----

function renderPreferences(): void {
  const prefs = api.getPreferences()
  app().innerHTML = `
    <div id="screen-prefs" class="screen active">
      <div class="menu-card">
        <h2>Preferences</h2>
        <label>
          Draw Count:
          <select id="pref-draw-count">
            <option value="1">Draw 1</option>
            <option value="3">Draw 3</option>
          </select>
        </label>
        <div class="pref-row">
          <span>Background:</span>
          <input type="file" id="pref-background" accept="image/*" />
          <button id="btn-clear-background" class="btn-secondary">Default</button>
        </div>
        <div class="pref-row">
          <span>Card Back:</span>
          <input type="file" id="pref-card-back" accept="image/*" />
          <button id="btn-clear-card-back" class="btn-secondary">Default</button>
        </div>
        <button id="btn-save-prefs">Save</button>
        <button id="btn-back-prefs" class="btn-secondary">Back</button>
      </div>
    </div>`

  const select = document.getElementById('pref-draw-count') as HTMLSelectElement
  select.value = String(prefs.drawCount)

  // Read a chosen image as a data URL, persist it under `key`, and apply it
  // immediately so the change is visible without leaving the screen.
  const wireImagePicker = (inputId: string, key: 'backgroundPath' | 'cardBackPath'): void => {
    document.getElementById(inputId)!.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        api.setPreferences({ [key]: reader.result as string })
        applyTheme(api.getPreferences())
      }
      reader.readAsDataURL(file)
    })
  }
  const wireImageReset = (buttonId: string, key: 'backgroundPath' | 'cardBackPath'): void => {
    document.getElementById(buttonId)!.addEventListener('click', () => {
      api.setPreferences({ [key]: null })
      applyTheme(api.getPreferences())
    })
  }
  wireImagePicker('pref-background', 'backgroundPath')
  wireImagePicker('pref-card-back', 'cardBackPath')
  wireImageReset('btn-clear-background', 'backgroundPath')
  wireImageReset('btn-clear-card-back', 'cardBackPath')

  document.getElementById('btn-save-prefs')!.addEventListener('click', () => {
    const val = (document.getElementById('pref-draw-count') as HTMLSelectElement).value
    api.setPreferences({ drawCount: Number(val) as 1 | 3 })
    renderMainMenu()
  })
  document.getElementById('btn-back-prefs')!.addEventListener('click', renderMainMenu)
}
