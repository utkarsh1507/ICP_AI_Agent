use ic_cdk::api::{caller, time};
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
}

#[derive(Clone, Debug, Serialize, Deserialize, CandidType)]
pub struct Agent {
    pub owner: Principal,
    pub tasks: VecDeque<Task>,
    pub active: bool,
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
    };
    AGENT.with(|a| *a.borrow_mut() = Some(agent));
}

#[update]
pub fn create_task(id: u64, data: String, frequency: u64) {
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            agent.tasks.push_back(Task { id, data, frequency, last_run: 0 });
        }
    });
}

#[query]
pub fn get_tasks() -> Vec<Task> {
    AGENT.with(|a| {
        a.borrow()
            .as_ref()
            .map(|agent| agent.tasks.iter().cloned().collect())
            .unwrap_or_default()
    })
}

#[query]
pub fn get_task(id: u64) -> Option<Task> {
    AGENT.with(|a| {
        a.borrow()
            .as_ref()
            .and_then(|agent| agent.tasks.iter().find(|task| task.id == id).cloned())
    })
}

#[update]
pub fn delete_task(id: u64) {
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            agent.tasks.retain(|task| task.id != id);
        }
    });
}

// Scheduler: execute due tasks (to be called by heartbeat or manual trigger)
#[update]
pub fn execute_tasks() {
    let now = time() / 1_000_000_000; // seconds
    AGENT.with(|a| {
        if let Some(agent) = &mut *a.borrow_mut() {
            for task in agent.tasks.iter_mut() {
                if now >= task.last_run + task.frequency {
                    // Execute the task (placeholder: just update last_run)
                    task.last_run = now;
                    // Add your action logic here
                }
            }
        }
    });
}

// Agent retirement
#[update]
pub fn retire_agent() {
    AGENT.with(|a| *a.borrow_mut() = None);
}

// Permissions: only owner can mutate
fn assert_owner() {
    AGENT.with(|a| {
        if let Some(agent) = &*a.borrow() {
            if agent.owner != caller() {
                ic_cdk::trap("Not authorized");
            }
        } else {
            ic_cdk::trap("Agent not initialized");
        }
    });
}

// Cycle management (placeholder, as cycles API is limited from Rust)
#[query]
pub fn cycles_available() -> u64 {
    ic_cdk::api::canister_balance()
}
