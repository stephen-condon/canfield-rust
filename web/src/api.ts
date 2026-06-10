import type { Preferences, Statistics } from './types'

const KEYS = {
  prefs: 'canfield:preferences',
  stats: 'canfield:statistics',
  savedGame: 'canfield:savedGame',
}

const DEFAULT_PREFS: Preferences = { drawCount: 3, backgroundPath: null, cardBackPath: null }
const DEFAULT_STATS: Statistics = { gamesPlayed: 0, wins: 0, losses: 0 }

// Merge stored values over the defaults so preferences/statistics saved before
// a new field existed still come back with that field populated.
function load<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export const api = {
  getPreferences: (): Preferences => load(KEYS.prefs, DEFAULT_PREFS),
  setPreferences: (prefs: Partial<Preferences>): void => {
    save(KEYS.prefs, { ...api.getPreferences(), ...prefs })
  },

  getStatistics: (): Statistics => load(KEYS.stats, DEFAULT_STATS),
  recordWin: (): void => {
    const s = api.getStatistics()
    save(KEYS.stats, { gamesPlayed: s.gamesPlayed + 1, wins: s.wins + 1, losses: s.losses })
  },
  recordLoss: (): void => {
    const s = api.getStatistics()
    save(KEYS.stats, { gamesPlayed: s.gamesPlayed + 1, wins: s.wins, losses: s.losses + 1 })
  },
  resetStatistics: (): void => save(KEYS.stats, DEFAULT_STATS),

  getSavedGame: (): string | null => localStorage.getItem(KEYS.savedGame),
  setSavedGame: (json: string | null): void => {
    if (json === null) localStorage.removeItem(KEYS.savedGame)
    else localStorage.setItem(KEYS.savedGame, json)
  },
}
