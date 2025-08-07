
import Together from 'together-ai';

import { tokenCanister } from './server.js';
import { Principal } from '@dfinity/principal';


const together = new Together({apiKey : process.env.TOGETHER_API});

const create_token_tool = {
    type : 'function',
    function : {
        name : 'create_token',
        description : 'Initializes a new token from the user',
        parameters : {
            type : 'object',
            required : ['name', 'symbol', 'decimals','description','logo','initial_supply','owner', 'fee'],
            properties : {
                name : {type : 'string' , description : 'Name of the token'},
                symbol : {type : 'string' , description : 'Symbol of the token'},
                decimals : {type : 'number' , description : 'Decimal of the token'},
                description : {type : 'string' , description : 'Description of the token'},
                logo : {type : 'string' , description : 'Logo of the token'},
                initial_supply : {type : 'number' , description : 'Initial Supply of the token'},
                fee : {type : 'number' , description : 'Fee for the token'},
                owner : {type : 'string' , description : 'Principal of the owner who will own the token'}
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
  type: 'function',
  function: {
    name: 'icrc2_mint',
    description: 'Mints new tokens to the specified account',
    parameters: {
      type: 'object',
      required: ['to','amount','symbol','owner'],
      properties: {
        to: {
          type: 'object',
          required: ['owner'],
          properties: {
            owner: { type: 'string', description: 'Principal who will receive the minted tokens' },
            subaccount: {
              anyOf: [
                { type: 'array', items: { type: 'string' } },
                { type: 'null' }
              ],
              description: 'Optional subaccount as an array of byte strings'
            }
          },
          description: 'Account to which tokens will be minted'
        },
        amount: {
          type: 'string',
          description: 'Amount of tokens to mint (passed as a string, will be converted to BigInt)'
        },
        symbol: { type: 'string', description: 'Symbol of the token' },
        owner: { type: 'string', description: 'Principal of the minting account' }
      },
      examples: [
        {
          to: { owner: 'w7x7r-cok77-xa', subaccount: null },
          amount: '1000',
          symbol: 'ABC',
          owner: 'aaaaa-aa'
        }
      ]
    }
  }
};

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

export async function runTokenCanisterTool(content: string,owner : Principal) : Promise<any>{
    const prompt = content + ' Owner will be '+ owner.toString();;
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
   { 
  role: 'system', 
  content: `You are an AI assistant integrated with tools that interact with a token canister.

Your job is to parse user prompts and call the appropriate function tool using valid arguments.
In the prompt you will be given the owner and you should add owner to the function arguments.
Do not add or create schedule to the function arguments if the user does not mention any type of time interval in the prompt.    
If the user's prompt mentions a time interval (e.g. "every 10 seconds", "every 2 minutes", "each day"), then:

Add a new field to the function arguments:

"schedule": {
  "type": "Interval",
  "interval_days": <converted_seconds>
}

If the user's prompt mentions a specific time (e.g. "at 3 PM every Monday", "at 10:20 PM Tuesday"), convert it to a cron expression in strict 5-field format:

"schedule": {
  "type": "Cron",
  "expression": "<cron_expression>"
}

🟢 Format rules (very important):
- Use 24-hour format (e.g., 11 PM = 23, 1 AM = 1)
- Use this exact cron format: MIN HOUR DAY_OF_MONTH MONTH DAY_OF_WEEK
  - MINUTE: 0-59
  - HOUR: 0-23
  - DAY_OF_MONTH: 1-31 or "*"
  - MONTH: 1-12 or "*"
  - DAY_OF_WEEK: 0-6 (Sunday = 0, Monday = 1, ..., Saturday = 6)

🧠 Example conversions:
- "Every Tuesday at 11 PM" → 0 23 * * 2
- "10:15 AM every Friday" → 15 10 * * 5`
}
,
    { role: 'user', content: prompt }
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
