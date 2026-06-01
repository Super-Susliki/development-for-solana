use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Donation {
    // TODO: a single gift — what's worth recording about it?
    // Hint: a String field needs `#[max_len(MAX_MESSAGE_LEN)]` so the account
    // stays a fixed size.
}
