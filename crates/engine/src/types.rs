use serde::{Deserialize, Serialize};

pub type Rank = u8; // 1–13

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
}

impl Suit {
    pub fn color(self) -> Color {
        match self {
            Suit::Hearts | Suit::Diamonds => Color::Red,
            Suit::Clubs | Suit::Spades => Color::Black,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Color {
    Red,
    Black,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: String,
    pub suit: Suit,
    pub rank: Rank,
    pub face_up: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ZoneId {
    Stock,
    Waste,
    Reserve,
    Foundation(usize),
    Tableau(usize),
}

impl ZoneId {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "stock" => Some(Self::Stock),
            "waste" => Some(Self::Waste),
            "reserve" => Some(Self::Reserve),
            _ if s.starts_with("foundation_") => {
                let idx: usize = s["foundation_".len()..].parse().ok()?;
                Some(Self::Foundation(idx))
            }
            _ if s.starts_with("tableau_") => {
                let idx: usize = s["tableau_".len()..].parse().ok()?;
                Some(Self::Tableau(idx))
            }
            _ => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameState {
    pub base_rank: Rank,
    pub foundation_suits: Vec<Suit>,
    pub foundations: Vec<Vec<Card>>,
    pub tableau: Vec<Vec<Card>>,
    pub reserve: Vec<Card>,
    pub stock: Vec<Card>,
    pub waste: Vec<Card>,
    pub draw_count: u8,
    pub moves: u32,
    pub elapsed_ms: u64,
    pub won: bool,
}
