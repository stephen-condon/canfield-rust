import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '../api'

beforeEach(() => localStorage.clear())

describe('preferences', () => {
  it('returns defaults when not set', () => {
    expect(api.getPreferences().drawCount).toBe(3)
  })

  it('persists and retrieves preferences', () => {
    api.setPreferences({ drawCount: 1 })
    expect(api.getPreferences().drawCount).toBe(1)
  })

  it('defaults the card back and background to null', () => {
    const prefs = api.getPreferences()
    expect(prefs.cardBackPath).toBeNull()
    expect(prefs.backgroundPath).toBeNull()
  })

  it('persists a custom card back without dropping other preferences', () => {
    api.setPreferences({ drawCount: 1 })
    api.setPreferences({ cardBackPath: 'data:image/png;base64,AAAA' })
    const prefs = api.getPreferences()
    expect(prefs.cardBackPath).toBe('data:image/png;base64,AAAA')
    expect(prefs.drawCount).toBe(1)
  })

  it('fills in new preference defaults for previously stored preferences', () => {
    localStorage.setItem('canfield:preferences', JSON.stringify({ drawCount: 1 }))
    expect(api.getPreferences().cardBackPath).toBeNull()
  })
})

describe('statistics', () => {
  it('returns zeros by default', () => {
    const s = api.getStatistics()
    expect(s.gamesPlayed).toBe(0)
    expect(s.wins).toBe(0)
  })

  it('recordWin increments gamesPlayed and wins', () => {
    api.recordWin()
    expect(api.getStatistics()).toEqual({ gamesPlayed: 1, wins: 1, losses: 0 })
  })

  it('recordLoss increments gamesPlayed and losses', () => {
    api.recordLoss()
    expect(api.getStatistics()).toEqual({ gamesPlayed: 1, wins: 0, losses: 1 })
  })

  it('resetStatistics zeros everything', () => {
    api.recordWin()
    api.resetStatistics()
    expect(api.getStatistics().gamesPlayed).toBe(0)
  })
})

describe('savedGame', () => {
  it('returns null when no game saved', () => {
    expect(api.getSavedGame()).toBeNull()
  })

  it('saves and retrieves a game', () => {
    api.setSavedGame('{"foo":1}')
    expect(api.getSavedGame()).toBe('{"foo":1}')
  })

  it('setSavedGame(null) removes the saved game', () => {
    api.setSavedGame('x')
    api.setSavedGame(null)
    expect(api.getSavedGame()).toBeNull()
  })
})
