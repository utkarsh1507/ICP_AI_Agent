use ic_cdk::api::{caller, time, print};
use ic_cdk_macros::{query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::{HashMap, BTreeMap};
use candid::{Principal, CandidType, Nat};
 
// ICRC-1 Standard types
#[derive(CandidType, Clone, Debug, Serialize, Deserialize, Eq, PartialEq, Hash)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<[u8; 32]>,
}

impl Default for Account {
    fn default() -> Self {
        Self {
            owner: Principal::anonymous(),
            subaccount: None,
        }
    }
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub struct TransferArgs {
    pub from_subaccount: Option<[u8; 32]>,
    pub to: Account,
    pub amount: Nat,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub enum TransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub enum TransferResult {
    Ok(Nat),
    Err(TransferError),
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub total_supply: Nat,
    pub owner: Principal,
    pub fee: Nat,
}

impl Default for Metadata {
    fn default() -> Self {
        Self {
            name: String::default(),
            symbol: String::default(),
            decimals: 8,
            description: None,
            logo: None,
            total_supply: Nat::from(0u64),
            owner: Principal::anonymous(),
            fee: Nat::from(0u64),
        }
    }
}

// Internal token state
#[derive(Clone, Debug, Default)]
pub struct TokenState {
    pub metadata: Metadata,
    pub balances: HashMap<Account, Nat>,
    pub transactions: Vec<Transaction>,
    pub transaction_counter: u64,
    pub minting_account: Account,
}

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct Transaction {
    pub id: u64,
    pub from: Account,
    pub to: Account,
    pub amount: Nat,
    pub timestamp: u64,
    pub memo: Option<Vec<u8>>,
}

thread_local! {
    static TOKEN_STATE: RefCell<Option<TokenState>> = RefCell::new(None);
}

// Initialize a new token
#[update]
pub fn icrc1_init(
    name: String,
    symbol: String,
    decimals: u8,
    description: Option<String>,
    logo: Option<String>,
    initial_supply: Nat,
    fee: Nat,
) -> bool {
    let caller = caller();
    print(format!("Initializing ICRC-1 token: {}", name));
    
    let minting_account = Account {
        owner: caller,
        subaccount: None,
    };
    
    let default_account = Account {
        owner: caller,
        subaccount: None,
    };
    
    let metadata = Metadata {
        name,
        symbol,
        decimals,
        description,
        logo,
        total_supply: initial_supply.clone(),
        owner: caller,
        fee,
    };
    
    let mut balances = HashMap::new();
    balances.insert(default_account.clone(), initial_supply.clone());
    
    let state = TokenState {
        metadata,
        balances,
        transactions: Vec::new(),
        transaction_counter: 0,
        minting_account,
    };
    
    TOKEN_STATE.with(|token_state| {
        *token_state.borrow_mut() = Some(state);
    });
    
    print(format!("ICRC-1 token initialized successfully with supply: {}", initial_supply));
    true
}

// ICRC-1 standard methods

#[query]
pub fn icrc1_name() -> String {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.metadata.name.clone()
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_symbol() -> String {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.metadata.symbol.clone()
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_decimals() -> u8 {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.metadata.decimals
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_fee() -> Nat {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.metadata.fee.clone()
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_total_supply() -> Nat {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.metadata.total_supply.clone()
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_minting_account() -> Option<Account> {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            Some(state.minting_account.clone())
        } else {
            None
        }
    })
}

#[query]
pub fn icrc1_balance_of(account: Account) -> Nat {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.balances.get(&account).cloned().unwrap_or_else(|| Nat::from(0u64))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc1_metadata() -> Vec<(String, String)> {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            let mut metadata = BTreeMap::new();
            
            metadata.insert("icrc1:name".to_string(), state.metadata.name.clone());
            metadata.insert("icrc1:symbol".to_string(), state.metadata.symbol.clone());
            metadata.insert("icrc1:decimals".to_string(), state.metadata.decimals.to_string());
            
            if let Some(description) = &state.metadata.description {
                metadata.insert("icrc1:description".to_string(), description.clone());
            }
            
            if let Some(logo) = &state.metadata.logo {
                metadata.insert("icrc1:logo".to_string(), logo.clone());
            }
            
            metadata.into_iter().collect()
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[update]
pub fn icrc1_transfer(args: TransferArgs) -> TransferResult {
    let caller_principal = caller();
    let from = Account {
        owner: caller_principal,
        subaccount: args.from_subaccount,
    };
    
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &mut *token_state.borrow_mut() {
            // Check fee
            if let Some(fee) = &args.fee {
                if fee != &state.metadata.fee {
                    return TransferResult::Err(TransferError::BadFee {
                        expected_fee: state.metadata.fee.clone(),
                    });
                }
            }
            
            // Check if sender has enough funds
            let sender_balance = state.balances.get(&from).cloned().unwrap_or_else(|| Nat::from(0u64));
            let required_amount = args.amount.clone() + state.metadata.fee.clone();
            
            if sender_balance < required_amount {
                return TransferResult::Err(TransferError::InsufficientFunds {
                    balance: sender_balance,
                });
            }
            
            // Check timestamp if provided
            let now = time() / 1_000_000_000; // nanoseconds to seconds
            if let Some(created_at) = args.created_at_time {
                if created_at > now + 120 { // 2 minutes into the future
                    return TransferResult::Err(TransferError::CreatedInFuture {
                        ledger_time: now,
                    });
                }
                
                if now > created_at + 24 * 60 * 60 { // 24 hours old
                    return TransferResult::Err(TransferError::TooOld);
                }
            }
            
            // Execute transfer
            let new_sender_balance = sender_balance - required_amount.clone();
            let recipient_balance = state.balances.get(&args.to).cloned().unwrap_or_else(|| Nat::from(0u64));
            let new_recipient_balance = recipient_balance + args.amount.clone();
            
            // Update balances
            state.balances.insert(from.clone(), new_sender_balance);
            state.balances.insert(args.to.clone(), new_recipient_balance);
            
            // Record transaction
            let tx_id = state.transaction_counter;
            state.transaction_counter += 1;
            
            let transaction = Transaction {
                id: tx_id,
                from: from.clone(),
                to: args.to.clone(),
                amount: args.amount.clone(),
                timestamp: now,
                memo: args.memo.clone(),
            };
            
            state.transactions.push(transaction);
            
            print(format!("Transfer completed: {} tokens from {} to {}", 
                args.amount, from.owner.to_string(), args.to.owner.to_string()));
            
            TransferResult::Ok(Nat::from(tx_id))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

// Additional helper methods

#[update]
pub fn mint(to: Account, amount: Nat) -> TransferResult {
    let caller_principal = caller();
    
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &mut *token_state.borrow_mut() {
            // Only minting account can mint
            if state.minting_account.owner != caller_principal {
                return TransferResult::Err(TransferError::GenericError {
                    error_code: Nat::from(1u64),
                    message: "Only minting account can mint tokens".to_string(),
                });
            }
            
            // Update recipient balance
            let recipient_balance = state.balances.get(&to).cloned().unwrap_or_else(|| Nat::from(0u64));
            let new_recipient_balance = recipient_balance + amount.clone();
            state.balances.insert(to.clone(), new_recipient_balance);
            
            // Update total supply
            state.metadata.total_supply += amount.clone();
            
            // Record transaction
            let tx_id = state.transaction_counter;
            state.transaction_counter += 1;
            
            let now = time() / 1_000_000_000;
            let transaction = Transaction {
                id: tx_id,
                from: state.minting_account.clone(),
                to: to.clone(),
                amount: amount.clone(),
                timestamp: now,
                memo: None,
            };
            
            state.transactions.push(transaction);
            
            print(format!("Minted {} tokens to {}", amount, to.owner.to_string()));
            
            TransferResult::Ok(Nat::from(tx_id))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[update]
pub fn burn(from: Account, amount: Nat) -> TransferResult {
    let caller_principal = caller();
    
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &mut *token_state.borrow_mut() {
            // Only account owner or minting account can burn
            if from.owner != caller_principal && state.minting_account.owner != caller_principal {
                return TransferResult::Err(TransferError::GenericError {
                    error_code: Nat::from(1u64),
                    message: "Not authorized to burn tokens".to_string(),
                });
            }
            
            // Check if account has enough funds
            let account_balance = state.balances.get(&from).cloned().unwrap_or_else(|| Nat::from(0u64));
            
            if account_balance < amount {
                return TransferResult::Err(TransferError::InsufficientFunds {
                    balance: account_balance,
                });
            }
            
            // Update account balance
            let new_balance = account_balance - amount.clone();
            state.balances.insert(from.clone(), new_balance);
            
            // Update total supply
            state.metadata.total_supply -= amount.clone();
            
            // Record transaction
            let tx_id = state.transaction_counter;
            state.transaction_counter += 1;
            
            let now = time() / 1_000_000_000;
            let transaction = Transaction {
                id: tx_id,
                from: from.clone(),
                to: state.minting_account.clone(), // Burning is like sending to minting account
                amount: amount.clone(),
                timestamp: now,
                memo: None,
            };
            
            state.transactions.push(transaction);
            
            print(format!("Burned {} tokens from {}", amount, from.owner.to_string()));
            
            TransferResult::Ok(Nat::from(tx_id))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn get_transactions(limit: u64) -> Vec<Transaction> {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            if limit == 0 || limit > state.transactions.len() as u64 {
                state.transactions.clone()
            } else {
                state.transactions.iter()
                    .rev()
                    .take(limit as usize)
                    .cloned()
                    .collect()
            }
        } else {
            Vec::new()
        }
    })
}

#[query]
pub fn get_all_accounts() -> Vec<(Account, Nat)> {
    TOKEN_STATE.with(|token_state| {
        if let Some(state) = &*token_state.borrow() {
            state.balances.iter()
                .map(|(account, balance)| (account.clone(), balance.clone()))
                .collect()
        } else {
            Vec::new()
        }
    })
} 
