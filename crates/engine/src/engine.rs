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

pub fn shuffle_deck(deck: &mut [Card]) {
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

// ---- Private helpers ----

fn clone_state(state: &GameState) -> GameState {
    state.clone()
}

fn top_card_of(state: &GameState, zone: ZoneId) -> Option<&Card> {
    match zone {
        ZoneId::Waste => state.waste.last(),
        ZoneId::Reserve => state.reserve.last(),
        ZoneId::Tableau(col) => state.tableau[col].last(),
        ZoneId::Foundation(idx) => state.foundations[idx].last(),
        ZoneId::Stock => state.stock.last(),
    }
}

fn remove_top_card(state: &mut GameState, zone: ZoneId) {
    match zone {
        ZoneId::Waste => {
            state.waste.pop();
        }
        ZoneId::Reserve => {
            state.reserve.pop();
            if let Some(top) = state.reserve.last_mut() {
                top.face_up = true;
            }
        }
        ZoneId::Tableau(col) => {
            state.tableau[col].pop();
            if let Some(top) = state.tableau[col].last_mut() {
                top.face_up = true;
            }
        }
        _ => {}
    }
}

fn auto_fill_empty_tableau(state: &mut GameState) {
    if state.reserve.is_empty() {
        return;
    }
    for i in 0..4 {
        if state.tableau[i].is_empty() && !state.reserve.is_empty() {
            let mut card = state.reserve.pop().unwrap();
            card.face_up = true;
            state.tableau[i].push(card);
            if let Some(top) = state.reserve.last_mut() {
                top.face_up = true;
            }
        }
    }
}

// ---- Public move functions ----

pub fn draw_from_stock(state: &GameState) -> Option<GameState> {
    if state.stock.is_empty() {
        return None;
    }
    let mut s = clone_state(state);
    let count = s.draw_count as usize;
    let draw_n = count.min(s.stock.len());
    let start = s.stock.len() - draw_n;
    let mut drawn: Vec<Card> = s.stock.drain(start..).collect();
    drawn.iter_mut().for_each(|c| c.face_up = true);
    drawn.reverse();
    s.waste.extend(drawn);
    s.moves += 1;
    Some(s)
}

pub fn redeal_stock(state: &GameState) -> Option<GameState> {
    if !state.stock.is_empty() || state.waste.is_empty() {
        return None;
    }
    let mut s = clone_state(state);
    let mut new_stock: Vec<Card> = s.waste.drain(..).collect();
    new_stock.reverse();
    new_stock.iter_mut().for_each(|c| c.face_up = false);
    s.stock = new_stock;
    s.moves += 1;
    Some(s)
}

pub fn move_to_foundation(
    state: &GameState,
    source_zone: ZoneId,
    foundation_index: usize,
) -> Option<GameState> {
    let card = top_card_of(state, source_zone)?.clone();
    let pile = &state.foundations[foundation_index];
    let expected_suit = state.foundation_suits[foundation_index];
    if !can_place_on_foundation(&card, pile, state.base_rank, expected_suit) {
        return None;
    }
    let mut s = clone_state(state);
    remove_top_card(&mut s, source_zone);
    let mut card = card;
    card.face_up = true;
    s.foundations[foundation_index].push(card);
    s.moves += 1;
    auto_fill_empty_tableau(&mut s);
    s.won = check_win(&s);
    Some(s)
}

pub fn move_tableau_to_tableau(
    state: &GameState,
    from_col: usize,
    from_index: usize,
    to_col: usize,
) -> Option<GameState> {
    let from = &state.tableau[from_col];
    if from_index >= from.len() || !from[from_index].face_up {
        return None;
    }
    let bottom_moving = &from[from_index];
    if !can_place_on_tableau(bottom_moving, &state.tableau[to_col]) {
        return None;
    }
    let mut s = clone_state(state);
    let moving: Vec<Card> = s.tableau[from_col].drain(from_index..).collect();
    if let Some(top) = s.tableau[from_col].last_mut() {
        top.face_up = true;
    }
    s.tableau[to_col].extend(moving);
    s.moves += 1;
    auto_fill_empty_tableau(&mut s);
    Some(s)
}

pub fn move_to_tableau(
    state: &GameState,
    source_zone: ZoneId,
    to_col: usize,
) -> Option<GameState> {
    let card = top_card_of(state, source_zone)?.clone();
    if !can_place_on_tableau(&card, &state.tableau[to_col]) {
        return None;
    }
    let mut s = clone_state(state);
    remove_top_card(&mut s, source_zone);
    let mut card = card;
    card.face_up = true;
    s.tableau[to_col].push(card);
    s.moves += 1;
    auto_fill_empty_tableau(&mut s);
    Some(s)
}

pub fn auto_move_to_foundation(state: &GameState, source_zone: ZoneId) -> Option<GameState> {
    for i in 0..4 {
        if let Some(result) = move_to_foundation(state, source_zone, i) {
            return Some(result);
        }
    }
    None
}

pub fn check_win(state: &GameState) -> bool {
    state.foundations.iter().map(|p| p.len()).sum::<usize>() == 52
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

    // ---- drawFromStock ----
    #[test]
    fn draw_from_stock_returns_none_when_empty() {
        assert!(draw_from_stock(&make_state(|_| {})).is_none());
    }

    #[test]
    fn draw_from_stock_draws_up_to_draw_count() {
        let s = make_state(|s| {
            s.stock = vec![
                make_card(1, Suit::Hearts, false),
                make_card(2, Suit::Clubs, false),
                make_card(3, Suit::Diamonds, false),
            ];
            s.draw_count = 3;
        });
        let next = draw_from_stock(&s).unwrap();
        assert_eq!(next.waste.len(), 3);
        assert_eq!(next.stock.len(), 0);
    }

    #[test]
    fn draw_from_stock_draws_fewer_when_stock_smaller() {
        let s = make_state(|s| {
            s.stock = vec![make_card(1, Suit::Hearts, false)];
            s.draw_count = 3;
        });
        let next = draw_from_stock(&s).unwrap();
        assert_eq!(next.waste.len(), 1);
    }

    #[test]
    fn draw_from_stock_increments_move_count() {
        let s = make_state(|s| s.stock = vec![make_card(1, Suit::Hearts, false)]);
        assert_eq!(draw_from_stock(&s).unwrap().moves, 1);
    }

    #[test]
    fn draw_from_stock_drawn_cards_are_face_up() {
        let s = make_state(|s| {
            s.stock = vec![make_card(1, Suit::Hearts, false)];
            s.draw_count = 1;
        });
        assert!(draw_from_stock(&s).unwrap().waste[0].face_up);
    }

    // ---- redealStock ----
    #[test]
    fn redeal_stock_returns_none_when_stock_not_empty() {
        let s = make_state(|s| {
            s.stock = vec![make_card(1, Suit::Hearts, false)];
            s.waste = vec![make_card(2, Suit::Clubs, true)];
        });
        assert!(redeal_stock(&s).is_none());
    }

    #[test]
    fn redeal_stock_returns_none_when_waste_empty() {
        assert!(redeal_stock(&make_state(|_| {})).is_none());
    }

    #[test]
    fn redeal_stock_flips_waste_into_stock() {
        let s = make_state(|s| {
            s.waste = vec![
                make_card(1, Suit::Hearts, true),
                make_card(2, Suit::Clubs, true),
                make_card(3, Suit::Diamonds, true),
            ];
        });
        let next = redeal_stock(&s).unwrap();
        assert_eq!(next.stock.len(), 3);
        assert_eq!(next.waste.len(), 0);
    }

    #[test]
    fn redeal_stock_new_stock_is_face_down() {
        let s = make_state(|s| s.waste = vec![make_card(1, Suit::Hearts, true)]);
        let next = redeal_stock(&s).unwrap();
        assert!(next.stock.iter().all(|c| !c.face_up));
    }

    // ---- moveToFoundation ----
    #[test]
    fn move_to_foundation_moves_valid_card_from_waste() {
        let base_card = make_card(1, Suit::Hearts, true);
        let two_hearts = make_card(2, Suit::Hearts, true);
        let s = make_state(|s| {
            s.base_rank = 1;
            s.foundations[0] = vec![base_card.clone()];
            s.waste = vec![two_hearts];
        });
        let next = move_to_foundation(&s, ZoneId::Waste, 0).unwrap();
        assert_eq!(next.foundations[0].len(), 2);
        assert_eq!(next.waste.len(), 0);
    }

    #[test]
    fn move_to_foundation_returns_none_for_invalid_move() {
        let s = make_state(|s| s.waste = vec![make_card(3, Suit::Hearts, true)]);
        assert!(move_to_foundation(&s, ZoneId::Waste, 0).is_none());
    }

    // ---- moveTableauToTableau ----
    #[test]
    fn move_tableau_to_tableau_moves_valid_card() {
        let red_q = make_card(12, Suit::Hearts, true);
        let black_j = make_card(11, Suit::Clubs, true);
        let s = make_state(|s| {
            s.tableau[0] = vec![red_q.clone()];
            s.tableau[1] = vec![black_j];
        });
        let next = move_tableau_to_tableau(&s, 1, 0, 0).unwrap();
        assert_eq!(next.tableau[0].len(), 2);
        assert_eq!(next.tableau[1].len(), 0);
    }

    #[test]
    fn move_tableau_to_tableau_returns_none_for_invalid_move() {
        let red_q = make_card(12, Suit::Hearts, true);
        let red_j = make_card(11, Suit::Diamonds, true);
        let s = make_state(|s| {
            s.tableau[0] = vec![red_q];
            s.tableau[1] = vec![red_j];
        });
        assert!(move_tableau_to_tableau(&s, 1, 0, 0).is_none());
    }

    #[test]
    fn move_tableau_to_tableau_moves_multi_card_sequence() {
        let red_q = make_card(12, Suit::Hearts, true);
        let black_j = make_card(11, Suit::Clubs, true);
        let red_ten = make_card(10, Suit::Diamonds, true);
        let s = make_state(|s| {
            s.tableau[0] = vec![red_q];
            s.tableau[1] = vec![black_j, red_ten];
        });
        let next = move_tableau_to_tableau(&s, 1, 0, 0).unwrap();
        assert_eq!(next.tableau[0].len(), 3);
        assert_eq!(next.tableau[1].len(), 0);
    }

    // ---- moveToTableau ----
    #[test]
    fn move_to_tableau_moves_waste_to_valid_column() {
        let red_q = make_card(12, Suit::Hearts, true);
        let black_j = make_card(11, Suit::Clubs, true);
        let s = make_state(|s| {
            s.tableau[0] = vec![red_q];
            s.waste = vec![black_j];
        });
        let next = move_to_tableau(&s, ZoneId::Waste, 0).unwrap();
        assert_eq!(next.tableau[0].len(), 2);
        assert_eq!(next.waste.len(), 0);
    }

    #[test]
    fn move_to_tableau_returns_none_for_invalid_move() {
        let red_q = make_card(12, Suit::Hearts, true);
        let red_j = make_card(11, Suit::Diamonds, true);
        let s = make_state(|s| {
            s.tableau[0] = vec![red_q];
            s.waste = vec![red_j];
        });
        assert!(move_to_tableau(&s, ZoneId::Waste, 0).is_none());
    }

    // ---- autoMoveToFoundation ----
    #[test]
    fn auto_move_to_foundation_moves_to_correct_foundation() {
        let base_card = make_card(1, Suit::Hearts, true);
        let two_hearts = make_card(2, Suit::Hearts, true);
        let s = make_state(|s| {
            s.base_rank = 1;
            s.foundations[0] = vec![base_card];
            s.waste = vec![two_hearts];
        });
        let next = auto_move_to_foundation(&s, ZoneId::Waste).unwrap();
        assert_eq!(next.foundations[0].len(), 2);
    }

    #[test]
    fn auto_move_to_foundation_returns_none_if_no_foundation_accepts() {
        let s = make_state(|s| {
            s.base_rank = 5;
            s.waste = vec![make_card(3, Suit::Hearts, true)];
        });
        assert!(auto_move_to_foundation(&s, ZoneId::Waste).is_none());
    }

    // ---- checkWin ----
    #[test]
    fn check_win_returns_false_if_not_all_in_foundations() {
        let s = make_state(|s| s.foundations[0] = vec![make_card(1, Suit::Hearts, true)]);
        assert!(!check_win(&s));
    }

    #[test]
    fn check_win_returns_true_when_52_in_foundations() {
        let s = make_state(|s| {
            let build_pile = |suit: Suit| -> Vec<Card> {
                (1u8..=13).map(|r| make_card(r, suit, true)).collect()
            };
            s.foundations = vec![
                build_pile(Suit::Hearts),
                build_pile(Suit::Diamonds),
                build_pile(Suit::Clubs),
                build_pile(Suit::Spades),
            ];
        });
        assert!(check_win(&s));
    }

    // ---- serialize/deserialize ----
    #[test]
    fn serialize_deserialize_round_trips() {
        let s = new_game(3);
        let json = serde_json::to_string(&s).unwrap();
        let restored: GameState = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.base_rank, s.base_rank);
        assert_eq!(restored.stock.len(), s.stock.len());
    }

    // ---- auto-fill empty tableau from reserve ----
    #[test]
    fn auto_fill_fills_empty_tableau_from_reserve_after_move() {
        let reserve_card = make_card(9, Suit::Diamonds, true);
        let top_card = make_card(5, Suit::Hearts, true);
        let s = make_state(|s| {
            s.reserve = vec![reserve_card.clone()];
            s.tableau[0] = vec![top_card];
        });
        let next = move_tableau_to_tableau(&s, 0, 0, 1).unwrap();
        assert_eq!(next.tableau[0].len(), 1);
        assert_eq!(next.tableau[0][0].id, reserve_card.id);
    }

    // ---- Stock order consistency ----
    #[test]
    fn stock_order_preserved_after_cycle_draw3() {
        let mut s = new_game(3);
        let initial_ids: Vec<_> = s.stock.iter().map(|c| c.id.clone()).collect();
        while !s.stock.is_empty() {
            s = draw_from_stock(&s).unwrap();
        }
        s = redeal_stock(&s).unwrap();
        let final_ids: Vec<_> = s.stock.iter().map(|c| c.id.clone()).collect();
        assert_eq!(final_ids, initial_ids);
    }

    #[test]
    fn stock_order_preserved_after_cycle_draw1() {
        let mut s = new_game(1);
        let initial_ids: Vec<_> = s.stock.iter().map(|c| c.id.clone()).collect();
        while !s.stock.is_empty() {
            s = draw_from_stock(&s).unwrap();
        }
        s = redeal_stock(&s).unwrap();
        let final_ids: Vec<_> = s.stock.iter().map(|c| c.id.clone()).collect();
        assert_eq!(final_ids, initial_ids);
    }
}
