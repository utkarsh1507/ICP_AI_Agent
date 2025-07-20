import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthProviderProps } from "../types/Auth";
import {canisterId , ai_agent_icp_backend, createActor} from "../../../../declarations/ai_agent_icp_backend";
import { AuthClient } from "@dfinity/auth-client";
const AuthContext = createContext<AuthProviderProps | undefined>(undefined);
const backendCanisterId = canisterId;
const network = import.meta.env.NETWORK;
const useAuthClient = ()=>{
    const [authClient , setAuthClient] = useState<AuthClient | null>(null);
    const [isAuthenticated , setIsAuthenticated ] = useState<boolean>(false);
    const [identity, setIdentity] = useState<any>(null);
    const [principal, setPrincipal] = useState<any>(null);
    const [actors, setActors] = useState(ai_agent_icp_backend);

    const initializeClient = async()=>{
        console.log("Initializing auth client");
        const client = await AuthClient.create();
        console.log("Auth client initialized");
        setAuthClient(client);
        const isAuth = await client.isAuthenticated();

        if(isAuth){
            const identity = client.getIdentity();
            console.log(" got identity");
            const principal = identity.getPrincipal();
            if(!principal.isAnonymous()){
                setIsAuthenticated(true);
                setIdentity(identity);
                setPrincipal(principal);

                const userActor = createActor(backendCanisterId,{agentOptions : {identity : identity}});

                setActors(userActor);
            }
        }
    }

    useEffect(()=>{
        initializeClient();
    },[]);


    const clientInfo = async(client : (AuthClient))=>{
        const isAuthenticated = await client.isAuthenticated();
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        setAuthClient(client);
        setIsAuthenticated(isAuthenticated);
        setPrincipal(principal);
        setIdentity(identity);

        if(isAuthenticated && identity && principal && principal.isAnonymous() === false){
            let userActor = createActor(backendCanisterId , {agentOptions : {identity : identity}});
            setActors(userActor);
            return {userActor};
        }
    }

    const IIlogin = async()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                if(authClient && (await authClient.isAuthenticated()) && (await authClient.getIdentity().getPrincipal().isAnonymous() === false)){
                    resolve(clientInfo(authClient));
                }else{
                    if(!authClient){
                        throw new Error("Authclient is not initialized");
                    }
                    await authClient.login({
                        identityProvider: network === "ic"
              ? "https://identity.ic0.app/#authorize"
              : `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943/`,
              onError : (error) =>reject(error),
              onSuccess : ()=>resolve(clientInfo(authClient))
                    })
                }
            } catch (error) {
                console.log(error);
                reject(error);
            }
        })
    }

    const logout=async()=>{
        if(authClient){
            await authClient.logout();
            setIsAuthenticated(false);
            setIdentity(null);
            setPrincipal(null);
            setActors(ai_agent_icp_backend);

        }else{
            throw new Error("AuthClient is not initialized");
        }

    };
    return {
        login : async()=>{return IIlogin();},
        logout,
        isAuthenticated,
        identity,
        principal,
        actors
    }
}

export const AuthProvider = ({children} : React.PropsWithChildren)=>{
    const auth = useAuthClient();
    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth =()=>useContext(AuthContext);