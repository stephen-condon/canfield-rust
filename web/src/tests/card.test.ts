import { describe, it, expect, vi } from 'vitest'
import { createCardElement } from '../card'
import type { Card } from '../types'

const heartAce: Card = { id: 'hearts_1', suit: 'hearts', rank: 1, faceUp: true }
const clubKing: Card = { id: 'clubs_13', suit: 'clubs', rank: 13, faceUp: true }
const faceDown: Card = { id: 'spades_5', suit: 'spades', rank: 5, faceUp: false }

describe('createCardElement', () => {
  it('renders rank and suit for face-up card', () => {
    const el = createCardElement(heartAce)
    expect(el.textContent).toContain('A')
    expect(el.textContent).toContain('♥')
  })

  it('applies rank-red class for hearts', () => {
    expect(createCardElement(heartAce).classList.contains('rank-red')).toBe(true)
  })

  it('applies rank-black class for clubs', () => {
    expect(createCardElement(clubKing).classList.contains('rank-black')).toBe(true)
  })

  it('adds face-down class when card is face-down', () => {
    expect(createCardElement(faceDown).classList.contains('face-down')).toBe(true)
  })

  it('does not render card-corner when face-down', () => {
    expect(createCardElement(faceDown).querySelector('.card-corner')).toBeNull()
  })

  it('dispatches card-dbl-click event on double click when face-up', () => {
    const el = createCardElement(heartAce, { draggable: true })
    document.body.appendChild(el)
    const spy = vi.fn()
    document.body.addEventListener('card-dbl-click', spy)
    el.dispatchEvent(new MouseEvent('dblclick'))
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0][0].detail).toEqual(heartAce)
    document.body.removeEventListener('card-dbl-click', spy)
    document.body.removeChild(el)
  })

  it('does not dispatch card-dbl-click when face-down', () => {
    const el = createCardElement(faceDown)
    document.body.appendChild(el)
    const spy = vi.fn()
    document.body.addEventListener('card-dbl-click', spy)
    el.dispatchEvent(new MouseEvent('dblclick'))
    expect(spy).not.toHaveBeenCalled()
    document.body.removeEventListener('card-dbl-click', spy)
    document.body.removeChild(el)
  })

  it('dispatches card-drag-start on dragstart when draggable', () => {
    const el = createCardElement(heartAce, { draggable: true })
    document.body.appendChild(el)
    const spy = vi.fn()
    document.body.addEventListener('card-drag-start', spy)
    try {
      el.dispatchEvent(new DragEvent('dragstart', { dataTransfer: new DataTransfer() }))
    } catch {
      el.dispatchEvent(new Event('dragstart'))
    }
    expect(spy).toHaveBeenCalledOnce()
    document.body.removeEventListener('card-drag-start', spy)
    document.body.removeChild(el)
  })

  it('shows card-back-pattern when face-down', () => {
    expect(createCardElement(faceDown).querySelector('.card-back-pattern')).toBeTruthy()
  })

  it('renders King label correctly', () => {
    expect(createCardElement(clubKing).textContent).toContain('K')
  })

  it('applies dragging class when isDragging is true', () => {
    expect(createCardElement(heartAce, { isDragging: true }).classList.contains('dragging')).toBe(true)
  })

  it('applies drop-active class when isDropTarget is true', () => {
    expect(createCardElement(heartAce, { isDropTarget: true }).classList.contains('drop-active')).toBe(true)
  })
})
