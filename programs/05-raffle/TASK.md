# 05 — Raffle (VRF)

Players deposit a token to enter. The more you deposit, the better your odds.
After a deadline, a **verifiably random** draw picks one weighted winner, who
takes the whole pot. Randomness comes from **MagicBlock VRF**
(`ephemeral-vrf-sdk`): you ask for it, and the oracle calls back later with the
answer. (This is the Solana counterpart of the Solidity `06-raffle`.)

This module ships as a **starter** — the design is yours to figure out.

## What you're given

- `src/lib.rs` — the program's five instructions.
- `src/constants.rs` — the seeds.
- `tests/05-raffle/fixture.ts` + `raffle.test.ts` — one happy-path test: two
  weighted deposits, the deadline passes, a mocked draw, and the winner is paid.
  It leans on the stubs you fill in.

## What you implement

- The program: account layouts, errors, and the logic for all five instructions.
- The per-entry PDA derivation left as `TODO` in the test.
- The rest of the tests (the losing entry can't claim, claiming twice, claiming
  before the draw, depositing after the deadline, someone else's entry, etc.).

## Flow

1. **Initialize** — open the raffle: record the deposit token, the deadline,
   and who the trusted oracle is.
2. **Deposit** — enter with some tokens while the raffle is open. Each deposit
   is its own entry; its weight is its size.
3. **Request randomness** — after the deadline, ask the oracle to draw. Once.
4. **Consume randomness** — the oracle's callback delivers the random value.
   This is where the winner is decided.
5. **Claim** — the winner presents the winning entry and takes the pot. Once.

## Constraints

The draw must be fair: a deposit's chance of winning is proportional to its
size, and nobody — not a player, not a validator, not whoever triggers the
draw — can bias or predict the result. Work out the data structure that lets the
winner prove they won without the program iterating over every entry.

A random value is only trustworthy if it genuinely came from the oracle. The
program must verify that itself — anyone can *call* the callback. In production
the oracle is MagicBlock's VRF identity; the tests stand in a key they control
to mock the response, but the verification you write is the real thing.
