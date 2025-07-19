import { createTokenCanister, TokenCanisterClient } from './token-canister.js';
import Together from 'together-ai';
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
console.log("File name ->>",__filename)
const __dirname = dirname(__filename);
console.log("Dir Name ", __dirname);

dotenv.config({path : `${dirname(__dirname)}/.env`});
let tokenCanister : ReturnType<typeof createTokenCanister> | null = null;
let host = process.env.HOST || 'http://localhost:4943';
let tokenCanisterId = process.env.TOKEN_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';
try {
    tokenCanister =await TokenCanisterClient.create(tokenCanisterId, host);
    console.log(`Token Canister Created Successfully with canister id -----> ${tokenCanisterId} and host -----> ${host}`);
    console.log(`Actor created with token canister have these methods -----> ${JSON.stringify(tokenCanister)}`);
} catch (error) {
    console.error('Failed to create token canister client:', error);
}

const together = new Together({apiKey : process.env.TOGETHER_API});

const create_token_tool = {
    type : 'function',
    function : {
        name : 'create_token',
        description : 'Initializes a new token from the user',
        parameters : {
            type : 'object',
            required : ['name', 'symbol', 'decimals','description','logo','total_supply'],
            properties : {
                name : {type : 'string' , description : 'Name of the token'},
                symbol : {type : 'string' , description : 'Symbol of the token'},
                decimals : {type : 'number' , description : 'Decimal of the token'},
                description : {type : 'string' , description : 'Description of the token'},
                logo : {type : 'string' , description : 'Logo of the token'},
                total_supply : {type : 'number' , description : 'Total Supply of the token'},
            }
        }
    }
}

const token_metadata_tool = {
    type : 'function',
    function : {
        name : 'get_token_metadata',
        description : 'Returns the metadat of the ICRC token using symbol',
        parameters : {
            type : 'object',
            required : ['symbol'],
            properties : {
                symbol : {type : 'string' , description : 'Symbol of the token'}
            }
        }
    }
}

const get_all_tokens_tool = {
    type : 'function',
    function : {
        name : "get_all_tokens",
        description : "Returns all ICRC tokens",
        parameters : {
            type : '',
            required : [],
            properties : {}
        }
    }
}
async function runTokenCanisterTool(content: string) {
   
    const availableFunctions = {
        create_token :tokenCanister?.create_token.bind(tokenCanister),
        get_token_metadata : tokenCanister?.get_token_metadata.bind(tokenCanister),
        get_all_tokens : tokenCanister?.get_all_tokens.bind(tokenCanister)
    }
    const response = await together.chat.completions.create({
        model : 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages : [ {role : 'user' , content : content}],
        tools :[create_token_tool,token_metadata_tool,get_all_tokens_tool],
        tool_choice : 'auto'
    });

    let output : any;
    const tool_calls = response.choices[0]?.message?.tool_calls;
    if(tool_calls){
        for(const tool of tool_calls){
            const arg = JSON.parse(tool.function.arguments);
            console.log("Parsing the function with these arguments given by the user", arg);
            const functionToCall = availableFunctions[tool.function.name];
            output =await functionToCall(arg);
            console.log("output from the function " , output);
            
        }
    }
   
}
runTokenCanisterTool('Get the metadata for the token having symbol T3 and after this get me all the tokens present.')
.catch(error => console.error("An error occurred:", error));