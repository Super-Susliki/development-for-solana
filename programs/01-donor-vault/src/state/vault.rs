use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    // TODO: a singleton account. What one count does it track across all donors?
    // (It also physically holds the donated lamports.)
}
