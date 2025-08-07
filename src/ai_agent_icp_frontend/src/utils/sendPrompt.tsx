
export async function sendPrompt(prompt:string | undefined| null, owner : string): Promise<string | undefined | null> {
    try {
        if(prompt !==''){
           
            const response = await fetch('http://localhost:5000/api/prompt',{
                method : 'POST',
                body : JSON.stringify({'prompt' : prompt , 'owner': owner}),
                headers : {
                    'Content-Type' :'application/json'
                }
            })
            if(response){
                const output =await response.json();
                return output;
            }
        }
    } catch (error) {
        
    }
}