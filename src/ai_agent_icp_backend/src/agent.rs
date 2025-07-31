
use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Principal};
use ic_cdk::{update};
use serde::{Deserialize, Serialize};
use uuid::Uuid;


thread_local! {
    static AGENTS: RefCell<BTreeMap<u64, AgentConfig>> = RefCell::new(BTreeMap::new());
    static USER_AGENTS: RefCell<BTreeMap<Principal, Vec<u64>>> = RefCell::new(BTreeMap::new());
}
use crate::{agent_config::{AgentConfig, Schedule}};
#[derive(Debug,Deserialize,Serialize,CandidType)]
pub struct AgentConfigParam{
    pub name : String,
    pub description : String,
    pub owner : Principal,
    pub schedule : Schedule,
    pub tasks : Vec<crate::agent_config::Task>
}
#[update]
pub fn create_agent(args : AgentConfigParam) -> Result<AgentConfig,String>{
    let agent_id = Uuid::new_v4().as_u64_pair().0;
    let created_at = chrono::Utc::now().timestamp();
    let next_run = match args.schedule{
        Schedule::Interval { interval_days }=>{
            Some(chrono::Utc::now().timestamp() + chrono::Duration::days(interval_days as i64).num_seconds())
        }
        Schedule::Cron { expression : _} => None
    };
    let agent_config = AgentConfig{
        agent_id,
        name : args.name,
        description : args.description,
        owner : args.owner,
        schedule : args.schedule,
        tasks : args.tasks,
        created_at,
        next_run
    };
    AGENTS.with(|agents| {
        let mut agents = agents.borrow_mut();
        agents.insert(agent_id.clone(), agent_config.clone());
    });
    USER_AGENTS.with(|user_agents| {
        let mut user_agents = user_agents.borrow_mut();
        user_agents.entry(args.owner.clone()).or_default().push(agent_id);
    });
    Ok(agent_config)
}


#[update]
pub fn invoke_agent(agent_id : u64)-> Result<(),String>{
    AGENTS.with(|agents|{
        let agents= agents.borrow();
        if let Some(agent) = agents.get(&agent_id){
            ic_cdk::println!("Invoking agent with name {} and ID {}",agent.name , agent.agent_id);
        }
        Ok(())
    })
}
#[update]
pub fn invoke_user_agents(user : Principal) ->Result<(),String>{
    USER_AGENTS.with(|agents|{
        let agents = agents.borrow();
        if let Some(agent_ids) = agents.get(&user){
            for agent_id in agent_ids.iter(){
                ic_cdk::println!("Calling agent with ID {}",agent_id);
                invoke_agent(*agent_id)?;
            }
        }
        Ok(())
    })
}

