
import { CronJob, SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { app, tokenCanister } from "../server.js";
import { Principal } from "@dfinity/principal";



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
  console.log("All agents : ",agents);
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
    if(!schedulesEqual(oldConfig.schedule,config.schedule)){
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
    console.log(`Running task for the agent having id ${id} and prompt : ${config.prompt}`);
    await sendPrompt(config.prompt , config.owner , id);
  })
  console.log(
  "Scheduling agent",
  id.toString(), // BigInt to string
  JSON.stringify(config.schedule, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
    2
  )
);

  if(config.schedule.Interval){
    console.log("Entered Task")
    scheduler.addSimpleIntervalJob(
      new SimpleIntervalJob(
        {seconds : Number(config.schedule.Interval.interval_seconds)},
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


async function sendPrompt(prompt : string , owner : Principal,id : bigint){
  try {
    console.log("Sending the prompt to the server  ",prompt, "with owner : ", owner);
    console.log("Sending body to the server",JSON.stringify({'prompt' : prompt , 'owner' :owner}))
    const response = await fetch("http://localhost:5000/api/prompt",{
      body : JSON.stringify({'prompt' : prompt , 'owner' :owner.toText()}),
      method : "POST",
      headers : {
         "Content-Type": "application/json"
      }
    })
    if(response){
      const output = await response.json();
      console.log("Output from AI : ", JSON.stringify(output));
      const result = await tokenCanister?.store_output(JSON.stringify(output , (_ , v)=> typeof v ==='bigint' ? v.toString() : v),BigInt(id));
      if(result){
        console.log("Prompt send and output stored", result);
      }
    }



  } catch (error) {
    console.log("Error occurred in the send Prompt block : ",error);
  }
}


function stringifyWithBigInt(obj : any){
  return JSON.stringify(obj ,(key , value)=>
    typeof value === 'bigint' ? value.toString() : value
  );
}
function schedulesEqual(a: any , b : any){
  return stringifyWithBigInt(a) === stringifyWithBigInt(b);
}


export async function test(){
  try {
   const output = await sendPrompt("Get the details of token having symbol BT",Principal.fromText("tt2ny-e542c-tlafd-ohion-shqfp-m3xeh-a47qn-q5htm-7a37y-fbdbu-pqe"),BigInt(0));
   console.log(output);
  } catch (error) {
    
  }
}