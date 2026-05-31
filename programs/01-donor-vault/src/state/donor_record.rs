use anchor_lang::prelude::*;

/// Per-donor summary — the analogue of indexing `mapping(address => ...)` by
/// `msg.sender`. One PDA per address. Holds the running total and the number of
/// donations; the donations themselves live in their own accounts.
#[account]
#[derive(InitSpace)]
pub struct DonorRecord {
    pub donor: Pubkey,
    pub total: u64,
    pub donation_count: u64,
}
