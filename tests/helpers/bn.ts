import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/** Coerce a number / string / bigint into an Anchor `BN`. */
export const toBN = (n: number | string | bigint) => new BN(n.toString());

/** Read a `BN` (or undefined) back as a `bigint` — safe past 2^53. */
export const fromBN = (bn?: BN) => BigInt((bn ?? 0).toString());

/** A SOL amount as a lamports `BN`, e.g. `sol(0.1)` → 100_000_000. */
export const sol = (amount: number) =>
  new BN(Math.round(amount * LAMPORTS_PER_SOL));
