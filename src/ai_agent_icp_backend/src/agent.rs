use std::{cell::RefCell, collections::{BTreeMap, HashMap}};

use candid::{CandidType, Principal};
use ic_cdk::{query, update};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};   

use crate::agent_config::{AgentConfig, Schedule};


#[derive(Clone,CandidType,Deserialize,Serialize)]
pub struct Output(String);

thread_local! {
    static OUTPUTS : RefCell<HashMap<String,String>> = RefCell::new(HashMap::new());
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

        "agent created successfully".to_string()
    })
}


#[query]
pub fn get_all_agents()-> BTreeMap<u64, AgentConfig> {
    AGENTS.with(|agents| {
        agents.borrow().clone()
    })
}

#[query]
pub fn get_user_agents(owner : Principal) -> Vec<AgentConfig> {
    let user = owner;
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
pub fn store_output(output : String , id : u64)-> String{
    let h = hash_output(&output);
    OUTPUTS.with(|outputs|{
        let mut outputs = outputs.borrow_mut();
        outputs.insert(h.clone(), output)
    });

    AGENTS.with(|agent|{

        if let Some(my_agent) = agent.borrow_mut().get_mut(&id){
            if !my_agent.outputs.contains(&h){

                my_agent.outputs.push(h.clone());
            }
        }
    });
    "Output Stored".to_string()
}




fn hash_output(output : &String) -> String{
    let mut hasher = Sha256::new();
    hasher.update(output.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}



#[query]
pub fn get_outputs(hash : String)-> Option<String>{
    OUTPUTS.with(|output|{
        output.borrow().get(&hash).cloned()
    })
}
