use std::{cell::RefCell, collections::BTreeMap};

use candid::Principal;
use ic_cdk::{api::msg_caller, query, update};

use crate::agent_config::{AgentConfig, Outputs, Schedule};


thread_local! {
    static AGENTS : RefCell<BTreeMap<u64, AgentConfig>> = RefCell::new(BTreeMap::new());
    static USER_AGENTS : RefCell<BTreeMap<Principal,Vec<u64>>> = RefCell::new(BTreeMap::new());
}


#[update]
pub fn create_agent(name : String , description : String , schedule :Schedule,created_at : i128,prompt : String, owner : Principal) -> String{
    let agent_id = AGENTS.with(|agents| {
        let agents = agents.borrow();
        let mut id = agents.len() as u64;
        // Ensure no collision (e.g. after deletion)
        while agents.contains_key(&id) {
            id += 1;
        }
        id
    });
    AGENTS.with(|agents| {
        let mut agents = agents.borrow_mut();
        
        if agents.contains_key(&agent_id){
            return format!("Agent with ID {} already exists", agent_id);
        }
        agents.insert(agent_id, 
            AgentConfig { 
            agent_id, 
            name: name.clone(), 
            description: description.clone(), 
            owner: owner, 
            schedule: schedule.clone(), 
            created_at: created_at.clone(), 
            prompt: prompt.clone(),
            outputs : Vec::new(),
           });
        USER_AGENTS.with(|user_agents|{
            let mut user_agents = user_agents.borrow_mut();
            user_agents.entry(owner).or_default().push(agent_id);
        });

        "args.agent_id created successfully".to_string()
    })
}


#[query]
pub fn get_all_agents()-> BTreeMap<u64, AgentConfig> {
    AGENTS.with(|agents| {
        agents.borrow().clone()
    })
}

#[query]
pub fn get_user_agents() -> Vec<AgentConfig> {
    let user = msg_caller();
    USER_AGENTS.with(|user_agents| {
        let user_agents = user_agents.borrow();
        if let Some(agent_ids) = user_agents.get(&user) {
            AGENTS.with(|agents| {
                let agents = agents.borrow();
                agent_ids
                    .iter()
                    .filter_map(|id| agents.get(id).cloned())
                    .collect()
            })
        } else {
            vec![]
        }
    })
}


#[update]
pub fn store_output(output : String , id : u64 ,created_at : i128)-> String{
    AGENTS.with(|agent|{
        if let Some(my_agent) = agent.borrow_mut().get_mut(&id){
            my_agent.outputs.push(Outputs{output : output , timestamp : created_at});
        }
    });
    "Output Stored".to_string()
}