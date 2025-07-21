import React, { useEffect, useState } from 'react';
import './index.css';
import { useAuth } from '../../../hooks/useAuth';
import { sendPrompt } from '../../../../utils/sendPrompt';

const Hero: React.FC = () => {
  const auth = useAuth();
  if (!auth) return <div>Loading...</div>;

  const { login, logout, isAuthenticated, principal } = auth;
  const [prompt, setPrompt] = useState<string | undefined>('');
  const [response, setResponse] = useState<string | undefined | null>('');
  //const [authenticated , setAuthenticated]= useState<boolean | null | undefined>(false);

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if(prompt !== ''){
      const aiResponse =await sendPrompt(prompt);
      setResponse(aiResponse);
    }
    // Handle prompt submission
    console.log('Prompt submitted:', prompt);
  };


  return (
    <section className="hero">
      <div className="hero-floating-elements">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
      </div>
      
      <div className="container">
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            Interact with ICP Tokens Using AI Prompts
          </h1>
          
          <p className="hero-subtitle">
            Mintfinity.AI revolutionizes token management on the Internet Computer with 
            natural language commands. Create, mint, burn, and transfer ICRC tokens 
            through intelligent AI-powered interactions.
          </p>
          
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
                {response}
              </div>
            </div>
          )}
          
          <div className="hero-stats slide-up">
            <div className="hero-stat">
              <span className="hero-stat-number">10K+</span>
              <span className="hero-stat-label">Tokens Created</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">50M+</span>
              <span className="hero-stat-label">Transactions</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">99.9%</span>
              <span className="hero-stat-label">Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;