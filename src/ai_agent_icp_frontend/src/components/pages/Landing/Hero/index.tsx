import React, { useEffect, useState } from 'react';
import './index.css';
import { useAuth } from '../../../hooks/useAuth';

const Hero: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [authenticated , setAuthenticated]= useState<boolean | null | undefined>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle prompt submission
    console.log('Prompt submitted:', prompt);
  };
  useEffect(()=>{
    const auth = useAuth();
    if(auth){
      setAuthenticated(auth?.isAuthenticated);
    }

  })

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
            <button type="submit" className="hero-prompt-button">
              {authenticated ?  'Ask AI' : 'Login First'}
            </button>
          </form>
          
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