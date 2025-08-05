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
  created_at: number; 
  prompts : string 
  next_run?: [number] | []; 
}

export type AgentSchedule = 
  | { Interval: { interval_days: bigint } }
  | { Cron: { expression: string } };


export interface Task {
  tool: string;
  params: string;
}
export type GetAllAgentsResponse = {
  [key: string]: AgentConfig;
};
export interface TokenCanister {
  icrc2_init : (name : string , symbol : string , decimals : number ,description : [string] | [],logo : [string] | [] , total_supply : bigint,fee : bigint)=>Promise<boolean>;
  icrc2_metadata :(symbol : string) =>Promise<APIResponse>;
  icrc2_get_all_records : () => Promise<APIResponse>;
  icrc2_mint: (to: { owner: Principal; subaccount: [] | [Uint8Array]}, amount: bigint, symbol: string) => Promise<APIResponse>;
  create_agent : (name : string , description : string ,schedule : AgentSchedule , tasks : Task[] , created_at : number , prompt : string ,next_run : [number] ) =>Promise<string>;
  get_all_agents : ()=> Promise<GetAllAgentsResponse>;
  transfer_token: (tokenId: string, to: Principal, amount: bigint) => Promise<boolean>;
}
interface CreateTokenArgs{
    name: string;
    symbol: string;
    decimals: number;
    description?: string;
    logo?: string;
    total_supply: bigint;
    fee: bigint;
    schedule? : Schedule;
}
type Schedule = 
  | { type: 'Interval'; interval_days: number }
  | { type: 'Cron'; expression: string };
interface APIResponse {
  Text : string;
  PairList : [string, string];
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
        if(args.schedule && args.schedule.type === 'Interval'){

            const agent = this.actor.create_agent(
                "Create Token Agent",
                "This agent is used to create tokens and schedule token creation on regular intervals",
                {Interval : {interval_days : BigInt(args.schedule.interval_days)}},
                [],
                Date.now(),
                `Create token with name ${args.name}, symbol ${args.symbol}, decimals ${args.decimals}, description ${args.description}, logo ${args.logo}, total supply ${args.total_supply} and fee ${args.fee}`,
                [Date.now() + args.schedule.interval_days * 24 * 60 * 60 * 1000]
            );
            console.log("Created agent for token creation", agent);

        }
        return await this.actor.icrc2_init(args.name , args.symbol,args.decimals,args.description ? [args.description] : [],args.logo? [args.logo] : [],BigInt(args.total_supply),BigInt(args.fee));
    }
    async get_token_metadata(args : CreateTokenArgs){
      console.log("Args:", args);
      if(args.schedule && args.schedule.type === 'Interval'){
        console.log("Creating agent for token metadata retrieval");
        const agent =await this.actor.create_agent(
                "Token Metadata Agent",
                "This agent is used to fetch token metadata on regular intervals",
                {Interval : {interval_days : BigInt(args.schedule.interval_days)}},
                [],
                Date.now(),
                `Get the details of token having symbol ${args.symbol}`,
                [Date.now() + args.schedule.interval_days * 24 * 60 * 60 * 1000]
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
    async mint_token(to: Account, amount: bigint, symbol: string) {
      if(to?.subaccount && Array.isArray(to.subaccount)){
        if(to.subaccount.length === 0){
            to.subaccount = null;
        }else{
          const bytes = Uint8Array.from(to.subaccount.map((b : string) => parseInt(b)));
          to.subaccount = bytes;
        }
      }
    const formattedTo: { owner: Principal; subaccount: [] | [Uint8Array] } = {
        owner: Principal.fromText(to.owner),
        subaccount: to.subaccount ? [to.subaccount] as [Uint8Array] : [],
    };
    return await this.actor.icrc2_mint(formattedTo, amount, symbol);
}
    async create_agent(name : string , description : string ,schedule : AgentSchedule , tasks : Task[] , created_at : number ,prompt : string, next_run : [number]) : Promise<string>{
        return await this.actor.create_agent(name , description ,schedule , tasks , created_at , prompt ,next_run  );
    }

    async get_all_agents() : Promise<GetAllAgentsResponse>{
        return await this.actor.get_all_agents();
    }


}





export const createTokenCanister = (actor : any) : TokenCanisterClient =>{
    return new TokenCanisterClient(actor);
}