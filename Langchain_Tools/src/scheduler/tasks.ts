import { run } from "node:test";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { tokenCanister } from "../server";




const scheduler = new ToadScheduler();
export async function runTasks(){
    //const agents : any = await tokenCanister?.get_all_agents();
    const agents = [{id : 1,name : "Create Token Agent", description: "This agent is used to create tokens and schedule token creation on regular intervals", owner: "aaaaa-aa", interval_days_in_seconds : 5,prompt : "Create token"}];
    agents.forEach(agent =>{
        const task = new Task(`${agent.name}-${agent.id}-${Date.now()}`,async ()=>{
            console.log(`Running task for agent ${agent.name} with id ${agent.id}`);
        })
        const job = new SimpleIntervalJob({seconds : agent.interval_days_in_seconds} , task);
        scheduler.addSimpleIntervalJob(job);
        console.log(`Added job for agent ${agent.name} with id ${agent.id}`);
    })
}

