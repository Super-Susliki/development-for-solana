use anchor_lang::prelude::*;

use crate::constants::MAX_MESSAGE_LEN;

/// A single donation, stored in its own account (one PDA per donation, seeded
/// by the donor and a zero-based index). `InitSpace` + `#[max_len]` keep it
/// fixed-size. The `amount, timestamp, message` field order is part of the spec.
#[account]
#[derive(InitSpace)]
pub struct Donation {
    pub amount: u64,
    pub timestamp: i64,
    #[max_len(MAX_MESSAGE_LEN)]
    pub message: String,
}
