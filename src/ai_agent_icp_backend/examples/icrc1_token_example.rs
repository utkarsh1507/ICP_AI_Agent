// Example of using ICRC-1 token from a client
use ic_cdk::api::call::CallResult;
use ic_agent::{Agent, Identity};
use candid::{Principal, Encode, Decode, CandidType, Nat, Deserialize};

// Define types matching our Candid definitions
#[derive(CandidType, Clone, Debug, Deserialize)]
struct Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Clone, Debug, Deserialize)]
struct TransferArgs {
    from_subaccount: Option<Vec<u8>>,
    to: Account,
    amount: Nat,
    fee: Option<Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}
       
#[derive(CandidType, Clone, Debug, Deserialize)]
enum TransferError {
    BadFee { expected_fee: Nat },
    BadBurn { min_burn_amount: Nat },
    InsufficientFunds { balance: Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    Duplicate { duplicate_of: Nat },
    TemporarilyUnavailable,
    GenericError { error_code: Nat, message: String },
}

#[derive(CandidType, Clone, Debug, Deserialize)]
enum TransferResult {
    Ok(Nat),
    Err(TransferError),
}

async fn demo_icrc1_token() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize IC agent
    let agent = Agent::builder()
        .with_url("http://localhost:8000")
        .build()?;
    agent.fetch_root_key().await?;
    
    // Canister ID where the ICRC-1 token is deployed
    let canister_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai")?;
    
    // 1. Initialize the token (only needs to be done once)
    println!("Initializing ICRC-1 token...");
    
    let name = "Demo Token";
    let symbol = "DEMO";
    let decimals: u8 = 8;
    let description: Option<String> = Some("A demonstration ICRC-1 token".to_string());
    let logo: Option<String> = None;
    let initial_supply = Nat::from(1_000_000_000_000_000_u64); // 10 million tokens with 8 decimals
    let fee = Nat::from(10_000); // 0.0001 token fee
    
    let init_args = Encode!(&name, &symbol, &decimals, &description, &logo, &initial_supply, &fee)?;
    let response = agent.update(&canister_id, "icrc1_init")
        .with_arg(init_args)
        .call_and_wait()
        .await?;
    
    let init_success: bool = Decode!(response.as_slice(), bool)?;
    println!("Token initialization success: {}", init_success);
    
    // 2. Get token metadata
    println!("\nFetching token metadata...");
    let response = agent.query(&canister_id, "icrc1_metadata")
        .call()
        .await?;
    
    let metadata: Vec<(String, String)> = Decode!(response.as_slice(), Vec<(String, String)>)?;
    println!("Token metadata:");
    for (key, value) in metadata {
        println!("  {}: {}", key, value);
    }
    
    // 3. Get user's own principal
    let my_principal = agent.get_principal();
    println!("\nMy principal: {}", my_principal);
    
    // 4. Create account struct for our principal
    let my_account = Account {
        owner: my_principal,
        subaccount: None,
    };
    
    // 5. Check token balance
    println!("\nChecking token balance...");
    let balance_args = Encode!(&my_account)?;
    let response = agent.query(&canister_id, "icrc1_balance_of")
        .with_arg(balance_args)
        .call()
        .await?;
    
    let balance: Nat = Decode!(response.as_slice(), Nat)?;
    println!("My token balance: {}", balance);
    
    // 6. Transfer tokens to another account
    println!("\nTransferring tokens...");
    
    // Another principal to transfer to
    let recipient_principal = Principal::from_text("aaaaa-aa")?;
    let recipient_account = Account {
        owner: recipient_principal,
        subaccount: None,
    };
    
    let transfer_amount = Nat::from(1_000_000); // 0.01 tokens with 8 decimals
    
    // Get the fee
    let response = agent.query(&canister_id, "icrc1_fee")
        .call()
        .await?;
    let fee: Nat = Decode!(response.as_slice(), Nat)?;
    println!("Token transfer fee: {}", fee);
    
    // Prepare transfer arguments
    let transfer_args = TransferArgs {
        from_subaccount: None,
        to: recipient_account,
        amount: transfer_amount.clone(),
        fee: Some(fee),
        memo: None,
        created_at_time: Some(std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs()),
    };
    
    let transfer_args_encoded = Encode!(&transfer_args)?;
    let response = agent.update(&canister_id, "icrc1_transfer")
        .with_arg(transfer_args_encoded)
        .call_and_wait()
        .await?;
    
    let transfer_result: TransferResult = Decode!(response.as_slice(), TransferResult)?;
    match transfer_result {
        TransferResult::Ok(block_index) => {
            println!("Transfer successful with block index: {}", block_index);
        },
        TransferResult::Err(error) => {
            println!("Transfer failed: {:?}", error);
        }
    }
    
    // 7. Check balance after transfer
    println!("\nChecking balance after transfer...");
    let balance_args = Encode!(&my_account)?;
    let response = agent.query(&canister_id, "icrc1_balance_of")
        .with_arg(balance_args)
        .call()
        .await?;
    
    let balance: Nat = Decode!(response.as_slice(), Nat)?;
    println!("My token balance after transfer: {}", balance);
    
    // 8. Get transaction history
    println!("\nFetching recent transactions...");
    let limit = 5u64;
    let tx_args = Encode!(&limit)?;
    let response = agent.query(&canister_id, "get_transactions")
        .with_arg(tx_args)
        .call()
        .await?;
    
    #[derive(CandidType, Clone, Debug, Deserialize)]
    struct Transaction {
        id: u64,
        from: Account,
        to: Account,
        amount: Nat,
        timestamp: u64,
        memo: Option<Vec<u8>>,
    }
    
    let transactions: Vec<Transaction> = Decode!(response.as_slice(), Vec<Transaction>)?;
    println!("Recent transactions:");
    for tx in transactions {
        println!("  ID: {}, From: {}, To: {}, Amount: {}", 
            tx.id, tx.from.owner, tx.to.owner, tx.amount);
    }
    
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Running ICRC-1 token demo...");
    demo_icrc1_token().await?;
    println!("ICRC-1 token demo completed successfully!");
    Ok(())
} 