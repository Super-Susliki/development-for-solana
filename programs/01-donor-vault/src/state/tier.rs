use anchor_lang::prelude::*;

/// Loyalty tier of a donor. The variant order is the on-chain/return encoding —
/// don't change it.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Tier {
    None,
    Bronze,
    Silver,
    Gold,
    Platinum,
}

impl Tier {
    // TODO: map a cumulative total (in lamports) to a tier. The boundaries are
    // in TASK.md — mind which edges are inclusive vs exclusive.
    pub fn from_total(_total: u64) -> Self {
        todo!()
    }
}
