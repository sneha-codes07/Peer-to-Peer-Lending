#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

#[test]
fn test_create_loan() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let borrower = Address::generate(&env);
    client.init();

    let loan_id = client.create_loan(
        &borrower,
        &1000i128,
        &500u32,
        &30u32,
        &String::from_str(&env, "Business startup"),
    );

    assert_eq!(loan_id, 1);

    let loan = client.get_loan(&1);
    assert!(loan.is_some());
    let loan = loan.unwrap();
    assert_eq!(loan.borrower, borrower);
    assert_eq!(loan.amount, 1000i128);
    assert_eq!(loan.interest_rate, 500u32);
    assert_eq!(loan.duration, 30u32);
    assert_eq!(loan.status, String::from_str(&env, "active"));
}

#[test]
fn test_fund_loan() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let borrower = Address::generate(&env);
    let lender = Address::generate(&env);
    client.init();

    client.create_loan(
        &borrower,
        &1000i128,
        &500u32,
        &30u32,
        &String::from_str(&env, "Test"),
    );

    client.fund_loan(&1, &lender, &500i128);

    let loan = client.get_loan(&1).unwrap();
    assert_eq!(loan.funded_amount, 500i128);
    assert_eq!(loan.status, String::from_str(&env, "active"));

    client.fund_loan(&1, &lender, &500i128);

    let loan = client.get_loan(&1).unwrap();
    assert_eq!(loan.funded_amount, 1000i128);
    assert_eq!(loan.status, String::from_str(&env, "funded"));
}

#[test]
fn test_repay_loan() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let borrower = Address::generate(&env);
    let lender = Address::generate(&env);
    client.init();

    client.create_loan(
        &borrower,
        &1000i128,
        &500u32,
        &30u32,
        &String::from_str(&env, "Test"),
    );
    client.fund_loan(&1, &lender, &1000i128);

    // Repay full amount with interest (1000 + 5% = 1050)
    client.repay_loan(&1, &borrower, &1050i128);

    let loan = client.get_loan(&1).unwrap();
    assert_eq!(loan.repaid_amount, 1050i128);
    assert_eq!(loan.status, String::from_str(&env, "repaid"));
}
