import ollama from 'ollama';
import { createMockTokenCanister, createTokenCanister, TokenCanisterClient } from './token-canister.js';
import Together from 'together-ai';
import { json } from 'zod';


let tokenCanister : ReturnType<typeof createTokenCanister> | null = null;
let host = process.env.HOST || 'http://localhost:4943';
let tokenCanisterId = process.env.TOKEN_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';
try {
    tokenCanister =await TokenCanisterClient.create(tokenCanisterId, host);
    console.log(`Token Canister Created Successfully with canister id -----> ${tokenCanisterId} and host -----> ${host}`);
    console.log(`Actor created with token canister have these methods -----> ${JSON.stringify(tokenCanister)}`);
} catch (error) {
    console.error('Failed to create token canister client:', error);
}

const mockTokenCanisterTool = {
    type : 'function',
    function : {
        name : 'createMockTokenCanister',
        description : "Creates a mock token canister just for tesing",
        parameters : {
            type : 'object',
            required : ['actor'],
            properties : {
                actor : {type : 'string' , description : 'The actor string for the mock token canister'}
            }
        }
    }
}
const together = new Together({apiKey : ''});

async function runMockTokenCanisterTool(actor: string) {
    const messages = [ {role : 'user' , content : `Create a mock token canister with actor : ${actor}`}];
    console.log('Prompt:', messages[0].content);
    const availableFunctions = {
        createMockTokenCanister
    }
    const response = await together.chat.completions.create({
        model : 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages : [ {role : 'user' , content : `Create a mock token canister with actor : ${actor}`}],
        tools :[mockTokenCanisterTool],
        tool_choice : 'auto'
    });

    let output : any;
    const toolcalls = response?.choices[0]?.message?.tool_calls;
    console.log("Tool to call -------->>>>>>>" ,toolcalls);
    if(toolcalls){
        for(const tool of toolcalls){
            const agrs = JSON.parse(tool.function.arguments);
            console.log("Arguments to provide in the function ------>>>>> " , agrs);
        }
    }
    /*if(response.message.tool_calls){
        for(const tool of response.message.tool_calls){
            const functionToCall = availableFunctions[tool.function.name];
            if(functionToCall){
                console.log('Calling function:', tool.function.name);
                console.log('Arguments:', tool.function.arguments);
                output = functionToCall(tool.function.arguments.actor);
                console.log('Function output:', output);

                // Add the function response to messages for the model to use
                messages.push(response.message);
                messages.push({
                    role: 'tool',
                    content: JSON.stringify(output),
                });
            } else {
                console.log('Function', tool.function.name, 'not found');
            }
        }
    }else{
        console.log('No tool calls returned from model');
    }*/
    //const mockTokenCanister = createMockTokenCanister(actor);
}

runMockTokenCanisterTool('mock-actor-string').catch(error => console.error("An error occurred:", error));

const getBalanceTool = {
    type : 'function',
    function : {
        name : 'getBalance',
        description : "Get the balance of a given account",
        parameters : {
            type : 'object',
            required : ['account'],
            properties : {
                account : {type : 'string' , description : 'The account ID to check balance for'}
            }
        }
    }
}


const transferTool = {
    type : 'function',
    function : {
        name : 'transfer',
        description : "Transfer tokens from one account to another",
        parameters : {
            type :'object',
            required : ['from', 'to','amount'],
            properties : {
                from : {type : 'string',description : 'The sender account ID'},
                to : {type : 'string',description : 'The recipient account ID'},
                amount : {type : 'string',description : 'The amount to transfer'}
            }
        }
    }
}

const getMetaDataTool = {
    type : 'function',
    function : {
        name : 'getMetaData',
        description : "Get the metadata of the token canister",
        parameters : {
            type : 'object',
            required : [],
            properties : {}
        }
    }
}


const getTranssactionsTool = {
    type : 'function',
    function : {
        name : 'getTransactions',
        description : "Get the transactions of the token canister",
        parameters : {
            type : 'object',
            required : [],
            properties : {
                limit : {type : 'number', description : 'The number of transactions to return, default is 10'}
            }
        }
    }
}

const create_task_tool = {
    type : 'function',
    function : {
        name : 'create_task',
        description : "Create the task with given id, data and frequency",
        parameters : {
            type : 'object',
            required : ['id','data','frequency'],
            properties : {
                id : {type : 'number', description : 'Task id for the new task to be created'},
                data : {type : 'string' , description : 'Data to be given for the tast'},
                frequency : {type : 'number' , description : 'How many times the task will be executed'}
            }
        }
    }
}

async function runTokenCanisterTool(content: string) {
    const messages = [ {role : 'user' , content : content}];
    //console.log('Prompt:', messages[0].content);
    const availableFunctions = {
        /*getBalance : tokenCanister?.getBalance.bind(tokenCanister),
        transfer : tokenCanister?.tranfer.bind(tokenCanister),
        getMetaData : tokenCanister?.getMetaData.bind(tokenCanister),
        getTransactions : tokenCanister?.getTransactions.bind(tokenCanister),*/
        create_task : tokenCanister?.create_task.bind(tokenCanister)
    }
    const response = await ollama.chat({
        model : 'llama3.1',
        messages,
        tools :[getBalanceTool , transferTool, getMetaDataTool, getTranssactionsTool,create_task_tool]
    });

    let output : any;
    if(response.message.tool_calls){
        for(const tool of response.message.tool_calls){
            const functionToCall = availableFunctions[tool.function.name];
            if(functionToCall){
                console.log('Calling function:', tool.function.name);
                console.log('Arguments:', tool.function.arguments);
                output =await functionToCall(tool.function.arguments);
                console.log('Function output:', output);

                // Add the function response to messages for the model to use
                messages.push(response.message);
                messages.push({
                    role: 'tool',
                    content: JSON.stringify(output),
                });
            } else {
                console.log('Function', tool.function.name, 'not found');
            }
        }
    }else{
        console.log('No tool calls returned from model');
    }
    //const mockTokenCanister = createMockTokenCanister(actor);
}
//runTokenCanisterTool('Create the task with task id 10102 and data sumit goyal with frequency 2').catch(error => console.error("An error occurred:", error));



