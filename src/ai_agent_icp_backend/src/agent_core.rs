use ic_cdk::api::{ msg_caller, time};
use ic_cdk_macros::{init, query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::VecDeque;
use candid::{Principal, CandidType, Nat};
 
use serde_json;
   
// Import only what we need from token
use crate::token::{Account};

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct Task {
    pub id: u64,
    pub data: String,
    pub frequency: u64, // seconds
    pub last_run: u64,  // timestamp
    pub url: Option<String>, // Optional URL for HTTP outbound calls
    pub action_type: String, // Type of action: "http_request", "custom", "token", etc.
    pub enabled: bool, // Whether this task is active
}

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct Agent {
    pub owner: Principal,
    pub tasks: VecDeque<Task>,
    pub active: bool,
    pub created_at: u64,
}

thread_local! {
    static AGENT: RefCell<Option<Agent>> = RefCell::new(None);
}

// Internal counter for task IDs
thread_local! {
    static NEXT_TASK_ID: RefCell<u64> = RefCell::new(0);
}

// Helper to get next task ID
/*fn get_next_task_id() -> u64 {
    NEXT_TASK_ID.with(|id| {
        let next_id = *id.borrow();
        *id.borrow_mut() += 1;
        next_id
    })
}*/

#[init]
pub fn init() {
    let agent = Agent {
        owner: ic_cdk::api::msg_caller(),
        tasks: VecDeque::new(),
        active: true,
        created_at: time() / 1_000_000_000,
    };
    AGENT.with(|a| *a.borrow_mut() = Some(agent));
    ic_cdk::api::debug_print(format!("Agent initialized with owner: {}", ic_cdk::api::msg_caller().to_string()));
}

#[update]
pub fn create_task(id: u64, data: String, frequency: u64)  {
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            // Check for duplicate ID
            if agent.tasks.iter().any(|t| t.id == id) {
                ic_cdk::trap("Task with this ID already exists");
            }
            agent.tasks.push_back(Task { 
                id, 
                data, 
                frequency, 
                last_run: 0,
                url: None,
                action_type: "custom".to_string(),
                enabled: true 
            });
            ic_cdk::api::debug_print(format!("Task created with ID: {}", id));
        }
    });
}

#[update]
pub fn create_task_complete(id: u64, data: String, frequency: u64, url: Option<String>, action_type: String) -> u64 {
    let actual_id = if id == 0 {
        // Auto-generate ID by finding the max ID and adding 1
        AGENT.with(|a| {
            ensure_agent_initialized();
            
            if let Some(agent) = &*a.borrow() {
                let max_id = agent.tasks.iter()
                    .map(|task| task.id)
                    .max()
                    .unwrap_or(0);
                
                max_id + 1
            } else {
                1 // Start with 1 if no tasks exist
            }
        })
    } else {
        id
    };
    
    ic_cdk::api::debug_print(format!("Creating task with ID: {}, data: {}, frequency: {}, action_type: {}", 
        actual_id, data, frequency, action_type));
    
    AGENT.with(|a| {
        // Auto-initialize agent if not initialized
        if a.borrow().is_none() {
            let new_agent = Agent {
                owner: ic_cdk::api::msg_caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            ic_cdk::api::debug_print(format!("Agent auto-initialized with owner: {}", ic_cdk::api::msg_caller().to_string()));
        }
        
        if let Some(agent) = &mut *a.borrow_mut() {
            // Check for duplicate ID
            if agent.tasks.iter().any(|t| t.id == actual_id) {
                ic_cdk::api::debug_print(format!("Task with ID {} already exists", actual_id));
                ic_cdk::trap("Task with this ID already exists");
            }
            
            let task = Task { 
                id: actual_id, 
                data, 
                frequency, 
                last_run: 0,
                url,
                action_type,
                enabled: true 
            };
            
            agent.tasks.push_back(task.clone());
            ic_cdk::api::debug_print(format!("Task created successfully: {:?}", task));
            
            // Debug log the current task count
            ic_cdk::api::debug_print(format!("Current task count: {}", agent.tasks.len()));
        } else {
            ic_cdk::api::debug_print("Agent not initialized");
            ic_cdk::trap("Agent not initialized");
        }
    });
    
    actual_id
}

#[update]
pub fn update_task(id: u64, data: Option<String>, frequency: Option<u64>, url: Option<String>, action_type: Option<String>, enabled: Option<bool>) {
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            for task in agent.tasks.iter_mut() {
                if task.id == id {
                    if let Some(data_val) = data {
                        task.data = data_val;
                    }
                    if let Some(frequency_val) = frequency {
                        task.frequency = frequency_val;
                    }
                    if let Some(url_val) = url {
                        task.url = Some(url_val);
                    }
                    if let Some(action_type_val) = action_type {
                        task.action_type = action_type_val;
                    }
                    if let Some(enabled_val) = enabled {
                        task.enabled = enabled_val;
                    }
                    ic_cdk::api::debug_print(format!("Task updated with ID: {}", id));
                    return;
                }
            }
            ic_cdk::trap("Task not found");
        }
    });
}

#[query]
pub fn get_tasks() -> Vec<Task> {
    AGENT.with(|a| {
        // Auto-initialize agent if not initialized
        if a.borrow().is_none() {
            let new_agent = Agent {
                owner: ic_cdk::api::msg_caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            ic_cdk::api::debug_print(format!("Agent auto-initialized with owner: {}", ic_cdk::api::msg_caller().to_string()));
        }
        
        let tasks = a.borrow()
            .as_ref()
            .map(|agent| {
                let tasks: Vec<Task> = agent.tasks.iter().cloned().collect();
                ic_cdk::api::debug_print(format!("Fetched {} tasks", tasks.len()));
                tasks
            })
            .unwrap_or_default();
        
        ic_cdk::api::debug_print(format!("Returning {} tasks", tasks.len()));
        tasks
    })
}

#[query]
pub fn get_task(id: u64) -> Option<Task> {
    ic_cdk::api::debug_print(format!("Looking for task with ID: {}", id));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        let task = a.borrow()
            .as_ref()
            .and_then(|agent| {
                let found = agent.tasks.iter().find(|task| task.id == id).cloned();
                if found.is_some() {
                    ic_cdk::api::debug_print(format!("Found task with ID: {}", id));
                } else {
                    ic_cdk::api::debug_print(format!("No task found with ID: {}", id));
                }
                found
            });
        
        task
    })
}

#[update]
pub fn delete_task(id: u64) {
    ic_cdk::api::debug_print(format!("Attempting to delete task with ID: {}", id));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            let original_len = agent.tasks.len();
            agent.tasks.retain(|task| task.id != id);
            if agent.tasks.len() == original_len {
                ic_cdk::api::debug_print(format!("Task with ID {} not found", id));
                ic_cdk::trap("Task not found");
            } else {
                ic_cdk::api::debug_print(format!("Task with ID {} deleted successfully", id));
            }
        }
    });
}

// Token operations through agent - all functions will create a task record

#[update]
pub fn create_token_init_task(name: String, symbol: String, decimals: u8, 
                            description: Option<String>, logo: Option<String>, 
                            initial_supply: Nat, fee: Nat) -> u64 {
    ic_cdk::api::debug_print(format!("Creating token initialization task for: {}", name));
    
    // Store token parameters in the data field as JSON
    let data = format!(
        "{{\"name\":\"{}\",\"symbol\":\"{}\",\"decimals\":{},\"initial_supply\":\"{}\",\"fee\":\"{}\",\"description\":{},\"logo\":{}}}",
        name, symbol, decimals, initial_supply, fee,
        description.map_or("null".to_string(), |d| format!("\"{}\"", d)),
        logo.map_or("null".to_string(), |l| format!("\"{}\"", l))
    );
    
    // Create the task
    let task_id = create_task_complete(
        0, // Use 0 to auto-assign ID
        data,
        0, // One-time task
        None,
        "token_init".to_string()
    );
    
    ic_cdk::api::debug_print(format!("Created token initialization task with ID: {}", task_id));
    task_id
}

#[update]
pub fn create_token_transfer_task(to: Account, amount: Nat, memo: Option<Vec<u8>>) -> u64 {
    ic_cdk::api::debug_print(format!("Creating token transfer task to: {}", to.owner.to_string()));
    
    // Store transfer parameters in the data field as JSON
    let data = format!(
        "{{\"to\":\"{}\",\"amount\":\"{}\",\"memo\":\"{}\"}}",
        to.owner.to_string(),
        amount.to_string(),
        memo.as_ref().map_or("".to_string(), |m| String::from_utf8_lossy(m).to_string())
    );
    
    // Create the task
    let task_id = create_task_complete(
        0, // Use 0 to auto-assign ID
        data,
        0, // One-time task
        None,
        "token_transfer".to_string()
    );
    
    ic_cdk::api::debug_print(format!("Created token transfer task with ID: {}", task_id));
    task_id
}

#[update]
pub fn create_token_mint_task(to: Account, amount: Nat) -> u64 {
    ic_cdk::api::debug_print(format!("Creating token mint task for: {}", to.owner.to_string()));
    
    // Store mint parameters in the data field as JSON
    let data = format!(
        "{{\"to\":\"{}\",\"amount\":\"{}\"}}",
        to.owner.to_string(),
        amount.to_string()
    );
    
    // Create the task
    let task_id = create_task_complete(
        0, // Use 0 to auto-assign ID
        data,
        0, // One-time task
        None,
        "token_mint".to_string()
    );
    
    ic_cdk::api::debug_print(format!("Created token mint task with ID: {}", task_id));
    task_id
}

#[update]
pub fn create_token_burn_task(from: Account, amount: Nat) -> u64 {
    ic_cdk::api::debug_print(format!("Creating token burn task for: {}", from.owner.to_string()));
    
    // Store burn parameters in the data field as JSON
    let data = format!(
        "{{\"from\":\"{}\",\"amount\":\"{}\"}}",
        from.owner.to_string(),
        amount.to_string()
    );
    
    // Create the task
    let task_id = create_task_complete(
        0, // Use 0 to auto-assign ID
        data,
        0, // One-time task
        None,
        "token_burn".to_string()
    );
    
    ic_cdk::api::debug_print(format!("Created token burn task with ID: {}", task_id));
    task_id
}

// Get all tasks of a specific token operation type
#[query]
pub fn get_token_tasks_by_type(operation_type: String) -> Vec<Task> {
    get_tasks_by_type(format!("token_{}", operation_type))
}

// Helper function to get tasks by type
#[query]
pub fn get_tasks_by_type(task_type: String) -> Vec<Task> {
    AGENT.with(|a| {
        ensure_agent_initialized();
        
        if let Some(agent) = &*a.borrow() {
            agent.tasks.iter()
                .filter(|task| task.action_type == task_type)
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    })
}

// Token information queries - these don't create tasks
#[query]
pub fn token_balance(account: crate::token::Account) -> Nat {
    crate::token::icrc1_balance_of(account)
}

#[query]
pub fn token_metadata() -> Vec<(String, String)> {
    crate::token::icrc1_metadata()
}

#[query]
pub fn token_name() -> String {
    crate::token::icrc1_name()
}

#[query]
pub fn token_symbol() -> String {
    crate::token::icrc1_symbol()
}

#[query]
pub fn token_decimals() -> u8 {
    crate::token::icrc1_decimals()
}

#[query]
pub fn token_total_supply() -> Nat {
    crate::token::icrc1_total_supply()
}

#[query]
pub fn token_fee() -> Nat {
    crate::token::icrc1_fee()
}

#[query]
pub fn token_transactions(limit: u64) -> Vec<crate::token::Transaction> {
    crate::token::get_transactions(limit)
}

// Task for scheduling token operations
#[update]
pub fn create_token_operation_task(id: u64, operation: String, data: String, frequency: u64) {
    ic_cdk::api::debug_print(format!("Creating token operation task: {}, operation: {}", id, operation));
    
    AGENT.with(|a| {
        ensure_agent_initialized();
        
        if let Some(agent) = &mut *a.borrow_mut() {
            // Check for duplicate ID
            if agent.tasks.iter().any(|t| t.id == id) {
                ic_cdk::api::debug_print(format!("Task with ID {} already exists", id));
                ic_cdk::trap("Task with this ID already exists");
            }
            
            let task = Task { 
                id, 
                data, // Operation parameters as JSON
                frequency, 
                last_run: 0,
                url: None,
                action_type: format!("token_{}", operation), // "token_transfer", "token_mint", etc.
                enabled: true,
            };
            
            agent.tasks.push_back(task);
            ic_cdk::api::debug_print(format!("Token operation task created with ID: {}", id));
        }
    });
}

// Modified execute_tasks to process token operation tasks
#[update]
pub fn execute_tasks() {
    let now = time() / 1_000_000_000; // seconds
    //ic_cdk::api::debug_print(format!("Executing tasks at timestamp: {}", now));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            //let mut executed_count = 0;
            
            for task in agent.tasks.iter_mut() {
                if task.enabled && (now >= task.last_run + task.frequency || task.last_run == 0) {
                    // Keep track of old last_run for logging
                    let old_last_run = task.last_run;
                    
                    // Token operations
                    if task.action_type.starts_with("token_") {
                        match task.action_type.as_str() {
                            "token_init" => execute_token_init_task(task),
                            "token_transfer" => execute_token_transfer_task(task),
                            "token_mint" => execute_token_mint_task(task),
                            "token_burn" => execute_token_burn_task(task),
                            _ => {
                                ic_cdk::api::debug_print(format!("Unknown token operation: {}", task.action_type));
                            }
                        }
                    } else if task.action_type == "http_request" {
                        // HTTP request handling
                        ic_cdk::api::debug_print(format!("HTTP request action for task ID: {}", task.id));
                        // HTTP outbound calls would go here
                    } else {
                        // Custom task handling
                        ic_cdk::api::debug_print(format!("Custom action for task ID: {}", task.id));
                        // Custom logic here
                    }
                    
                    // Update last run time
                    task.last_run = now;
                    //executed_count += 1;
                    
                    ic_cdk::api::debug_print(format!("Executed task ID: {}, last run updated from {} to {}", 
                           task.id, old_last_run, now));
                }
            }
            
            //ic_cdk::api::debug_print(format!("Executed {} tasks out of {}", executed_count, agent.tasks.len()));
        }
    });
}

// Token task execution helpers
fn execute_token_init_task(task: &mut Task) {
    ic_cdk::api::debug_print(format!("Executing token initialization task: {}", task.id));
    
    // Parse the JSON from data field
    match serde_json::from_str::<serde_json::Value>(&task.data) {
        Ok(json_data) => {
            let name = json_data["name"].as_str().unwrap_or_default().to_string();
            let symbol = json_data["symbol"].as_str().unwrap_or_default().to_string();
            let decimals = json_data["decimals"].as_u64().unwrap_or(8) as u8;
            
            let initial_supply_str = json_data["initial_supply"].as_str().unwrap_or("0");
            let fee_str = json_data["fee"].as_str().unwrap_or("0");
            
            let initial_supply = Nat::from(u64::from_str_radix(initial_supply_str, 10).unwrap_or(0));
            let fee = Nat::from(u64::from_str_radix(fee_str, 10).unwrap_or(0));
            
            let description = json_data["description"].as_str().map(|s| s.to_string());
            let logo = json_data["logo"].as_str().map(|s| s.to_string());
            
            // Call the actual token init function
            let result = crate::token::icrc1_init(
                name, 
                symbol, 
                decimals, 
                description, 
                logo, 
                initial_supply, 
                fee
            );
            
            // Update task with result
            let status_update = format!("{{\"status\":\"{}\"}}", if result { "success" } else { "failed" });
            update_task_data(task, &status_update);
            
            ic_cdk::api::debug_print(format!("Token initialization result: {}", result));
            
            // Disable the task after execution as it's a one-time operation
            task.enabled = false;
        },
        Err(e) => {
            ic_cdk::api::debug_print(format!("Failed to parse token initialization data: {}", e));
            let status_update = format!("{{\"status\":\"failed\",\"error\":\"Parse error: {}\"}}", e);
            update_task_data(task, &status_update);
        }
    }
}

fn execute_token_transfer_task(task: &mut Task) {
    ic_cdk::api::debug_print(format!("Executing token transfer task: {}", task.id));
    
    match serde_json::from_str::<serde_json::Value>(&task.data) {
        Ok(json_data) => {
            if let (Some(to_principal), Some(amount_str)) = (
                json_data["to"].as_str(), 
                json_data["amount"].as_str()
            ) {
                let to = crate::token::Account {
                    owner: Principal::from_text(to_principal).unwrap_or(Principal::anonymous()),
                    subaccount: None,
                };
                
                let amount = Nat::from(u64::from_str_radix(amount_str, 10).unwrap_or(0));
                let memo = json_data["memo"].as_str().map(|s| s.as_bytes().to_vec());
                
                let transfer_args = crate::token::TransferArgs {
                    from_subaccount: None,
                    to,
                    amount,
                    fee: None,
                    memo,
                    created_at_time: Some(time() / 1_000_000_000),
                };
                
                match crate::token::icrc1_transfer(transfer_args) {
                    crate::token::TransferResult::Ok(tx_id) => {
                        ic_cdk::api::debug_print(format!("Token transfer successful, tx_id: {}", tx_id));
                        let status_update = format!("{{\"status\":\"success\",\"tx_id\":\"{}\"}}", tx_id);
                        update_task_data(task, &status_update);
                    },
                    crate::token::TransferResult::Err(err) => {
                        ic_cdk::api::debug_print(format!("Token transfer failed: {:?}", err));
                        let status_update = format!("{{\"status\":\"failed\",\"error\":\"{:?}\"}}", err);
                        update_task_data(task, &status_update);
                    }
                }
                
                // Task is completed, disable it
                task.enabled = false;
            } else {
                ic_cdk::api::debug_print("Missing required fields for token transfer");
                let status_update = "{{\"status\":\"failed\",\"error\":\"Missing required fields\"}}";
                update_task_data(task, status_update);
            }
        },
        Err(e) => {
            ic_cdk::api::debug_print(format!("Failed to parse token transfer data: {}", e));
            let status_update = format!("{{\"status\":\"failed\",\"error\":\"Parse error: {}\"}}", e);
            update_task_data(task, &status_update);
        }
    }
}

fn execute_token_mint_task(task: &mut Task) {
    ic_cdk::api::debug_print(format!("Executing token mint task: {}", task.id));
    
    match serde_json::from_str::<serde_json::Value>(&task.data) {
        Ok(json_data) => {
            if let (Some(to_principal), Some(amount_str)) = (
                json_data["to"].as_str(), 
                json_data["amount"].as_str()
            ) {
                let to = crate::token::Account {
                    owner: Principal::from_text(to_principal).unwrap_or(Principal::anonymous()),
                    subaccount: None,
                };
                
                let amount = Nat::from(u64::from_str_radix(amount_str, 10).unwrap_or(0));
                
                match crate::token::mint(to, amount) {
                    crate::token::TransferResult::Ok(tx_id) => {
                        ic_cdk::api::debug_print(format!("Token minting successful, tx_id: {}", tx_id));
                        let status_update = format!("{{\"status\":\"success\",\"tx_id\":\"{}\"}}", tx_id);
                        update_task_data(task, &status_update);
                    },
                    crate::token::TransferResult::Err(err) => {
                        ic_cdk::api::debug_print(format!("Token minting failed: {:?}", err));
                        let status_update = format!("{{\"status\":\"failed\",\"error\":\"{:?}\"}}", err);
                        update_task_data(task, &status_update);
                    }
                }
                
                // Task is completed, disable it
                task.enabled = false;
            } else {
                ic_cdk::api::debug_print("Missing required fields for token minting");
                let status_update = "{{\"status\":\"failed\",\"error\":\"Missing required fields\"}}";
                update_task_data(task, status_update);
            }
        },
        Err(e) => {
            ic_cdk::api::debug_print(format!("Failed to parse token minting data: {}", e));
            let status_update = format!("{{\"status\":\"failed\",\"error\":\"Parse error: {}\"}}", e);
            update_task_data(task, &status_update);
        }
    }
}

fn execute_token_burn_task(task: &mut Task) {
    ic_cdk::api::debug_print(format!("Executing token burn task: {}", task.id));
    
    match serde_json::from_str::<serde_json::Value>(&task.data) {
        Ok(json_data) => {
            if let (Some(from_principal), Some(amount_str)) = (
                json_data["from"].as_str(), 
                json_data["amount"].as_str()
            ) {
                let from = crate::token::Account {
                    owner: Principal::from_text(from_principal).unwrap_or(Principal::anonymous()),
                    subaccount: None,
                };
                
                let amount = Nat::from(u64::from_str_radix(amount_str, 10).unwrap_or(0));
                
                match crate::token::burn(from, amount) {
                    crate::token::TransferResult::Ok(tx_id) => {
                        ic_cdk::api::debug_print(format!("Token burning successful, tx_id: {}", tx_id));
                        let status_update = format!("{{\"status\":\"success\",\"tx_id\":\"{}\"}}", tx_id);
                        update_task_data(task, &status_update);
                    },
                    crate::token::TransferResult::Err(err) => {
                        ic_cdk::api::debug_print(format!("Token burning failed: {:?}", err));
                        let status_update = format!("{{\"status\":\"failed\",\"error\":\"{:?}\"}}", err);
                        update_task_data(task, &status_update);
                    }
                }
                
                // Task is completed, disable it
                task.enabled = false;
            } else {
                ic_cdk::api::debug_print("Missing required fields for token burning");
                let status_update = "{{\"status\":\"failed\",\"error\":\"Missing required fields\"}}";
                update_task_data(task, status_update);
            }
        },
        Err(e) => {
            ic_cdk::api::debug_print(format!("Failed to parse token burning data: {}", e));
            let status_update = format!("{{\"status\":\"failed\",\"error\":\"Parse error: {}\"}}", e);
            update_task_data(task, &status_update);
        }
    }
}

// Helper to update task data
fn update_task_data(task: &mut Task, status_update: &str) {

    // Append the status update to existing data
    let mut data_value: serde_json::Value = serde_json::from_str(&task.data).unwrap_or(serde_json::json!({}));
    let status_value: serde_json::Value = serde_json::from_str(status_update).unwrap_or(serde_json::json!({}));
    
    // Merge the objects
    if let (Some(data_obj), Some(status_obj)) = (data_value.as_object_mut(), status_value.as_object()) {
        for (key, value) in status_obj {
            data_obj.insert(key.clone(), value.clone());
        }
    }
    
    task.data = data_value.to_string();
    ic_cdk::api::debug_print(format!("Updated task {} data: {}", task.id, task.data));
}

// Agent retirement
#[update]
pub fn retire_agent() {
    assert_owner();
    AGENT.with(|a| *a.borrow_mut() = None);
    ic_cdk::api::debug_print("Agent retired");
}

// Permissions: only owner can mutate
fn assert_owner() {
    AGENT.with(|a| {
        if let Some(agent) = &*a.borrow() {
            if agent.owner != ic_cdk::api::msg_caller() {
                ic_cdk::api::debug_print(format!("Authorization failed: {} is not the owner {}", 
                      ic_cdk::api::msg_caller().to_string(), agent.owner.to_string()));
                ic_cdk::trap("Not authorized");
            }
        } else {
            ic_cdk::api::debug_print("Agent not initialized");
            ic_cdk::trap("Agent not initialized");
        }
    });
}

// Cycle management (placeholder, as cycles API is limited from Rust)
#[query]
pub fn cycles_available() -> u128 {
    let cycles = ic_cdk::api::canister_cycle_balance();
    ic_cdk::api::debug_print(format!("Available cycles: {}", cycles));
    cycles
}

// Helper function to ensure agent is initialized
#[ic_cdk::heartbeat]
fn heartbeat() {
    // Periodically execute tasks on the canister heartbeat (called roughly every second)
    execute_tasks();
}

fn ensure_agent_initialized() {
    AGENT.with(|a| {
        if a.borrow().is_none() {
            let new_agent = Agent {
                owner: msg_caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            ic_cdk::api::debug_print(format!("Agent auto-initialized with owner: {}", msg_caller().to_string()));
        }
    });
}
