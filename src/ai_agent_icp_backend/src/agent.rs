
use candid::CandidType;
use ic_cdk::update;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::agent_config::{AgentConfig, Schedule};
#[derive(Debug,Deserialize,Serialize,CandidType)]
pub struct AgentConfigParam{
    pub name : String,
    pub description : String,
    pub owner : String,
    pub schedule : Schedule,
    pub tasks : Vec<crate::agent_config::Task>
}
#[update]
pub fn create_agent(args : AgentConfigParam) -> Result<AgentConfig,String>{
    let agent_id = Uuid::new_v4().as_u128() as u64;
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
    Ok(agent_config)
}