
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { app, tokenCanister } from "../server.js";
import { runTokenCanisterTool } from "../test-tool";

const scheduler = new ToadScheduler();
export async function runTasks() {
  //const agents : any = await tokenCanister?.get_all_agents();
  const agents = [
    {
      id: 1,
      name: "Create Token Agent",
      description:
        "This agent is used to create tokens and schedule token creation on regular intervals",
      owner: "aaaaa-aa",
      interval_days: 5,
      prompt: "Create token",
    },
    {
      id: 2,
      name: "Create Token Agent with time 1 second",
      description:
        "This agent is used to create tokens and schedule token creation on regular intervals",
      owner: "aaaaa-aa",
      interval_days: 1,
      prompt: "Create token",
    },
    {
      id: 3,
      name: "Create Token Agent with time 9 seconds",
      description:
        "This agent is used to create tokens and schedule token creation on regular intervals",
      owner: "aaaaa-aa",
      interval_days: 9,
      prompt: "Create token",
    },
    {
      id: 4,
      name: "Create Token Agent with time 15 seconds",
      description:
        "This agent is used to create tokens and schedule token creation on regular intervals",
      owner: "aaaaa-aa",
      interval_days: 15,
      prompt: "Create token",
    },
  ];
  agents.forEach((agent) => {
    const task = new Task(
      `${agent.name}-${agent.id}-${Date.now()}`,
      async () => {
        console.log(`Running task for agent ${agent.name} with id ${agent.id}`);
        /*app.post("/api/prompt", async (req, res) => {
          try {
            const prompt = agent.prompt;
            const response = await runTokenCanisterTool(prompt);
            if (response) {
              console.log(response);
              return res.status(200).json(response);
            }
          } catch (error) {
            console.log(`Error occurred ${error}`);
            return res.send(400).json(error);
          }
        });*/
      }
    );
    
    const job = new SimpleIntervalJob(
      { seconds: agent.interval_days},
      task
    );
    scheduler.addSimpleIntervalJob(job);
    console.log(`Added job for agent ${agent.name} with id ${agent.id}`);
  });
}


export async function get_all_agents(){
    const agents = await tokenCanister?.get_all_agents();
    if(!agents){
        console.error("Failed to fetch agents from token canister");
        return [];
    }
    return agents;
}