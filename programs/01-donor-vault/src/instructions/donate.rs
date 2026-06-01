use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Donate<'info> {
    // TODO: a donation spans a few accounts — the vault, a per-donor record
    // (created lazily the first time, so `init_if_needed`), and a fresh
    // per-donation account seeded by the donor's current count. Plus the donor
    // (mut signer) and the System program.
}

pub fn donate(_ctx: Context<Donate>, _amount: u64, _message: String) -> Result<()> {
    // TODO: validate first, then move the lamports into the vault (a System
    // transfer CPI), fill the donation account, and update the donor's totals.
    // Hint: only a donor's FIRST donation should bump the unique donor count.
    todo!()
}
