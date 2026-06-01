use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: create the singleton vault PDA here.
    // Hint: the vault (init, seeded), whoever pays (mut signer), and the System
    // program.
}

pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
    // TODO: set the vault's starting state.
    todo!()
}
