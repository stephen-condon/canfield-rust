import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Defined after mocks are set up (vi.mock is hoisted; factory must be self-contained)
const EMPTY_STATE = '{"baseRank":1,"foundationSuits":["hearts","diamonds","clubs","spades"],"foundations":[[],[],[],[]],"tableau":[[],[],[],[]],"reserve":[],"stock":[],"waste":[],"drawCount":3,"moves":0,"elapsedMs":0,"won":false}'

vi.mock('../pkg/canfield_wasm.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  new_game: vi.fn().mockReturnValue('{"baseRank":1,"foundationSuits":["hearts","diamonds","clubs","spades"],"foundations":[[],[],[],[]],"tableau":[[],[],[],[]],"reserve":[],"stock":[],"waste":[],"drawCount":3,"moves":0,"elapsedMs":0,"won":false}'),
  draw_from_stock: vi.fn().mockReturnValue(null),
  redeal_stock: vi.fn().mockReturnValue(null),
  move_to_foundation: vi.fn().mockReturnValue(null),
  move_tableau_to_tableau: vi.fn().mockReturnValue(null),
  move_to_tableau: vi.fn().mockReturnValue(null),
  auto_move_to_foundation: vi.fn().mockReturnValue(null),
  check_win: vi.fn().mockReturnValue(false),
  first_face_up_index_in_col: vi.fn().mockReturnValue(0),
}))

vi.mock('../api', () => ({
  api: {
    getPreferences: vi.fn().mockReturnValue({ drawCount: 3, backgroundPath: null }),
    setPreferences: vi.fn(),
    getStatistics: vi.fn().mockReturnValue({ gamesPlayed: 0, wins: 0, losses: 0 }),
    recordWin: vi.fn(),
    recordLoss: vi.fn(),
    resetStatistics: vi.fn(),
    getSavedGame: vi.fn().mockReturnValue(null),
    setSavedGame: vi.fn(),
  },
}))

import { renderGameBoard, renderMainMenu, stopTimer } from '../board'
import { api } from '../api'
import { new_game } from '../pkg/canfield_wasm.js'

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>'
  vi.clearAllMocks()
  vi.mocked(api.getPreferences).mockReturnValue({ drawCount: 3, backgroundPath: null })
  vi.mocked(api.getSavedGame).mockReturnValue(null)
  vi.mocked(api.getStatistics).mockReturnValue({ gamesPlayed: 0, wins: 0, losses: 0 })
  vi.mocked(new_game).mockReturnValue(EMPTY_STATE)
})

afterEach(() => {
  stopTimer()
})

describe('surrender flow', () => {
  it('shows confirm overlay when Surrender button is clicked', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    expect(document.getElementById('overlay-surrender')!.style.display).toBe('flex')
  })

  it('hides confirm overlay when Keep Playing is clicked', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    document.getElementById('btn-keep-playing')!.click()
    expect(document.getElementById('overlay-surrender')!.style.display).toBe('none')
  })

  it('confirming surrender records loss and shows post-surrender overlay', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    document.getElementById('btn-confirm-surrender')!.click()
    expect(api.recordLoss).toHaveBeenCalledOnce()
    expect(document.getElementById('overlay-post-surrender')!.style.display).toBe('flex')
  })

  it('New Game button in post-surrender overlay starts a new game', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    document.getElementById('btn-confirm-surrender')!.click()
    document.getElementById('btn-new-game-after')!.click()
    expect(new_game).toHaveBeenCalled()
    expect(document.getElementById('btn-surrender')).toBeTruthy()
  })

  it('Main Menu button in post-surrender overlay navigates to main menu', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    document.getElementById('btn-confirm-surrender')!.click()
    document.getElementById('btn-main-menu-after')!.click()
    expect(document.getElementById('btn-new-game')).toBeTruthy()
  })

  it('clicking backdrop dismiss (Keep Playing) closes overlay', () => {
    renderGameBoard(EMPTY_STATE)
    document.getElementById('btn-surrender')!.click()
    expect(document.getElementById('overlay-surrender')!.style.display).toBe('flex')
    document.getElementById('btn-keep-playing')!.click()
    expect(document.getElementById('overlay-surrender')!.style.display).toBe('none')
  })
})

describe('waste fan', () => {
  const stateWithWaste = (n: number): string => {
    const waste = Array.from({ length: n }, (_, i) => ({
      id: `w${i}`,
      suit: 'hearts',
      rank: i + 1,
      faceUp: true,
    }))
    return JSON.stringify({
      baseRank: 1,
      foundationSuits: ['hearts', 'diamonds', 'clubs', 'spades'],
      foundations: [[], [], [], []],
      tableau: [[], [], [], []],
      reserve: [],
      stock: [],
      waste,
      drawCount: 3,
      moves: 0,
      elapsedMs: 0,
      won: false,
    })
  }

  it('fans up to 3 waste cards with only the top one draggable', () => {
    renderGameBoard(stateWithWaste(3))
    const cards = document.querySelectorAll('#waste-slot .playing-card')
    expect(cards.length).toBe(3)
    expect((cards[0] as HTMLElement).draggable).toBe(false)
    expect((cards[1] as HTMLElement).draggable).toBe(false)
    expect((cards[2] as HTMLElement).draggable).toBe(true)
  })

  it('shows only the last 3 cards when the waste pile is deeper', () => {
    renderGameBoard(stateWithWaste(5))
    const cards = document.querySelectorAll('#waste-slot .playing-card')
    expect(cards.length).toBe(3)
    expect(cards[2].getAttribute('data-card-id')).toBe('w4')
  })

  it('renders a single draggable card in draw-1-style waste', () => {
    renderGameBoard(stateWithWaste(1))
    const cards = document.querySelectorAll('#waste-slot .playing-card')
    expect(cards.length).toBe(1)
    expect((cards[0] as HTMLElement).draggable).toBe(true)
  })
})

describe('main menu', () => {
  it('shows New Game, Statistics, Preferences buttons', () => {
    renderMainMenu()
    expect(document.getElementById('btn-new-game')).toBeTruthy()
    expect(document.getElementById('btn-statistics')).toBeTruthy()
    expect(document.getElementById('btn-preferences')).toBeTruthy()
  })
})
