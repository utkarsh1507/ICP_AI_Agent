
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
#[derive(Debug,Serialize,Deserialize,CandidType,Clone)]
pub struct AgentConfig{
    pub agent_id : u64,
    pub name : String,
    pub description : String,
    pub owner : Principal,
    pub schedule : Schedule,
    pub created_at : i128,
    pub prompt : String,
    pub outputs : Vec<Outputs>,
}

#[derive(Debug, Serialize, Deserialize,CandidType,Clone)]
pub enum Schedule {
    Interval{interval_seconds : u64},
    Cron{expression : String}
}
#[derive(Debug, Serialize, Deserialize,CandidType,Clone) ]
pub struct Outputs{
    pub output : String,
    pub timestamp : i128
}
