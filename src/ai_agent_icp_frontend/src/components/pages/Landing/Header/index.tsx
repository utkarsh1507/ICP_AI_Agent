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
        
        <nav className="header-nav">
          <a href="#home" className="header-nav-link">Home</a>
          <a href="#services" className="header-nav-link">Services</a>
          <a href="#architecture" className="header-nav-link">Architecture</a>
          <a href="#contact" className="header-nav-link">Contact</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;