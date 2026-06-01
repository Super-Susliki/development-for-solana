import { BN, Program } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { Raffle } from "../../target/types/raffle";
import idl from "../../target/idl/raffle.json";
import {
  initBankrun,
  createMintAndFund,
  processTransaction,
  sendIxs,
  oneToken,
  findPDA,
  getTime,
} from "../helpers";

export interface RaffleFixture {
  context: ProgramTestContext;
  program: Program<Raffle>;
  payer: Keypair;
  mint: PublicKey;
  raffle: PublicKey;
  vault: PublicKey;
  // The trusted oracle. In production this is MagicBlock's VRF identity; here
  // it's a key the tests control so they can mock the oracle's callback.
  oracle: Keypair;
  drawTime: BN;
  // Each entrant, funded with `weights[i]` tokens of `mint`.
  entrants: { keypair: Keypair; ata: PublicKey; weight: BN }[];
}

/**
 * Boot a fresh raffle: bankrun, a deposit-token mint, two entrants funded with
 * different weights, and `initialize` called with the deadline + trusted oracle.
 */
export const setupRaffle = async (): Promise<RaffleFixture> => {
  const { context, program, accounts } = await initBankrun(idl as Raffle);
  const payer = context.payer;
  const oracle = Keypair.generate();

  const raffle = findPDA(["raffle"], program)[0];
  const vault = findPDA(["vault"], program)[0];

  // A deposit-token mint (authority = payer), so we can fund each entrant.
  const { mint } = await createMintAndFund(
    context,
    payer,
    payer.publicKey,
    oneToken(),
  );

  const weights = [oneToken(), oneToken().muln(3)];
  const entrants = await Promise.all(
    accounts.slice(0, weights.length).map(async (keypair, i) => {
      const ata = getAssociatedTokenAddressSync(mint, keypair.publicKey);
      await sendIxs(
        context,
        [payer],
        createAssociatedTokenAccountInstruction(
          payer.publicKey,
          ata,
          keypair.publicKey,
          mint,
        ),
        createMintToInstruction(
          mint,
          ata,
          payer.publicKey,
          BigInt(weights[i].toString()),
        ),
      );
      return { keypair, ata, weight: weights[i] };
    }),
  );

  const drawTime = new BN((await getTime(context)).toString()).addn(3600);

  const initIx = await program.methods
    .initialize(drawTime, oracle.publicKey)
    .accountsPartial({
      mint,
      payer: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  await sendIxs(context, [payer], initIx);

  return { context, program, payer, mint, raffle, vault, oracle, drawTime, entrants };
};

/** Build + send a deposit for `entrant`'s entry at `index`. */
export const deposit = async (
  env: RaffleFixture,
  index: number,
  entrant: { keypair: Keypair; ata: PublicKey; weight: BN },
  entryPda: PublicKey,
) => {
  const { context, program, mint, raffle, vault } = env;
  const ix = await program.methods
    .deposit(entrant.weight)
    .accountsPartial({
      raffle,
      vault,
      entry: entryPda,
      depositorAta: entrant.ata,
      mint,
      depositor: entrant.keypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  await processTransaction(context, new Transaction().add(ix), [
    entrant.keypair,
  ]);
};
