#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Loan {
    pub borrower: Address,
    pub amount: i128,
    pub interest_rate: u32,
    pub duration: u32,
    pub purpose: String,
    pub funded_amount: i128,
    pub repaid_amount: i128,
    pub status: String,
}

#[contracttype]
pub enum DataKey {
    Loans,
    LoanCount,
    LenderLoans,
    BorrowerLoans,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env) {
        env.storage()
            .instance()
            .set(&DataKey::Loans, &Map::<u32, Loan>::new(&env));
        env.storage().instance().set(&DataKey::LoanCount, &0u32);
        env.storage()
            .instance()
            .set(&DataKey::LenderLoans, &Map::<Address, Vec<u32>>::new(&env));
        env.storage().instance().set(
            &DataKey::BorrowerLoans,
            &Map::<Address, Vec<u32>>::new(&env),
        );
    }

    pub fn create_loan(
        env: Env,
        borrower: Address,
        amount: i128,
        interest_rate: u32,
        duration: u32,
        purpose: String,
    ) -> u32 {
        borrower.require_auth();
        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LoanCount)
            .unwrap_or(0);
        count += 1;

        let loan = Loan {
            borrower: borrower.clone(),
            amount,
            interest_rate,
            duration,
            purpose,
            funded_amount: 0,
            repaid_amount: 0,
            status: String::from_str(&env, "active"),
        };

        let mut loans: Map<u32, Loan> = env.storage().instance().get(&DataKey::Loans).unwrap();
        loans.set(count, loan);

        let mut borrower_loans: Map<Address, Vec<u32>> = env
            .storage()
            .instance()
            .get(&DataKey::BorrowerLoans)
            .unwrap();
        let mut loans_list = borrower_loans
            .get(borrower.clone())
            .unwrap_or(Vec::new(&env));
        loans_list.push_back(count);
        borrower_loans.set(borrower, loans_list);

        env.storage().instance().set(&DataKey::Loans, &loans);
        env.storage().instance().set(&DataKey::LoanCount, &count);
        env.storage()
            .instance()
            .set(&DataKey::BorrowerLoans, &borrower_loans);
        count
    }

    pub fn fund_loan(env: Env, loan_id: u32, lender: Address, amount: i128) {
        lender.require_auth();
        let mut loans: Map<u32, Loan> = env.storage().instance().get(&DataKey::Loans).unwrap();
        let mut loan = loans.get(loan_id).expect("loan not found");

        assert!(
            loan.status == String::from_str(&env, "active"),
            "loan not active"
        );
        let new_funded = loan.funded_amount + amount;
        assert!(new_funded <= loan.amount, "exceeds loan amount");

        loan.funded_amount = new_funded;
        if new_funded >= loan.amount {
            loan.status = String::from_str(&env, "funded");
        }
        loans.set(loan_id, loan);

        let mut lender_loans: Map<Address, Vec<u32>> =
            env.storage().instance().get(&DataKey::LenderLoans).unwrap();
        let mut loans_list = lender_loans.get(lender.clone()).unwrap_or(Vec::new(&env));
        if !loans_list.contains(&loan_id) {
            loans_list.push_back(loan_id);
            lender_loans.set(lender, loans_list);
        }

        env.storage().instance().set(&DataKey::Loans, &loans);
        env.storage()
            .instance()
            .set(&DataKey::LenderLoans, &lender_loans);
    }

    pub fn repay_loan(env: Env, loan_id: u32, borrower: Address, amount: i128) {
        borrower.require_auth();
        let mut loans: Map<u32, Loan> = env.storage().instance().get(&DataKey::Loans).unwrap();
        let mut loan = loans.get(loan_id).expect("loan not found");

        assert!(loan.borrower == borrower, "not borrower");
        assert!(
            loan.status == String::from_str(&env, "funded"),
            "loan not funded"
        );

        let total_due = loan.amount + (loan.amount * loan.interest_rate as i128 / 10000);
        let new_repaid = loan.repaid_amount + amount;

        loan.repaid_amount = new_repaid;
        if new_repaid >= total_due {
            loan.status = String::from_str(&env, "repaid");
        }
        loans.set(loan_id, loan);
        env.storage().instance().set(&DataKey::Loans, &loans);
    }

    pub fn get_loan(env: Env, loan_id: u32) -> Option<Loan> {
        let loans: Map<u32, Loan> = env.storage().instance().get(&DataKey::Loans).unwrap();
        loans.get(loan_id)
    }

    pub fn get_borrower_loans(env: Env, borrower: Address) -> Vec<u32> {
        let borrower_loans: Map<Address, Vec<u32>> = env
            .storage()
            .instance()
            .get(&DataKey::BorrowerLoans)
            .unwrap();
        borrower_loans.get(borrower).unwrap_or(Vec::new(&env))
    }

    pub fn get_lender_loans(env: Env, lender: Address) -> Vec<u32> {
        let lender_loans: Map<Address, Vec<u32>> =
            env.storage().instance().get(&DataKey::LenderLoans).unwrap();
        lender_loans.get(lender).unwrap_or(Vec::new(&env))
    }

    pub fn get_all_loans(env: Env) -> Vec<u32> {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::LoanCount)
            .unwrap_or(0);
        let mut ids = Vec::new(&env);
        for i in 1..=count {
            ids.push_back(i);
        }
        ids
    }
}

mod test;
