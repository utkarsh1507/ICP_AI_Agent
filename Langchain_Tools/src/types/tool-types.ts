import { Principal } from "@dfinity/principal";

export interface MintTokenArgs{
  to : Account;
  amount : string;
  symbol : string;
  owner : string;
}

export interface BalanceTokenArgs{
  owner : string;
  symbol : string;
}

export interface GetTokenMetadataArgs{
  symbol : string,
  schedule? : Schedule,
  owner : string 
}

export interface CreateTokenArgs{
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
export type Schedule = 
  | { type: 'Interval'; interval_seconds: number }
  | { type: 'Cron'; expression: string };
export interface APIResponse {
  Text : string;
  PairList : [string, string];
}

export interface Account {
  owner: string;
  subaccount?: Uint8Array | null;
}
export interface AgentConfig {
  name: string;
  description: string;
  schedule: AgentSchedule;
  created_at: bigint; 
  prompts : string;
  owner : Principal;
}

export type AgentSchedule = 
  | { Interval: { interval_seconds: bigint } }
  | { Cron: { expression: string } };


export interface Task {
  tool: string;
  params: string;
}
export type GetAllAgentsResponse = 
  [bigint, AgentConfig][];
;

export type UserAgents = AgentConfig[];