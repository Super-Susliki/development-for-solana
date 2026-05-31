# 01 — Donor Tiers Vault

The Solana/Anchor counterpart of the Ethereum `DonorVault` task. This module
ships **fully implemented** as the reference example for the template: read it
to see how an Anchor program, PDAs, one-account-per-item storage, and a bankrun
test suite fit together. Later modules (`02`–`06`) are stubs for you to
implement.

## The scenario

The contract layer for a charity platform. Anyone can send funds along with a
short message; the program classifies each donor by their cumulative
contribution and stores their full history as fetchable accounts.

## Ethereum → Solana

The original task is written for Solidity. The faithful Solana translation:

| Solidity                          | This program                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `msg.value` (ETH in wei)          | an explicit lamport `amount` transferred into the vault PDA           |
| `1 ether`                         | `1 SOL` = 1,000,000,000 lamports                                      |
| `mapping(address => Donation[])`  | a `DonorRecord` PDA per address + one `Donation` PDA per donation     |
| dynamic storage array             | one fixed-size account per donation, PDA-seeded by `(donor, index)`   |
| `revert ZeroDonation()`           | `require!(amount > 0, DonorVaultError::ZeroDonation)`                 |
| a `view` that *computes*          | one instruction returning a value, called with `.view()` (`tier_of`)  |
| a `view` that *reads storage*     | no instruction — the client just fetches the account                  |

On Solana you don't grow one account to hold an unbounded list — you give each
item its own account. So a donation is its own PDA, seeded by the donor and a
zero-based index (`DonorRecord.donation_count`). Account sizes come from
`#[derive(InitSpace)]` (+ `#[max_len]` on the message), never hand-counted.

## What it does

- `initialize()` — creates the singleton `vault` PDA that receives donations and
  holds the unique donor count. (Solidity's constructor.)
- `donate(amount, message)` — transfers `amount` lamports into the vault,
  creates a new `Donation { amount, timestamp, message }` account at the donor's
  next index, and adds to their cumulative total. Reverts `ZeroDonation` if
  `amount == 0`. The first donation from an address bumps the unique donor
  count; later donations from the same address do not.
- `tier_of(donor)` — the donor's `Tier`, derived from their cumulative total.
  This is the **only** getter: the tier is computed, not stored.

Everything else the frontend reads by fetching accounts directly — there is no
point adding on-chain getters that just hand back stored bytes:

| You want…                | Fetch…                                            |
| ------------------------ | ------------------------------------------------- |
| total donated by an addr | `DonorRecord.total`                               |
| number of donations      | `DonorRecord.donation_count`                      |
| a single donation        | the `Donation` PDA at `[b"donation", donor, i]`   |
| unique donor count       | `Vault.unique_donor_count`                        |

## Tiers

`Tier` is `{ None, Bronze, Silver, Gold, Platinum }` (this order is fixed — it
is the on-chain/IDL encoding). Boundaries are strict, on the cumulative total:

| Tier     | Cumulative total            |
| -------- | --------------------------- |
| None     | `total == 0`                |
| Bronze   | `0 < total < 0.1 SOL`       |
| Silver   | `0.1 SOL ≤ total < 1 SOL`   |
| Gold     | `1 SOL ≤ total < 10 SOL`    |
| Platinum | `10 SOL ≤ total`            |

Boundary checks: `0` → None, `1` lamport → Bronze, exactly `0.1 SOL` → Silver,
exactly `10 SOL` → Platinum.

## Accounts / PDAs

| PDA            | Seeds                              | Purpose                              |
| -------------- | --------------------------------- | ------------------------------------ |
| `vault`        | `[b"vault"]`                      | unique donor count; receives lamports |
| `donor_record` | `[b"donor", donor_key]`          | one donor's total + donation count   |
| `donation`     | `[b"donation", donor_key, index]` | a single donation (index is `u64` LE) |

## Specification (authoritative)

Exact, unambiguous contract — the source of truth for grading.

**Program:** module `donor_vault`, id `GhAdtT9Vd5Gst89DyG8jShfgygJUdNcoQGGS5fGyZUVT`.

### Seeds (byte literals)

| PDA            | Seeds                                                              |
| -------------- | ----------------------------------------------------------------- |
| `vault`        | `[b"vault"]`                                                      |
| `donor_record` | `[b"donor", donor.key().as_ref()]`                               |
| `donation`     | `[b"donation", donor.key().as_ref(), index.to_le_bytes()]`       |

- `donor.key()` is the donor's 32-byte pubkey.
- `index` is a **`u64` little-endian, 8 bytes**, equal to the donor's
  `donation_count` at the moment of the donation (0-based, contiguous).

### Constants

| Name              | Value (lamports) |
| ----------------- | ---------------- |
| `TENTH_SOL`       | `100_000_000`    |
| `ONE_SOL`         | `1_000_000_000`  |
| `TEN_SOL`         | `10_000_000_000` |
| `MAX_MESSAGE_LEN` | `200` (bytes)    |

### State accounts

Each account carries Anchor's 8-byte discriminator prefix; sizes via
`#[derive(InitSpace)]`.

```rust
#[account] pub struct Vault       { pub unique_donor_count: u64 }
#[account] pub struct DonorRecord { pub donor: Pubkey, pub total: u64, pub donation_count: u64 }
#[account] pub struct Donation    { pub amount: u64, pub timestamp: i64, pub message: String } // #[max_len(200)]
```

Field order is fixed (it is the on-chain layout). `Donation` field order
`amount, timestamp, message` is part of the spec.

### Tier enum

Fieldless enum; variant index is its on-chain/return encoding.

| Variant  | Index | Condition on cumulative `total` (lamports) |
| -------- | ----- | ------------------------------------------ |
| None     | 0     | `total == 0`                               |
| Bronze   | 1     | `0 < total < TENTH_SOL`                    |
| Silver   | 2     | `TENTH_SOL <= total < ONE_SOL`             |
| Gold     | 3     | `ONE_SOL <= total < TEN_SOL`               |
| Platinum | 4     | `total >= TEN_SOL`                         |

### Instructions

```
initialize()
  accounts:
    vault          init, payer=payer, seeds=[b"vault"], bump
    payer          mut, signer
    system_program
  effect: vault.unique_donor_count = 0

donate(amount: u64, message: String)
  accounts:
    vault          mut, seeds=[b"vault"], bump
    donor_record   init_if_needed, payer=donor, seeds=[b"donor", donor], bump
    donation       init, payer=donor, seeds=[b"donation", donor, donor_record.donation_count.to_le_bytes()], bump
    donor          mut, signer
    system_program
  checks (in order):
    require amount > 0                         else ZeroDonation
    require message.len() <= MAX_MESSAGE_LEN    else MessageTooLong
  effects:
    transfer `amount` lamports donor -> vault (System Program CPI)
    donation.amount    = amount
    donation.timestamp = Clock::get().unix_timestamp
    donation.message   = message
    if donor_record is new (donor_record.donor == Pubkey::default()):
        donor_record.donor = donor.key()
        vault.unique_donor_count += 1
    donor_record.total          += amount   (checked)
    donor_record.donation_count += 1         (checked)

tier_of() -> Tier
  accounts:
    donor          unchecked (seed source only)
    donor_record   seeds=[b"donor", donor], bump
  returns: Tier::from_total(donor_record.total) as return data
           (single byte = variant index)
```

### Errors (`DonorVaultError`, Anchor codes from 6000)

| Code   | Hex      | Variant        | Message                                      |
| ------ | -------- | -------------- | -------------------------------------------- |
| `6000` | `0x1770` | `ZeroDonation` | donation amount must be greater than zero    |
| `6001` | `0x1771` | `MessageTooLong` | message exceeds the maximum allowed length |
| `6002` | `0x1772` | `Overflow`     | arithmetic overflow                          |

### Invariants

- `unique_donor_count` increments **exactly once per distinct donor address**,
  on that address's first donation only.
- `donation_count` increments by 1 per donation; donation PDA indices are
  contiguous starting at 0.
- `donor_record.total` equals the sum of all that donor's donation `amount`s.
- The `vault` account's lamports increase by `amount` on each `donate`.
- A `donate` with `amount == 0` reverts with `ZeroDonation` (6000) and changes
  no state.
- A donor's `Tier` is a pure function of `donor_record.total` per the table above.

## Run it

```bash
npm run test:donorVault
```

## Notes

- A non-existent `donor_record` means the address has never donated — the
  client treats that absence as `None` / count `0`, the same default a Solidity
  mapping would return. `tier_of` requires the record to exist, so call it only
  for addresses that have donated.
- Each donation is its own fixed-size account, paid for and rent-funded by the
  donor; there is no `realloc`. Index `i` is always at
  `[b"donation", donor, i]`, so the frontend can fetch any donation directly.
- `init_if_needed` is enabled so a donor's record is created on first donation;
  each `donation` account uses plain `init` (a fresh account every time).
