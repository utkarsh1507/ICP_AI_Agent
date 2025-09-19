export async function getIntro(){
    const response = await fetch('http://localhost:5000/api/intro',{
                method : 'GET',
            });
    if(response){
                const output =await response.json();
                return output;
            }
}