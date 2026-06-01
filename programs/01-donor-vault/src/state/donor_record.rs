use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DonorRecord {
    // TODO: one record per donor. What do you need to remember between their
    // donations? (e.g. a running total, and how many donations they've made.)
}
