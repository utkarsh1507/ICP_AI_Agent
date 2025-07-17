import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import {idlFactory} from "../../src/declarations/ai_agent_icp_backend/index.js";

export interface TokenCanister {
  getBalance: (account: string) => Promise<string>;
  transfer: (from: string, to: string, amount: string) => Promise<{ transactionId: string }>;
  getMetadata: () => Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }>;
  getTransactions: (limit?: number) => Promise<Array<{
    id: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
  }>>;
}


export class TokenCanisterClient{
    private actor : ActorSubclass<TokenCanister>;
    constructor(actor : any){
        this.actor = actor;
    }

    static async create(tokenCanisterId : string ,host : string) : Promise<TokenCanisterClient>{
        try {
            const agent = await HttpAgent.create({host});

            if(host.includes("localhost")){
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

    async getBalance(account : string) : Promise<string>{
        try {
            return await this.actor.getBalance(account);
        } catch (error) {
            throw new Error(`Failed to get balance for account ${account}: ${error}`);
        }
    }

    async tranfer(from: string, to: string, amount: string): Promise<{ transactionId: string }> {
        try {
            return await this.actor.transfer(from, to , amount);
        } catch (error) {
            throw new Error(`Failed to transfer from ${from} to ${to} of amount ${amount}: ${error}`);
        }
    }

    async getMetaData() : Promise<{ name : string ; symbol : string ; decimals : number ; totalSupply : string}>{
        try {
            return await this.actor.getMetadata();
        } catch (error) {
            throw new Error(`Failed to get metadata: ${error}`);
        }
    }

    async getTransactions(limit : number = 10) : Promise<Array<{id : string ; from : string ; to : string ; amount : string ; timestamp : string }>>{
        try {
            return await this.actor.getTransactions(limit);
        } catch (error) {
            throw new Error(`Failed to get transactions with limit ${limit}: ${error}`);
        }
    }
}


export class MockTokenCanister{
    private actor : string;
    constructor(actor : string){
        this.actor = actor;
        console.log(`Mock Class For Token Canister created with actor : ${actor}`);
    }

    static getBalance(account : string) : string {
        console.log(`Mock Get Balance ran for account : ${account}`);
        return `Account ${account} has a balance of 10000 BTC`;
    }

    static transfer(from : string , to : string , amount : string) : string{
        console.log(`Mock transfer ran from ${from} to ${to} of amount ${amount}`);
        return `Transferred ${amount} from ${from} to ${to}`;
    }

    static getMetadata() : string {
        console.log("Mock getMetadata ran");
        return `Token Name: MockToken, Symbol: MTK, Decimals: 18, Total Supply: 1000000 MTK`;
    }
    static getTransactions(limit: number = 10): string {
        console.log(`Mock getTransactions ran with limit: ${limit}`);
        return `Returning last ${limit} transactions.`;
    }
}

export const createMockTokenCanister = (actor: string): MockTokenCanister => {
    return new MockTokenCanister(actor);
}



export const createTokenCanister = (actor : any) : TokenCanisterClient =>{
    return new TokenCanisterClient(actor);
}