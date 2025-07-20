import { ActorSubclass } from "@dfinity/agent";

interface AuthProviderProps{
    login : ()=> Promise<any>;
    logout : ()=> Promise<void>;
    isAuthenticated :boolean;
    identity : any;
    principal : any;
    actors : ActorSubclass<_SERVICE>;
}