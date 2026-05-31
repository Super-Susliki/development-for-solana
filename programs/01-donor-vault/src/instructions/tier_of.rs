use anchor_lang::prelude::*;

use crate::state::Tier;

#[derive(Accounts)]
pub struct TierOf<'info> {
    // TODO: add the accounts this instruction needs.
}

/// View: the donor's current tier, derived from their cumulative total. Called
/// off-chain with `.view()` (a simulation that returns data).
pub fn tier_of(_ctx: Context<TierOf>) -> Result<Tier> {
    // TODO: implement.
    todo!()
}
