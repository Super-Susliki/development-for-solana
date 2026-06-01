use anchor_lang::prelude::*;

use crate::state::Tier;

#[derive(Accounts)]
pub struct TierOf<'info> {
    // TODO: a read-only "view" — you need the donor (only to derive the PDA) and
    // their donor record.
}

pub fn tier_of(_ctx: Context<TierOf>) -> Result<Tier> {
    // TODO: return the donor's tier from their total. Anchor sends the value back
    // as return data; the test reads it from a simulated call.
    todo!()
}
