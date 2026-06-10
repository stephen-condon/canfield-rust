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

// Faded rank+suit watermark for an empty foundation, showing the base rank and
// the suit that foundation accepts (e.g. "J♥"). Non-interactive.
export function createFoundationPlaceholder(baseRank: number, suit: string): HTMLElement {
  const el = document.createElement('div')
  el.className = 'pile-placeholder foundation-hint'
  el.classList.add(isRed(suit) ? 'rank-red' : 'rank-black')

  const rank = document.createElement('div')
  rank.className = 'hint-rank'
  rank.textContent = rankLabel(baseRank)
  el.appendChild(rank)

  const suitEl = document.createElement('div')
  suitEl.className = 'hint-suit'
  suitEl.textContent = suitSymbol(suit)
  el.appendChild(suitEl)

  return el
}

// Faded single-glyph hint for an empty reserve / stock / tableau slot.
export function createGlyphPlaceholder(kind: 'reserve' | 'stock' | 'tableau', glyph: string): HTMLElement {
  const el = document.createElement('div')
  el.className = `pile-placeholder ${kind}-hint`
  el.textContent = glyph
  return el
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

  const label = `${rankLabel(card.rank)}${suitSymbol(card.suit)}`

  const center = document.createElement('div')
  center.className = 'card-suit-center'
  center.textContent = suitSymbol(card.suit)
  el.appendChild(center)

  const corner = document.createElement('div')
  corner.className = 'card-corner'
  corner.textContent = label
  el.appendChild(corner)

  const cornerBottom = document.createElement('div')
  cornerBottom.className = 'card-corner card-corner-bottom'
  cornerBottom.textContent = label
  el.appendChild(cornerBottom)

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
