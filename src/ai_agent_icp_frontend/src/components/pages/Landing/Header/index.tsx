import React from 'react';
import './index.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <img src="/logo.png" alt="Mintfinity.AI Logo" className="header-logo-image" />
          <span className="header-logo-text">Mintfinity.AI</span>
        </div>
    
      </div>
    </header>
  );
};

export default Header;