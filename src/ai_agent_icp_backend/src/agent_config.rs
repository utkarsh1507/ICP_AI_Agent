
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
#[derive(Debug,Serialize,Deserialize,CandidType,Clone)]
pub struct AgentConfig{
    pub agent_id : u64,
    pub name : String,
    pub description : String,
    pub owner : Principal,
    pub schedule : Schedule,
    pub tasks : Vec<Task>,
    pub created_at : i128,
    pub prompt : String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_run : Option<i128>,
}

#[derive(Debug, Serialize, Deserialize,CandidType,Clone)]
pub enum Schedule {
    Interval{interval_days : u64},
    Cron{expression : String}
}
#[derive(Debug, Serialize, Deserialize,CandidType,Clone) ]
pub struct Task{
    pub tool : String,
    pub params : String
}

