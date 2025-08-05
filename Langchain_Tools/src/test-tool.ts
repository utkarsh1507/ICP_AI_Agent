
import Together from 'together-ai';

import { tokenCanister } from './server.js';


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

const mint_token_tool = {
    type : 'function',
    function : {
        name : 'icrc2_mint',
        description : 'Mints new tokens to the specified account',
        parameters : {
            type : 'object',
            required : ['to', 'amount', 'symbol'],
            properties : {
                to : {
                    type : 'object',
                    required : ['owner'],
                    properties : {
                        owner : {type : 'string', description : 'Principal of the owner'},
                        subaccount : {type : ['array','null'], items: {type: 'string'}, description: 'Subaccount of the owner'}
                    },
                    description : 'Account to which tokens will be minted'
                },
                amount : {type : 'number', description : 'Amount of tokens to mint'},
                symbol : {type : 'string', description : 'Symbol of the token'}
            }
        }
    }
}
const transfer_token_tool = {
    type : 'function',
    function : {
        name : 'icrc2_transfer',
        description : 'Transfers tokens from the caller to the specified account.',
        parameters : {
            type : 'object',
            required : ['to', 'amount', 'symbol'],
            properties : {
                to : {
                    type : 'object',
                    required : ['owner'],
                    properties : {
                        owner : {type : 'string', description : 'Principal of the recipient account.'},
                        subaccount : {type : ['array','null'], items: {type: 'string'}, description: 'Optional subaccount of the recipient.'}
                    },
                    description : 'The account to which tokens will be transferred.'
                },
                amount : {type : 'number', description : 'The amount of tokens to transfer.'},
                symbol : {type : 'string', description : 'The symbol of the token to transfer.'}
            }
        }
    }
}

export async function runTokenCanisterTool(content: string) : Promise<any>{
   
    const availableFunctions = {
        create_token :tokenCanister?.create_token.bind(tokenCanister),
        get_token_metadata : tokenCanister?.get_token_metadata.bind(tokenCanister),
        get_all_tokens : tokenCanister?.get_all_tokens.bind(tokenCanister),
        mint_token : tokenCanister?.mint_token.bind(tokenCanister),
        transfer_token : tokenCanister?.transfer_token.bind(tokenCanister)
    }
    const response = await together.chat.completions.create({
  model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  messages: [
    { role: 'system', content: `You are an AI assistant integrated with tools that interact with a token canister.

Your job is to parse user prompts and call the appropriate function tool using valid arguments.

If the user's prompt mentions a time interval (e.g. "every 10 seconds", "every 2 minutes", "each day"), then:

Add a new field to the function arguments:

"schedule": {
  "type": "Interval",
  "interval_days": <converted_seconds>
}
` },
    { role: 'user', content: content }
  ],
  tools: [
    create_token_tool,
    token_metadata_tool,
    get_all_tokens_tool,
    mint_token_tool,
    transfer_token_tool
  ],
  tool_choice: 'auto'
});


    let output :any[] = [];
    const tool_calls = response.choices[0]?.message?.tool_calls;
    if(tool_calls){
        for(const tool of tool_calls){
            const arg = JSON.parse(tool.function.arguments);
            console.log("Parsing the function with these arguments given by the user", arg);
            const functionToCall = availableFunctions[tool.function.name];
            if(functionToCall){

                const result = await functionToCall(arg);
                //output =await functionToCall(arg);
                console.log("output from the function " , result);
                output.push(result)
            }else{
                console.warn(`Function ${tool.function.name} is not present`);
            }
            
            
        }

    }
    return output;
   
}
