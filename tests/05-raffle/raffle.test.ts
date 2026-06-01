import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, timeTravel } from "../helpers";
import { setupRaffle, deposit, RaffleFixture } from "./fixture";

describe("05-raffle", () => {
  let env: RaffleFixture;

  // TODO(you): derive the per-entry PDA (seeded by its zero-based index).
  const entryPda = (_index: number): PublicKey => {
    throw new Error("TODO: derive the entry PDA");
  };

  before(async () => {
    env = await setupRaffle();
  });

  it("draws a weighted winner who takes the whole pot", async () => {
    const { context, program, raffle, vault, oracle, drawTime, entrants } = env;

    // Everyone enters.
    for (let i = 0; i < entrants.length; i++) {
      await deposit(env, i, entrants[i], entryPda(i));
    }
    const pot = entrants.reduce((sum, e) => sum.add(e.weight), new BN(0));

    // The entry window closes.
    await timeTravel(context, BigInt(drawTime.addn(1).toString()));

    // Mock the oracle: it (and only it) calls back with a random value. The
    // program verifies the signer — a key we don't control would be rejected.
    const randomness = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) & 0xff);
    const consumeIx = await program.methods
      .consumeRandomness(randomness)
      .accountsPartial({ raffle, oracle: oracle.publicKey })
      .instruction();
    await sendIxs(context, [oracle], consumeIx);

    // The winning ticket is now fixed on-chain. Find whose range contains it —
    // the program's job is to verify the index, not to search for it.
    const ticket = (await program.account.raffle.fetch(raffle)).winningTicket;
    let winnerIndex = -1;
    for (let i = 0; i < entrants.length; i++) {
      const e = await program.account.entry.fetch(entryPda(i));
      if (ticket.gte(e.rangeStart) && ticket.lt(e.rangeEnd)) {
        winnerIndex = i;
        break;
      }
    }
    assert.isAtLeast(winnerIndex, 0, "winning ticket fell outside every range");
    const winner = entrants[winnerIndex];

    const claimIx = await program.methods
      .claim(new BN(winnerIndex))
      .accountsPartial({
        raffle,
        vault,
        entry: entryPda(winnerIndex),
        winnerAta: winner.ata,
        winner: winner.keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    await sendIxs(context, [winner.keypair], claimIx);

    const acc = await context.banksClient.getAccount(winner.ata);
    const balance = AccountLayout.decode(acc!.data).amount;
    assert.equal(balance.toString(), pot.toString());
  });
});
