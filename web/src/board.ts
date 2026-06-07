import {
  new_game,
  draw_from_stock,
  redeal_stock,
  move_to_foundation,
  move_tableau_to_tableau,
  move_to_tableau,
  auto_move_to_foundation,
} from './pkg/canfield_wasm.js'
import { createCardElement } from './card'
import { api } from './api'
import type { GameState, Card } from './types'

const app = (): HTMLElement => document.getElementById('app')!

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
  const savedGame = api.getSavedGame()
  app().innerHTML = `
    <div id="screen-menu" class="screen active">
      <h1>Canfield Solitaire</h1>
      <button id="btn-new-game">New Game</button>
      <button id="btn-resume" style="display:none">Resume Game</button>
      <button id="btn-statistics">Statistics</button>
      <button id="btn-preferences">Preferences</button>
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

  function updateDOM(): void {
    const reserveEl = document.getElementById('zone-reserve')!
    reserveEl.innerHTML = ''
    if (state.reserve.length > 0) {
      reserveEl.appendChild(
        createCardElement(state.reserve[state.reserve.length - 1], { draggable: true }),
      )
    }

    for (let i = 0; i < 4; i++) {
      const fEl = document.getElementById(`zone-foundation-${i}`)!
      fEl.innerHTML = ''
      if (state.foundations[i].length > 0) {
        fEl.appendChild(createCardElement(state.foundations[i][state.foundations[i].length - 1]))
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
    }

    const stockEl = document.getElementById('zone-stock')!
    stockEl.innerHTML = ''
    if (state.stock.length > 0) {
      const dummy: Card = { id: 'stock', suit: 'spades', rank: 1, faceUp: false }
      stockEl.appendChild(createCardElement(dummy))
    }

    const wasteEl = document.getElementById('waste-slot')!
    wasteEl.innerHTML = ''
    if (state.waste.length > 0) {
      wasteEl.appendChild(
        createCardElement(state.waste[state.waste.length - 1], { draggable: true }),
      )
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

  function showWinOverlay(): void {
    stopTimer()
    api.recordWin()
    api.setSavedGame(null)
    const overlay = document.getElementById('overlay-win')!
    overlay.style.display = 'flex'
    document.getElementById('win-moves')!.textContent = String(state.moves)
    document.getElementById('win-time')!.textContent = formatTime(elapsedMs)
  }

  function findZoneForCard(cardId: string): string | null {
    if (state.waste.length > 0 && state.waste[state.waste.length - 1].id === cardId)
      return 'waste'
    if (state.reserve.length > 0 && state.reserve[state.reserve.length - 1].id === cardId)
      return 'reserve'
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
        <span class="hud-stat">Moves: <span id="hud-moves">0</span></span>
        <span class="hud-stat">Time: <span id="hud-time">0:00</span></span>
        <button id="btn-surrender">Surrender</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
      <div class="board">
        <div id="zone-reserve" class="zone reserve-slot"></div>
        <div class="foundations">
          ${[0, 1, 2, 3].map((i) => `<div id="zone-foundation-${i}" class="zone foundation-slot" data-foundation="${i}"></div>`).join('')}
        </div>
        <div class="tableau">
          ${[0, 1, 2, 3].map((i) => `<div id="zone-tableau-${i}" class="zone tableau-col" data-col="${i}" style="position:relative;min-height:200px"></div>`).join('')}
        </div>
        <div class="stock-area">
          <div id="zone-stock" class="zone stock-slot"></div>
          <div id="waste-slot" class="zone waste-slot"></div>
        </div>
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

  // Foundation drop targets
  for (let i = 0; i < 4; i++) {
    const fEl = document.getElementById(`zone-foundation-${i}`)!
    fEl.addEventListener('dragover', (e) => e.preventDefault())
    fEl.addEventListener('drop', (e) => {
      e.preventDefault()
      const cardId = e.dataTransfer?.getData('text/plain') ?? ''
      const zone = findZoneForCard(cardId)
      if (zone) applyMove(move_to_foundation(JSON.stringify(state), zone, i))
    })
  }

  // Tableau drop targets
  for (let col = 0; col < 4; col++) {
    const tEl = document.getElementById(`zone-tableau-${col}`)!
    tEl.addEventListener('dragover', (e) => e.preventDefault())
    tEl.addEventListener('drop', (e) => {
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

  // Double-click → auto move to foundation
  app().addEventListener('card-dbl-click', (e) => {
    const card = (e as CustomEvent<Card>).detail
    const zone = findZoneForCard(card.id)
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
    const prefs = api.getPreferences()
    const newStateJson = new_game(prefs.drawCount)
    elapsedMs = 0
    api.setSavedGame(newStateJson)
    renderGameBoard(newStateJson)
  })

  document.getElementById('btn-main-menu-win')!.addEventListener('click', renderMainMenu)
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
      <h2>Statistics</h2>
      <div class="stat-value">Games Played: <span id="stat-played"></span></div>
      <div class="stat-value">Wins: <span id="stat-wins"></span></div>
      <div class="stat-value">Losses: <span id="stat-losses"></span></div>
      <div class="stat-value">Win %: <span id="stat-pct"></span></div>
      <button id="btn-reset-stats">Reset Statistics</button>
      <button id="btn-back-stats">Back</button>
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
      <h2>Preferences</h2>
      <label>
        Draw Count:
        <select id="pref-draw-count">
          <option value="1">Draw 1</option>
          <option value="3">Draw 3</option>
        </select>
      </label>
      <button id="btn-save-prefs">Save</button>
      <button id="btn-back-prefs">Back</button>
    </div>`

  const select = document.getElementById('pref-draw-count') as HTMLSelectElement
  select.value = String(prefs.drawCount)

  document.getElementById('btn-save-prefs')!.addEventListener('click', () => {
    const val = (document.getElementById('pref-draw-count') as HTMLSelectElement).value
    api.setPreferences({ drawCount: Number(val) as 1 | 3 })
    renderMainMenu()
  })
  document.getElementById('btn-back-prefs')!.addEventListener('click', renderMainMenu)
}
