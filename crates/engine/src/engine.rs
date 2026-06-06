use crate::types::*;
use rand::seq::SliceRandom;

// ---- Public API stubs (implement AFTER tests) ----

pub fn build_deck() -> Vec<Card> {
    let suits = [Suit::Hearts, Suit::Diamonds, Suit::Clubs, Suit::Spades];
    let mut deck = Vec::with_capacity(52);
    for suit in suits {
        for rank in 1u8..=13 {
            deck.push(Card {
                id: format!(
                    "{}_{}",
                    match suit {
                        Suit::Hearts => "hearts",
                        Suit::Diamonds => "diamonds",
                        Suit::Clubs => "clubs",
                        Suit::Spades => "spades",
                    },
                    rank
                ),
                suit,
                rank,
                face_up: false,
            });
        }
    }
    deck
}

pub fn shuffle_deck(deck: &mut Vec<Card>) {
    let mut rng = rand::thread_rng();
    deck.shuffle(&mut rng);
}

pub fn new_game(draw_count: u8) -> GameState {
    let mut deck = build_deck();
    shuffle_deck(&mut deck);

    // Deal 13 to reserve; top card face up
    let mut reserve: Vec<Card> = deck.drain(..13).collect();
    reserve.last_mut().unwrap().face_up = true;

    // First foundation card sets base rank
    let mut first_foundation_card = deck.remove(0);
    first_foundation_card.face_up = true;
    let base_rank = first_foundation_card.rank;
    let first_suit = first_foundation_card.suit;

    // Deal 4 face-up cards to tableau
    let mut tableau: Vec<Vec<Card>> = vec![vec![], vec![], vec![], vec![]];
    for col in &mut tableau {
        let mut card = deck.remove(0);
        card.face_up = true;
        col.push(card);
    }

    let foundation_suits = {
        let all = [Suit::Hearts, Suit::Diamonds, Suit::Clubs, Suit::Spades];
        let mut suits = vec![first_suit];
        for s in all {
            if s != first_suit {
                suits.push(s);
            }
        }
        suits
    };

    GameState {
        base_rank,
        foundation_suits,
        foundations: vec![vec![first_foundation_card], vec![], vec![], vec![]],
        tableau,
        reserve,
        stock: deck,
        waste: vec![],
        draw_count,
        moves: 0,
        elapsed_ms: 0,
        won: false,
    }
}

// ---- Rank arithmetic ----

pub fn next_rank(rank: Rank) -> Rank {
    (rank % 13) + 1
}

pub fn prev_rank(rank: Rank) -> Rank {
    ((rank + 11) % 13) + 1
}

// ---- Validation ----

pub fn can_place_on_foundation(
    card: &Card,
    pile: &[Card],
    base_rank: Rank,
    expected_suit: Suit,
) -> bool {
    if card.suit != expected_suit {
        return false;
    }
    match pile.last() {
        None => card.rank == base_rank,
        Some(top) => card.rank == next_rank(top.rank),
    }
}

pub fn can_place_on_tableau(card: &Card, column: &[Card]) -> bool {
    match column.last() {
        None => true,
        Some(top) => {
            card.suit.color() != top.suit.color() && card.rank == prev_rank(top.rank)
        }
    }
}

pub fn first_face_up_index(column: &[Card]) -> usize {
    column.iter().position(|c| c.face_up).unwrap_or(column.len())
}

// ---- Tests ----

#[cfg(test)]
mod tests {
    use super::*;

    pub fn make_card(rank: Rank, suit: Suit, face_up: bool) -> Card {
        Card {
            id: format!(
                "{}_{}",
                match suit {
                    Suit::Hearts => "hearts",
                    Suit::Diamonds => "diamonds",
                    Suit::Clubs => "clubs",
                    Suit::Spades => "spades",
                },
                rank
            ),
            suit,
            rank,
            face_up,
        }
    }

    pub fn make_state(overrides: impl FnOnce(&mut GameState)) -> GameState {
        let mut s = GameState {
            base_rank: 1,
            foundations: vec![vec![], vec![], vec![], vec![]],
            tableau: vec![vec![], vec![], vec![], vec![]],
            reserve: vec![],
            stock: vec![],
            waste: vec![],
            draw_count: 3,
            moves: 0,
            elapsed_ms: 0,
            won: false,
            foundation_suits: vec![Suit::Hearts, Suit::Diamonds, Suit::Clubs, Suit::Spades],
        };
        overrides(&mut s);
        s
    }

    // buildDeck
    #[test]
    fn build_deck_generates_52_unique_cards() {
        let deck = build_deck();
        assert_eq!(deck.len(), 52);
        let ids: std::collections::HashSet<_> = deck.iter().map(|c| &c.id).collect();
        assert_eq!(ids.len(), 52);
    }

    #[test]
    fn build_deck_all_face_down() {
        assert!(build_deck().iter().all(|c| !c.face_up));
    }

    // shuffle
    #[test]
    fn shuffle_preserves_length() {
        let mut deck = build_deck();
        shuffle_deck(&mut deck);
        assert_eq!(deck.len(), 52);
    }

    #[test]
    fn shuffle_preserves_all_elements() {
        let mut deck = build_deck();
        let original_ids: std::collections::HashSet<_> =
            deck.iter().map(|c| c.id.clone()).collect();
        shuffle_deck(&mut deck);
        let shuffled_ids: std::collections::HashSet<_> =
            deck.iter().map(|c| c.id.clone()).collect();
        assert_eq!(original_ids, shuffled_ids);
    }

    // newGame
    #[test]
    fn new_game_deals_correct_card_counts() {
        let s = new_game(3);
        assert_eq!(s.reserve.len(), 13);
        assert_eq!(s.foundations[0].len(), 1);
        assert_eq!(s.foundations[1].len(), 0);
        assert_eq!(s.tableau.len(), 4);
        assert!(s.tableau.iter().all(|c| c.len() == 1));
        assert_eq!(s.stock.len(), 34);
        assert_eq!(s.waste.len(), 0);
    }

    #[test]
    fn new_game_top_of_reserve_is_face_up() {
        let s = new_game(3);
        assert!(s.reserve.last().unwrap().face_up);
    }

    #[test]
    fn new_game_foundation_base_card_is_face_up() {
        let s = new_game(3);
        assert!(s.foundations[0][0].face_up);
    }

    #[test]
    fn new_game_base_rank_matches_first_foundation_card() {
        let s = new_game(3);
        assert_eq!(s.foundations[0][0].rank, s.base_rank);
    }

    #[test]
    fn new_game_uses_provided_draw_count() {
        assert_eq!(new_game(1).draw_count, 1);
        assert_eq!(new_game(3).draw_count, 3);
    }

    #[test]
    fn new_game_total_card_count_is_52() {
        let s = new_game(3);
        let total = s.stock.len()
            + s.waste.len()
            + s.reserve.len()
            + s.foundations.iter().map(|p| p.len()).sum::<usize>()
            + s.tableau.iter().map(|c| c.len()).sum::<usize>();
        assert_eq!(total, 52);
    }

    // ---- nextRank ----
    #[test]
    fn next_rank_increments_normally() {
        assert_eq!(next_rank(5), 6);
    }

    #[test]
    fn next_rank_wraps_king_to_ace() {
        assert_eq!(next_rank(13), 1);
    }

    // ---- prevRank ----
    #[test]
    fn prev_rank_decrements_normally() {
        assert_eq!(prev_rank(5), 4);
    }

    #[test]
    fn prev_rank_wraps_ace_to_king() {
        assert_eq!(prev_rank(1), 13);
    }

    // ---- canPlaceOnFoundation ----
    #[test]
    fn foundation_accepts_base_rank_on_empty_pile() {
        assert!(can_place_on_foundation(&make_card(7, Suit::Hearts, true), &[], 7, Suit::Hearts));
    }

    #[test]
    fn foundation_rejects_non_base_rank_on_empty_pile() {
        assert!(!can_place_on_foundation(&make_card(8, Suit::Hearts, true), &[], 7, Suit::Hearts));
    }

    #[test]
    fn foundation_rejects_wrong_suit_on_empty_pile() {
        assert!(!can_place_on_foundation(&make_card(7, Suit::Diamonds, true), &[], 7, Suit::Hearts));
    }

    #[test]
    fn foundation_accepts_next_rank_same_suit() {
        let pile = vec![make_card(7, Suit::Hearts, true)];
        assert!(can_place_on_foundation(&make_card(8, Suit::Hearts, true), &pile, 7, Suit::Hearts));
    }

    #[test]
    fn foundation_rejects_wrong_suit() {
        let pile = vec![make_card(7, Suit::Hearts, true)];
        assert!(!can_place_on_foundation(&make_card(8, Suit::Clubs, true), &pile, 7, Suit::Hearts));
    }

    #[test]
    fn foundation_rejects_wrong_rank() {
        let pile = vec![make_card(7, Suit::Hearts, true)];
        assert!(!can_place_on_foundation(&make_card(9, Suit::Hearts, true), &pile, 7, Suit::Hearts));
    }

    #[test]
    fn foundation_wraps_king_to_ace() {
        let pile = vec![make_card(13, Suit::Hearts, true)];
        assert!(can_place_on_foundation(&make_card(1, Suit::Hearts, true), &pile, 7, Suit::Hearts));
    }

    // ---- canPlaceOnTableau ----
    #[test]
    fn tableau_accepts_anything_on_empty_column() {
        assert!(can_place_on_tableau(&make_card(5, Suit::Hearts, true), &[]));
    }

    #[test]
    fn tableau_accepts_alternating_color_one_lower() {
        let top = make_card(8, Suit::Hearts, true); // red
        let card = make_card(7, Suit::Clubs, true); // black
        assert!(can_place_on_tableau(&card, &[top]));
    }

    #[test]
    fn tableau_rejects_same_color() {
        let top = make_card(8, Suit::Hearts, true);
        let card = make_card(7, Suit::Diamonds, true);
        assert!(!can_place_on_tableau(&card, &[top]));
    }

    #[test]
    fn tableau_rejects_wrong_rank() {
        let top = make_card(8, Suit::Hearts, true);
        let card = make_card(6, Suit::Clubs, true);
        assert!(!can_place_on_tableau(&card, &[top]));
    }

    #[test]
    fn tableau_wraps_ace_onto_king() {
        let top = make_card(1, Suit::Hearts, true);  // red Ace
        let card = make_card(13, Suit::Clubs, true); // black King
        assert!(can_place_on_tableau(&card, &[top]));
    }

    // ---- firstFaceUpIndex ----
    #[test]
    fn first_face_up_index_returns_correct_index() {
        let col = vec![make_card(5, Suit::Hearts, false), make_card(6, Suit::Clubs, true)];
        assert_eq!(first_face_up_index(&col), 1);
    }

    #[test]
    fn first_face_up_index_returns_len_when_no_face_up() {
        let col = vec![make_card(5, Suit::Hearts, false)];
        assert_eq!(first_face_up_index(&col), 1);
    }
}
