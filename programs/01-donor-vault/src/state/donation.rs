use anchor_lang::prelude::*;

/// A single donation, stored in its own account (one PDA per donation).
#[account]
#[derive(InitSpace)]
pub struct Donation {
    // TODO: add the fields this account needs.
}
