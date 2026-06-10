export type Rank = number // 1-13
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Color = 'red' | 'black'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
  faceUp: boolean
}

export type ZoneId =
  | 'stock'
  | 'waste'
  | 'reserve'
  | `foundation_${number}`
  | `tableau_${number}`

export interface GameState {
  baseRank: Rank
  foundationSuits: Suit[]
  foundations: Card[][]
  tableau: Card[][]
  reserve: Card[]
  stock: Card[]
  waste: Card[]
  drawCount: 1 | 3
  moves: number
  elapsedMs: number
  won: boolean
}

export interface Preferences {
  drawCount: 1 | 3
  backgroundPath: string | null
  cardBackPath: string | null
}

export interface Statistics {
  gamesPlayed: number
  wins: number
  losses: number
}
