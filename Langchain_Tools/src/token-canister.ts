import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {idlFactory} from "../../src/declarations/ai_agent_icp_backend/index.js";
import { Principal } from "@dfinity/principal";

interface Account {
  owner: string;
  subaccount?: Uint8Array | null;
}
export interface AgentConfig {
  name: string;
  description: string;
  schedule: AgentSchedule;
  tasks: Task[];
  created_at: bigint; 
  prompts : string 
  next_run?: [bigint] | []; 
}

export type AgentSchedule = 
  | { Interval: { interval_days: bigint } }
  | { Cron: { expression: string } };


export interface Task {
  tool: string;
  params: string;
}
export type GetAllAgentsResponse = 
  [bigint, AgentConfig][];
;
export interface TokenCanister {
  icrc2_init : (name : string , symbol : string , decimals : number ,description : [string] | [],logo : [string] | [] , total_supply : bigint, owner : Principal,fee : bigint)=>Promise<boolean>;
  icrc2_metadata :(symbol : string) =>Promise<APIResponse>;
  icrc2_get_all_records : () => Promise<APIResponse>;
  icrc2_mint: (to: { owner: Principal; subaccount: [] | [Uint8Array]}, amount: bigint, symbol: string,owner : Principal) => Promise<APIResponse>;
  create_agent : (name : string , description : string ,schedule : AgentSchedule , tasks : Task[] , created_at : number , prompt : string ,next_run : [number] ) =>Promise<string>;
  get_all_agents : ()=> Promise<GetAllAgentsResponse | undefined>;
  transfer_token: (tokenId: string, to: Principal, amount: bigint) => Promise<boolean>;
  icrc2_balance_of: (owner : Principal , symbol : string)=> Promise<bigint>;
  store_outputs : (output : string , id : bigint , created_at : bigint)=>Promise<string>;
}
interface CreateTokenArgs{
    name: string;
    symbol: string;
    decimals: number;
    description?: string;
    logo?: string;
    initial_supply: bigint;
    fee: bigint;
    schedule? : Schedule;
    owner : string;
}
type Schedule = 
  | { type: 'Interval'; interval_days: number }
  | { type: 'Cron'; expression: string };
interface APIResponse {
  Text : string;
  PairList : [string, string];
}


interface MintTokenArgs{
  to : Account;
  amount : string;
  symbol : string;
  owner : string;
}

interface BalanceTokenArgs{
  owner : string;
  symbol : string;
}

export class TokenCanisterClient{
    private actor : ActorSubclass<TokenCanister>;
    constructor(actor : any){
        this.actor = actor;
    }

    static async create(tokenCanisterId : string ,host : string) : Promise<TokenCanisterClient>{
        try {
            const agent = await HttpAgent.create({host});

            if(typeof host === 'string' && host.includes("localhost")){
                await agent.fetchRootKey();
                console.log("Root key fetched for local development");
            }
            const actor : ActorSubclass= Actor.createActor(idlFactory , {
                agent,
                canisterId : tokenCanisterId
            });
            console.log(`Created Actor ------>>> ${JSON.stringify(actor)}<<<<-------`);
            return new TokenCanisterClient(actor);
        } catch (error) {
            throw new Error(`Failed to create TokenCanisterClient: ${error}`);
        }
    }

    async create_token(args : CreateTokenArgs){
        if(args.schedule?.type === 'Interval' || args.schedule?.type === 'Cron'){
             
            const agent = this.actor.create_agent(
                "Create Token Agent",
                "This agent is used to create tokens and schedule token creation on regular intervals",
                args.schedule.type==='Interval' ? { Interval : {interval_days : BigInt(args.schedule.interval_days)}} : {Cron : {expression : args.schedule.expression}},
                [],
                Date.now(),
                `Create token with name ${args.name}, symbol ${args.symbol}, decimals ${args.decimals}, description ${args.description}, logo ${args.logo}, total supply ${args.initial_supply}, owner ${args.owner} and fee ${args.fee} `,
                args.schedule.type==='Interval' ? [Date.now() + Number(args.schedule.interval_days)] : [0]
            );
            console.log("Created agent for token creation", agent);

        }
        return await this.actor.icrc2_init(args.name , args.symbol,args.decimals,args.description ? [args.description] : [],args.logo? [args.logo] : [],BigInt(args.initial_supply),Principal.fromText(args.owner),BigInt(args.fee) , );
    }
    async get_token_metadata(args : CreateTokenArgs){
      console.log("Args:", args);
      if(args.schedule ){
        console.log("Creating agent for token metadata retrieval");
        const agent =await this.actor.create_agent(
                "Token Metadata Agent",
                "This agent is used to fetch token metadata on regular intervals",
                args.schedule.type==='Interval' ? { Interval : {interval_days : BigInt(args.schedule.interval_days)}} : {Cron : {expression : args.schedule.expression}},
                [],
                Date.now(),
                `Get the details of token having symbol ${args.symbol}`,
                args.schedule.type==='Interval' ? [Date.now() + args.schedule.interval_days] : [0]
            );
        if(agent){
          console.log("Created agent for token metadata retrieval", agent);
        }
      }
        return await this.actor.icrc2_metadata(args.symbol);
    }

    async get_all_tokens(){
        return await this.actor.icrc2_get_all_records();
    }
    async transfer_token(tokenId: string, to: Principal, amount: bigint): Promise<boolean> {
        return await this.actor.transfer_token(tokenId, to, amount);
    }
    async mint_token(args : MintTokenArgs) {
      if(args.to?.subaccount && Array.isArray(args.to.subaccount)){
        if(args.to.subaccount.length === 0){
            args.to.subaccount = null;
        }else{
          const bytes = Uint8Array.from(args.to.subaccount.map((b : string) => parseInt(b)));
          args.to.subaccount = bytes;
        }
      }
    const formattedTo: { owner: Principal; subaccount: [] | [Uint8Array] } = {
        owner: Principal.fromText(args.to.owner),
        subaccount: args.to.subaccount ? [args.to.subaccount] as [Uint8Array] : [],
    };
    return await this.actor.icrc2_mint(formattedTo, BigInt(args.amount), args.symbol,Principal.fromText(args.owner));
}
    async create_agent(name : string , description : string ,schedule : AgentSchedule , tasks : Task[] , created_at : number ,prompt : string, next_run : [number]) : Promise<string>{
        return await this.actor.create_agent(name , description ,schedule , tasks , created_at , prompt ,next_run  );
    }

    async get_all_agents() : Promise<GetAllAgentsResponse | undefined>{
        return await this.actor.get_all_agents();
    }

    async icrc2_balance_of(args : BalanceTokenArgs) : Promise<bigint>{
        return await this.actor.icrc2_balance_of(Principal.fromText(args.owner), args.symbol);
    }

    async store_outputs(output : string , id : bigint , created_at : bigint){
      return await this.actor.store_outputs(output,id,created_at);
    }


    

  


}





export const createTokenCanister = (actor : any) : TokenCanisterClient =>{
    return new TokenCanisterClient(actor);
}