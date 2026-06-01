use anchor_lang::prelude::*;

// Asks the VRF oracle for a random value. The oracle answers later by calling
// `consume_randomness` back. See the MagicBlock `ephemeral-vrf-sdk` crate.
#[derive(Accounts)]
pub struct RequestRandomness<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn request_randomness(_ctx: Context<RequestRandomness>) -> Result<()> {
    // TODO: implement.
    todo!()
}
