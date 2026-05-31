use anchor_lang::prelude::*;

/// Per-donor summary — the analogue of indexing `mapping(address => ...)` by
/// `msg.sender`. One PDA per address.
#[account]
#[derive(InitSpace)]
pub struct DonorRecord {
    // TODO: add the fields this account needs.
}
