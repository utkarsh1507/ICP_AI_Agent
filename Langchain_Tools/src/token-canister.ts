import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {idlFactory} from "../../src/declarations/ai_agent_icp_backend/index.js";
import { Principal } from "@dfinity/principal";
import { Account, AgentSchedule, APIResponse, BalanceTokenArgs, CreateTokenArgs, GetAllAgentsResponse, GetTokenMetadataArgs, MintTokenArgs, UserAgents } from "./types/tool-types.js";




export interface TokenCanister {
  icrc2_init : (name : string , symbol : string , decimals : number ,description : [string] | [],logo : [string] | [] , total_supply : bigint, owner : Principal,fee : bigint)=>Promise<boolean>;
  icrc2_metadata :(symbol : string) =>Promise<APIResponse>;
  icrc2_get_all_records : () => Promise<APIResponse>;
  icrc2_mint: (to: { owner: Principal; subaccount: [] | [Uint8Array]}, amount: bigint, symbol: string,owner : Principal) => Promise<APIResponse>;
  create_agent : (name : string , description : string ,schedule : AgentSchedule ,  created_at : number , prompt : string ,owner : Principal ) =>Promise<string>;
  get_all_agents : ()=> Promise<GetAllAgentsResponse | undefined>;
  transfer_token: (tokenId: string, to: Principal, amount: bigint) => Promise<boolean>;
  icrc2_balance_of: (account: Account, symbol: string) => Promise<bigint>;
  store_output : (output : string , id : bigint)=>Promise<string>;
  get_user_agents : (owner : Principal)=>Promise<UserAgents | undefined>;
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
                args.schedule.type==='Interval' ? { Interval : {interval_seconds : BigInt(args.schedule.interval_seconds)}} : {Cron : {expression : args.schedule.expression}},
           
                Date.now(),
                `Create token with name ${args.name}, symbol ${args.symbol}, decimals ${args.decimals}, description ${args.description}, logo ${args.logo}, total supply ${args.initial_supply}, owner ${args.owner} and fee ${args.fee} `,
               Principal.fromText(args.owner)
            );
            console.log("Created agent for token creation", agent);

        }
        return await this.actor.icrc2_init(args.name , args.symbol,args.decimals,args.description ? [args.description] : [],args.logo? [args.logo] : [],BigInt(args.initial_supply),Principal.fromText(args.owner),BigInt(args.fee) , );
    }
    async get_token_metadata(args : GetTokenMetadataArgs){
      console.log("Symbol :", args.symbol , "Schedule : " , args.schedule);
      if(args.schedule){
        console.log("Creating agent for token metadata retrieval");
        const agent =await this.actor.create_agent(
                "Token Metadata Agent",
                "This agent is used to fetch token metadata on regular intervals",
                args.schedule.type==='Interval' ? { Interval : {interval_seconds : BigInt(args.schedule.interval_seconds)}} : {Cron : {expression : args.schedule.expression}},
           
                Date.now(),
                `Get the details of token having symbol ${args.symbol}`,
               Principal.fromText(args.owner)
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
        owner: args.to.owner,
        subaccount: args.to.subaccount ? [args.to.subaccount] as [Uint8Array] : [],
    };
    return await this.actor.icrc2_mint(formattedTo, BigInt(args.amount), args.symbol,Principal.fromText(args.owner));
}
    async create_agent(name : string , description : string ,schedule : AgentSchedule ,  created_at : number ,prompt : string,owner : Principal) : Promise<string>{
        return await this.actor.create_agent(name , description ,schedule  , created_at , prompt, owner );
    }

    async get_all_agents() : Promise<GetAllAgentsResponse | undefined>{
        return await this.actor.get_all_agents();
    }

    async icrc2_balance_of(args: BalanceTokenArgs): Promise<bigint> {
  const principal = Principal.fromText(args.owner);

  let subaccount: Uint8Array | null = null;
  if (args.subaccount && Array.isArray(args.subaccount)) {
    if (args.subaccount.length > 0) {
      subaccount = Uint8Array.from(args.subaccount.map((b: string | number) => Number(b)));
    }
  } else if (args.subaccount instanceof Uint8Array) {
    subaccount = args.subaccount;
  }

  return await this.actor.icrc2_balance_of(
    {
      owner: principal, // Principal
      subaccount,       // Uint8Array | null
    },
    args.symbol
  );
}


    async store_output(output : string , id : bigint ){
      return await this.actor.store_output(output,id);
    }


    async get_user_agents(owner : string){
      return await this.actor.get_user_agents(Principal.fromText(owner));
    }
}





export const createTokenCanister = (actor : any) : TokenCanisterClient =>{
    return new TokenCanisterClient(actor);
}