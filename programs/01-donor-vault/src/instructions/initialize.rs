use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: add the accounts this instruction needs.
}

/// Create the singleton vault PDA that receives donations and tracks the unique
/// donor count. Mirrors the Solidity constructor.
pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
    // TODO: implement.
    todo!()
}
