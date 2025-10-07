import Together from "together-ai";
const together = new Together({ apiKey: process.env.TOGETHER_API });
export async function introBotChat(){
    try {  
        const response = await together.chat.completions.create({
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            messages : [
                {
                    role : 'system',
                    content : 'You are a friendly assistant that greets new users and introduces MintFinity.AI. Keep it short and clear. Mention that MintFinity.AI is an automated ICRC token management system where users can easily create, mint, transfer, check balances, and burn tokens — all through simple prompts, with no programming required.'
                }
            ],
            max_tokens : 150,
            temperature : 0.7
        });
        return response.choices[0].message?.content;
    } catch (error) {
        console.error("Error in introBotChat:", error);
        return "Welcome to MintFinity.AI";
    }
}
