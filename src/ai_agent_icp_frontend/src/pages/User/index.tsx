import React, { useState } from 'react'
import { useAuth } from '../../components/hooks/useAuth';
import { sendPrompt } from '../../utils/sendPrompt';
import "./index.css"
const User = () => {
      const auth = useAuth();
      if (!auth) return <div>Loading...</div>;
    
      const { login, logout, isAuthenticated, principal } = auth;
      const [prompt, setPrompt] = useState<string | undefined>('');
      const [response, setResponse] = useState<any>(null);
      
      //const [authenticated , setAuthenticated]= useState<boolean | null | undefined>(false);
    
      const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt !== '') {
        console.log('Principal:', principal);
    console.log('Principal text:', principal?.toText?.());
    console.log('Type of principal:', typeof principal);
        const aiResponse = await sendPrompt(prompt , principal?.toText?.());
        console.log('AI Response:', aiResponse);
    
        type AIResponseItem = { Text?: string; PairList?: [string, string][] };
        const firstItem = aiResponse ? (aiResponse[0] as AIResponseItem) : null;
    
        if (firstItem && typeof firstItem === 'object' && 'Text' in firstItem) {
          setResponse({
            type: 'Text',
            content: firstItem.Text,
          });
        } else if (firstItem && typeof firstItem === 'object' && 'PairList' in firstItem) {
          setResponse({
            type: 'PairList',
            content: firstItem.PairList,
          });
        } else {
          setResponse({
            type: 'Unknown',
            content: JSON.stringify(aiResponse),
          });
        }
      }
    };
  
  return (
    <section className="hero">
     <div>User DashBoard</div>
      
   
      
     
          
          <form className="hero-prompt-container" onSubmit={handleSubmit}>
            <input
              type="text"
              className="hero-prompt-input"
              placeholder="Ask Mintfinity... e.g., 'Create a new token called MyToken with 1M supply'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          
              {isAuthenticated ? <button type="submit" className="hero-prompt-button"> Ask AI</button> :<button onClick={()=>login()} className='hero-prompt-button'> Login First</button>}
         
          </form>
          {response && (
  <div className="hero-response-container fade-in">
    <div className="hero-response-header">
      <span className="hero-response-title">AI Response</span>
    </div>
    <div className="hero-response-content">
      {response.type === 'Text' && <p>{response.content}</p>}

      {response.type === 'PairList' && (
        <ul className="hero-response-list">
          {response.content.map((pair: [string, string], idx: number) => (
            <li key={idx}>
              <strong>{pair[0]}:</strong> {pair[1]}
            </li>
          ))}
        </ul>
      )}

      {response.type === 'Unknown' && (
        <pre>{response.content}</pre>
      )}
    </div>
  </div>
)}


          
     
       
     
    </section>
  );
};


export default User