// Example of using the token system in the ICP AI Agent

use ic_cdk::api::call::CallResult;
use ic_agent::{Agent, Identity};
use candid::{Principal, Encode, Decode, CandidType, Deserialize};
use std::collections::HashMap;

#[derive(CandidType, Clone, Deserialize)]
struct Token {
    id: String,
    owner: Principal,
    created_at: u64,
    expires_at: Option<u64>,
    metadata: HashMap<String, String>,
    balance: u64,
}

async fn demo_token_workflow() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the Internet Computer agent
    let agent = Agent::builder()
        .with_url("http://localhost:8000")
        .build()?;
    agent.fetch_root_key().await?;
    
    // Canister ID where the agent code is deployed
    let canister_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai")?;
    
    // 1. Create a token
    println!("Creating a new token...");
    let mut metadata = HashMap::new();
    metadata.insert("name".to_string(), "Demo Token".to_string());
    metadata.insert("symbol".to_string(), "DTKN".to_string());
    metadata.insert("description".to_string(), "This is a demo token for testing purposes".to_string());
    
    let initial_balance = 1000;
    let expires_in_seconds = Some(3600 * 24 * 30); // 30 days
    
    let create_args = Encode!(&metadata, &initial_balance, &expires_in_seconds)?;
    let response = agent.update(&canister_id, "create_token")
        .with_arg(create_args)
        .call_and_wait()
        .await?;
    
    let token_id: String = Decode!(response.as_slice(), String)?;
    println!("Token created with ID: {}", token_id);
    
    // 2. Get token details
    println!("Getting token details...");
    let get_args = Encode!(&token_id)?;
    let response = agent.query(&canister_id, "get_token")
        .with_arg(get_args)
        .call()
        .await?;
    
    let token: Option<Token> = Decode!(response.as_slice(), Option<Token>)?;
    if let Some(token) = token {
        println!("Token details:");
        println!("  ID: {}", token.id);
        println!("  Owner: {}", token.owner.to_string());
        println!("  Created at: {}", token.created_at);
        println!("  Balance: {}", token.balance);
        println!("  Metadata: {:?}", token.metadata);
    } else {
        println!("Token not found!");
    }
    
    // 3. Update token metadata
    println!("Updating token metadata...");
    metadata.insert("description".to_string(), "Updated description".to_string());
    metadata.insert("color".to_string(), "blue".to_string());
    
    let update_args = Encode!(&token_id, &metadata)?;
    let response = agent.update(&canister_id, "update_token_metadata")
        .with_arg(update_args)
        .call_and_wait()
        .await?;
    
    let success: bool = Decode!(response.as_slice(), bool)?;
    println!("Metadata update success: {}", success);
    
    // 4. Check token validity
    println!("Checking token validity...");
    let valid_args = Encode!(&token_id)?;
    let response = agent.query(&canister_id, "is_token_valid")
        .with_arg(valid_args)
        .call()
        .await?;
    
    let is_valid: bool = Decode!(response.as_slice(), bool)?;
    println!("Token is valid: {}", is_valid);
    
    // 5. Get user's tokens
    println!("Getting user tokens...");
    let user_principal = agent.get_principal();
    let user_args = Encode!(&Option::<Principal>::Some(user_principal))?;
    let response = agent.query(&canister_id, "get_user_tokens")
        .with_arg(user_args)
        .call()
        .await?;
    
    let tokens: Vec<Token> = Decode!(response.as_slice(), Vec<Token>)?;
    println!("User has {} tokens", tokens.len());
    for (i, token) in tokens.iter().enumerate() {
        println!("Token {}: {} - Balance: {}", i+1, token.id, token.balance);
    }
    
    // 6. Transfer some tokens to another user
    println!("Transferring tokens...");
    // Another Principal to transfer tokens to
    let recipient = Principal::from_text("aaaaa-aa")?; // Example principal
    let amount = 200;
    
    let transfer_args = Encode!(&token_id, &recipient, &amount)?;
    let response = agent.update(&canister_id, "transfer_token")
        .with_arg(transfer_args)
        .call_and_wait()
        .await?;
    
    let transfer_success: bool = Decode!(response.as_slice(), bool)?;
    println!("Transfer success: {}", transfer_success);
    
    // 7. Check our balance after transfer
    let get_args = Encode!(&token_id)?;
    let response = agent.query(&canister_id, "get_token")
        .with_arg(get_args)
        .call()
        .await?;
    
    let token: Option<Token> = Decode!(response.as_slice(), Option<Token>)?;
    if let Some(token) = token {
        println!("Token balance after transfer: {}", token.balance);
    }
    
    // 8. Burn a token (uncomment to test)
    /*
    println!("Burning token...");
    let burn_args = Encode!(&token_id)?;
    let response = agent.update(&canister_id, "burn_token")
        .with_arg(burn_args)
        .call_and_wait()
        .await?;
    
    let burn_success: bool = Decode!(response.as_slice(), bool)?;
    println!("Token burn success: {}", burn_success);
    */
    
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Running token demo workflow...");
    demo_token_workflow().await?;
    println!("Token demo completed successfully!");
    Ok(())
} 