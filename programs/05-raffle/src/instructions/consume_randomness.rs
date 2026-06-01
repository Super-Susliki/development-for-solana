use anchor_lang::prelude::*;

// The oracle's callback. Whoever calls this is claiming to be the oracle —
// don't take their word for it.
#[derive(Accounts)]
pub struct ConsumeRandomness<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn consume_randomness(_ctx: Context<ConsumeRandomness>, _randomness: [u8; 32]) -> Result<()> {
    // TODO: implement.
    todo!()
}
