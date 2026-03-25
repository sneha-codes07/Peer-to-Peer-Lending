"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CARCETSXEE3C7U3YKTLD3V7TOKDGDFXMEYQ34J5NFJGG5TWFVYB3KRWT";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    return simulated;
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey();
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

export function toScValSymbol(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}

export function toScValU64(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

// ============================================================
// P2P Lending — Contract Methods
// ============================================================

/**
 * Initialize the contract (setup storage).
 */
export async function initContract(caller: string) {
  return callContract("init", [], caller, true);
}

/**
 * Create a loan request.
 * create_loan(borrower: Address, amount: i128, interest_rate: u32, duration: u32, purpose: String) -> u32
 */
export async function createLoan(
  caller: string,
  amount: bigint,
  interestRate: number,
  duration: number,
  purpose: string
) {
  return callContract(
    "create_loan",
    [
      toScValAddress(caller),
      toScValI128(amount),
      toScValU32(interestRate),
      toScValU32(duration),
      toScValString(purpose),
    ],
    caller,
    true
  );
}

/**
 * Fund a loan.
 * fund_loan(loan_id: u32, lender: Address, amount: i128)
 */
export async function fundLoan(
  caller: string,
  loanId: number,
  amount: bigint
) {
  return callContract(
    "fund_loan",
    [toScValU32(loanId), toScValAddress(caller), toScValI128(amount)],
    caller,
    true
  );
}

/**
 * Repay a loan.
 * repay_loan(loan_id: u32, borrower: Address, amount: i128)
 */
export async function repayLoan(
  caller: string,
  loanId: number,
  amount: bigint
) {
  return callContract(
    "repay_loan",
    [toScValU32(loanId), toScValAddress(caller), toScValI128(amount)],
    caller,
    true
  );
}

/**
 * Get loan details (read-only).
 * get_loan(loan_id: u32) -> Option<Loan>
 */
export async function getLoan(loanId: number, caller?: string) {
  return readContract("get_loan", [toScValU32(loanId)], caller);
}

/**
 * Get loans by borrower (read-only).
 * get_borrower_loans(borrower: Address) -> Vec<u32>
 */
export async function getBorrowerLoans(borrower: string, caller?: string) {
  return readContract("get_borrower_loans", [toScValAddress(borrower)], caller);
}

/**
 * Get loans by lender (read-only).
 * get_lender_loans(lender: Address) -> Vec<u32>
 */
export async function getLenderLoans(lender: string, caller?: string) {
  return readContract("get_lender_loans", [toScValAddress(lender)], caller);
}

/**
 * Get all loan IDs (read-only).
 * get_all_loans() -> Vec<u32>
 */
export async function getAllLoans(caller?: string) {
  return readContract("get_all_loans", [], caller);
}

export { nativeToScVal, scValToNative, Address, xdr };
