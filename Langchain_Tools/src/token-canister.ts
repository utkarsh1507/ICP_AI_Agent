import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {idlFactory} from "../../src/declarations/ai_agent_icp_backend/index.js";
import { Principal } from "@dfinity/principal";
interface Account {
  owner: string;
  subaccount?: Uint8Array | null;
}

export interface TokenCanister {
  icrc2_init : (name : string , symbol : string , decimals : number ,description : [string] | [],logo : [string] | [] , total_supply : bigint,fee : bigint)=>Promise<boolean>;
  icrc2_metadata :(symbol : string) =>Promise<APIResponse>;
  icrc2_get_all_records : () => Promise<APIResponse>;
  icrc2_mint: (to: { owner: Principal; subaccount: [] | [Uint8Array]}, amount: bigint, symbol: string) => Promise<APIResponse>;
}
interface CreateTokenArgs{
    name: string;
    symbol: string;
    decimals: number;
    description?: string;
    logo?: string;
    total_supply: bigint;
    fee: bigint;
}

interface APIResponse {
  Text : string;
  PairList : [string, string];
}
/*
type TokenMetaData = [string,string];
type MetaData = TokenMetaData[];

type TokenData =[string,string];
type AllToken = TokenData[]*/
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
        return await this.actor.icrc2_init(args.name , args.symbol,args.decimals,args.description ? [args.description] : [],args.logo? [args.logo] : [],BigInt(args.total_supply),BigInt(args.fee));
    }
    async get_token_metadata(args : CreateTokenArgs){
        return await this.actor.icrc2_metadata(args.symbol);
    }

    async get_all_tokens(){
        return await this.actor.icrc2_get_all_records();
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

}





export const createTokenCanister = (actor : any) : TokenCanisterClient =>{
    return new TokenCanisterClient(actor);
}