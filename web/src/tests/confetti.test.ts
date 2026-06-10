import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startConfetti } from '../confetti'

// A canvas whose 2D context is a no-op stub (jsdom has no real canvas).
function fakeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D
  canvas.getContext = (() => ctx) as unknown as HTMLCanvasElement['getContext']
  return canvas
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('matchMedia', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('startConfetti', () => {
  it('schedules an animation frame when started', () => {
    startConfetti(fakeCanvas())
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('stop() cancels the scheduled animation frame', () => {
    const handle = startConfetti(fakeCanvas())
    handle.stop()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it('does nothing when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const handle = startConfetti(fakeCanvas())
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(() => handle.stop()).not.toThrow()
  })

  it('does nothing when the canvas has no 2D context', () => {
    const canvas = document.createElement('canvas')
    canvas.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
    startConfetti(canvas)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })
})
