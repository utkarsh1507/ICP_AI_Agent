import React from 'react';
import './index.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
  example: string;
  tags: string[];
}

const features: Feature[] = [
  {
    icon: '🪙',
    title: 'Create New ICRC Token',
    description: 'Generate new ICRC tokens with custom parameters including name, symbol, supply, and metadata through simple natural language commands.',
    example: 'Create a token called "EcoToken" with symbol "ECO" and 1 million supply',
    tags: ['Token Creation', 'ICRC Standard', 'Metadata']
  },
  {
    icon: '📋',
    title: 'View All Tokens',
    description: 'Get comprehensive overviews of all tokens in your portfolio or the entire ecosystem with detailed analytics and performance metrics.',
    example: 'Show me all tokens in my wallet with their current balances',
    tags: ['Portfolio', 'Analytics', 'Overview']
  },
  {
    icon: '🔍',
    title: 'Get Token Details',
    description: 'Retrieve specific information about any token including supply, holders, transaction history, and smart contract details.',
    example: 'What are the details of token with ID abc123?',
    tags: ['Token Info', 'Supply Data', 'History']
  },
  {
    icon: '⚡',
    title: 'Mint Tokens',
    description: 'Increase token supply by minting new tokens to specified addresses with proper authorization and supply management.',
    example: 'Mint 1000 MyToken to address rrkah-fqaaa-aaaaa-aaaaq-cai',
    tags: ['Minting', 'Supply Management', 'Authorization']
  },
  {
    icon: '🔥',
    title: 'Burn Tokens',
    description: 'Permanently remove tokens from circulation by burning them from your balance, reducing total supply effectively.',
    example: 'Burn 500 tokens from my MyToken balance',
    tags: ['Burning', 'Supply Reduction', 'Deflation']
  },
  {
    icon: '💸',
    title: 'Transfer Tokens',
    description: 'Send tokens between addresses with automatic fee calculation, transaction optimization, and confirmation tracking.',
    example: 'Transfer 100 MyToken to alice.ic and 50 to bob.ic',
    tags: ['Transfers', 'Batch Operations', 'Fee Optimization']
  }
];

const Features: React.FC = () => {
  return (
    <section className="features section">
      <div className="container">
        <div className="features-header">
          <h2 className="features-title fade-in">
            Powerful AI-Driven ICRC Capabilities
          </h2>
          <p className="features-subtitle fade-in">
            Transform complex token operations into simple conversations. 
            Mintfinity.AI understands natural language and executes blockchain operations seamlessly.
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">
                {feature.icon}
              </div>
              
              <h3 className="feature-title">{feature.title}</h3>
              
              <p className="feature-description">
                {feature.description}
              </p>
              
              <div className="feature-example">
                {feature.example}
              </div>
              
              <div className="feature-tags">
                {feature.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="feature-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="features-cta">
          <h3 className="features-cta-title">Ready to Get Started?</h3>
          <p className="features-cta-description">
            Join thousands of developers and users who are already using Mintfinity.AI 
            to streamline their ICRC token operations.
          </p>
          <button className="btn btn-primary">
            Start Building with AI
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;