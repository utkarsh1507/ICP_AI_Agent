import express from 'express'
import { create_token_canister } from './create-token-canister.js';
import { TokenCanisterClient } from './token-canister.js';
import { runTokenCanisterTool } from './test-tool.js';
import cors from 'cors';
import { get_all_agents, runTasks, test } from './scheduler/tasks.js';
import { Principal } from '@dfinity/principal';
import { introBotChat } from './convo.js';
export const app = express()
app.use(express.json());
const port = process.env.PORT || 5000;
app.use(cors());
export let tokenCanister : TokenCanisterClient | null = null;

(async ()=> {

   tokenCanister = await create_token_canister();
   //get_all_agents().then(agents =>{console.log("Fetched agents:",agents)}).catch(err => console.error("Error fetching agents:", err));
   //runTasks().then(() => console.log("Tasks are running...")).catch(err => console.error("Error running tasks:", err));
   //test().then(()=>console.log("Test ran successfully")).catch((err)=>console.log("Error",err));
   if(!tokenCanister){
    console.error("------------> Failed to create token canister...... Exiting <-----------");
    process.exit(1);
   }
   
   
   app.listen(port , ()=>{
       console.log(`A.I server running, now you can send prompts to use canister methods \ '/api/prompt can be used to send prompts'`)
    })
})().then(()=>console.log("Working Everything fine"));


app.post('/api/prompt', async(req,res)=>{
    try {
        const {prompt,owner} = req.body;
        const response =await runTokenCanisterTool(prompt,Principal.fromText(owner));
        if(response){
            console.log(response);
            return res.status(200).json(response);
        }
    } catch (error) {
        console.log(`Error occurred ${error}`);
        return res.send(400).json(error);
    }
})
app.get("/api/intro", async(req,res)=>{
    try {
        const response = await introBotChat();
        if(response){
            console.log(response);
            return res.status(200).json(response);
        }
    } catch (error) {
        console.log(`Error occurred ${error}`);
        return res.send(400).json(error);
    }
})