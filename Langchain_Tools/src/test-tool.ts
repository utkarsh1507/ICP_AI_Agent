import Together from "together-ai";

import { tokenCanister } from "./server.js";
import { Principal } from "@dfinity/principal";

const together = new Together({ apiKey: process.env.TOGETHER_API });
const agent_schedule = {
  type: "object",
  description: "Optional Scheduling info",
  properties: {
    type: {
      type: "string",
      enum: ["Interval", "Cron"],
    },
    interval_seconds: {
      type: "string",
      description: "Interval in seconds (for Interval type)",
    },
    expression: {
      type: "string",
      description: "Cron expression (for Cron type)",
    },
  },
  required: ["type"],
};
const create_token_tool = {
  type: "function",
  function: {
    name: "create_token",
    description: "Initializes a new token from the user",
    parameters: {
      type: "object",
      required: [
        "name",
        "symbol",
        "decimals",
        "description",
        "logo",
        "initial_supply",
        "owner",
        "fee",
      ],
      properties: {
        name: { type: "string", description: "Name of the token" },
        symbol: { type: "string", description: "Symbol of the token" },
        decimals: { type: "number", description: "Decimal of the token" },
        description: {
          type: "string",
          description: "Description of the token",
        },
        logo: { type: "string", description: "Logo of the token" },
        initial_supply: {
          type: "number",
          description: "Initial Supply of the token",
        },
        fee: { type: "number", description: "Fee for the token" },
        owner: {
          type: "string",
          description: "Principal of the owner who will own the token",
        },
      },
    },
  },
};

const token_metadata_tool = {
  type: "function",
  function: {
    name: "get_token_metadata",
    description: "Returns the metadata of the ICRC token using symbol",
    parameters: {
      type: "object",
      required: ["symbol", "owner"],
      properties: {
        symbol: { type: "string", description: "Symbol of the token" },
        owner: { type: "string", description: "Principal of the owner" },
        schedule: agent_schedule,
      },
    },
  },
};

const get_all_tokens_tool = {
  type: "function",
  function: {
    name: "get_all_tokens",
    description: "Returns all ICRC tokens",
    parameters: {
      type: "",
      required: [],
      properties: {},
    },
  },
};

const mint_token_tool = {
  type: "function",
  function: {
    name: "icrc2_mint",
    description: "Mints new tokens to the specified account",
    parameters: {
      type: "object",
      required: ["to", "amount", "symbol", "owner"],
      properties: {
        to: {
          type: "object",
          required: ["owner"],
          properties: {
            owner: {
              type: "string",
              description: "Principal who will receive the minted tokens",
            },
            subaccount: {
              anyOf: [
                { type: "array", items: { type: "string" } },
                { type: "null" },
              ],
              description: "Optional subaccount as an array of byte strings",
            },
          },
          description: "Account to which tokens will be minted",
        },
        amount: {
          type: "string",
          description:
            "Amount of tokens to mint (passed as a string, will be converted to BigInt)",
        },
        symbol: { type: "string", description: "Symbol of the token" },
        owner: {
          type: "string",
          description: "Principal of the minting account",
        },
      },
      examples: [
        {
          to: { owner: "w7x7r-cok77-xa", subaccount: null },
          amount: "1000",
          symbol: "ABC",
          owner: "aaaaa-aa",
        },
      ],
    },
  },
};

const transfer_token_tool = {
  type: "function",
  function: {
    name: "icrc2_transfer",
    description: "Transfers tokens from the caller to the specified account.",
    parameters: {
      type: "object",
      required: ["to", "amount", "symbol"],
      properties: {
        symbol: {
          type: "string",
          description: "The symbol of the token to transfer.",
        },
        to: {
          type: "object",
          required: ["owner"],
          properties: {
            owner: {
              type: "string",
              description: "Principal of the recipient account.",
            },
            subaccount: {
              type: ["array", "null"],
              items: { type: "integer" },
              description: "Optional subaccount of the recipient, 32-byte array as integers.",
            },
          },
          description: "The account to which tokens will be transferred.",
        },
        amount: {
          type: "string",
          description: "The amount of tokens to transfer (as a string to support nat).",
        },
        fee: {
          type: ["string", "null"],
          description: "Optional transfer fee. Defaults to token metadata fee if null.",
        },
        memo: {
          type: ["array", "null"],
          items: { type: "integer" },
          description: "Optional memo as bytes.",
        },
        from_subaccount: {
          type: ["array", "null"],
          items: { type: "integer" },
          description: "Optional subaccount of the sender.",
        },
        created_at_time: {
          type: ["string", "null"],
          description: "Optional timestamp (nanoseconds since epoch).",
        },
      },
    },
  },
};


const balance_tool = {
  type: "function",
  function: {
    name: "icrc2_balance_of",
    description:
      "Returns the balance of the specified account for a given token symbol.",
    parameters: {
      type: "object",
      required: ["owner", "symbol"],
      properties: {
        owner: {
          type: "string",
          description:
            "Principal of the account whose balance is being queried.",
        },
        symbol: {
          type: "string",
          description:
            "Symbol of the token for which the balance is being queried.",
        },
      },
      examples: [
        {
          owner: "w7x7r-cok77-xa",
          symbol: "ABC",
        },
      ],
    },
  },
};

const user_agents_tool = {
  type: "function",
  function: {
    name: "get_user_agents",
    description:
      "Fetches all agents for a given owner. Optionally, include a schedule to filter agents by their schedule type.",
    parameters: {
      type: "object",
      required: ["owner"],
      properties: {
        owner: {
          type: "string",
          description: "Principal of the user whose agents to be fetched.",
        },
        schedule : agent_schedule
      },
    },
  },
};

export async function runTokenCanisterTool(
  content: string,
  owner: Principal
): Promise<any> {
  const prompt = content + " Owner will be " + owner.toString();
  const availableFunctions = {
    create_token: tokenCanister?.create_token.bind(tokenCanister),
    get_token_metadata: tokenCanister?.get_token_metadata.bind(tokenCanister),
    get_all_tokens: tokenCanister?.get_all_tokens.bind(tokenCanister),
    icrc2_mint: tokenCanister?.mint_token.bind(tokenCanister),
    icrc2_transfer: tokenCanister?.transfer_token.bind(tokenCanister),
    icrc2_balance_of: tokenCanister?.icrc2_balance_of.bind(tokenCanister),
  };
  const isHowToQuery = /how to use/i.test(content)
  const response = await together.chat.completions.create({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant integrated with tools that interact with a token canister.
Your Responsibilities : 

1. Your job is to parse user prompts and call the appropriate function tool using valid arguments.
2. Always include the user's owner (principal) in the function arguments when required.
3. User can ask you to list all the avalaible feautres or tools .
4. You need to provide example input to the user for each tool they ask for.
5. Stay within the context of ICRC tokens of ICP and the supported tools in our app. 
6. If user misses any required parameter, explain what's missing and show a valid sample input before executing.
7. Never hallucinate unsupported tools. If a user asks for something outside ICRC tokens, politely refuse.
Available Tools : 
1. create_token
  • Description: Initializes a new token from the user.
  • Arguments:
    - name (string): Name of the token.
    - symbol (string): Symbol of the token.
    - decimals (number): Number of decimal places for the token.
    - description (string): Description of the token.
    - logo (string): URL or base64 string of the token logo.
    - initial_supply (number): The initial total supply of the token.
    - fee (number): The transaction fee for the token.
    - owner (string): Principal of the user creating the token (must always be included).
  • Example prompts:
    - "Create a new token named GoldCoin with symbol GLD, 8 decimals, and initial supply of 1,000,000."
    - "Create a token called MyToken, symbol MTK, with 2 decimals, logo https://example.com/logo.png, fee 1."
2. icrc2_transfer 
  • Description: Transfers tokens from the caller to the specified account.
  • Arguments:
    - symbol (string): The symbol of the token.
    - to (record): Recipient account with fields { owner: string, subaccount?: [u8; 32] }.
    - amount (nat as string): The amount of tokens to transfer.
    - fee (optional nat as string): Transfer fee if custom fee is desired.
    - memo (optional bytes): Extra data attached to the transfer.
    - from_subaccount (optional [u8; 32]): Subaccount of sender.
    - created_at_time (optional nat64): Timestamp in nanoseconds.
  • Example prompts:
    - "Transfer 1000 GLD to principal abcde-12345"
    - "Send 500 MTK to principal wxyz-67890 with memo 'payment'"
    - "Transfer 250 USDT from my subaccount to principal zzzz-99999"

3. get_token_metadata
  • Description: Returns the metadata of the ICRC token using its symbol.
  • Arguments:
    - symbol (string): The symbol of the token.
    - owner (string): Principal of the owner requesting metadata.
    - schedule (object): Agent schedule configuration (optional, for internal use).
  • Example prompts:
    - "Get the metadata for token GLD"
    - "Show me details of my token MTK"
    - "Fetch metadata of USDT owned by my principal"
4. get_all_tokens
  • Description: Returns all ICRC tokens available in the system.
  • Arguments: None.
  • Example prompts:
    - "Show me all tokens"
    - "List every token created so far"
    - "Get all available ICRC tokens"
5. icrc2_balance_of
  • Description: Returns the balance of the specified account for a given token symbol.
  • Arguments:
    - owner (string): Principal of the account whose balance is being queried.
    - symbol (string): Symbol of the token for which the balance is being queried.
  • Example prompts:
    - "Check my balance of GLD"
    - "How many MTK tokens does principal abcde-12345 have?"
    - "Get balance of USDT for my account"

Whenever a user asks something, explain which tool you'll use and show them how it works with their input before executing.
`,
      },
      { role: "user", content: prompt },
    ],
    tools: isHowToQuery?  undefined : [
      create_token_tool,
      token_metadata_tool,
      get_all_tokens_tool,
      mint_token_tool,
      transfer_token_tool,
      balance_tool,
    ],
    tool_choice: isHowToQuery ? undefined : "auto",
  });

  let output: any[] = [];
  const tool_calls = response.choices[0]?.message?.tool_calls;
  if (tool_calls) {
    for (const tool of tool_calls) {
      const arg = JSON.parse(tool.function.arguments);
      console.log(
        "Parsing the function with these arguments given by the user",
        arg
      );
      const functionToCall = availableFunctions[tool.function.name];
      if (functionToCall) {
        const result = await functionToCall(arg);
        //output =await functionToCall(arg);
        
        console.log("output from the function ", result);
        output.push(result);
      } else {
        console.warn(`Function ${tool.function.name} is not present`);
      }
    }
  }
  return output;
}
