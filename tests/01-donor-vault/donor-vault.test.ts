import { Program, BN } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { assert } from "chai";

import { DonorVault } from "../../target/types/donor_vault";
import idl from "../../target/idl/donor_vault.json";
import {
  initBankrun,
  processTransaction,
  expectReverted,
  findPDA,
  toBN,
  sol,
} from "../helpers";

describe("01-donor-vault", () => {
  let context: ProgramTestContext;
  let program: Program<DonorVault>;
  let accounts: Keypair[];
  let payer: Keypair;

  let vault: PublicKey;

  const donorRecord = (donor: PublicKey) =>
    findPDA(["donor", donor], program)[0];

  const donationPda = (donor: PublicKey, index: number) =>
    findPDA(
      ["donation", donor, toBN(index).toArrayLike(Buffer, "le", 8)],
      program,
    )[0];

  // Build the donate instruction and run it through the bank.
  const donate = async (
    donor: Keypair,
    index: number,
    amount: BN,
    message: string,
  ) => {
    const ix = await program.methods
      .donate(amount, message)
      .accounts({
        vault,
        donorRecord: donorRecord(donor.publicKey),
        donation: donationPda(donor.publicKey, index),
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    await processTransaction(context, new Transaction().add(ix), [donor]);
  };

  // tier_of is the only on-chain getter (a computed value); read it via .view().
  const tierOf = (donor: PublicKey) =>
    program.methods
      .tierOf()
      .accounts({ donor, donorRecord: donorRecord(donor) })
      .view();

  before(async () => {
    ({ context, program, accounts } = await initBankrun(idl as DonorVault));
    payer = context.payer;

    vault = findPDA(["vault"], program)[0];

    const ix = await program.methods
      .initialize()
      .accounts({
        vault,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    await processTransaction(context, new Transaction().add(ix), [payer]);
  });

  it("starts with zero unique donors", async () => {
    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 0);
  });

  it("records a donation and classifies a tiny donor as Bronze", async () => {
    await donate(payer, 0, toBN(1), "first gift");

    assert.property(await tierOf(payer.publicKey), "bronze");

    const rec = await program.account.donorRecord.fetch(
      donorRecord(payer.publicKey),
    );
    assert.equal(rec.total.toNumber(), 1);
    assert.equal(rec.donationCount.toNumber(), 1);

    const donation = await program.account.donation.fetch(
      donationPda(payer.publicKey, 0),
    );
    assert.equal(donation.amount.toNumber(), 1);
    assert.equal(donation.message, "first gift");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 1);
  });

  it("does not double-count a repeat donor, and accumulates the total", async () => {
    await donate(payer, 1, toBN(9), "second gift");

    const rec = await program.account.donorRecord.fetch(
      donorRecord(payer.publicKey),
    );
    assert.equal(rec.donationCount.toNumber(), 2);
    assert.equal(rec.total.toNumber(), 10);

    // Each donation kept its own account.
    const second = await program.account.donation.fetch(
      donationPda(payer.publicKey, 1),
    );
    assert.equal(second.message, "second gift");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 1, "repeat donor must not bump the count");
  });

  it("counts a second distinct donor and applies the Silver boundary", async () => {
    const donor = accounts[0];

    // Exactly 0.1 SOL is the first amount that counts as Silver (not Bronze).
    await donate(donor, 0, sol(0.1), "to silver");

    assert.property(await tierOf(donor.publicKey), "silver");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 2);
  });

  it("rejects a zero donation", async () =>
    expectReverted(
      { revertedWith: { message: "ZeroDonation" } },
      donate(payer, 2, toBN(0), "nothing"),
    ));
});
