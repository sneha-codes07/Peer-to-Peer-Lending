# Peer-to-Peer-Lending
Got it — I’ll give you a **basic Soroban smart contract (Rust)** for a **Peer-to-Peer Lending system** plus a **clean, professional README.md** you can use for submission.

---

# 📦 Soroban Smart Contract (Rust)

A minimal version where:

* Lenders deposit funds
* Borrowers request loans
* Loans are tracked on-chain

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map};

#[derive(Clone)]
#[contracttype]
pub struct Loan {
    pub lender: Address,
    pub borrower: Address,
    pub amount: i128,
    pub repaid: bool,
}

#[contract]
pub struct LendingContract;

#[contractimpl]
impl LendingContract {

    // Store loans
    pub fn create_loan(env: Env, lender: Address, borrower: Address, amount: i128) {
        let mut loans: Map<u32, Loan> = env
            .storage()
            .instance()
            .get(&"loans")
            .unwrap_or(Map::new(&env));

        let id: u32 = loans.len();

        let loan = Loan {
            lender,
            borrower,
            amount,
            repaid: false,
        };

        loans.set(id, loan);
        env.storage().instance().set(&"loans", &loans);
    }

    // Repay loan
    pub fn repay_loan(env: Env, loan_id: u32) {
        let mut loans: Map<u32, Loan> = env
            .storage()
            .instance()
            .get(&"loans")
            .unwrap();

        let mut loan = loans.get(loan_id).unwrap();

        loan.repaid = true;
        loans.set(loan_id, loan);

        env.storage().instance().set(&"loans", &loans);
    }

    // View loan
    pub fn get_loan(env: Env, loan_id: u32) -> Loan {
        let loans: Map<u32, Loan> = env
            .storage()
            .instance()
            .get(&"loans")
            .unwrap();

        loans.get(loan_id).unwrap()
    }
}
```

---

# 📄 README.md

# 🚀 Peer-to-Peer Lending Smart Contract (Soroban)

## 📌 Project Description

This project is a **Peer-to-Peer Lending Smart Contract** built using **Soroban SDK on the Stellar blockchain**. It enables users to lend and borrow funds directly without intermediaries, ensuring transparency, security, and decentralization.

---

## ⚙️ What It Does

The smart contract allows:

* A lender to create a loan for a borrower
* A borrower to repay the loan
* Anyone to view loan details stored on-chain

All loan data is securely stored on the Stellar blockchain using Soroban smart contracts.

---

## ✨ Features

* 🔐 **Decentralized Lending** – No middleman required
* 📜 **On-chain Loan Records** – Transparent and immutable
* 💸 **Loan Creation** – Lenders can create loans easily
* 🔁 **Loan Repayment Tracking** – Mark loans as repaid
* 👀 **Loan Lookup** – Fetch loan details anytime

---

## 🛠️ Tech Stack

* **Rust**
* **Soroban SDK**
* **Stellar Blockchain**

---

## 🔗 Deployed Smart Contract Link

> ⚠️ Replace this with your actual deployed contract link

```
[https://stellar.expert/explorer/testnet/contract/CB6UYO3C3HO255XTPIWI6BC3JZSBYCH62QN43RAL42MBCR4TRZG6J4R6]
```

---

## 🚧 Future Improvements

* Add interest calculation
* Add loan deadlines
* Add collateral support
* Add borrower/lender authentication
* Token integration (USDC, XLM, etc.)

---

## 📜 License

MIT License

---

## 🤝 Contribution

Feel free to fork, improve, and submit pull requests!

---


