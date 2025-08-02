import express from 'express'
import { create_token_canister } from './create-token-canister.js';
import { TokenCanisterClient } from './token-canister.js';
import { runTokenCanisterTool } from './test-tool.js';
import cors from 'cors';
import { runTasks } from './scheduler/tasks.js';
const app = express()
app.use(express.json());
const port = process.env.PORT || 5000;
app.use(cors());
export let tokenCanister : TokenCanisterClient | null = null;

(async ()=> {

   tokenCanister = await create_token_canister();
   runTasks().then(() => console.log("Tasks are running...")).catch(err => console.error("Error running tasks:", err));
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
        const {prompt} = req.body;
        const response =await runTokenCanisterTool(prompt);
        if(response){
            console.log(response);
            return res.status(200).json(response);
        }
    } catch (error) {
        console.log(`Error occurred ${error}`);
        return res.send(400).json(error);
    }
})