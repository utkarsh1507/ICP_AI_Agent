import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Define the interface for the token canister based on your token.rs implementation
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

// This is a simplified IDL (Interface Description Language) for your token canister
// In a real implementation, you would generate this from your Candid file
const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    // Map to the icrc1_balance_of function in token.rs
    'getBalance': IDL.Func([IDL.Text], [IDL.Text], ['query']),
    
    // Map to the icrc1_transfer function in token.rs
    'transfer': IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text], 
      [IDL.Record({ 'transactionId': IDL.Text })], 
      []
    ),
    
    // Map to the icrc1_metadata function in token.rs
    'getMetadata': IDL.Func(
      [], 
      [IDL.Record({
        'name': IDL.Text,
        'symbol': IDL.Text,
        'decimals': IDL.Nat8,
        'totalSupply': IDL.Text
      })], 
      ['query']
    ),
    
    // Map to the get_transactions function in token.rs
    'getTransactions': IDL.Func(
      [IDL.Opt(IDL.Nat)], 
      [IDL.Vec(IDL.Record({
        'id': IDL.Text,
        'from': IDL.Text,
        'to': IDL.Text,
        'amount': IDL.Text,
        'timestamp': IDL.Text
      }))], 
      ['query']
    )
  });
};

// Create a class to interact with the token canister
export class TokenCanisterClient implements TokenCanister {
  private actor: any;

  constructor(canisterId: string, host: string) {
    try {
      // Create an agent to communicate with the IC
      const agent = new HttpAgent({ host });
      
      // In development, we need to fetch the root key
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        console.log('Local development detected, fetching root key');
        // Use Promise.resolve to handle the root key fetch asynchronously
        // This prevents blocking the constructor
        Promise.resolve().then(async () => {
          try {
            await agent.fetchRootKey();
            console.log('Root key fetched successfully');
          } catch (err) {
            console.warn('Unable to fetch root key. Check your local replica is running');
            console.error(err);
          }
        });
      }

      // Create an actor to interact with the canister
      this.actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: Principal.fromText(canisterId),
      });
      
      console.log(`TokenCanisterClient initialized for canister: ${canisterId} at host: ${host}`);
    } catch (error) {
      console.error('Failed to initialize TokenCanisterClient:', error);
      // Instead of throwing, we'll set the actor to null and handle errors in the methods
      this.actor = null;
    }
  }

  async getBalance(account: string): Promise<string> {
    try {
      return await this.actor.getBalance(account);
    } catch (error) {
      console.error(`Error getting balance for account ${account}:`, error);
      throw error;
    }
  }

  async transfer(from: string, to: string, amount: string): Promise<{ transactionId: string }> {
    try {
      return await this.actor.transfer(from, to, amount);
    } catch (error) {
      console.error(`Error transferring ${amount} from ${from} to ${to}:`, error);
      throw error;
    }
  }

  async getMetadata(): Promise<{ name: string; symbol: string; decimals: number; totalSupply: string }> {
    try {
      return await this.actor.getMetadata();
    } catch (error) {
      console.error('Error getting metadata:', error);
      throw error;
    }
  }

  async getTransactions(limit?: number): Promise<Array<{ id: string; from: string; to: string; amount: string; timestamp: string }>> {
    try {
      return await this.actor.getTransactions(limit ? [limit] : []);
    } catch (error) {
      console.error(`Error getting transactions with limit ${limit}:`, error);
      throw error;
    }
  }
}

// Export a function to create a token canister client
export const createTokenCanister = (canisterId: string, host: string): TokenCanister => {
  return new TokenCanisterClient(canisterId, host);
};
