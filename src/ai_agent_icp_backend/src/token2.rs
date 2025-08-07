use ic_cdk::api::{ debug_print, msg_caller, time};
use ic_cdk_macros::{query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::{HashMap};
use candid::{Principal, CandidType, Nat};

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
pub struct ApproveArgs {
    pub from_subaccount: Option<[u8; 32]>,
    pub spender: Account,
    pub amount: Nat,
    pub expected_allowance: Option<Nat>,
    pub expires_at: Option<u64>,
    pub fee: Option<Nat>,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub struct AllowanceArgs {
    pub account: Account,
    pub spender: Account,
}

#[derive(CandidType, Clone, Debug, Serialize, Deserialize)]
pub struct TransferFromArgs {
    pub spender_subaccount: Option<[u8; 32]>,
    pub from: Account,
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
    InsufficientAllowance { allowance: Nat },
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

#[derive(Clone, Debug, Default,Deserialize)]
pub struct TokenState {
    pub metadata: Metadata,
    pub balances: HashMap<Account, Nat>,
    pub allowances: HashMap<(Account, Account), Nat>, // (owner, spender) -> allowance
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

#[derive(CandidType, Deserialize, Serialize, Clone)]
pub struct AccountBalance {
    pub account: Account,
    pub balance: Nat,
}

#[derive(CandidType,Deserialize,Serialize)]
#[serde(tag ="type" , content = "content")]
pub enum APIResponse{
    Text(String),
    PairList(Vec<(String,String)>)
}
thread_local! {
   pub static TOKEN_STATE: RefCell<HashMap<String,TokenState>> = RefCell::new(HashMap::new());
}

#[update]
pub fn icrc2_init(
    name: String,
    symbol: String,
    decimals: u8,
    description: Option<String>,
    logo: Option<String>,
    initial_supply: Nat,
    owner : Principal,
    fee: Nat,
) -> APIResponse {
    //let caller = msg_caller();
    debug_print(format!("Initializing ICRC-2 token: {}", name));
    let minting_account = Account {
        owner: owner,
        subaccount: None,
    };
    let default_account = Account {
        owner: owner,
        subaccount: None,
    };
    let symbol_clone = symbol.clone();

    let metadata = Metadata {
        name,
        symbol,
        decimals,
        description,
        logo,
        total_supply: initial_supply.clone(),
        owner: owner,
        fee,
    };
    let mut balances = HashMap::new();
    balances.insert(default_account.clone(), initial_supply.clone());
    let state = TokenState {
        metadata,
        balances,
        allowances: HashMap::new(),
        transactions: Vec::new(),
        transaction_counter: 0,
        minting_account,
    };
    let state_clone = state.clone();
    TOKEN_STATE.with(|token_state| {
        token_state.borrow_mut().insert(symbol_clone, state);
    });
    debug_print(format!("ICRC-2 token initialized successfully with data: {:?}", state_clone));
    let output = format!(
        "ICRC-2 token initialized with name: {}, symbol: {}, decimals: {}, total_supply: {}, fee: {}",
        state_clone.metadata.name,
        state_clone.metadata.symbol,
        state_clone.metadata.decimals,
        state_clone.metadata.total_supply,
        state_clone.metadata.fee
    );
    APIResponse::Text(output)
}

// ICRC-1 compatible queries
#[query]
pub fn icrc2_name(symbol : String) -> String {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.metadata.name.clone())
            .unwrap_or_default()
    })
}

#[query]
pub fn icrc2_symbol(name : String) -> String {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&name)
            .map(|state| state.metadata.symbol.clone())
            .unwrap_or_default()
    })
}

#[query]
pub fn icrc2_decimals(symbol : String) -> u8 {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.metadata.decimals)
            .unwrap_or(8)
    })
}

#[query]
pub fn icrc2_fee(symbol : String) -> Nat {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.metadata.fee.clone())
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[query]
pub fn icrc2_total_supply(symbol : String) -> Nat {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.metadata.total_supply.clone())
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[query]
pub fn icrc2_minting_account(symbol : String) -> Option<Account> {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.minting_account.clone())
    })
}

#[query]
pub fn icrc2_balance_of(account: Account,symbol : String) -> Nat {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.balances.get(&account).cloned().unwrap_or_else(|| Nat::from(0u64)))
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[query]
pub fn icrc2_metadata(symbol : String) -> APIResponse {
    TOKEN_STATE.with(|token_state| {
        token_state.borrow().get(&symbol).map(|state| {
            let mut meta = vec![
                ("name".to_string(), state.metadata.name.clone()),
                ("symbol".to_string(), state.metadata.symbol.clone()),
                ("decimals".to_string(), state.metadata.decimals.to_string()),
                ("total_supply".to_string(), state.metadata.total_supply.to_string()),
                ("owner".to_string(), state.metadata.owner.to_string()),
                ("fee".to_string(), state.metadata.fee.to_string()),
            ];
            if let Some(desc) = &state.metadata.description {
                meta.push(("description".to_string(), desc.clone()));
            }
            if let Some(logo) = &state.metadata.logo {
                meta.push(("logo".to_string(), logo.clone()));
            }
            APIResponse::PairList(meta)
        }).unwrap_or_else(|| APIResponse::Text("Token not found".to_string()))
    })
}

#[update]
pub fn icrc2_transfer(symbol : String,args: TransferArgs) -> TransferResult {
    let caller_principal = msg_caller();

    TOKEN_STATE.with(|token_state| {
        let mut tokens = token_state.borrow_mut();
        if let Some(state) = tokens.get_mut(&symbol) {
            let from_account = Account {
                owner: caller_principal,
                subaccount: args.from_subaccount,
            };
            let from_balance = state.balances.get(&from_account).cloned().unwrap_or_else(|| Nat::from(0u64));
            let fee = args.fee.clone().unwrap_or_else(|| state.metadata.fee.clone());
            let total = args.amount.clone() + fee.clone();
            if from_balance < total {
                return TransferResult::Err(TransferError::InsufficientFunds { balance: from_balance });
            }
            // Deduct from sender
            let new_balance = from_balance - total.clone();
            state.balances.insert(from_account.clone(), new_balance);
            // Credit recipient
            let recipient_balance = state.balances.get(&args.to).cloned().unwrap_or_else(|| Nat::from(0u64));
            let new_recipient_balance = recipient_balance + args.amount.clone();
            state.balances.insert(args.to.clone(), new_recipient_balance);
            // Record transaction
            let tx_id = state.transaction_counter;
            state.transaction_counter += 1;
            let now = time() / 1_000_000_000;
            let transaction = Transaction {
                id: tx_id,
                from: from_account.clone(),
                to: args.to.clone(),
                amount: args.amount.clone(),
                timestamp: now,
                memo: args.memo.clone(),
            };
            state.transactions.push(transaction);
            debug_print(format!("Transferred {} tokens from {} to {}", args.amount, from_account.owner.to_string(), args.to.owner.to_string()));
            TransferResult::Ok(Nat::from(tx_id))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[update]
pub fn icrc2_mint(to: Account, amount: Nat,symbol : String) -> APIResponse {
    let caller_principal = msg_caller();
    TOKEN_STATE.with(|token_state| {
        let mut tokens = token_state.borrow_mut();
        if let Some(state) = tokens.get_mut(&symbol) {
            if state.minting_account.owner != caller_principal {
                return APIResponse::Text("Not authorized to mint tokens".to_string());
            }
            let recipient_balance = state.balances.get(&to).cloned().unwrap_or_else(|| Nat::from(0u64));
            let new_recipient_balance = recipient_balance + amount.clone();
            state.balances.insert(to.clone(), new_recipient_balance);
            state.metadata.total_supply += amount.clone();
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
            debug_print(format!("Minted {} tokens to {}", amount, to.owner.to_string()));
            APIResponse::Text(format!("Minted {} tokens to {}", amount, to.owner.to_string()))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

// ICRC2-specific methods
#[update]
pub fn icrc2_approve(args: ApproveArgs,symbol : String) -> TransferResult {
    let caller_principal = msg_caller();
    TOKEN_STATE.with(|token_state| {
        let mut tokens = token_state.borrow_mut();
        if let Some(state) = tokens.get_mut(&symbol) {
            let owner_account = Account {
                owner: caller_principal,
                subaccount: args.from_subaccount,
            };
            let current_allowance = state.allowances.get(&(owner_account.clone(), args.spender.clone())).cloned().unwrap_or_else(|| Nat::from(0u64));
            if let Some(expected) = args.expected_allowance {
                if current_allowance != expected {
                    return TransferResult::Err(TransferError::GenericError {
                        error_code: Nat::from(2u64),
                        message: "Allowance mismatch".to_string(),
                    });
                }
            }
            state.allowances.insert((owner_account.clone(), args.spender.clone()), args.amount.clone());
            debug_print(format!("Approved {} tokens for {} by {}", args.amount, args.spender.owner.to_string(), owner_account.owner.to_string()));
            TransferResult::Ok(Nat::from(0u64))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc2_allowance(args: AllowanceArgs,symbol : String) -> Nat {
    TOKEN_STATE.with(|token_state| {
        token_state
            .borrow()
            .get(&symbol)
            .map(|state| state.allowances.get(&(args.account.clone(), args.spender.clone())).cloned().unwrap_or_else(|| Nat::from(0u64)))
            .unwrap_or_else(|| Nat::from(0u64))
    })
}

#[update]
pub fn icrc2_transfer_from(args: TransferFromArgs,symbol: String) -> TransferResult {
    let caller_principal = msg_caller();
    TOKEN_STATE.with(|token_state| {
        let mut tokens = token_state.borrow_mut();
        if let Some(state) = tokens.get_mut(&symbol) {
            let spender_account = Account {
                owner: caller_principal,
                subaccount: args.spender_subaccount,
            };
            let allowance = state.allowances.get(&(args.from.clone(), spender_account.clone())).cloned().unwrap_or_else(|| Nat::from(0u64));
            if allowance < args.amount {
                return TransferResult::Err(TransferError::InsufficientAllowance { allowance });
            }
            let from_balance = state.balances.get(&args.from).cloned().unwrap_or_else(|| Nat::from(0u64));
            let fee = args.fee.clone().unwrap_or_else(|| state.metadata.fee.clone());
            let total = args.amount.clone() + fee.clone();
            if from_balance < total {
                return TransferResult::Err(TransferError::InsufficientFunds { balance: from_balance });
            }
            // Deduct from allowance
            state.allowances.insert((args.from.clone(), spender_account.clone()), allowance - args.amount.clone());
            // Deduct from sender
            state.balances.insert(args.from.clone(), from_balance - total.clone());
            // Credit recipient
            let recipient_balance = state.balances.get(&args.to).cloned().unwrap_or_else(|| Nat::from(0u64));
            state.balances.insert(args.to.clone(), recipient_balance + args.amount.clone());
            // Record transaction
            let tx_id = state.transaction_counter;
            state.transaction_counter += 1;
            let now = time() / 1_000_000_000;
            let transaction = Transaction {
                id: tx_id,
                from: args.from.clone(),
                to: args.to.clone(),
                amount: args.amount.clone(),
                timestamp: now,
                memo: args.memo.clone(),
            };
            state.transactions.push(transaction);
            debug_print(format!("TransferFrom: {} tokens from {} to {} by {}", args.amount, args.from.owner.to_string(), args.to.owner.to_string(), spender_account.owner.to_string()));
            TransferResult::Ok(Nat::from(tx_id))
        } else {
            ic_cdk::trap("Token not initialized");
        }
    })
}

#[query]
pub fn icrc2_get_transactions(limit: u64,symbol : String) -> Vec<Transaction> {
    TOKEN_STATE.with(|token_state| {
        let tokens = token_state.borrow();
        if let Some(state) =tokens.get(&symbol) {
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
pub fn icrc2_get_all_accounts(symbol: String) -> Vec<AccountBalance> {
    TOKEN_STATE.with(|token_state| {
        let tokens = token_state.borrow();
        if let Some(state) = tokens.get(&symbol) {
            state.balances.iter()
                .map(|(account, balance)| AccountBalance {
                    account: account.clone(),
                    balance: balance.clone(),
                })
                .collect()
        } else {
            Vec::new()
        }
    })
}

#[query]
pub fn icrc2_get_all_records()->APIResponse{
   let records = TOKEN_STATE.with(|t|{
        t.borrow()
        .iter()
        .map(
            |(symbol,state)| {(symbol.clone() , state.metadata.name.clone())}
        )
        .collect()
    });
    APIResponse::PairList(records)
}


#[query]
pub fn my_tokens () -> APIResponse{
    let caller = msg_caller();
    let tokens = TOKEN_STATE.with(|t|{
        t.borrow()
        .iter()
        .filter_map(
            |(symbol,state)| {
                if state.metadata.owner == caller {
                    Some((symbol.clone(),state.metadata.name.clone()))
                } else {
                    None
                }
            }
        )
        .collect()
    });
    APIResponse::PairList(tokens)
}