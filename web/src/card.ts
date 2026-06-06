import type { Card } from './types'

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const RANK_LABELS: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
}

export function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank)
}

export function suitSymbol(suit: string): string {
  return SUIT_SYMBOLS[suit] ?? suit
}

export function isRed(suit: string): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

export interface CardElementOptions {
  draggable?: boolean
  isDragging?: boolean
  isDropTarget?: boolean
}

export function createCardElement(card: Card, opts: CardElementOptions = {}): HTMLElement {
  const el = document.createElement('div')
  el.className = 'playing-card'
  el.dataset.cardId = card.id

  if (!card.faceUp) {
    el.classList.add('face-down')
    const back = document.createElement('div')
    back.className = 'card-back-pattern'
    el.appendChild(back)
    return el
  }

  if (opts.isDragging) el.classList.add('dragging')
  if (opts.isDropTarget) el.classList.add('drop-active')
  if (opts.draggable) el.draggable = true

  const colorClass = isRed(card.suit) ? 'rank-red' : 'rank-black'
  el.classList.add(colorClass)

  const corner = document.createElement('div')
  corner.className = 'card-corner'
  corner.textContent = `${rankLabel(card.rank)}${suitSymbol(card.suit)}`
  el.appendChild(corner)

  if (opts.draggable) {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', card.id)
      el.dispatchEvent(new CustomEvent('card-drag-start', { detail: card, bubbles: true }))
    })
  }

  el.addEventListener('dblclick', () => {
    el.dispatchEvent(new CustomEvent('card-dbl-click', { detail: card, bubbles: true }))
  })

  return el
}
