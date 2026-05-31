use anchor_lang::prelude::*;

/// Loyalty tier of a donor. Order is fixed and must not change
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Tier {
    None,
    Bronze,
    Silver,
    Gold,
    Platinum,
}
