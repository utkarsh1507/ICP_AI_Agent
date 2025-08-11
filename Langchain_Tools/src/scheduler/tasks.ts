
import { CronJob, SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { app, tokenCanister } from "../server.js";


let agent_registry : Map<bigint,any>= new Map<bigint,any>();
const SYNC_AGENTS_TIME = 10;
const scheduler = new ToadScheduler();
export async function runTasks() {
  await syncAgents();
  scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      {seconds : SYNC_AGENTS_TIME},
      new Task('sync-agents' , async()=>{
        await syncAgents();
      })
    )
  )
 
}
async function syncAgents(){
  console.log("Syncing Agents Started ............");
  const agents =await tokenCanister?.get_all_agents();
  if(!agents) return;
  const seen = new Set<bigint>();
  for(const[rawId , config] of agents){
    const id = BigInt(rawId);
    seen.add(id);
    const oldConfig = agent_registry.get(id);
    if(!oldConfig){
      scheduleAgents(id , config);
      agent_registry.set(id,config);
      continue;
    }
    if(JSON.stringify(oldConfig.schedule) !== JSON.stringify(config.schedule)){
      scheduler.removeById(jobId(id));
      scheduleAgents(id, config);
      agent_registry.set(id , config);
    }
  }
  for(const id of agent_registry.keys()){
    if(!seen.has(id)){
      scheduler.removeById(jobId(id));
      agent_registry.delete(id);
    }
  }
  console.log("Syncing Agents Complete ...........");
}

function scheduleAgents(id :bigint , config : any){
  const task = new Task(`run-agent-${id}` , async()=>{
    console.log(`Running task for the agent having id ${id}`);
    await sendPrompt(config.prompt , config.owner , id);
  })

  if(config.schedule.Interval){
    scheduler.addSimpleIntervalJob(
      new SimpleIntervalJob(
        {days : config.schedule.Interval.interval_days},
        task,
        {id : jobId(id)}
      )
    );
  }else if(config.schedule.Cron){
    scheduler.addCronJob(
      new CronJob(
        {cronExpression : config.schedule.Cron.expression},
        task,
        {id : jobId(id)}
      )
    )
  }
}


export async function get_all_agents(){
    const agents = await tokenCanister?.get_all_agents();
    if(!agents){
        console.error("Failed to fetch agents from token canister");
        return [];
    }
    return agents;
}


function jobId(id : bigint){
  return `agent-id-job-${id}`;
}


async function sendPrompt(prompt : string , owner : string,id : bigint){
  try {
    const response = await fetch("http://localhost:5000/api/prompt",{
      body : JSON.stringify({prompt : prompt , owner :owner}),
      method : "POST",
      headers : {
         "Content-Type": "application/json"
      }
    })
    if(response){
      const output = await response.json();
      const result = await tokenCanister?.store_outputs(JSON.stringify(output),id , BigInt(Date.now()));
      if(result){
        console.log("Prompt send and output stored", result);
      }
    }



  } catch (error) {
    console.log("Error occurred in the send Prompt block : ",error);
  }
}