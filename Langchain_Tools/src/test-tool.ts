import ollama from 'ollama';
import { createMockTokenCanister } from './token-canister.js';


const mockTokenCanisterTool = {
    type : 'function',
    function : {
        name : 'createMockTokenCanister',
        description : "Creates a mock token canister just for tesing",
        parameters : {
            type : 'object',
            required : ['actor'],
            properties : {
                actor : {type : 'string' , description : 'The actor string for the mock token canister'}
            }
        }
    }
}


async function runMockTokenCanisterTool(actor: string) {
    const messages = [ {role : 'user' , content : `Create a mock token canister with actor : ${actor}`}];
    console.log('Prompt:', messages[0].content);
    const availableFunctions = {
        createMockTokenCanister
    }
    const response = await ollama.chat({
        model : 'llama3.1',
        messages,
        tools :[mockTokenCanisterTool]
    });

    let output : any;
    if(response.message.tool_calls){
        for(const tool of response.message.tool_calls){
            const functionToCall = availableFunctions[tool.function.name];
            if(functionToCall){
                console.log('Calling function:', tool.function.name);
                console.log('Arguments:', tool.function.arguments);
                output = functionToCall(tool.function.arguments.actor);
                console.log('Function output:', output);

                // Add the function response to messages for the model to use
                messages.push(response.message);
                messages.push({
                    role: 'tool',
                    content: JSON.stringify(output),
                });
            } else {
                console.log('Function', tool.function.name, 'not found');
            }
        }
    }else{
        console.log('No tool calls returned from model');
    }
    //const mockTokenCanister = createMockTokenCanister(actor);
}

runMockTokenCanisterTool('mock-actor-string').catch(error => console.error("An error occurred:", error));