use ic_cdk::api::{caller, time, print};
use ic_cdk_macros::{init, query, update};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::collections::VecDeque;
use candid::{Principal, CandidType};

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct Task {
    pub id: u64,
    pub data: String,
    pub frequency: u64, // seconds
    pub last_run: u64,  // timestamp
    pub url: Option<String>, // Optional URL for HTTP outbound calls
    pub action_type: String, // Type of action: "http_request", "custom", etc.
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

#[init]
pub fn init() {
    let agent = Agent {
        owner: caller(),
        tasks: VecDeque::new(),
        active: true,
        created_at: time() / 1_000_000_000,
    };
    AGENT.with(|a| *a.borrow_mut() = Some(agent));
    print(format!("Agent initialized with owner: {}", caller().to_string()));
}

#[update]
pub fn create_task(id: u64, data: String, frequency: u64) {
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
            print(format!("Task created with ID: {}", id));
        }
    });
}

#[update]
pub fn create_task_complete(id: u64, data: String, frequency: u64, url: Option<String>, action_type: String) {
    print(format!("Creating task with ID: {}, data: {}, frequency: {}, action_type: {}", id, data, frequency, action_type));
    
    AGENT.with(|a| {
        // Auto-initialize agent if not initialized
        if a.borrow().is_none() {
            let new_agent = Agent {
                owner: caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            print(format!("Agent auto-initialized with owner: {}", caller().to_string()));
        }
        
        if let Some(agent) = &mut *a.borrow_mut() {
            // Check for duplicate ID
            if agent.tasks.iter().any(|t| t.id == id) {
                print(format!("Task with ID {} already exists", id));
                ic_cdk::trap("Task with this ID already exists");
            }
            
            let task = Task { 
                id, 
                data, 
                frequency, 
                last_run: 0,
                url,
                action_type,
                enabled: true 
            };
            
            agent.tasks.push_back(task.clone());
            print(format!("Task created successfully: {:?}", task));
            
            // Debug log the current task count
            print(format!("Current task count: {}", agent.tasks.len()));
        } else {
            print("Agent not initialized");
            ic_cdk::trap("Agent not initialized");
        }
    });
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
                    print(format!("Task updated with ID: {}", id));
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
                owner: caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            print(format!("Agent auto-initialized with owner: {}", caller().to_string()));
        }
        
        let tasks = a.borrow()
            .as_ref()
            .map(|agent| {
                let tasks: Vec<Task> = agent.tasks.iter().cloned().collect();
                print(format!("Fetched {} tasks", tasks.len()));
                tasks
            })
            .unwrap_or_default();
        
        print(format!("Returning {} tasks", tasks.len()));
        tasks
    })
}

#[query]
pub fn get_task(id: u64) -> Option<Task> {
    print(format!("Looking for task with ID: {}", id));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        let task = a.borrow()
            .as_ref()
            .and_then(|agent| {
                let found = agent.tasks.iter().find(|task| task.id == id).cloned();
                if found.is_some() {
                    print(format!("Found task with ID: {}", id));
                } else {
                    print(format!("No task found with ID: {}", id));
                }
                found
            });
        
        task
    })
}

#[update]
pub fn delete_task(id: u64) {
    print(format!("Attempting to delete task with ID: {}", id));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            let original_len = agent.tasks.len();
            agent.tasks.retain(|task| task.id != id);
            if agent.tasks.len() == original_len {
                print(format!("Task with ID {} not found", id));
                ic_cdk::trap("Task not found");
            } else {
                print(format!("Task with ID {} deleted successfully", id));
            }
        }
    });
}

// Scheduler: execute due tasks (to be called by heartbeat or manual trigger)
#[update]
pub fn execute_tasks() {
    let now = time() / 1_000_000_000; // seconds
    print(format!("Executing tasks at timestamp: {}", now));
    
    ensure_agent_initialized();
    
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            let mut executed_count = 0;
            
            for task in agent.tasks.iter_mut() {
                if task.enabled && now >= task.last_run + task.frequency {
                    // Execute the task (placeholder: just update last_run)
                    let old_last_run = task.last_run;
                    task.last_run = now;
                    executed_count += 1;
                    
                    print(format!("Executed task ID: {}, last run updated from {} to {}", 
                           task.id, old_last_run, now));
                    
                    // Action type handling
                    match task.action_type.as_str() {
                        "http_request" => {
                            print(format!("HTTP request action for task ID: {}", task.id));
                            // HTTP outbound calls would go here
                        },
                        "custom" | _ => {
                            print(format!("Custom action for task ID: {}", task.id));
                            // Custom logic here
                        }
                    }
                }
            }
            
            print(format!("Executed {} tasks out of {}", executed_count, agent.tasks.len()));
        }
    });
}

// Agent retirement
#[update]
pub fn retire_agent() {
    assert_owner();
    AGENT.with(|a| *a.borrow_mut() = None);
    print("Agent retired");
}

// Permissions: only owner can mutate
fn assert_owner() {
    AGENT.with(|a| {
        if let Some(agent) = &*a.borrow() {
            if agent.owner != caller() {
                print(format!("Authorization failed: {} is not the owner {}", 
                      caller().to_string(), agent.owner.to_string()));
                ic_cdk::trap("Not authorized");
            }
        } else {
            print("Agent not initialized");
            ic_cdk::trap("Agent not initialized");
        }
    });
}

// Cycle management (placeholder, as cycles API is limited from Rust)
#[query]
pub fn cycles_available() -> u64 {
    let cycles = ic_cdk::api::canister_balance();
    print(format!("Available cycles: {}", cycles));
    cycles
}

// Helper function to ensure agent is initialized
fn ensure_agent_initialized() {
    AGENT.with(|a| {
        if a.borrow().is_none() {
            let new_agent = Agent {
                owner: caller(),
                tasks: VecDeque::new(),
                active: true,
                created_at: time() / 1_000_000_000,
            };
            *a.borrow_mut() = Some(new_agent);
            print(format!("Agent auto-initialized with owner: {}", caller().to_string()));
        }
    });
}
