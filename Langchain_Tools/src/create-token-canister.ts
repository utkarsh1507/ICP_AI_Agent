import { createTokenCanister, TokenCanisterClient } from './token-canister.js';
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
console.log("File name ->>",__filename)
const __dirname = dirname(__filename);
console.log("Dir Name ", __dirname);

dotenv.config({path : `${dirname(__dirname)}/.env`});

export async function create_token_canister() : Promise<TokenCanisterClient | null>{
    let host = process.env.HOST || 'http://localhost:4943';
    let tokenCanisterId = process.env.TOKEN_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';
    try {
        console.log(`Initializing token canister with canister id -----> ${tokenCanisterId} and host -----> ${host}`);
        return await TokenCanisterClient.create(tokenCanisterId, host);
        
        
    } catch (error) {
        console.error('Failed to create token canister client:', error);
        return null;
    }
}