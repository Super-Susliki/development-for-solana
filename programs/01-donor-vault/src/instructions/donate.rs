use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Donate<'info> {
    // TODO: add the accounts this instruction needs.
}

/// Record a donation: move `amount` lamports into the vault, store this entry
/// as a new `Donation` account, and update the donor's running total and count.
/// Must revert `ZeroDonation` when `amount == 0`.
pub fn donate(_ctx: Context<Donate>, _amount: u64, _message: String) -> Result<()> {
    // TODO: implement.
    todo!()
}
