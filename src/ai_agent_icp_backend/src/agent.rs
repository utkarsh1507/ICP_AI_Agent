
/*use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Principal};
use ic_cdk::{ update};
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

/*#[heartbeat]
pub fn heartbeat(){
    let now = chrono::Utc::now().timestamp();
    AGENTS.with(|agents|{
        let mut agents = agents.borrow_mut();
        for agent in agents.values_mut(){
            if let Some(next_run) = agent.next_run{
                if next_run <= now{
                    invoke_agent(agent.agent_id).unwrap_or_else(|err| {
                        ic_cdk::println!("Error invoking agent {}: {}", agent.agent_id, err);
                        agent.next_run = Some(now + 60);
                    });
                    agent.next_run = match agent.schedule {
                        Schedule::Interval { interval_days }=>{
                            Some(now + chrono::Duration::days(interval_days as i64).num_seconds())
                        }
                        Schedule::Cron { expression: _ } => {
                            None
                        }
                    }
                }
            }
        }
    })
}*/*/

use std::{cell::RefCell, collections::BTreeMap};

use candid::Principal;
use ic_cdk::{query, update};

use crate::agent_config::AgentConfig;


thread_local! {
    static AGENTS : RefCell<BTreeMap<u64, AgentConfig>> = RefCell::new(BTreeMap::new());
    static USER_AGENTS : RefCell<BTreeMap<Principal,Vec<u64>>> = RefCell::new(BTreeMap::new());
}


#[update]
pub fn create_agent(args : AgentConfig) -> Result<AgentConfig, String>{
    AGENTS.with(|agents| {
        let mut agents = agents.borrow_mut();
        if agents.contains_key(&args.agent_id){
            return Err(format!("Agent with ID {} already exists", args.agent_id));
        }
        agents.insert(args.agent_id, 
            AgentConfig { 
            agent_id: args.agent_id.clone(), 
            name: args.name.clone(), 
            description: args.description.clone(), 
            owner: args.owner.clone(), 
            schedule: args.schedule.clone(), 
            tasks: args.tasks.clone(), 
            created_at: args.created_at.clone(), 
            prompt: args.prompt.clone(),
            next_run: args.next_run.clone()});
        USER_AGENTS.with(|user_agents|{
            let mut user_agents = user_agents.borrow_mut();
            user_agents.entry(args.owner.clone()).or_default().push(args.agent_id);
        });

        Ok(args)
    })
}


#[query]
pub fn get_all_agents()-> BTreeMap<u64, AgentConfig> {
    AGENTS.with(|agents| {
        agents.borrow().clone()
    })
}

#[query]
pub fn get_user_agents(user :Principal) ->Result<Vec<AgentConfig>,String>{
    USER_AGENTS.with(|user_agents|{
        let user_agents = user_agents.borrow();
        if let Some(agent_ids) = user_agents.get(&user){
            let agents = AGENTS.with(|agents|{
                let agents = agents.borrow();
                agent_ids.iter().filter_map(|id| agents.get(id).cloned()).collect()
            });
            Ok(agents)
        }else{
            Err(format!("User {} has no agents",user))
        }
    })
}