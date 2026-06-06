use canfield_engine::{self as engine, GameState, ZoneId};
use wasm_bindgen::prelude::*;

fn parse_state(json: &str) -> Option<GameState> {
    serde_json::from_str(json).ok()
}

fn to_json(state: GameState) -> String {
    serde_json::to_string(&state).unwrap()
}

#[wasm_bindgen]
pub fn new_game(draw_count: u8) -> String {
    to_json(engine::new_game(draw_count))
}

#[wasm_bindgen]
pub fn draw_from_stock(state_json: &str) -> Option<String> {
    let state = parse_state(state_json)?;
    engine::draw_from_stock(&state).map(to_json)
}

#[wasm_bindgen]
pub fn redeal_stock(state_json: &str) -> Option<String> {
    let state = parse_state(state_json)?;
    engine::redeal_stock(&state).map(to_json)
}

#[wasm_bindgen]
pub fn move_to_foundation(state_json: &str, source_zone: &str, foundation_index: usize) -> Option<String> {
    let state = parse_state(state_json)?;
    let zone = ZoneId::parse(source_zone)?;
    engine::move_to_foundation(&state, zone, foundation_index).map(to_json)
}

#[wasm_bindgen]
pub fn move_tableau_to_tableau(
    state_json: &str,
    from_col: usize,
    from_index: usize,
    to_col: usize,
) -> Option<String> {
    let state = parse_state(state_json)?;
    engine::move_tableau_to_tableau(&state, from_col, from_index, to_col).map(to_json)
}

#[wasm_bindgen]
pub fn move_to_tableau(state_json: &str, source_zone: &str, to_col: usize) -> Option<String> {
    let state = parse_state(state_json)?;
    let zone = ZoneId::parse(source_zone)?;
    engine::move_to_tableau(&state, zone, to_col).map(to_json)
}

#[wasm_bindgen]
pub fn auto_move_to_foundation(state_json: &str, source_zone: &str) -> Option<String> {
    let state = parse_state(state_json)?;
    let zone = ZoneId::parse(source_zone)?;
    engine::auto_move_to_foundation(&state, zone).map(to_json)
}

#[wasm_bindgen]
pub fn check_win(state_json: &str) -> bool {
    parse_state(state_json)
        .map(|s| engine::check_win(&s))
        .unwrap_or(false)
}

#[wasm_bindgen]
pub fn first_face_up_index_in_col(state_json: &str, col: usize) -> usize {
    parse_state(state_json)
        .map(|s| engine::first_face_up_index(&s.tableau[col]))
        .unwrap_or(0)
}
