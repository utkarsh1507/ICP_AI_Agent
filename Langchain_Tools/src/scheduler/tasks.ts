
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { app, tokenCanister } from "../server.js";
import { runTokenCanisterTool } from "../test-tool";
import { GetAllAgentsResponse } from "../token-canister.js";

let agent_registry : Map<bigint,any>= new Map<bigint,any>();

const scheduler = new ToadScheduler();
export async function runTasks() {
  
  const get_agent_task = new Task("get_all_agents", async ()=>{
   let agents = await tokenCanister?.get_all_agents();
   if(!agents)return;
   agent_registry.clear();
   for(const [id , config] of agents){
    agent_registry.set(BigInt(id) , config);
   }
   console.log("Updated agent registry with agents:", agent_registry);
  })
  const agent_job = new SimpleIntervalJob({
    seconds : 10
  }, get_agent_task);
  scheduler.addSimpleIntervalJob(agent_job);
 
}


export async function get_all_agents(){
    const agents = await tokenCanister?.get_all_agents();
    if(!agents){
        console.error("Failed to fetch agents from token canister");
        return [];
    }
    return agents;
}